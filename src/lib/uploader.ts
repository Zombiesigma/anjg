/**
 * @fileOverview Utilitas unggahan file Elitera dengan sistem Failover Dual-CDN.
 * Urutan: Catbox (Proxy) -> Pomf (Internal API).
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
 * LAYANAN 1: Catbox via Proxy (Layanan Utama)
 * Menggunakan uploader.himmel.web.id sebagai jembatan untuk menghindari CORS browser.
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
 * LAYANAN 2: Pomf.lain.la via Internal API Route (Failover)
 * Menembak ke /api/upload/pomf untuk diproses di sisi server.
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
 * FUNGSI UTAMA: uploadFile
 * Mengorkestrasi failover otomatis antar penyedia layanan permanen.
 */
export async function uploadFile(file: File): Promise<string> {
  // 1. Coba Catbox (Utama)
  try {
    console.log('[Uploader] Mencoba Catbox...');
    return await uploadToCatbox(file);
  } catch (err) {
    console.warn('[Uploader] Catbox gagal, beralih ke Pomf...');
  }

  // 2. Coba Pomf (Cadangan Terakhir)
  try {
    console.log('[Uploader] Mencoba Pomf...');
    return await uploadToPomf(file);
  } catch (err) {
    console.error('[Uploader] Fatal: Semua sistem upload gagal!', err);
    throw new Error('Gagal mengunggah file. Harap periksa ukuran file (maks 5MB) atau koneksi internet Anda.');
  }
}
