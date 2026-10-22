// Préparation des images dans le navigateur, avant l'envoi vers Supabase Storage.

/**
 * Réduit l'image (côté le plus long ≤ maxSide) et la convertit en WebP.
 * Avec `square`, recadre au centre en carré (photos de profil).
 */
export async function prepareImage(file: File, { maxSide, square = false }: { maxSide: number; square?: boolean }) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = square ? (bitmap.width - side) / 2 : 0;
  const sy = square ? (bitmap.height - side) / 2 : 0;
  const sw = square ? side : bitmap.width;
  const sh = square ? side : bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("conversion"))), "image/webp", 0.82),
  );
}
