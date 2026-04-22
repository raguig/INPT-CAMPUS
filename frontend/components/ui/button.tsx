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
          "bg-[#042747] text-white shadow-[0_12px_30px_rgba(4,39,71,0.22)] hover:-translate-y-0.5 hover:bg-[#063562]",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-black",
        secondary:
          "bg-white text-[#042747] border border-[#042747]/15 shadow-[0_10px_24px_rgba(4,39,71,0.08)] hover:bg-gray-50",
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
