interface UserAvatarProps {
    name: string;
    role?: string;
    size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, role = "encargado", size = "md" }: UserAvatarProps) {
    const getInitials = (fullName: string) => {
        const parts = fullName.trim().split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    };

    const sizeClasses = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
    };

    const colorClasses = role === "admin"
        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

    return (
        <div
            className={`${sizeClasses[size]} ${colorClasses} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
        >
            {getInitials(name)}
        </div>
    );
}
