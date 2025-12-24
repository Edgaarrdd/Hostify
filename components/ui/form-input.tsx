import React from "react";
import { cn } from "@/lib/utils";

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function FormInput({
  label,
  error,
  className,
  id,
  ...props
}: FormInputProps) {
  const baseClasses =
    "appearance-none rounded-lg relative block w-full px-3 py-3 border border-zinc-300 dark:border-zinc-700 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-white bg-background-light dark:bg-background-dark focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm";

  const errorClasses = error
    ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500"
    : "";

  return (
    <div>
      {label && (
        <label
          className="block text-sm font-medium text-zinc-900 dark:text-white mb-2"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(baseClasses, errorClasses, className)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
