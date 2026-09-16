export function estoqueBaixo(quantidade: number, minimo: number) {
  return quantidade <= minimo;
}

export function pendente(item: { quantidade: number; recebido: number; cancelado: number }) {
  return Math.max(0, Math.round((item.quantidade - item.recebido - item.cancelado) * 1e6) / 1e6);
}

export const statusPedido: Record<string, string> = {
  RASCUNHO: 'Pedido pendente', PENDENTE: 'Pedido pendente', ENVIADO: 'Enviado',
  PARCIAL: 'Recebido parcialmente', ATENDIDO: 'Atendido', CANCELADO: 'Cancelado',
};

// Datas operacionais sao dias civis, nao instantes no fuso do navegador.
export function formatarData(data: string | Date) {
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function hoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}
