export async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  if (response.status === 401) { window.location.assign('/login'); throw new Error('Sessao expirada.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.erro || 'Nao foi possivel carregar os dados.');
  return data as T;
}
