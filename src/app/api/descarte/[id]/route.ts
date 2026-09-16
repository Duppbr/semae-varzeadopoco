import { NextRequest } from 'next/server';
import { api } from '@/lib/api';
import { buscarMovimento, excluirMovimento } from '@/lib/operacoes';
import { ErroValidacao } from '@/lib/validacao';
import { optionsResponse } from '@/lib/cors-mobile';
type Context = { params: Promise<{ id: string }> };
export const OPTIONS = optionsResponse;
export async function GET(req: NextRequest, { params }: Context) {
  return api(req, async () => {
    const doc = await buscarMovimento('descarte', (await params).id);
    if (!doc) throw new ErroValidacao('Documento nao encontrado.', 404);
    return doc;
  });
}
export async function DELETE(req: NextRequest, { params }: Context) {
  return api(req, async session => excluirMovimento('descarte', (await params).id, session));
}


