import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImageUploadField, FileUploadField, VideoUploadField } from "@/components/forms/UploadFields";
import { MediaPreviewCard } from "@/components/media/MediaPreviewCard";
import { mediaAssets } from "@/data/mockData";

export default function MediaPage() {
  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col gap-6">
        <PageHeader title="Media Library" description="ImageKit-ready placeholders for profile images, homework attachments, study materials, gallery images, videos, and documents." />
        <div className="grid gap-4 md:grid-cols-3">
          <ImageUploadField />
          <FileUploadField />
          <VideoUploadField />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {mediaAssets.map((asset) => <MediaPreviewCard key={asset.id} asset={asset} />)}
        </div>
      </div>
    </DashboardLayout>
  );
}
