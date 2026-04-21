import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-12 px-5 py-3",
        lg: "h-[3.25rem] px-6 py-3.5",
        sm: "h-10 px-4 py-2",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(15,118,110,0.22)] hover:-translate-y-0.5 hover:bg-[#0c6760]",
        ghost:
          "bg-transparent text-slate-700 hover:bg-white/70 hover:text-slate-900",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_10px_24px_rgba(251,146,60,0.14)] hover:bg-[#ffedd5]",
      },
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };
