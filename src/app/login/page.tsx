'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: identificador.trim(), senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Usuário ou senha inválidos.');
        setLoading(false);
        return;
      }
      window.location.assign('/dashboard');
    } catch {
      setErro('Erro de rede. Verifique a conexão e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm p-8 border border-slate-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <img src="/logo-semae.png" alt="SEMAE" className="w-16 h-16 object-contain" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="w-16 h-16 flex items-center justify-center"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'#2563eb\' stroke-width=\'2\'><path d=\'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\'/></svg></div>';
            }} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SEMAE</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Setor Municipal de Alimentação Escolar</p>
          <p className="text-xs text-slate-400 mt-0.5">Várzea do Poço – BA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuário</label>
            <input
              type="text"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              required
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldCheck size={18} />
            )}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Prefeitura Municipal de Várzea do Poço
        </p>
      </div>
    </div>
  );
}
