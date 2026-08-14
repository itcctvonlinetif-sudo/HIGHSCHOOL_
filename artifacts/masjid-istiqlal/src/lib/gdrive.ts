/**
 * Converts any Google Drive URL to a directly embeddable image URL.
 * Handles formats:
 *   - https://drive.google.com/uc?id=FILE_ID&export=view  (old format, often blocked)
 *   - https://drive.google.com/file/d/FILE_ID/view
 *   - https://drive.google.com/open?id=FILE_ID
 * Returns the thumbnail URL format which works reliably for public files.
 */
export function toGDriveImageUrl(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com") && !parsed.hostname.includes("docs.google.com")) {
      return url;
    }

    let fileId: string | null = null;

    const idParam = parsed.searchParams.get("id");
    if (idParam) {
      fileId = idParam;
    }

    if (!fileId) {
      const match = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    }

    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  } catch {
  }

  return url;
}
