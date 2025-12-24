"use client";

import { useState } from "react";
import { updateUser } from "@/lib/actions/users";

interface EditUserDialogProps {
    userId: string;
    currentName: string;
    currentEmail: string;
    isOpen: boolean;
    onClose: () => void;
}

export function EditUserDialog({ userId, currentName, currentEmail, isOpen, onClose }: EditUserDialogProps) {
    const [name, setName] = useState(currentName);
    const [email, setEmail] = useState(currentEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await updateUser(userId, { fullName: name, email: email });
            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                }, 1500);
            } else {
                setError(res.error || "Error al actualizar");
            }
        } catch {
            setError("Error inesperado");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-card w-full max-w-md rounded-xl shadow-xl border border-border p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Editar Usuario</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        ✕
                    </button>
                </div>

                {success ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-center">
                        ¡Usuario actualizado correctamente!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 rounded-md border bg-background"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 rounded-md border bg-background"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isLoading ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
