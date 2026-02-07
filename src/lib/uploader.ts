/**
 * @fileOverview Utilitas untuk mengunggah file ke layanan pihak ketiga.
 * Menggunakan API dari https://uploader.himmel.web.id/api/upload
 */

const BASE_URL = 'https://uploader.himmel.web.id/api/upload';

export const UPLOADER_SERVICES = [
  'Catbox',
  'Litterbox',
  'Pomf',
  'Quax',
  'Ryzumi',
  'Uguu',
  'Videy',
  'Cloudku',
  'Picsur'
];

/**
 * Mengunggah file ke layanan uploader.
 * @param file Objek File dari input browser.
 * @param service Nama layanan uploader (default: Catbox).
 * @returns Promise yang mengembalikan URL file yang diunggah.
 */
export async function uploadFile(file: File, service: string = 'Catbox'): Promise<string> {
  if (!UPLOADER_SERVICES.includes(service)) {
    throw new Error(`Layanan tidak valid. Tersedia: ${UPLOADER_SERVICES.join(', ')}`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('service', service);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload gagal dengan status: ${response.status}`);
    }

    const data = await response.json();
    
    // Berdasarkan pola umum API uploader himmel, URL biasanya ada di data.result atau data.url
    const uploadedUrl = data.result || data.url || data.link || (data.data && data.data.url);

    if (!uploadedUrl) {
      throw new Error('Gagal mendapatkan URL hasil unggahan dari respons server.');
    }

    return uploadedUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}
