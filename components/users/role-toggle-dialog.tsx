"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Shield, UserCog } from "lucide-react";

interface RoleToggleDialogProps {
    isOpen: boolean;
    userName: string;
    currentRole: string;
    isUpdating: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function RoleToggleDialog({
    isOpen,
    userName,
    currentRole,
    isUpdating,
    onConfirm,
    onCancel,
}: RoleToggleDialogProps) {
    const isPromoting = currentRole !== "admin";
    const newRole = isPromoting ? "Administrador" : "Encargado";
    const Icon = isPromoting ? Shield : UserCog;

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {isPromoting ? "Promover a Administrador" : "Degradar a Encargado"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isPromoting ? (
                            <>
                                Estás a punto de promover a <span className="font-semibold">{userName}</span> a{" "}
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    Administrador
                                </span>
                                . Este usuario tendrá acceso completo al sistema, incluyendo la gestión de otros
                                usuarios.
                            </>
                        ) : (
                            <>
                                Estás a punto de degradar a <span className="font-semibold">{userName}</span> a{" "}
                                <span className="font-semibold text-blue-600 dark:text-blue-400">Encargado</span>.
                                Este usuario perderá acceso a la gestión de usuarios y otras funciones
                                administrativas.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cambiar a {newRole}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
