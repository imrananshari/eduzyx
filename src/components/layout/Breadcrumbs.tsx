import Link from "next/link";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#72706c]">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span className="text-ink">{item.label}</span>}
          {index < items.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </nav>
  );
}
