/**
 * @fileOverview Utilitas untuk mengunggah file dengan sistem failover otomatis.
 * Alur: Proxy (Catbox/Litterbox/Uguu) -> Fileditch -> PixelDrain (Multi-Key/Anonymous).
 */

const BASE_PROXY_URL = 'https://uploader.himmel.web.id/api/upload';
const PIXELDRAIN_KEYS = [
  'ab9eec7d-1684-4f59-a0dc-207cf4a6af77',
  '6d7d2f74-8af6-4f7f-8dc8-c5d817bc4cd2',
  'a0ed18eb-3627-4ced-8f0d-b782aaccc016'
];

export const UPLOADER_SERVICES = [
  'Catbox',
  'Litterbox',
  'Uguu',
  'Pomf',
  'Quax'
];

/**
 * Mencoba mengunggah ke Fileditch (Limit besar, tanpa API Key).
 */
async function uploadToFileditch(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("files[]", file);

  console.log("[Uploader] Mencoba Fileditch...");
  try {
    const response = await fetch("https://up1.fileditch.com/upload.php", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Fileditch gagal dengan status: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.files && data.files.length > 0) {
      console.log("[Uploader] Berhasil mengunggah ke Fileditch.");
      return data.files[0].url;
    }
    throw new Error("Gagal mendapatkan URL dari Fileditch");
  } catch (error) {
    console.warn("[Uploader] Fileditch error:", error);
    throw error;
  }
}

/**
 * Fungsi internal untuk mengunggah ke PixelDrain dengan sistem multi-key dan anonymous fallback.
 */
async function uploadToPixelDrain(file: File, keyIndex: number = 0): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

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
 * Mencoba mengunggah ke berbagai layanan melalui proxy.
 */
async function uploadViaProxy(file: File, serviceIndex: number = 0): Promise<string> {
  if (serviceIndex >= UPLOADER_SERVICES.length) {
    throw new Error('Seluruh layanan proxy gagal.');
  }

  const service = UPLOADER_SERVICES[serviceIndex];
  console.log(`[Uploader] Mencoba mengunggah ke ${service} via Proxy...`);

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
      const uploadedUrl = data.result || data.url || data.link || (data.data && data.data.url) || data.files?.[0]?.url;
      
      if (uploadedUrl) {
        console.log(`[Uploader] Berhasil mengunggah ke ${service}.`);
        return uploadedUrl;
      }
    }
    
    console.warn(`[Uploader] ${service} gagal, mencoba layanan proxy berikutnya...`);
    return uploadViaProxy(file, serviceIndex + 1);
  } catch (error) {
    console.warn(`[Uploader] ${service} error, mencoba layanan proxy berikutnya...`);
    return uploadViaProxy(file, serviceIndex + 1);
  }
}

/**
 * Mengunggah file dengan sistem failover multi-lapis.
 * @param file Objek File dari input browser.
 * @returns Promise yang mengembalikan URL file yang berhasil diunggah.
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Coba berbagai layanan via Proxy (Catbox, Litterbox, dll)
  try {
    return await uploadViaProxy(file);
  } catch (proxyError) {
    console.warn(`[Uploader] Seluruh layanan proxy gagal, mencoba Fileditch...`);
    
    // 2. Jika semua proxy gagal, coba Fileditch
    try {
      return await uploadToFileditch(file);
    } catch (fileditchError) {
      console.warn(`[Uploader] Fileditch gagal, beralih ke PixelDrain sebagai cadangan terakhir...`);
      
      // 3. Jika Fileditch gagal, beralih ke PixelDrain (Multi-Key)
      try {
        const url = await uploadToPixelDrain(file);
        console.log("[Uploader] Berhasil mengunggah ke PixelDrain.");
        return url;
      } catch (pdError) {
        console.error('[Uploader] Fatal: Seluruh sistem CDN gagal merespons!', pdError);
        throw new Error('Gagal mengunggah file. Harap periksa koneksi internet Anda atau coba file yang lebih kecil.');
      }
    }
  }
}
