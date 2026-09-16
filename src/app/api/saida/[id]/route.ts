import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { buscarMovimento, excluirMovimento, statusSaida } from '@/lib/operacoes';
import { ErroValidacao } from '@/lib/validacao';
import { optionsResponse } from '@/lib/cors-mobile';
type Context = { params: Promise<{ id: string }> };
export const OPTIONS = optionsResponse;
export async function GET(req: NextRequest, { params }: Context) {
  return api(req, async () => {
    const doc = await buscarMovimento('saida', (await params).id);
    if (!doc) throw new ErroValidacao('Documento nao encontrado.', 404);
    return doc;
  });
}
export async function DELETE(req: NextRequest, { params }: Context) {
  return api(req, async session => excluirMovimento('saida', (await params).id, session));
}
export async function PUT(req: NextRequest, { params }: Context) {
  return api(req, async session => statusSaida((await params).id, await req.json(), session));
}

