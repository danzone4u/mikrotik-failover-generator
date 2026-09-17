import { NextRequest, NextResponse } from 'next/server';
import { generateRouterOSv7Script } from '../../../../lib/generator-v7';
import { RouterOSConfigParams } from '../../../../types/mikrotik';

export async function POST(request: NextRequest) {
  try {
    const body: RouterOSConfigParams = await request.json();
    if (!body || !body.identity) {
      return NextResponse.json({ error: 'Parameter identity wajib diisi.' }, { status: 400 });
    }

    const script = generateRouterOSv7Script(body);
    return NextResponse.json({ script, success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Gagal membuat script MikroTik';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
