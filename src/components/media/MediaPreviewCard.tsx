import { FileText, Image, Video } from "lucide-react";
import type { MediaAsset } from "@/types";
import { Badge } from "@/components/ui/badge";

export function MediaPreviewCard({ asset }: { asset: MediaAsset }) {
  const Icon = asset.type === "image" ? Image : asset.type === "video" ? Video : FileText;
  return (
    <article className="rounded-card bg-white p-5">
      <div className="flex aspect-video items-center justify-center rounded-[22px] bg-pastel-blue">
        <Icon className="size-10" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge tone={asset.type === "video" ? "purple" : "blue"}>{asset.type}</Badge>
        <span className="text-xs font-bold text-[#72706c]">ImageKit-ready</span>
      </div>
      <h3 className="mt-3 text-lg font-black">{asset.title}</h3>
      <p className="mt-1 text-sm text-[#72706c]">Owner: {asset.owner}</p>
    </article>
  );
}
