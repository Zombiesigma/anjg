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
      throw new Error(`Upload gagal dengan status: ${response.status}. Silakan coba lagi nanti.`);
    }

    const data = await response.json();
    
    // Mencari URL dalam berbagai kemungkinan struktur respons API
    const uploadedUrl = data.result || data.url || data.link || (data.data && data.data.url) || data.files?.[0]?.url;

    if (!uploadedUrl) {
      console.error('Respons API tidak dikenal:', data);
      throw new Error('Gagal mendapatkan URL hasil unggahan. Server tidak memberikan tautan balik.');
    }

    return uploadedUrl;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Gagal menghubungi server uploader. Periksa koneksi internet atau coba matikan VPN/Adblock.');
    }
    throw error;
  }
}
