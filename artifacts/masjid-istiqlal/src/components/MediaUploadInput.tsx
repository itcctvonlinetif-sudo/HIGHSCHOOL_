import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, Loader2, CheckCircle, X } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Module-level provider cache — fetched once, reused everywhere
let _cachedProvider: string | null = null;
let _fetchingProvider: Promise<string> | null = null;

async function fetchProvider(): Promise<string> {
  if (_cachedProvider) return _cachedProvider;
  if (!_fetchingProvider) {
    _fetchingProvider = fetch(`${BASE}/api/storage/provider`)
      .then((r) => r.json())
      .then((d) => {
        _cachedProvider = d.provider ?? "gcs";
        return _cachedProvider as string;
      })
      .catch(() => {
        _cachedProvider = "gcs";
        return "gcs";
      });
  }
  return _fetchingProvider;
}

interface MediaUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
  label?: string;
}

export function MediaUploadInput({
  value,
  onChange,
  accept = "image/*",
  placeholder = "https://...",
  label,
}: MediaUploadInputProps) {
  const isLocal = value.startsWith("/api/storage");
  const isExternal = value.startsWith("https://") || value.startsWith("http://");
  const isProviderFile = !isLocal && isExternal && value.includes("drive.google.com");
  const isOneDriveFile = !isLocal && isExternal && (value.includes("1drv.ms") || value.includes("sharepoint.com") || value.includes("onedrive.live.com"));

  const hasUploadedFile = isLocal || isProviderFile || isOneDriveFile;

  const [mode, setMode] = useState<"link" | "upload">(
    hasUploadedFile ? "upload" : "link"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadDone(false);

    try {
      const provider = await fetchProvider();

      if (provider === "gcs") {
        // GCS: 2-step presigned URL upload
        const res = await fetch(`${BASE}/api/storage/uploads/request-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });
        if (!res.ok) throw new Error("Gagal mendapatkan URL upload");
        const { uploadURL, objectPath } = await res.json();

        const putRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!putRes.ok) throw new Error("Gagal mengupload file ke storage");

        onChange(`/api/storage${objectPath}`);
      } else {
        // Google Drive / OneDrive: single-step server upload
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${BASE}/api/storage/uploads/direct`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Upload gagal");
        }
        const { url } = await res.json();
        onChange(url);
      }

      setUploadDone(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const displayName = isLocal
    ? value.split("/").pop() ?? "File terupload"
    : isProviderFile
    ? "Google Drive"
    : isOneDriveFile
    ? "OneDrive"
    : "";

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Mode tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "link" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <LinkIcon size={12} /> Link URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
            mode === "upload" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Upload size={12} /> Upload File
        </button>
      </div>

      {mode === "link" ? (
        <input
          type="text"
          value={hasUploadedFile ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {hasUploadedFile && !isUploading ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
              <CheckCircle size={14} className="text-green-600 shrink-0" />
              <span className="text-green-700 truncate flex-1">{displayName || "File terupload"}</span>
              <button
                type="button"
                onClick={() => { onChange(""); setUploadDone(false); }}
                className="text-gray-400 hover:text-red-500 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Pilih file atau seret ke sini
                </>
              )}
            </button>
          )}

          {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          {uploadDone && <p className="mt-1 text-xs text-green-600">✓ File berhasil diupload</p>}
        </div>
      )}
    </div>
  );
}
