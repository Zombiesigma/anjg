/**
 * @fileOverview Utilitas unggahan file Elitera dengan sistem Failover Dual-CDN.
 * Urutan: Catbox (Proxy) -> Pomf Multi-Mirror (Internal API).
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
    throw new Error(`Catbox Proxy Error: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  const url = data.result || data.url;
  if (!url) throw new Error('Catbox returned no URL');
  
  return ensureHttps(url);
}

/**
 * LAYANAN 2: Pomf Multi-Mirror via Internal API Route (Failover)
 */
async function uploadToPomf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/pomf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Jalur Pomf internal tidak merespons.' }));
    throw new Error(errorData.error || `Server cadangan gagal dengan status: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.success && data.files && data.files.length > 0) {
    return ensureHttps(data.files[0].url);
  }
  
  throw new Error('Gagal mendapatkan URL permanen dari sistem cadangan.');
}

/**
 * FUNGSI UTAMA: uploadFile
 * Mengorkestrasi failover otomatis antara dua penyedia layanan permanen terbaik.
 */
export async function uploadFile(file: File): Promise<string> {
  // Validasi ukuran file (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (Maksimal 5MB).');
  }

  // 1. Coba Catbox (Utama)
  try {
    console.log('[Uploader] Mencoba layanan utama (Catbox)...');
    return await uploadToCatbox(file);
  } catch (err: any) {
    console.warn('[Uploader] Layanan utama gagal:', err.message);
    console.log('[Uploader] Beralih ke sistem cadangan multi-mirror (Pomf)...');
  }

  // 2. Coba Pomf Multi-Mirror (Cadangan)
  try {
    return await uploadToPomf(file);
  } catch (err: any) {
    console.error('[Uploader] Fatal: Seluruh sistem unggahan gagal!', err.message);
    throw new Error(`Gagal mengunggah file. Detail: ${err.message}. Harap coba perkecil ukuran file atau periksa koneksi internet Anda.`);
  }
}
