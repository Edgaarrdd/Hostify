"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { UserProfile } from "@/lib/types";

// Re-export for backward compatibility
export type { UserProfile };

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validatePassword(password: string): string | null {
    if (!PASSWORD_REGEX.test(password)) {
        return "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales (@$!%*?&).";
    }
    return null;
}

/**
 * Crea un nuevo usuario en el sistema de autenticación y su perfil asociado.
 * Si no se proporciona contraseña, se genera una aleatoria segura.
 * 
 * @param data - Datos del usuario: email, nombre completo, y contraseña opcional.
 * @returns Resultado indicando éxito o error, y la contraseña si fue autogenerada.
 */
export async function createUser(data: { email: string; fullName: string; password?: string }) {
    try {
        // 1. Crear usuario en Supabase Auth (usando API Admin)
        // Usamos contraseña temporal si no se proporciona, ¿o dejamos que la restablezcan?
        // El usuario solicitó crear usuario, así que probablemente estableciendo una contraseña.
        let password = data.password;

        if (password) {
            const validationError = validatePassword(password);
            if (validationError) {
                return { success: false, error: validationError };
            }
        } else {
            // Autogenerar una contraseña fuerte si no se proporciona (aunque la UI fomenta establecerla explícitamente)
            // La generación aleatoria simple podría no cumplir requisitos de complejidad, así que forzamos un patrón o solo simple random
            // Por ahora, asumamos que si es autogenerada la hacemos suficientemente fuerte
            const randomPart = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            password = `A1${randomPart}!`; // Truco para cumplir requisitos: Mayúscula, Número, Especial
        }

        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: data.fullName,
            },
        });

        if (createError) {
            throw new Error(createError.message);
        }

        if (!user.user) throw new Error("User creation failed unexpectedly.");

        // 2. La creación de perfil se maneja via TRIGGER usualmente.
        // Pero si queremos asegurar o actualizar el rol inmediatamente:
        // El trigger crea el perfil con 'encargado' por defecto.
        // Si quisiéramos 'admin', lo actualizaríamos aquí. Por ahora, 'encargado' es default.

        // ¿Actualizar perfil explícitamente por si acaso hay latencia del trigger o para forzar consistencia? 
        // El trigger es síncrono.

        revalidatePath("/protected/encargados");
        return { success: true, message: "Usuario creado exitosamente", password }; // Retornando contraseña para mostrar al admin una vez

    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
    }
}

export async function updateUserPassword(userId: string, newPassword: string) {
    try {
        const validationError = validatePassword(newPassword);
        if (validationError) {
            return { success: false, error: validationError };
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (error) throw new Error(error.message);

        return { success: true, message: "Contraseña actualizada correctamente" };
    } catch (error) {
        console.error("Error updating password:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al actualizar contraseña" };
    }
}

export async function getUsers() {
    try {
        const { data: profiles, error } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .order("email");

        if (error) throw new Error(error.message);

        return { success: true, data: profiles as UserProfile[] };
    } catch (error) {
        console.error("Error fetching users:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al obtener usuarios" };
    }
}

/**
 * Elimina un usuario del sistema.
 * Incluye validación de seguridad: no permite eliminar al último administrador.
 * 
 * @param userId - ID del usuario a eliminar.
 */
export async function deleteUser(userId: string) {
    try {
        // Verificar si usuario es admin y si es el último
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        if (profileError) {
            // Si no se encuentra perfil, ¿tal vez solo eliminar usuario auth? Pero más seguro dar error.
            if (profileError.code !== 'PGRST116') throw new Error("Error verificando usuario");
        }

        if (userProfile?.role === 'admin') {
            const { count, error: countError } = await supabaseAdmin
                .from("profiles")
                .select("*", { count: 'exact', head: true })
                .eq("role", "admin");

            if (countError) throw new Error("Error verificando administradores");

            if (count && count <= 1) {
                return { success: false, error: "No se puede eliminar al último administrador." };
            }
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) throw new Error(error.message);

        // El perfil debería eliminarse por CASCADE en la restricción de clave foránea de la BD

        revalidatePath("/protected/encargados");
        return { success: true, message: "Usuario eliminado correctamente" };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al eliminar usuario" };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        // 1. Actualizar public.profiles
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ role: newRole })
            .eq("id", userId);

        if (profileError) throw new Error(profileError.message);

        // 2. Actualizar metadatos de auth.users para coincidir
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            app_metadata: { role: newRole }
        });

        if (authError) throw new Error(authError.message);

        revalidatePath("/protected/encargados");
        return { success: true, message: "Rol actualizado correctamente" };
    } catch (error) {
        console.error("Error updating role:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al actualizar rol" };
    }
}

export async function updateUser(userId: string, data: { fullName?: string, email?: string }) {
    try {
        // 1. Actualizar public.profiles
        const profileUpdates: { full_name?: string; email?: string } = {};
        if (data.fullName) profileUpdates.full_name = data.fullName;
        if (data.email) profileUpdates.email = data.email;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .update(profileUpdates)
                .eq("id", userId);

            if (profileError) throw new Error(profileError.message);
        }

        // 2. Actualizar auth.users si cambia el email
        const updateData: { email?: string, user_metadata?: { full_name?: string } } = {};
        if (data.email) updateData.email = data.email;
        if (data.fullName) updateData.user_metadata = { full_name: data.fullName };

        if (Object.keys(updateData).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
            if (authError) throw new Error(authError.message);
        }

        revalidatePath("/protected/encargados");
        return { success: true, message: "Usuario actualizado correctamente" };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al actualizar usuario" };
    }
}
