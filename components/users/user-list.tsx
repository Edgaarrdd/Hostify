"use client";

import { UserProfile, deleteUser, updateUserRole } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { EditUserDialog } from "./edit-user-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { RoleToggleDialog } from "./role-toggle-dialog";
import { UserAvatar } from "./user-avatar";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Key, Trash2, Pencil } from "lucide-react";

export function UserList({ users }: { users: UserProfile[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Dialog states
    const [deleteDialog, setDeleteDialog] = useState<{ userId: string; userName: string } | null>(null);
    const [roleDialog, setRoleDialog] = useState<{ userId: string; userName: string; currentRole: string } | null>(null);
    const [editingUser, setEditingUser] = useState<{ id: string; name: string } | null>(null);
    const [editingProfileUser, setEditingProfileUser] = useState<{ id: string; name: string; email: string } | null>(null);

    const handleDeleteConfirm = async () => {
        if (!deleteDialog) return;

        startTransition(async () => {
            const res = await deleteUser(deleteDialog.userId);
            if (res.success) {
                toast.success("Usuario eliminado correctamente");
                router.refresh();
            } else {
                toast.error(res.error || "Error al eliminar usuario");
            }
            setDeleteDialog(null);
        });
    };

    const handleRoleChangeConfirm = async () => {
        if (!roleDialog) return;

        const newRole = roleDialog.currentRole === 'admin' ? 'encargado' : 'admin';

        startTransition(async () => {
            const res = await updateUserRole(roleDialog.userId, newRole);
            if (res.success) {
                toast.success(`Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Encargado'}`);
                router.refresh();
            } else {
                toast.error(res.error || "Error al cambiar el rol");
            }
            setRoleDialog(null);
        });
    };

    if (!users || users.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <UserPlus className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No hay usuarios registrados</h3>
                <p className="text-sm text-muted-foreground">
                    Crea el primer encargado usando el formulario de la izquierda.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-accent/10 border-b border-border text-left">
                        <tr>
                            <th className="p-4 font-medium">Usuario</th>
                            <th className="p-4 font-medium">Rol</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-accent/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={user.full_name || user.email} role={user.role} />
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {user.full_name || "Sin nombre"}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.role === "admin"
                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            } `}
                                    >
                                        {user.role === "admin" ? "Administrador" : "Encargado"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setEditingProfileUser({
                                                    id: user.id,
                                                    name: user.full_name || "",
                                                    email: user.email,
                                                })
                                            }
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Editar
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setRoleDialog({
                                                    userId: user.id,
                                                    userName: user.full_name || user.email,
                                                    currentRole: user.role,
                                                })
                                            }
                                            disabled={isPending}
                                            className={
                                                user.role === "admin"
                                                    ? "border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
                                                    : ""
                                            }
                                        >
                                            {user.role === "admin" ? (
                                                <Shield className="w-4 h-4 mr-2" />
                                            ) : (
                                                <UserPlus className="w-4 h-4 mr-2" />
                                            )}
                                            {user.role === "admin" ? "Admin" : "Promover"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setEditingUser({ id: user.id, name: user.full_name || user.email })
                                            }
                                        >
                                            <Key className="w-4 h-4 mr-2" />
                                            Contraseña
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteDialog({
                                                    userId: user.id,
                                                    userName: user.full_name || user.email,
                                                })
                                            }
                                            disabled={isPending}
                                            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialogs */}
            {deleteDialog && (
                <DeleteUserDialog
                    isOpen={!!deleteDialog}
                    userName={deleteDialog.userName}
                    isDeleting={isPending}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteDialog(null)}
                />
            )}

            {roleDialog && (
                <RoleToggleDialog
                    isOpen={!!roleDialog}
                    userName={roleDialog.userName}
                    currentRole={roleDialog.currentRole}
                    isUpdating={isPending}
                    onConfirm={handleRoleChangeConfirm}
                    onCancel={() => setRoleDialog(null)}
                />
            )}

            {editingUser && (
                <ChangePasswordDialog
                    isOpen={!!editingUser}
                    userId={editingUser.id}
                    userName={editingUser.name}
                    onClose={() => setEditingUser(null)}
                />
            )}

            {editingProfileUser && (
                <EditUserDialog
                    isOpen={!!editingProfileUser}
                    userId={editingProfileUser.id}
                    currentName={editingProfileUser.name}
                    currentEmail={editingProfileUser.email}
                    onClose={() => setEditingProfileUser(null)}
                />
            )}
        </>
    );
}
