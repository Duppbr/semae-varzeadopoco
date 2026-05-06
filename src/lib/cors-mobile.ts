import { NextRequest, NextResponse } from 'next/server';

// Capacitor Android usa http://localhost, iOS usa capacitor://localhost
function isOrigemPermitida(origin: string) {
  if (!origin) return true; // sem Origin = same-origin ou nativo
  return (
    origin === 'capacitor://localhost' ||
    origin === 'ionic://localhost' ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin)
  );
}

export function corsMobile(req: NextRequest) {
  const origin = req.headers.get('origin') ?? '';
  const permitida = isOrigemPermitida(origin);
  return {
    'Access-Control-Allow-Origin': permitida ? (origin || 'capacitor://localhost') : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

export function optionsResponse(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsMobile(req) });
}
