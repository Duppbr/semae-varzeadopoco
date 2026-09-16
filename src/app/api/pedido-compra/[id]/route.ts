import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { alterarPedido, buscarPedido, excluirPedido } from '@/lib/pedidos';
import { ErroValidacao } from '@/lib/validacao';
import { optionsResponse } from '@/lib/cors-mobile';
type Context = { params: Promise<{ id: string }> };
export const OPTIONS = optionsResponse;
export async function GET(req: NextRequest, { params }: Context) {
  return api(req, async () => {
    const doc = await buscarPedido((await params).id);
    if (!doc) throw new ErroValidacao('Pedido nao encontrado.', 404);
    return doc;
  });
}
export async function PUT(req: NextRequest, { params }: Context) {
  return api(req, async session => alterarPedido((await params).id, await req.json(), session));
}
export async function DELETE(req: NextRequest, { params }: Context) {
  return api(req, async session => excluirPedido((await params).id, session));
}
