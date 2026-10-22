// Shrinks a photo before it is uploaded: phone photos are often 4–10 MB, but 768 px is plenty
// for recognising food. Returns a JPEG data URL ("data:image/jpeg;base64,…") of about 60–150 kB: quick to upload and to analyse.
export async function shrinkImage(file, maxSize = 768, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
