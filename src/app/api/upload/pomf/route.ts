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
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const pomfFormData = new FormData();
    // Pomf mewajibkan field name 'files[]'
    pomfFormData.append('files[]', file);

    const response = await fetch('https://pomf.lain.la/upload.php', {
      method: 'POST',
      body: pomfFormData,
    });

    if (!response.ok) {
      throw new Error(`Pomf responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Pomf Route] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
