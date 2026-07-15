import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonVariant = "default" | "ghost" | "disabled";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-display font-bold border-2 border-black transition-all duration-150";
    const variants = {
      default: "bg-brutal-yellow text-black hover:shadow-brutal-md hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
      ghost: "bg-transparent hover:bg-brutal-yellow hover:-translate-x-[1px] hover:-translate-y-[1px] active:shadow-none",
      disabled: "bg-brutal-stone opacity-50 cursor-not-allowed",
    };
    const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", lg: "h-11 px-6 text-base" };
    return (
      <button ref={ref} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";
