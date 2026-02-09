/**
 * @fileOverview Utilitas untuk mengunggah file dengan sistem failover otomatis.
 * Alur: Mencoba Catbox (via Proxy) -> Jika Gagal -> Mencoba PixelDrain (Direct).
 */

const BASE_PROXY_URL = 'https://uploader.himmel.web.id/api/upload';
const PIXELDRAIN_API_KEY = '6d7d2f74-8af6-4f7f-8dc8-c5d817bc4cd2';

/**
 * Fungsi internal untuk mengunggah langsung ke PixelDrain sebagai cadangan.
 */
async function uploadToPixelDrain(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  // PixelDrain menggunakan Basic Auth (user kosong, password adalah API Key)
  const auth = btoa(`:${PIXELDRAIN_API_KEY}`);

  const response = await fetch('https://pixeldrain.com/api/file', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`PixelDrain API gagal dengan status: ${response.status}`);
  }

  const data = await response.json();
  if (!data.id) {
    throw new Error('Respons PixelDrain tidak menyertakan ID file.');
  }

  // Mengembalikan direct link untuk akses gambar
  return `https://pixeldrain.com/api/file/${data.id}`;
}

/**
 * Mengunggah file dengan sistem failover.
 * @param file Objek File dari input browser.
 * @param service Nama layanan uploader utama (default: Catbox).
 * @returns Promise yang mengembalikan URL file yang berhasil diunggah.
 */
export async function uploadFile(file: File, service: string = 'Catbox'): Promise<string> {
  // 1. Coba layanan utama (Catbox) via Proxy
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('service', service);

    const response = await fetch(BASE_PROXY_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      // Mencari URL dalam berbagai kemungkinan struktur respons API proxy
      const uploadedUrl = data.result || data.url || data.link || (data.data && data.data.url) || data.files?.[0]?.url;
      
      if (uploadedUrl) return uploadedUrl;
    }
    
    throw new Error(`Layanan ${service} memberikan respons tidak valid.`);
  } catch (error) {
    console.warn(`[Uploader] ${service} gagal atau error, mencoba failover ke PixelDrain...`, error);
    
    // 2. Jika gagal, otomatis beralih ke PixelDrain
    try {
      return await uploadToPixelDrain(file);
    } catch (pdError) {
      console.error('[Uploader] Semua layanan CDN gagal!', pdError);
      throw new Error('Gagal mengunggah file ke semua penyedia layanan (Catbox & PixelDrain). Harap periksa koneksi internet Anda.');
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
