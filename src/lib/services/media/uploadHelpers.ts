import type { MediaKind, MediaUploadIntent } from "./mediaTypes";

export function buildMediaIntent(kind: MediaKind, folder: string, ownerId?: string): MediaUploadIntent {
  return { kind, folder, ownerId };
}
