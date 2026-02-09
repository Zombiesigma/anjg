/**
 * @fileOverview Utilitas unggahan file Elitera dengan sistem Failover 4-Lapis.
 * Urutan: Catbox (Proxy) -> ImgBB (API Route) -> Pomf (Multi-Mirror API Route) -> Fileditch (Permanent Link).
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
 * Logika untuk mengubah link preview Fileditch menjadi link mentah permanen.
 */
function getFileditchPermanentLink(rawUrl: string): string {
  try {
    if (rawUrl.includes("file.php")) {
      const urlParams = new URL(rawUrl);
      const filePath = urlParams.searchParams.get('f');
      if (filePath) {
        return `https://up1.fileditch.com${filePath.startsWith('/') ? '' : '/'}${filePath}`;
      }
    }
    // Bersihkan parameter jika itu mirror ber-token
    const cleanUrl = rawUrl.split('?')[0];
    if (cleanUrl.includes('thegumonmyshoe.me') || cleanUrl.includes('fileditchfiles.me')) {
        const path = new URL(cleanUrl).pathname;
        return `https://up1.fileditch.com${path}`;
    }
    return ensureHttps(rawUrl);
  } catch (e) {
    return ensureHttps(rawUrl);
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

  if (!response.ok) throw new Error(`Catbox Proxy Error: ${response.status}`);
  
  const data = await response.json();
  const url = data.result || data.url;
  if (!url) throw new Error('Catbox returned no URL');
  
  return ensureHttps(url);
}

/**
 * LAYANAN 2: ImgBB via Internal API Route (Stabil & Terpercaya)
 */
async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/imgbb', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'ImgBB Route tidak merespons.' }));
    throw new Error(errorData.error || 'Gagal mengunggah ke ImgBB');
  }
  
  const data = await response.json();
  return ensureHttps(data.url);
}

/**
 * LAYANAN 3: Pomf Multi-Mirror via Internal API Route
 */
async function uploadToPomf(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/pomf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Pomf Route tidak merespons.' }));
    throw new Error(errorData.error || 'Gagal mengunggah ke Pomf');
  }
  
  const data = await response.json();
  if (data.success && data.files && data.files.length > 0) {
    return ensureHttps(data.files[0].url);
  }
  throw new Error('Pomf gagal memberikan URL file.');
}

/**
 * LAYANAN 4: Fileditch (Cadangan Akhir - Direct Link Only)
 */
async function uploadToFileditch(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('files[]', file);

  const response = await fetch('https://up1.fileditch.com/upload.php', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(`Fileditch Error: ${response.status}`);
  
  const data = await response.json();
  if (data.success && data.files && data.files.length > 0) {
    return getFileditchPermanentLink(data.files[0].url);
  }
  throw new Error('Fileditch gagal memberikan URL file.');
}

/**
 * FUNGSI UTAMA: uploadFile
 * Mengorkestrasi failover otomatis antara 4 CDN permanen.
 */
export async function uploadFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file terlalu besar (Maksimal 5MB).');
  }

  // 1. Coba Catbox
  try {
    console.log('[Uploader] Mencoba Prioritas 1: Catbox...');
    return await uploadToCatbox(file);
  } catch (err: any) {
    console.warn('[Uploader] Catbox gagal:', err.message);
  }

  // 2. Coba ImgBB
  try {
    console.log('[Uploader] Mencoba Prioritas 2: ImgBB...');
    return await uploadToImgBB(file);
  } catch (err: any) {
    console.warn('[Uploader] ImgBB gagal:', err.message);
  }

  // 3. Coba Pomf
  try {
    console.log('[Uploader] Mencoba Prioritas 3: Pomf...');
    return await uploadToPomf(file);
  } catch (err: any) {
    console.warn('[Uploader] Pomf gagal:', err.message);
  }

  // 4. Coba Fileditch
  try {
    console.log('[Uploader] Mencoba Prioritas 4: Fileditch...');
    return await uploadToFileditch(file);
  } catch (err: any) {
    console.error('[Uploader] Fatal: Seluruh sistem unggahan gagal!', err.message);
    throw new Error('Gagal mengunggah file ke semua layanan. Harap periksa koneksi atau coba file lain.');
  }
}
