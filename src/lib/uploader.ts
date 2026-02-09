/**
 * @fileOverview Utilitas unggahan file Elitera yang ultra-resilient.
 * Menggunakan GitHub sebagai Storage Utama dan Catbox sebagai Failover.
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
 * PRIORITAS 1: GitHub via API Route Internal
 */
async function uploadToGithub(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/github', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (data.success && data.url) {
    console.log('[Uploader] Berhasil mengunggah ke GitHub Storage.');
    return ensureHttps(data.url);
  }
  
  throw new Error(data.error || 'GitHub Storage gagal.');
}

/**
 * PRIORITAS 2 (CADANGAN): Catbox via Secure Proxy
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
    throw new Error(`Catbox Proxy Error: ${response.status}`);
  }
  
  const data = await response.json();
  const url = data.result || data.url;
  
  if (!url) {
    throw new Error('Gagal mendapatkan URL dari Catbox.');
  }
  
  return ensureHttps(url);
}

/**
 * FUNGSI PUBLIK: uploadFile (Dengan Failover Multi-Storage)
 * Digunakan oleh komponen untuk mengunggah file.
 */
export async function uploadFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (Maksimal 5MB).');
  }

  // Langkah 1: Coba Unggah ke GitHub (Utama)
  try {
    return await uploadToGithub(file);
  } catch (err: any) {
    console.warn('[Uploader] GitHub Storage gagal, mencoba cadangan Catbox:', err.message);
  }

  // Langkah 2: Coba Unggah ke Catbox (Cadangan)
  try {
    return await uploadToCatbox(file);
  } catch (err: any) {
    console.error('[Uploader] Fatal: Seluruh sistem upload gagal!', err.message);
    throw new Error('Gagal mengunggah file ke server. Harap periksa koneksi internet Anda atau coba lagi nanti.');
  }
}
