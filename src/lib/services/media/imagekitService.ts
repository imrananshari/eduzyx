import type { MediaUploadIntent, MediaUploadResult } from "./mediaTypes";

export async function createImageKitUploadPlaceholder(intent: MediaUploadIntent): Promise<MediaUploadResult> {
  return {
    url: `${process.env.IMAGEKIT_URL_ENDPOINT ?? "https://ik.imagekit.io/demo"}/${intent.folder}/mock-${intent.kind}`,
    fileId: `mock-imagekit-${Date.now()}`,
    mocked: true
  };
}
