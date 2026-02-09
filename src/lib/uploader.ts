/**
 * @fileOverview Utilitas unggahan file Elitera yang disederhanakan.
 * Hanya menggunakan Catbox melalui Proxy aman.
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
 * Fungsi Unggah Utama ke Catbox via Proxy
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
 * FUNGSI PUBLIK: uploadFile
 * Digunakan oleh komponen untuk mengunggah file.
 */
export async function uploadFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (Maksimal 5MB).');
  }

  try {
    return await uploadToCatbox(file);
  } catch (err: any) {
    console.error('[Uploader] Gagal mengunggah:', err.message);
    throw new Error('Gagal mengunggah file ke server. Harap periksa koneksi internet Anda.');
  }
}
