/**
 * @fileOverview Utilitas untuk mengunggah file dengan sistem failover otomatis.
 * Alur: Proxy (Catbox/Litterbox/Uguu/Pomf/Quax) -> Fileditch Permanent Direct Link (thegumonmyshoe.me).
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
 * Mengubah link preview/mirror menjadi link direct CDN permanen.
 * Target: https://thegumonmyshoe.me/[path]
 */
function getPermanentDirectLink(url: string): string {
  try {
    const cleanUrl = ensureHttps(url);
    const urlObj = new URL(cleanUrl);

    // Kasus 1: Tautan via file.php?f=/path/file.png
    const filePath = urlObj.searchParams.get('f');
    if (filePath) {
      return `https://thegumonmyshoe.me${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    // Kasus 2: Tautan mirror Fileditch atau domain lain yang berisi path file asli
    if (cleanUrl.includes("fileditch") || cleanUrl.includes("thegumonmyshoe.me")) {
      // Kita ambil path-nya saja dan paksa ke domain thegumonmyshoe.me tanpa parameter md5/expires
      return `https://thegumonmyshoe.me${urlObj.pathname}`;
    }

    return cleanUrl;
  } catch (e) {
    console.warn("[Uploader] Gagal mentransformasi URL Mirror:", e);
    return url;
  }
}

/**
 * Mencoba mengunggah ke Fileditch (Limit 15GB, Tanpa API Key).
 * Output otomatis diubah menjadi Direct Link Mirror (thegumonmyshoe.me).
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
      const rawUrl = data.files[0].url;
      console.log("[Uploader] Berhasil mengunggah ke Fileditch.");
      // Intersepsi dan ubah ke link mirror thegumonmyshoe.me
      return getPermanentDirectLink(rawUrl);
    }
    throw new Error("Respons Fileditch tidak valid");
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
 * Strategi: Proxy (Multi-Service) -> Fileditch (Permanent thegumonmyshoe.me).
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Upaya pertama: Gunakan jalur Proxy (Catbox/Uguu/Litterbox)
  try {
    return await uploadViaProxy(file);
  } catch (proxyError) {
    console.warn(`[Uploader] Seluruh layanan proxy gagal, mengalihkan ke Fileditch...`);
    
    // 2. Upaya cadangan: Fileditch dengan transformasi link permanen mirror otomatis
    try {
      return await uploadToFileditch(file);
    } catch (fileditchError) {
      console.error('[Uploader] Fatal: Seluruh sistem uploader gagal!', fileditchError);
      throw new Error('Gagal mengunggah file ke semua penyedia layanan. Harap periksa ukuran file atau koneksi internet Anda.');
    }
  }
}
