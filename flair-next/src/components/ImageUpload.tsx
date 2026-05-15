// Image upload UI for the Badge editor.
//
// Pattern matches the native Flair editor's image card: a dashed drop
// zone with click-to-browse + drag-and-drop, then an alt-text input,
// Width / Height inputs, and a chain-link icon that toggles a URL-paste
// mode (for Shopify CDN or external image links).
//
// On upload, the source image's natural dimensions auto-fill Width and
// Height so the badge renders at its natural size by default. Merchants
// can still override either field. Pasting a URL preloads the image to
// fill W/H the same way.
//
// ───────────────────────────────────────────────────────────────────────
// FOR NICK — STORAGE LAYER
// ───────────────────────────────────────────────────────────────────────
// Prototype stores uploaded files as base64 data URLs on Creative.imageUrl
// so the preview round-trips end-to-end without a backend. In production,
// swap the storage layer to a Shopify CDN upload (presigned URL flow or
// the Files API) — the rest of the UI continues working unchanged because
// it only reads Creative.imageUrl, not the file blob.

import { useRef, useState } from "react";

export type ImageContent = {
  imageUrl: string | null;
  imageFileName: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageSourceUrl: string | null;
  altText: string;
};

type Props = {
  value: ImageContent;
  onChange: (patch: Partial<ImageContent>) => void;
};

const ACCEPTED_TYPES = "image/gif,image/jpeg,image/png,image/svg+xml,image/webp";
const ACCEPTED_LABEL = "GIF, JPG, PNG, SVG, WEBP";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// ─── Helpers ───────────────────────────────────────────────────────────────

