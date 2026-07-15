import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center border-2 border-black font-bold text-black transition-all duration-150",
  {
    variants: {
      variant: {
        default: "bg-brutal-cream hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#141111]",
        accent: "bg-brutal-pink hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#141111]",
        primary: "bg-brutal-yellow hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#141111]",
        danger: "bg-brutal-red hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#141111]",
        ghost: "bg-transparent hover:bg-brutal-cream",
      },
      size: {
        default: "px-4 py-2 text-sm shadow-[2px_2px_0_#141111]",
        sm: "px-3 py-1 text-xs shadow-[2px_2px_0_#141111]",
        lg: "px-6 py-3 text-base shadow-[4px_4px_0_#141111]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }