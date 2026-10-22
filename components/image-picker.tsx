"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/image";

export function ImagePicker({
  groupId,
  initialPath,
  initialUrl,
}: {
  groupId: string;
  initialPath: string;
  initialUrl: string | null;
}) {
  const [path, setPath] = useState(initialPath);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      return;
    }
    setStatus("uploading");
    try {
      const blob = await prepareImage(file, { maxSide: 1600 });
      const newPath = `${groupId}/covers/${crypto.randomUUID()}.webp`;
      const { error } = await getBrowserClient()
        .storage.from("plan-photos")
        .upload(newPath, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;

      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setPreview(objectUrl.current);
      setPath(newPath);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    setPath("");
    setPreview(null);
    setStatus("idle");
  }

  return (
    <div className="field">
      <span className="field__label">Image</span>
      <input type="hidden" name="cover_path" value={path} />
      <input
        ref={inputRef}
        id="cover"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      {preview ? (
        <div className="cover-pick">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu de l'image du plan" className="cover-pick__img" />
          <div className="cover-pick__actions">
            <label htmlFor="cover" className="btn btn--outline btn--sm">
              <ImagePlus className="i" aria-hidden="true" />
              Changer
            </label>
            <button type="button" className="btn btn--ghost btn--sm" onClick={remove}>
              <Trash2 className="i" aria-hidden="true" />
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor="cover" className="cover-drop">
          <ImagePlus className="i" aria-hidden="true" />
          <span>{status === "uploading" ? "Envoi de l'image…" : "Ajouter une affiche ou une photo"}</span>
          <span className="field__hint">JPG, PNG ou WebP. Elle est réduite automatiquement.</span>
        </label>
      )}

      {status === "uploading" && preview && <span className="field__hint">Envoi de l&apos;image…</span>}
      {status === "error" && (
        <span className="field__hint" style={{ color: "var(--bz-no)" }} role="alert">
          L&apos;image n&apos;est pas passée. Essaie avec une photo JPG ou PNG.
        </span>
      )}
    </div>
  );
}