// Read a File into a base64 data URL. Used as the prototype's storage path
// (see file header — Nick swaps this for a CDN upload in production).
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Peek an image's natural dimensions by loading it into an off-screen
// <img>. Used to auto-fill W/H on first upload or URL paste.
function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════
export default function ImageUpload({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState<boolean>(!!value.imageSourceUrl && !value.imageFileName);
  const [urlDraft, setUrlDraft] = useState<string>(value.imageSourceUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  const hasImage = !!value.imageUrl;

  // ── File processing — shared by browse + drop ─────────────────────────
  const ingestFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError(`Only image files are supported (${ACCEPTED_LABEL}).`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 2 MB.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const dims = await readImageDimensions(dataUrl).catch(() => null);
      onChange({
        imageUrl: dataUrl,
        imageFileName: file.name,
        imageSourceUrl: null,
        imageWidth: dims?.width ?? null,
        imageHeight: dims?.height ?? null,
      });
    } catch (err) {
      setError("Could not read that file. Try a different one.");
    }
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void ingestFile(file);
    // Reset so picking the same file twice still triggers onChange
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void ingestFile(file);
  };

  // ── URL paste mode ────────────────────────────────────────────────────
  const handleUrlCommit = async () => {
    const url = urlDraft.trim();
    if (!url) return;
    setError(null);
    try {
      const dims = await readImageDimensions(url);
      onChange({
        imageUrl: url,
        imageSourceUrl: url,
        imageFileName: null,
        imageWidth: dims.width,
        imageHeight: dims.height,
      });
    } catch (err) {
      setError("That URL didn't load as an image.");
    }
  };

  const handleRemove = () => {
    onChange({
      imageUrl: null,
      imageFileName: null,
      imageSourceUrl: null,
      imageWidth: null,
      imageHeight: null,
    });
    setUrlDraft("");
    setError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="be-image-upload">
      <div className="be-image-upload-label">Image</div>

      {/* Drop zone OR URL input OR file pill, depending on state */}
      {hasImage ? (
        <FilePill
          imageUrl={value.imageUrl!}
          fileName={value.imageFileName ?? value.imageSourceUrl ?? "Image"}
          onReplace={() => {
            if (urlMode) {
              setUrlDraft("");
            } else {
              handleBrowseClick();
            }
          }}
          onRemove={handleRemove}
        />
      ) : urlMode ? (
        <div className="be-image-url-row">
          <input
            type="url"
            className="be-input"
            placeholder="Paste an image URL"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleUrlCommit();
              }
            }}
            onBlur={() => urlDraft.trim() && void handleUrlCommit()}
          />
        </div>
      ) : (
        <div
          className={"be-dropzone " + (isDragOver ? "is-dragover" : "")}
          onClick={handleBrowseClick}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <svg
            className="be-dropzone-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            width="36"
            height="36"
          >
            <path
              d="M4 4h12a2 2 0 0 1 2 2v8.586l-3.293-3.293a1 1 0 0 0-1.414 0L9 15.586l-1.293-1.293a1 1 0 0 0-1.414 0L4 16.586V4z"
              fill="currentColor"
              opacity="0.35"
            />
            <path
              d="M19 17v-2h2v2h2v2h-2v2h-2v-2h-2v-2h2z"
              fill="currentColor"
            />
          </svg>
          <div className="be-dropzone-primary">
            <span className="be-dropzone-link">Upload a file</span>{" "}
            <span className="be-dropzone-muted">or drag and drop</span>
          </div>
          <div className="be-dropzone-meta">{ACCEPTED_LABEL} up to 2MB</div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="be-dropzone-input"
            onChange={handleFileInputChange}
          />
        </div>
      )}

      {error && <div className="be-image-error">{error}</div>}

      {/* Field row — Alt text + Width + Height + URL-paste toggle */}
      <div className="be-image-fields-row">
        <div className="be-image-field be-image-field--alt">
          <label className="be-image-field-label">Alt Text</label>
          <input
            type="text"
            className="be-input"
            placeholder="e.g. — Sale badge"
            value={value.altText}
            onChange={(e) => onChange({ altText: e.target.value })}
          />
        </div>
        <div className="be-image-field be-image-field--dim">
          <label className="be-image-field-label">Width</label>
          <input
            type="number"
            className="be-input"
            min={1}
            value={value.imageWidth ?? ""}
            onChange={(e) =>
              onChange({ imageWidth: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <div className="be-image-field be-image-field--dim">
          <label className="be-image-field-label">Height</label>
          <input
            type="number"
            className="be-input"
            min={1}
            value={value.imageHeight ?? ""}
            onChange={(e) =>
              onChange({ imageHeight: e.target.value ? Number(e.target.value) : null })
            }
          />
        </div>
        <button
          type="button"
          className={"be-image-url-toggle " + (urlMode ? "is-active" : "")}
          onClick={() => {
            // Toggle URL mode. If switching away while there's no image,
            // clear the draft so the dropzone shows fresh.
            const next = !urlMode;
            setUrlMode(next);
            if (!next) setUrlDraft("");
            setError(null);
          }}
          title={urlMode ? "Switch back to file upload" : "Paste an image URL instead"}
          aria-pressed={urlMode}
          aria-label="Toggle URL paste mode"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
            <path
              d="M8.5 11.5a3 3 0 0 0 4.24 0l3-3a3 3 0 1 0-4.24-4.24l-1.06 1.06m-2.5 5.42a3 3 0 0 0-4.24 0l-3 3a3 3 0 1 0 4.24 4.24l1.06-1.06"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── File pill ───────────────────────────────────────────────────────────
function FilePill({
  imageUrl,
  fileName,
  onReplace,
  onRemove,
}: {
  imageUrl: string;
  fileName: string;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="be-file-pill">
      <div className="be-file-pill-thumb">
        <img src={imageUrl} alt="" />
      </div>
      <div className="be-file-pill-meta">
        <div className="be-file-pill-name">{fileName}</div>
        <div className="be-file-pill-actions">
          <button type="button" className="be-file-pill-action" onClick={onReplace}>
            Replace
          </button>
          <span className="be-file-pill-sep">·</span>
          <button
            type="button"
            className="be-file-pill-action be-file-pill-action--danger"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
