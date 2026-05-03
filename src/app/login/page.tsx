'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: identificador.trim(),
          senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || 'Usuario ou senha invalidos.');
        setLoading(false);
        return;
      }

      const destino = from && from.startsWith('/') ? from : `/consulta/${data.lojaId}`;
      window.location.assign(destino);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro de rede. Verifique o Wi-Fi e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-950">Rios Baterias</h1>
        <h2 className="text-center text-slate-500 mb-6">Acesso restrito</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2 text-sm font-medium">ID do funcionario</label>
            <input
              type="text"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2 text-sm font-medium">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {erro && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{erro}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-xs text-center text-slate-400 mt-4">
          Para testar: admin / admin123
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
