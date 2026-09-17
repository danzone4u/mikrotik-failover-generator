import { NextRequest, NextResponse } from 'next/server';
import { DirectDeployParams } from '../../../../types/mikrotik';
import { generateRouterOSv7Script } from '../../../../lib/generator-v7';

export async function POST(request: NextRequest) {
  try {
    const body: DirectDeployParams = await request.json();
    const { routerIp, routerPort = 443, username, password, useSsl, configParams } = body;

    if (!routerIp || !username) {
      return NextResponse.json(
        { error: 'IP Router dan Username wajib diisi untuk deployment direct.' },
        { status: 400 }
      );
    }

    const script = generateRouterOSv7Script(configParams);
    const protocol = useSsl ? 'https' : 'http';
    const baseUrl = `${protocol}://${routerIp}:${routerPort}/rest`;

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const authHeader = `Basic ${credentials}`;

    // Test connectivity first via RouterOS v7 REST API /system/resource
    const testRes = await fetch(`${baseUrl}/system/resource`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      // Note: Node 18+ fetch options
      signal: AbortSignal.timeout(5000)
    }).catch(err => {
      throw new Error(`Gagal terhubung ke RouterOS v7 REST API pada ${baseUrl}: ${err.message}`);
    });

    if (!testRes.ok) {
      return NextResponse.json({
        success: false,
        message: `Koneksi ditolak oleh RouterOS REST API (${testRes.status} ${testRes.statusText})`
      }, { status: 401 });
    }

    const resourceInfo = await testRes.json();

    // In RouterOS v7, execute script via REST API /system/script or /execute
    // Or post lines via REST API endpoint /execute
    const execRes = await fetch(`${baseUrl}/system/script`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'cdt_deploy_script',
        source: script
      })
    });

    if (execRes.ok) {
      // Run script
      await fetch(`${baseUrl}/system/script/run`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: 'cdt_deploy_script'
        })
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil push & jalankan konfigurasi pada MikroTik ${routerIp}`,
      routerInfo: {
        identity: configParams.identity,
        boardName: resourceInfo['board-name'] || 'MikroTik Router',
        version: resourceInfo['version'] || 'v7',
        cpuLoad: resourceInfo['cpu-load'] || 0
      },
      scriptGenerated: script
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat push deployment';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
