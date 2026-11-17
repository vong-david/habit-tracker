/**
 * Local IndexedDB Image Storage for Trading Journal Chart Screenshots
 * Supports client-side compression (WebP/JPEG) to save disk space and offline persistence.
 */

const DB_NAME = "TradingJournalImagesDB";
const STORE_NAME = "tradeScreenshots";
const DB_VERSION = 1;

function openImagesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Compress an image file/blob to optimized WebP/JPEG DataURL (max 1600px width/height)
 */
export function compressImage(
  fileOrBlob: Blob,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        try {
          const webpUrl = canvas.toDataURL("image/webp", quality);
          if (webpUrl.startsWith("data:image/webp")) {
            resolve(webpUrl);
            return;
          }
        } catch {
          // ignore
        }
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Save image into IndexedDB and return its generated ID
 */
export async function saveTradeImage(dataUrlOrBlob: string | Blob): Promise<string> {
  let dataUrl: string;
  if (typeof dataUrlOrBlob === "string") {
    dataUrl = dataUrlOrBlob;
  } else {
    dataUrl = await compressImage(dataUrlOrBlob);
  }

  const imageId = "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

  try {
    const db = await openImagesDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(dataUrl, imageId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to write image to IndexedDB, fallback to direct DataURL", err);
    // If IndexedDB fails, return the DataURL itself so user data is never lost
    return dataUrl;
  }

  return imageId;
}

/**
 * Get image by imageId (or return directly if it's already a DataURL / http link)
 */
export async function getTradeImage(imageId: string): Promise<string | null> {
  if (!imageId) return null;
  if (imageId.startsWith("data:") || imageId.startsWith("http://") || imageId.startsWith("https://")) {
    return imageId;
  }

  try {
    const db = await openImagesDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(imageId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Delete image from IndexedDB
 */
export async function deleteTradeImage(imageId: string): Promise<void> {
  if (!imageId || imageId.startsWith("data:") || imageId.startsWith("http")) return;
  try {
    const db = await openImagesDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(imageId);
  } catch (err) {
    console.warn("Failed to delete image from IndexedDB", err);
  }
}
