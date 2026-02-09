/**
 * @fileOverview Utilitas untuk mengunggah file dengan sistem failover otomatis.
 * Alur: Proxy (Catbox/Litterbox/Uguu/Pomf/Quax) -> Fileditch.
 */

const BASE_PROXY_URL = 'https://uploader.himmel.web.id/api/upload';

export const UPLOADER_SERVICES = [
  'Catbox',
  'Litterbox',
  'Uguu',
  'Pomf',
  'Quax'
];

/**
 * Memastikan URL menggunakan protokol HTTPS.
 */
function ensureHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  if (!url.startsWith('http')) return `https://${url}`;
  return url;
}

/**
 * Mencoba mengunggah ke Fileditch (Limit besar, tanpa API Key).
 */
async function uploadToFileditch(file: File): Promise<string> {
  const formData = new FormData();
  // Fileditch menggunakan array name 'files[]'
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
      return ensureHttps(data.files[0].url);
    }
    throw new Error("Gagal mendapatkan URL dari Fileditch");
  } catch (error) {
    console.warn("[Uploader] Fileditch error:", error);
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
        return ensureHttps(uploadedUrl);
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
 * Mengunggah file dengan sistem failover dua lapis.
 * @param file Objek File dari input browser.
 * @returns Promise yang mengembalikan URL file yang berhasil diunggah.
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Coba berbagai layanan via Proxy (Catbox, Litterbox, dll)
  try {
    return await uploadViaProxy(file);
  } catch (proxyError) {
    console.warn(`[Uploader] Seluruh layanan proxy gagal, mencoba Fileditch...`);
    
    // 2. Jika semua proxy gagal, coba Fileditch sebagai cadangan utama
    try {
      return await uploadToFileditch(file);
    } catch (fileditchError) {
      console.error('[Uploader] Fatal: Seluruh sistem uploader gagal merespons!', fileditchError);
      throw new Error('Gagal mengunggah file ke semua penyedia layanan. Harap periksa koneksi internet Anda atau coba file yang lebih kecil.');
    }
  }
}
