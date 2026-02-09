import { NextResponse } from 'next/server';

/**
 * API Route Handler untuk menangani upload ke Pomf.lain.la secara server-side.
 * Hal ini dilakukan untuk menghindari masalah CORS yang sering terjadi pada upload langsung dari browser.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan dalam permintaan.' }, { status: 400 });
    }

    const pomfFormData = new FormData();
    // Pomf clones mewajibkan field name 'files[]'
    pomfFormData.append('files[]', file);

    // Gunakan timeout agar tidak menggantung jika server remote lambat
    const response = await fetch('https://pomf.lain.la/upload.php', {
      method: 'POST',
      body: pomfFormData,
      signal: AbortSignal.timeout(30000), // Batas waktu 30 detik
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Pomf API] Remote server error:', response.status, errorText);
      return NextResponse.json({ 
        success: false, 
        error: `Server Pomf merespons dengan status: ${response.status}` 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Pomf Route] Error:', error.message);
    const isTimeout = error.name === 'TimeoutError' || error.message.includes('timeout');
    
    return NextResponse.json({ 
      success: false, 
      error: isTimeout ? 'Unggahan ke Pomf melampaui batas waktu (timeout).' : `Kesalahan server internal: ${error.message}` 
    }, { status: 500 });
  }
}
