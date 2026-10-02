/**
 * Cloudflare R2 storage utilities.
 * Replaces Supabase Storage for storing Firebase Service Account JSON files.
 *
 * R2 is accessed via the Worker binding `env.R2` (an R2Bucket).
 * No SDK needed — the binding is available directly in the Worker runtime.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

/** R2 is optional — new installs store Firebase JSON encrypted in D1 only. */
async function getBucket(): Promise<R2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    return (env as { R2?: R2Bucket }).R2 ?? null
  } catch {
    return null
  }
}

/**
 * Upload a Firebase Service Account JSON file to R2.
 *
 * @param key     R2 object key — e.g. "users/{userId}/projects/{projectId}/firebase.json"
 * @param content The JSON file content as a string
 */
export async function uploadToR2(key: string, content: string): Promise<void> {
  const bucket = await getBucket()
  if (!bucket) {
    throw new Error('R2 is not configured. Firebase JSON is stored in D1; R2 is only for legacy migrations.')
  }
  await bucket.put(key, content, {
    httpMetadata: { contentType: 'application/json' },
  })
}

/**
 * Download a file from R2 and return its text content.
 * Returns null if the object does not exist.
 */
export async function downloadFromR2(key: string): Promise<string | null> {
  const bucket = await getBucket()
  if (!bucket) return null
  const object = await bucket.get(key)
  if (!object) return null
  return object.text()
}

/**
 * Delete a file from R2.
 * Silent no-op if the object doesn't exist.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const bucket = await getBucket()
  if (!bucket) return
  await bucket.delete(key)
}

/**
 * Build the R2 object key for a project's Firebase credentials.
 * Format: users/{userId}/projects/{projectId}/firebase.json
 */
export function buildFirebaseCredentialsKey(
  userId: string,
  projectId: string
): string {
  return `users/${userId}/projects/${projectId}/firebase.json`
}
