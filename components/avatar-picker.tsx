"use client";

import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/image";

/** Photo de profil : recadrée en carré 512 px, envoyée dans le bucket public « avatars ». */
export function AvatarPicker({ userId, initialUrl, initial }: { userId: string; initialUrl: string | null; initial: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");

  async function onPick(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    setStatus("uploading");
    try {
      if (!file.type.startsWith("image/")) throw new Error("type");
      const blob = await prepareImage(file, { maxSide: 512, square: true });
      const path = `${userId}/${crypto.randomUUID()}.webp`;
      const storage = getBrowserClient().storage.from("avatars");
      const { error } = await storage.upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw error;
      setUrl(storage.getPublicUrl(path).data.publicUrl);
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      input.value = "";
    }
  }

  return (
    <div className="field">
      <span className="field__label">Ta photo</span>
      <input type="hidden" name="avatar_url" value={url} />
      <input id="avatar-file" type="file" accept="image/*" className="sr-only" onChange={(e) => onPick(e.currentTarget)} />
      <div className="avatar-pick">
        <label htmlFor="avatar-file" className="avatar-pick__preview" aria-label="Choisir une photo de profil">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" />
          ) : (
            <span className="avatar-pick__initial">{initial || "?"}</span>
          )}
          <span className="avatar-pick__badge" aria-hidden="true">
            <Camera className="i" />
          </span>
        </label>
        <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
          <label htmlFor="avatar-file" className="btn btn--outline btn--sm" style={{ cursor: "pointer" }}>
            {status === "uploading" ? "Envoi…" : url ? "Changer la photo" : "Choisir une photo"}
          </label>
          {url && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setUrl("")}>
              <Trash2 className="i" aria-hidden="true" />
              Retirer
            </button>
          )}
        </div>
      </div>
      {status === "error" ? (
        <span className="field__hint" style={{ color: "var(--bz-no)" }} role="alert">
          La photo n&apos;est pas passée. Essaie avec une image JPG ou PNG.
        </span>
      ) : (
        <span className="field__hint">Facultatif. Sans photo, c&apos;est ton initiale sur ta couleur.</span>
      )}
    </div>
  );
}
