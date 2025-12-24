"use client";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = "Buscar...",
  value,
  onChange,
  className = "",
}: SearchInputProps) {
  return (
    <div className={className}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="w-full p-2 border border-border-light dark:border-border-dark rounded-lg bg-gray-50 dark:bg-gray-900 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
