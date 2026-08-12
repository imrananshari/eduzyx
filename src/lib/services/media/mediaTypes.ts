export type MediaKind = "image" | "video" | "document";

export type MediaUploadIntent = {
  kind: MediaKind;
  ownerId?: string;
  folder: string;
};

export type MediaUploadResult = {
  url: string;
  fileId: string;
  mocked: boolean;
};
