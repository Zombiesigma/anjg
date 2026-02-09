/**
 * @fileOverview Utilitas unggahan file Elitera dengan sistem Multi-CDN Failover.
 * Urutan: Catbox (Proxy) -> Pomf (Internal API) -> Fileditch (Permanent Link).
 */

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
 * Mengonversi link preview/mirror menjadi link direct CDN permanen.
 * Fokus pada transformasi Fileditch: file.php?f=... -> up1.fileditch.com/...
 */
function getPermanentDirectLink(url: string): string {
  try {
    const cleanUrl = ensureHttps(url);
    const urlObj = new URL(cleanUrl);

    // Kasus Fileditch: Ekstrak path asli dari parameter 'f'
    const filePath = urlObj.searchParams.get('f');
    if (filePath) {
      // Hasil akhir: https://up1.fileditch.com/path/ke/file.png
      return `https://up1.fileditch.com${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    // Jika URL mengandung mirror Fileditch lama, paksa ke domain CDN utama
    if (cleanUrl.includes("fileditch") || cleanUrl.includes("thegumonmyshoe.me")) {
      return `https://up1.fileditch.com${urlObj.pathname}`;
    }

    return cleanUrl;
  } catch (e) {
    return url;
  }
}

/**
 * LAYANAN 1: Catbox via Proxy (Layanan Utama)
 */
async function uploadToCatbox(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('service', 'Catbox');

  const response = await fetch('https://uploader.himmel.web.id/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Catbox Proxy failed');
  
  const data = await response.json();
  const url = data.result || data.url;
  if (!url) throw new Error('Catbox returned no URL');
  
  return ensureHttps(url);
}

/**
 * LAYANAN 2: Pomf.lain.la via Internal API Route (Failover 1)
 */
async function uploadToPomf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/pomf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Internal Pomf Route failed');
  
  const data = await response.json();
  if (data.success && data.files && data.files.length > 0) {
    return ensureHttps(data.files[0].url);
  }
  
  throw new Error('Pomf upload was unsuccessful');
}

/**
 * LAYANAN 3: Fileditch (Failover 2 / Permanen Terakhir)
 */
async function uploadToFileditch(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('files[]', file);

  const response = await fetch('https://up1.fileditch.com/upload.php', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Fileditch direct upload failed');
  
  const data = await response.json();
  if (data.success && data.files && data.files.length > 0) {
    const rawUrl = data.files[0].url;
    // Transformasi ke link permanen up1.fileditch.com
    return getPermanentDirectLink(rawUrl);
  }
  
  throw new Error('Fileditch returned no file data');
}

/**
 * FUNGSI UTAMA: uploadFile
 * Mengorkestrasi failover otomatis antar penyedia layanan.
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Coba Catbox (Utama)
  try {
    console.log('[Uploader] Mencoba Catbox...');
    return await uploadToCatbox(file);
  } catch (err) {
    console.warn('[Uploader] Catbox gagal, beralih ke Pomf...');
  }

  // 2. Coba Pomf (Cadangan 1)
  try {
    console.log('[Uploader] Mencoba Pomf...');
    return await uploadToPomf(file);
  } catch (err) {
    console.warn('[Uploader] Pomf gagal, beralih ke Fileditch...');
  }

  // 3. Coba Fileditch (Cadangan 2 / Terakhir)
  try {
    console.log('[Uploader] Mencoba Fileditch...');
    return await uploadToFileditch(file);
  } catch (err) {
    console.error('[Uploader] Fatal: Semua sistem upload gagal!', err);
    throw new Error('Gagal mengunggah file. Harap periksa koneksi atau coba file lain.');
  }
}
