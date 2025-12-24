"use client";

import { useState } from "react";
import { createUser } from "@/lib/actions/users";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateUserForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [createdPassword, setCreatedPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const router = useRouter();

    const handleCopyPassword = async () => {
        if (!createdPassword) return;

        try {
            await navigator.clipboard.writeText(createdPassword);
            setCopied(true);
            toast.success("Contraseña copiada al portapapeles");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Error al copiar la contraseña");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setCreatedPassword(null);

        try {
            const result = await createUser({ email, fullName, password });
            if (result.success) {
                if (result.password) {
                    setCreatedPassword(result.password);
                }
                toast.success("Usuario creado exitosamente");
                setEmail("");
                setFullName("");
                setPassword("");
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Error al crear usuario");
            }
        } catch {
            toast.error("Error inesperado al crear usuario");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {createdPassword && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                        ¡Usuario creado exitosamente!
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-sm bg-white dark:bg-black p-2 rounded border border-green-300 dark:border-green-700">
                            {createdPassword}
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCopyPassword}
                            className="flex-shrink-0"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Copiado
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copiar
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Guarda esta contraseña, no podrás verla de nuevo.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Ej: Juan Pérez"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="juan@hotel.com"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña (Opcional)</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Dejar vacío para autogenerar"
                            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
                            title="Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos (@$!%*?&)"
                            disabled={isLoading}
                            className="pr-10"
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
                    <p className="text-xs text-muted-foreground">
                        Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos (@$!%*?&).
                    </p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Creando..." : "Crear Encargado"}
                </Button>
            </form>
        </div>
    );
}
