import { LabelHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={clsx("block text-sm font-bold text-brutal-black", className)} {...props} />
));
Label.displayName = "Label";
