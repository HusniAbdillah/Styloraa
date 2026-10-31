import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary-hover inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
