import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-bold transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100",
  {
    variants: {
      variant: {
        default: "bg-cta text-white hover:bg-[#e84b2d] focus-visible:outline-cta",
        secondary: "bg-sun text-ink hover:bg-[#edbd37] focus-visible:outline-sun",
        purple: "bg-grape text-white hover:bg-[#a84fe0] focus-visible:outline-grape",
        ghost: "bg-transparent text-ink hover:bg-white",
        dark: "bg-ink text-white hover:bg-[#282323]"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        icon: "size-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ asChild, children, className, variant, size, ...props }, ref) => {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(classes, children.props.className)
    });
  }

  return <button className={classes} ref={ref} {...props}>{children}</button>;
});
Button.displayName = "Button";
