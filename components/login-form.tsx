// components/login-form.tsx
"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormInput } from "./ui/form-input";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";



export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState(""); // usamos email para Supabase
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Aquí podrías usar `role` para decidir a dónde redirigir
      // por ejemplo, después de tener roles en tu tabla `profiles`.
      router.push("/protected");
    } catch (error: unknown) {
      let errorMessage = "Ocurrió un error";

      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Correo o contraseña incorrectos";
        } else if (error.message.includes("User not found")) {
          errorMessage = "El usuario no existe";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor confirma tu correo electrónico";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="w-full p-8 space-y-8 bg-white dark:bg-zinc-800 rounded-xl shadow-lg">
        {/* Encabezado*/}
        <div className="text-center">
          <Image
            alt="Logo Hotel"
            className="w-48 h-auto mx-auto"
            src="/img/logosinletras.png"
            width={192}
            height={108}
          />
          <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white">
            Hotel
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Bienvenido al sistema de gestión
          </p>
        </div>

        {/* Formulario */}
        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Correo */}
          <FormInput
            id="email"
            name="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Correo electrónico"
          />

          {/* Password */}
          {/* Password */}
          <div>
            <label
              className="block text-sm font-medium text-zinc-900 dark:text-white mb-2"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pr-10 border border-zinc-300 dark:border-zinc-700 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-white bg-background-light dark:bg-background-dark focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>


          {/* Error de login */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Botón de enviar */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
