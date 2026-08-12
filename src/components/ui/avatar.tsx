import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  imageUrl,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { imageUrl?: string | null }) {
  return (
    <div className={cn("flex size-10 items-center justify-center overflow-hidden rounded-full bg-sun text-sm font-black text-ink", className)} {...props}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : children}
    </div>
  );
}

export function AvatarStack({ items, extra }: { items: string[]; extra?: number }) {
  return (
    <div className="flex items-center">
      {items.map((item) => (
        <Avatar key={item} className="-ml-2 first:ml-0 ring-2 ring-white">
          {item}
        </Avatar>
      ))}
      {extra ? <span className="-ml-2 rounded-full bg-white px-3 py-2 text-xs font-black ring-2 ring-white">+{extra}</span> : null}
    </div>
  );
}
