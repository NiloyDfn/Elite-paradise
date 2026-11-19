// ─────────────────────────────────────────────────────────────────────────────
// Multi-image uploader for the admin product form.
//
// Uploads go browser → object storage directly (the server only signs the PUT),
// so a 5 MB photo never passes through the API. Each file is validated before
// it is sent, shows its own progress, and can be removed or reordered. The
// first image in the list is the primary image — the storefront uses it for
// cards and the product page's main view.
//
// Nothing here is optimistic: an image only enters the list once the commit
// call has returned, so a failed upload can never leave a dead URL in a product.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { trpc } from "@/_core/trpc";
import { IconClose } from "./shared";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — generous for a product photo

type Item = {
  id: string;
  url: string;
  name: string;
  progress: number; // 0–100
  status: "uploading" | "done" | "error";
  error?: string;
};

export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadUrl = trpc.files.uploadUrl.useMutation();
  const commit = trpc.files.commit.useMutation();

  // The committed list is the source of truth for the form; `items` only tracks
  // in-flight uploads and their progress.
  const emit = (urls: string[]) => onChange(urls);

  const addUrls = (urls: string[]) => {
    const next = [...value, ...urls.filter((u) => !value.includes(u))];
    emit(next);
  };

  const removeAt = (index: number) => {
    emit(value.filter((_, i) => i !== index));
  };

  const makePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    emit(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  };

  const uploadOne = async (file: File) => {
    const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;

    // Validate before spending a request.
    if (!ACCEPTED.includes(file.type)) {
      setItems((prev) => [
        ...prev,
        { id, url: "", name: file.name, progress: 0, status: "error", error: "Not a supported image type." },
      ]);
      return;
    }
    if (file.size > MAX_BYTES) {
      setItems((prev) => [
        ...prev,
        {
          id,
          url: "",
          name: file.name,
          progress: 0,
          status: "error",
          error: `Too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 8 MB.`,
        },
      ]);
      return;
    }

    setItems((prev) => [...prev, { id, url: "", name: file.name, progress: 0, status: "uploading" }]);

    try {
      const signed = await uploadUrl.mutateAsync({ name: file.name, contentType: file.type });

      // XHR rather than fetch: it is the only way to read upload progress.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: pct } : it)));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Storage rejected the upload (${xhr.status}).`));
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(file);
      });

      await commit.mutateAsync({ key: signed.key, name: file.name });

      setItems((prev) => prev.filter((it) => it.id !== id));
      addUrls([signed.publicPath]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "error", error: message } : it)),
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setGlobalError(null);
    Array.from(files).forEach((f) => void uploadOne(f));
  };

  return (
    <div className="sm:col-span-2">
      <div className="flex items-baseline justify-between mb-2">
        <p className="ep-label mb-0">Product images</p>
        <p className="text-[10.5px] text-grey">
          {value.length} {value.length === 1 ? "image" : "images"} · first is primary
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border border-dashed px-5 py-7 text-center transition-colors ${
          dragging ? "border-gold bg-gold/5" : "border-border bg-white/60"
        }`}
      >
        <p className="text-[12.5px] text-ink">Drag photos here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="ep-btn ep-btn-ghost mt-3 text-[10px]"
        >
          Browse files
        </button>
        <p className="text-[10.5px] text-grey mt-3">
          PNG, JPEG, WebP, AVIF or GIF · up to 8 MB each · multiple selection supported
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {globalError && <p className="text-[11px] text-destructive mt-2">{globalError}</p>}

      {/* In-flight uploads */}
      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="border border-border bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-ink truncate">{it.name}</span>
                <span className="text-[10.5px] text-grey shrink-0">
                  {it.status === "error" ? "Failed" : `${it.progress}%`}
                </span>
              </div>
              {it.status === "uploading" ? (
                <div className="mt-1.5 h-[2px] bg-border overflow-hidden">
                  <div
                    className="h-full bg-gold transition-[width] duration-200"
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-[10.5px] text-destructive mt-1">{it.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Committed images */}
      {value.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, i) => (
            <li key={url} className="relative group border border-border bg-white">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={url} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
              </div>

              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-gold text-night text-[8px] tracking-[0.12em] uppercase px-1.5 py-0.5">
                  Primary
                </span>
              )}

              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove image ${i + 1}`}
                className="absolute top-1.5 right-1.5 bg-ivory/95 border border-border p-1 hover:bg-white"
              >
                <IconClose className="w-3 h-3" />
              </button>

              <div className="flex items-center justify-between px-1.5 py-1 border-t border-border">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                    className="px-1 text-[11px] text-grey disabled:opacity-30 hover:text-ink"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label="Move later"
                    className="px-1 text-[11px] text-grey disabled:opacity-30 hover:text-ink"
                  >
                    →
                  </button>
                </div>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    className="text-[9px] tracking-[0.08em] uppercase text-grey hover:text-ink"
                  >
                    Set primary
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
