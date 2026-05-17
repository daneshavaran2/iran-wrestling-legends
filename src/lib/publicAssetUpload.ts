import { apiFetch } from './apiClient';

export interface UploadPublicAssetParams {
  file: File;
  category?: 'wrestlers' | 'albums' | 'buildings' | 'about' | 'history' | 'books' | 'audio';
  /** Optional snapshot patch hints */
  table?: string;
  recordId?: string;
  field?: string;
}

/**
 * Uploads a file via the admin backend; the server writes it to
 * public/images or public/videos and patches snapshot.json.
 * Returns the bundled public URL (e.g. /images/wrestlers/abc.webp).
 */
export async function uploadPublicAsset(p: UploadPublicAssetParams): Promise<string> {
  const fd = new FormData();
  fd.append('file', p.file);
  fd.append('category', p.category || 'wrestlers');
  if (p.table) fd.append('table', p.table);
  if (p.recordId) fd.append('recordId', p.recordId);
  if (p.field) fd.append('field', p.field);

  const res = await apiFetch<{ url: string; category: string }>(
    '/admin/public-assets',
    { method: 'POST', body: fd },
  );
  if (res.error || !res.data) {
    throw new Error(res.error?.message || 'Upload failed');
  }
  return res.data.url;
}