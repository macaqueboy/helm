import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={clsx("w-full px-3 py-2 border-2 border-brutal-black bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-brutal-cyan", className)} {...props} />
));
Input.displayName = "Input";
