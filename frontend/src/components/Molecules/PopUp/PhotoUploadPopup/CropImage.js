// src/components/PhotoUploadPopup/CropImage.js

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Fungsi untuk crop gambar.
 * Mendukung transparansi jika inputnya PNG.
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  mimeType = "image/jpeg"
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set ukuran canvas sesuai area crop
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Bersihkan canvas (penting untuk transparansi)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jika user ingin memaksa JPG (bukan PNG), kita beri background putih
  // agar bagian transparan tidak menjadi hitam otomatis.
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Gambar area yang dicrop ke canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas ke Blob/File
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        // Gunakan nama file dan tipe yang sesuai
        const fileName =
          mimeType === "image/png" ? "cropped-photo.png" : "cropped-photo.jpg";
        const file = new File([blob], fileName, { type: mimeType });
        resolve(file);
      },
      mimeType,
      1
    ); // Kualitas 1 (Maksimum)
  });
}
