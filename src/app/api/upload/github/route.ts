import { NextResponse } from 'next/server';

/**
 * API Route untuk mengunggah file ke GitHub Repository.
 * Menghindari CORS dan menjaga keamanan Token GitHub di sisi server.
 */

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
      console.error('[GitHub API] Konfigurasi environment tidak lengkap.');
      return NextResponse.json({ success: false, error: 'Server misconfigured (GitHub constants missing).' }, { status: 500 });
    }

    // Konversi file ke Base64 (Syarat GitHub Content API)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString('base64');

    // Buat nama file unik untuk menghindari tabrakan data (timestamp + sanitasi nama asli)
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${cleanFileName}`;
    const filePath = `uploads/${fileName}`;

    // Tembak GitHub REST API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
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
      console.error('[GitHub API] Error response:', data);
      return NextResponse.json({ 
        success: false, 
        error: data.message || `GitHub gagal merespons dengan status: ${response.status}` 
      }, { status: response.status });
    }

    // Kembalikan Raw URL yang bisa diakses langsung oleh tag <img>
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;

    return NextResponse.json({
      success: true,
      url: rawUrl,
    });

  } catch (error: any) {
    console.error('[GitHub Route] Fatal Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: `Kesalahan server internal: ${error.message}` 
    }, { status: 500 });
  }
}
