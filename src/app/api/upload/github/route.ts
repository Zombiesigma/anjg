import { NextResponse } from 'next/server';

/**
 * API Route untuk mengunggah file ke GitHub Repository (Hardcoded Config).
 * Menyimpan file di folder uploads/ dengan nama unik berbasis timestamp.
 */

const GITHUB_TOKEN = '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';
const GITHUB_REPO_OWNER = 'Zombiesigma';
const GITHUB_REPO_NAME = 'elitera-asset';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
    }

    // Konversi file ke Base64 untuk GitHub API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString('base64');

    // Buat nama file unik
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${cleanFileName}`;
    const filePath = `uploads/${fileName}`;

    // Tembak GitHub REST API
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Elitera-App',
      },
      body: JSON.stringify({
        message: `Upload ${fileName} from Elitera App`,
        content: base64Content,
        branch: 'main'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[GitHub API Error]', data);
      return NextResponse.json({ 
        success: false, 
        error: data.message || `GitHub gagal merespons (${response.status})` 
      }, { status: response.status });
    }

    // URL Raw GitHub untuk akses langsung
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/${filePath}`;

    return NextResponse.json({
      success: true,
      url: rawUrl,
    });

  } catch (error: any) {
    console.error('[GitHub Route Fatal Error]', error.message);
    return NextResponse.json({ 
      success: false, 
      error: `Internal Server Error: ${error.message}` 
    }, { status: 500 });
  }
}
