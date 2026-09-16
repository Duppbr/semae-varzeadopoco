import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { receberPedido } from '@/lib/pedidos';
import { optionsResponse } from '@/lib/cors-mobile';
export const OPTIONS = optionsResponse;
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return api(req, async session => receberPedido((await params).id, await req.json(), session), 201);
}
