import { FileUp, ImageUp, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function UploadShell({ title, description, icon: Icon }: { title: string; description: string; icon: typeof ImageUp }) {
  return (
    <div className="rounded-[22px] border border-dashed border-ink/20 bg-white p-5">
      <div className="flex size-12 items-center justify-center rounded-[18px] bg-pastel-yellow">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-sm font-black">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[#72706c]">{description}</p>
      <Badge className="mt-3" tone="blue">Mock upload</Badge>
    </div>
  );
}

export function ImageUploadField() {
  return <UploadShell title="Image upload" description="Profile and gallery ImageKit placeholder." icon={ImageUp} />;
}

export function FileUploadField() {
  return <UploadShell title="Document upload" description="PDF, worksheet, and record placeholder." icon={FileUp} />;
}

export function VideoUploadField() {
  return <UploadShell title="Video upload" description="Study material video placeholder." icon={Video} />;
}
