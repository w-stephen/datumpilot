/**
 * Storage metadata contract required by RLS/storage policies.
 * Every object must map back to an uploads row and owning project/user.
 */
export type StorageMetadata = {
  uploadId: string;
  projectId: string;
  ownerUserId: string;
  contentType?: string;
};

export type SignedUrlRequest = {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
};

export function validateStorageMetadata(meta: StorageMetadata) {
  if (!meta.uploadId || !meta.projectId || !meta.ownerUserId) {
    throw new Error("uploadId, projectId, and ownerUserId are required in storage metadata");
  }
  return meta;
}

// Placeholder for signed URL generation; ensure callers provide validated metadata.
export function createSignedUrl(_: SignedUrlRequest & { metadata: StorageMetadata }) {
  validateStorageMetadata(_.metadata);
  return { url: "" };
}
