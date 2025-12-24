"use client";

import { UserList } from "@/components/users/user-list";
import { UserProfile } from "@/lib/actions/users";
import { Users, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CreateUserForm } from "@/components/users/create-user-form";
import { useState } from "react";

interface EncargadosClientProps {
    users: UserProfile[];
    success: boolean;
}

export function EncargadosClient({ users, success }: EncargadosClientProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    const totalUsers = users?.length || 0;
    const adminCount = users?.filter((u) => u.role === "admin").length || 0;

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                        Gestión de Encargados
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                        Administra los usuarios con acceso al sistema.
                    </p>
                </div>

                <div className="flex gap-4">
                    {/* Total Users Card */}
                    <div className="bg-white dark:bg-card border border-border rounded-lg p-4 min-w-[120px]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </div>

                    {/* Admin Count Card */}
                    <div className="bg-white dark:bg-card border border-border rounded-lg p-4 min-w-[120px]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                                <p className="text-xs text-muted-foreground">Admins</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User List with Create Button */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Encargados Registrados</h2>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Nuevo Encargado
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Registrar Nuevo Encargado</DialogTitle>
                                <DialogDescription>
                                    Completa los datos para crear una nueva cuenta de usuario.
                                </DialogDescription>
                            </DialogHeader>
                            <CreateUserForm onSuccess={() => setDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {success && users ? (
                        <UserList users={users} />
                    ) : (
                        <div className="p-8 text-center text-red-500">Error al cargar usuarios.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
