const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_DIM = 1200;
const QUALITY = 0.75;

/** Compress an image File via canvas. Returns a Blob. */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/jpeg', QUALITY);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Upload a file to the backend. Returns the URL string. */
export async function uploadPhoto(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const blob = await compressImage(file);
  const formData = new FormData();
  formData.append('file', blob, 'photo.jpg');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/upload/`);
    if (onProgress) {
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(`${BASE_URL}${data.url}`);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/** Create an object URL preview from a File. Remember to revoke when done. */
export function previewUrl(file: File): string {
  return URL.createObjectURL(file);
}
