import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("h-11 w-full rounded-pill border border-transparent bg-white px-4 text-sm outline-none transition placeholder:text-[#8f8c86] autofill:bg-white focus:border-ink/20 focus:ring-0", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("min-h-28 w-full rounded-[20px] border border-transparent bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#8f8c86] focus:border-ink/20 focus:ring-0", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";
