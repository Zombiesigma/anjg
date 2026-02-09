/**
 * @fileOverview Utilitas unggahan file Elitera dengan sistem Failover Dual-CDN.
 * Urutan: Catbox (Proxy) -> Pomf.lain.la (Internal API).
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Catbox Proxy failed: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  const url = data.result || data.url;
  if (!url) throw new Error('Catbox returned no URL');
  
  return ensureHttps(url);
}

/**
 * LAYANAN 2: Pomf.lain.la via Internal API Route (Failover)
 * Menembak ke /api/upload/pomf untuk diproses di sisi server agar aman dari CORS.
 */
async function uploadToPomf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/pomf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    // Mencoba mengambil detail error dari JSON jika tersedia
    const errorData = await response.json().catch(() => ({ error: 'Internal server error on Pomf route' }));
    throw new Error(errorData.error || `Internal Pomf Route failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.success && data.files && data.files.length > 0) {
    return ensureHttps(data.files[0].url);
  }
  
  throw new Error('Pomf upload was unsuccessful: ' + (data.error || 'No file URL returned from provider'));
}

/**
 * FUNGSI UTAMA: uploadFile
 * Mengorkestrasi failover otomatis antar penyedia layanan permanen.
 */
export async function uploadFile(file: File): Promise<string> {
  // Validasi ukuran file (5MB) sebelum memulai proses
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar. Maksimal 5MB untuk menjaga performa.');
  }

  // 1. Coba Catbox (Utama)
  try {
    console.log('[Uploader] Mencoba Catbox...');
    return await uploadToCatbox(file);
  } catch (err: any) {
    console.warn('[Uploader] Catbox gagal:', err.message);
    console.warn('[Uploader] Beralih ke layanan cadangan (Pomf)...');
  }

  // 2. Coba Pomf (Cadangan Terakhir)
  try {
    console.log('[Uploader] Mencoba Pomf...');
    return await uploadToPomf(file);
  } catch (err: any) {
    console.error('[Uploader] Fatal: Seluruh sistem upload gagal!', err.message);
    throw new Error('Gagal mengunggah file ke semua layanan (Catbox & Pomf). Harap periksa koneksi internet Anda atau coba perkecil ukuran file.');
  }
}
