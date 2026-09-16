export class ErroValidacao extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function objeto(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ErroValidacao('Dados invalidos.');
  return value as Record<string, unknown>;
}

export function texto(value: unknown, campo: string, obrigatorio = false, max = 2000): string {
  if (value == null && !obrigatorio) return '';
  if (typeof value !== 'string' || value.length > max || (obrigatorio && !value.trim()))
    throw new ErroValidacao(`Campo invalido: ${campo}.`);
  return value.trim();
}

export function numero(value: unknown, campo: string, minimo = -1e9): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimo || Math.abs(value) > 1e9)
    throw new ErroValidacao(`Numero invalido: ${campo}.`);
  return value;
}

export function dataCivil(value: unknown) {
  const str = texto(value, 'data', true, 10);
  const data = new Date(`${str}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || !Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== str)
    throw new ErroValidacao('Data invalida.');
  return data;
}

export function lista(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 500) throw new ErroValidacao('Informe de 1 a 500 itens.');
  return value.map(objeto);
}
