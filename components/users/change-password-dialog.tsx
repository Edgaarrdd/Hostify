"use client";

import { useState } from "react";
import { updateUserPassword } from "@/lib/actions/users";
import { Eye, EyeOff } from "lucide-react";

interface ChangePasswordDialogProps {
    userId: string;
    userName: string;
    isOpen: boolean;
    onClose: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export function ChangePasswordDialog({ userId, userName, isOpen, onClose }: ChangePasswordDialogProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            setError("La contraseña no cumple con los requisitos de seguridad.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await updateUserPassword(userId, password);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setPassword("");
                    setConfirmPassword("");
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
                    <h3 className="text-lg font-bold">Cambiar Contraseña</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        ✕
                    </button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                    Cambiando contraseña para: <span className="font-medium text-foreground">{userName}</span>
                </p>

                {success ? (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-center">
                        ¡Contraseña actualizada correctamente!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-2 pr-10 rounded-md border bg-background"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos (@$!%*?&).
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-2 pr-10 rounded-md border bg-background"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
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
                                {isLoading ? "Guardando..." : "Actualizar Contraseña"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
