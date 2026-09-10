import type { Bindings } from "../index";

/**
 * Uploads a file buffer directly to Cloudflare R2 bucket.
 */
export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  await bucket.put(key, data, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return key;
}

/**
 * Retrieves an object from Cloudflare R2 bucket.
 */
export async function getFromR2(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return await bucket.get(key);
}

/**
 * Resolves the absolute public URL of an image stored in R2.
 */
export function getR2PublicUrl(env: Bindings, key: string): string {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }
  const domain = env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "");
  if (domain) {
    return `${domain}/${key}`;
  }
  // Fallback to Worker media proxy endpoint
  return `/api/media/${key}`;
}
