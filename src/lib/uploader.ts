/**
 * @fileOverview Utilitas untuk mengunggah file dengan sistem failover otomatis.
 * Alur: Proxy (Catbox/Litterbox/Uguu/Pomf/Quax) -> Fileditch Permanent.
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
 * Konversi link sementara atau mirror Fileditch menjadi link permanen tanpa token md5/expires.
 * Tautan permanen menggunakan domain up1.fileditch.com.
 */
function getPermanentFileditchLink(url: string): string {
  try {
    const cleanUrl = ensureHttps(url);
    
    // Kasus 1: Tautan via file.php?f=/path/file.png
    if (cleanUrl.includes("file.php")) {
      const urlObj = new URL(cleanUrl);
      const filePath = urlObj.searchParams.get('f');
      if (filePath) {
        return `https://up1.fileditch.com${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      }
    }
    
    // Kasus 2: Tautan mirror (thegumonmyshoe.me) atau tautan berparameter token
    if (cleanUrl.includes("thegumonmyshoe.me") || cleanUrl.includes("fileditch.com")) {
        const urlObj = new URL(cleanUrl);
        // Ambil path saja untuk membuang query params (md5, expires, dll)
        return `https://up1.fileditch.com${urlObj.pathname}`;
    }
    
    return cleanUrl;
  } catch (e) {
    console.warn("[Uploader] Gagal membersihkan URL Fileditch:", e);
    return url;
  }
}

/**
 * Mencoba mengunggah ke Fileditch (Limit besar, tanpa API Key).
 * Menghasilkan tautan permanen yang bertahan selamanya.
 */
async function uploadToFileditch(file: File): Promise<string> {
  const formData = new FormData();
  // Fileditch mewajibkan field name 'files[]'
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
      // Transformasi ke tautan permanen CDN sebelum dikembalikan
      return getPermanentFileditchLink(data.files[0].url);
    }
    throw new Error("Gagal mendapatkan respons valid dari Fileditch");
  } catch (error) {
    console.warn("[Uploader] Fileditch error:", error);
    throw error;
  }
}

/**
 * Mencoba mengunggah ke berbagai layanan melalui proxy (Catbox, Uguu, dll).
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
 * Mengunggah file dengan sistem failover otomatis.
 * Strategi: Proxy (Layanan Ringan) -> Fileditch (Layanan Kapasitas Besar).
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Upaya pertama: Gunakan jalur Proxy untuk Catbox/Uguu/Litterbox
  try {
    return await uploadViaProxy(file);
  } catch (proxyError) {
    console.warn(`[Uploader] Seluruh layanan proxy gagal, mengalihkan ke Fileditch Permanent...`);
    
    // 2. Upaya cadangan utama: Fileditch dengan transformasi link permanen
    try {
      return await uploadToFileditch(file);
    } catch (fileditchError) {
      console.error('[Uploader] Fatal: Seluruh sistem uploader gagal!', fileditchError);
      throw new Error('Gagal mengunggah file. Harap periksa koneksi internet Anda atau coba file yang lebih kecil.');
    }
  }
}
