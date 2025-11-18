import imageCompression from "browser-image-compression";

export async function compressImage(file: File) {
  return await imageCompression(file, {
    maxWidthOrHeight: 1500,
    maxSizeMB: 0.4,
    useWebWorker: true,
  });
}
