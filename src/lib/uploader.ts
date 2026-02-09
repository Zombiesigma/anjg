/**
 * @fileOverview Utilitas untuk mengunggah file dengan sistem failover otomatis.
 * Alur: Mencoba Catbox (via Proxy) -> Jika Gagal -> Mencoba PixelDrain (Direct dengan Multi-Key).
 */

const BASE_PROXY_URL = 'https://uploader.himmel.web.id/api/upload';
const PIXELDRAIN_KEYS = [
  '6d7d2f74-8af6-4f7f-8dc8-c5d817bc4cd2',
  'a0ed18eb-3627-4ced-8f0d-b782aaccc016'
];

/**
 * Fungsi internal untuk mengunggah ke PixelDrain dengan sistem multi-key dan anonymous fallback.
 */
async function uploadToPixelDrain(file: File, keyIndex: number = 0): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  // Jika sudah mencoba semua key, coba upload anonim
  const isAnonymous = keyIndex >= PIXELDRAIN_KEYS.length;
  
  const options: RequestInit = {
    method: 'POST',
    body: formData,
  };

  if (!isAnonymous) {
    const auth = btoa(`:${PIXELDRAIN_KEYS[keyIndex]}`);
    options.headers = {
      'Authorization': `Basic ${auth}`
    };
    console.log(`[Uploader] Mencoba PixelDrain dengan API Key #${keyIndex + 1}...`);
  } else {
    console.log(`[Uploader] Mencoba PixelDrain via Anonymous Upload...`);
  }

  try {
    const response = await fetch('https://pixeldrain.com/api/file', options);

    if (!response.ok) {
      if (!isAnonymous) {
        console.warn(`[Uploader] PixelDrain Key #${keyIndex + 1} gagal (Status: ${response.status}).`);
        return uploadToPixelDrain(file, keyIndex + 1);
      }
      throw new Error(`PixelDrain API gagal dengan status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.id) {
      throw new Error('Respons PixelDrain tidak menyertakan ID file.');
    }

    return `https://pixeldrain.com/api/file/${data.id}`;
  } catch (error) {
    if (!isAnonymous) {
      console.warn(`[Uploader] PixelDrain Key #${keyIndex + 1} error, mencoba tahap berikutnya...`, error);
      return uploadToPixelDrain(file, keyIndex + 1);
    }
    throw error;
  }
}

/**
 * Mengunggah file dengan sistem failover.
 * @param file Objek File dari input browser.
 * @returns Promise yang mengembalikan URL file yang berhasil diunggah.
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Coba layanan utama (Catbox) via Proxy
  try {
    console.log("[Uploader] Mencoba mengunggah ke Catbox...");
    const formData = new FormData();
    formData.append('file', file);
    formData.append('service', 'Catbox');

    const response = await fetch(BASE_PROXY_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const uploadedUrl = data.result || data.url || data.link || (data.data && data.data.url) || data.files?.[0]?.url;
      
      if (uploadedUrl) {
        console.log("[Uploader] Berhasil mengunggah ke Catbox.");
        return uploadedUrl;
      }
    }
    
    throw new Error(`Respons Proxy Catbox tidak valid.`);
  } catch (error) {
    console.warn(`[Uploader] Catbox gagal atau sibuk, beralih ke sistem failover PixelDrain...`, error);
    
    // 2. Jika gagal, otomatis beralih ke PixelDrain dengan sistem multi-key
    try {
      const url = await uploadToPixelDrain(file);
      console.log("[Uploader] Berhasil mengunggah ke PixelDrain.");
      return url;
    } catch (pdError) {
      console.error('[Uploader] Seluruh sistem CDN (Catbox & PixelDrain) gagal merespons!', pdError);
      throw new Error('Gagal mengunggah file ke semua penyedia layanan. Harap periksa ukuran file atau koneksi internet Anda.');
    }
  }
}

export const UPLOADER_SERVICES = [
  'Catbox',
  'Litterbox',
  'Pomf',
  'Quax',
  'Ryzumi',
  'Uguu',
  'Videy',
  'Cloudku',
  'Picsur'
];
