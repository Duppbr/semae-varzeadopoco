'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';

type Aplicacao = {
  id: string;
  carBrand: string | null;
  carModel: string | null;
  carYearFrom: number | null;
  carYearTo: number | null;
  vehicleType: string | null;
  amperagem: string | null;
  tipo: string | null;
  battery: string | null;
};

type Opcao = {
  id: number;
  categoria: string;
  valor: string;
};

// MUDANÇA: card de aplicação para mobile — evita a tabela de 7 colunas com scroll horizontal.
// Editar abre um modal overlay em vez de editar inline na linha da tabela.
function AplicacaoCard({
  app,
  onEditar,
  onExcluir,
}: {
  app: Aplicacao;
  onEditar: (app: Aplicacao) => void;
  onExcluir: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">
            {app.carBrand || '—'} {app.carModel || ''}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {app.carYearFrom}–{app.carYearTo}
            {app.vehicleType && ` · ${app.vehicleType}`}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEditar(app)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            aria-label="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onExcluir(app.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
            aria-label="Excluir"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {app.amperagem && (
          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{app.amperagem}</span>
        )}
        {app.tipo && (
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{app.tipo}</span>
        )}
        {app.battery && (
          <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-mono">{app.battery}</span>
        )}
      </div>
    </div>
  );
}

// MUDANÇA: modal de edição para mobile — substitui a edição inline dentro da célula da tabela,
// que era impossível de usar em telas pequenas.
function ModalEdicaoMobile({
  app,
  amperagens,
  tipos,
  onSalvar,
  onCancelar,
}: {
  app: Aplicacao;
  amperagens: string[];
  tipos: string[];
  onSalvar: (dados: any) => void;
  onCancelar: () => void;
}) {
  const [dados, setDados] = useState<any>({ ...app });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* MUDANÇA: no mobile o modal sobe de baixo (bottom sheet), no desktop é centralizado */}
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Editar Aplicação</h2>
          <button onClick={onCancelar} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Marca</label>
              <input
                value={dados.carBrand || ''}
                onChange={e => setDados({ ...dados, carBrand: e.target.value })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Modelo</label>
              <input
                value={dados.carModel || ''}
                onChange={e => setDados({ ...dados, carModel: e.target.value })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ano inicial</label>
              <input
                type="number"
                value={dados.carYearFrom || ''}
                onChange={e => setDados({ ...dados, carYearFrom: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ano final</label>
              <input
                type="number"
                value={dados.carYearTo || ''}
                onChange={e => setDados({ ...dados, carYearTo: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Amperagem</label>
              <select
                value={dados.amperagem || ''}
                onChange={e => setDados({ ...dados, amperagem: e.target.value })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione...</option>
                {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo</label>
              <select
                value={dados.tipo || ''}
                onChange={e => setDados({ ...dados, tipo: e.target.value })}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione...</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Código da bateria (Moura)</label>
            <input
              value={dados.battery || ''}
              onChange={e => setDados({ ...dados, battery: e.target.value })}
              className="w-full border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancelar}
            className="flex-1 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSalvar(dados)}
            className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAplicacoesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Desktop: edição inline na tabela
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [dadosEdit, setDadosEdit] = useState<any>({});

  // MUDANÇA: mobile usa modal em vez de edição inline na célula da tabela
  const [appEditandoMobile, setAppEditandoMobile] = useState<Aplicacao | null>(null);

  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [arquivoImport, setArquivoImport] = useState<File | null>(null);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState({
    carBrand: '', carModel: '', carYearFrom: '', carYearTo: '',
    vehicleType: '', amperagem: '', tipo: '', battery: '',
  });

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    carregar();
    fetch('/api/admin/opcoes').then(r => r.json()).then(setOpcoes);
  }, [user, userLoading]);

  const carregar = async (pagina = paginaAtual) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/aplicacoes?busca=${encodeURIComponent(busca)}&page=${pagina}&limit=50`);
      if (res.ok) {
        const json = await res.json();
        setAplicacoes(json.data);
        setTotalPaginas(json.totalPaginas);
        setPaginaAtual(json.pagina);
      }
    } catch {
      alert('Erro ao carregar aplicações.');
    }
    setLoading(false);
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta aplicação?')) return;
    await fetch('/api/admin/aplicacoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    carregar();
  };

  // Edição desktop (inline na tabela)
  const iniciarEdicao = (app: Aplicacao) => {
    setEditandoId(app.id);
    setDadosEdit({ ...app });
  };

  const salvarEdicaoDesktop = async () => {
    await fetch('/api/admin/aplicacoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dadosEdit.id, ...dadosEdit }),
    });
    setEditandoId(null);
    carregar();
  };

  // MUDANÇA: edição mobile via modal
  const salvarEdicaoMobile = async (dados: any) => {
    await fetch('/api/admin/aplicacoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    setAppEditandoMobile(null);
    carregar();
  };

  const importar = async () => {
    if (!arquivoImport) return;
    const formData = new FormData();
    formData.append('file', arquivoImport);
    const res = await fetch('/api/admin/aplicacoes/importar', { method: 'POST', body: formData });
    const data = await res.json();
    alert(data.message);
    carregar();
  };

  const criarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/aplicacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        carBrand: novoVeiculo.carBrand || null,
        carModel: novoVeiculo.carModel || null,
        carYearFrom: novoVeiculo.carYearFrom ? parseInt(novoVeiculo.carYearFrom) : null,
        carYearTo: novoVeiculo.carYearTo ? parseInt(novoVeiculo.carYearTo) : null,
        vehicleType: novoVeiculo.vehicleType || null,
        amperagem: novoVeiculo.amperagem || null,
        tipo: novoVeiculo.tipo || null,
        battery: novoVeiculo.battery || null,
      }),
    });
    if (res.ok) {
      setMostrarFormNovo(false);
      setNovoVeiculo({ carBrand: '', carModel: '', carYearFrom: '', carYearTo: '', vehicleType: '', amperagem: '', tipo: '', battery: '' });
      carregar();
    } else {
      alert('Erro ao criar aplicação.');
    }
  };

  const amperagens = opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor);
  const tipos = opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor);
  const marcasVeiculos = opcoes.filter(o => o.categoria === 'marca_veiculo').map(o => o.valor);
  const tiposVeiculo = ['CARRO', 'MOTO', 'CAMINHAO'];

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900">Aplicações de Veículos</h1>

      {/* Ações */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-2 items-center">
        <label className="flex-1 min-w-0">
          <span className="block text-xs text-slate-500 mb-1">Importar CSV</span>
          <input type="file" accept=".csv" onChange={e => setArquivoImport(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-600" />
        </label>
        <button
          onClick={importar}
          disabled={!arquivoImport}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition"
        >
          Importar
        </button>
        <button
          onClick={() => setMostrarFormNovo(!mostrarFormNovo)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          {mostrarFormNovo ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {/* Formulário novo veículo */}
      {mostrarFormNovo && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm">Novo veículo</h3>
          <form onSubmit={criarNovo} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={novoVeiculo.carBrand} onChange={e => setNovoVeiculo({...novoVeiculo, carBrand: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white" required>
              <option value="">Marca *</option>
              {marcasVeiculos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="text" placeholder="Modelo *" value={novoVeiculo.carModel} onChange={e => setNovoVeiculo({...novoVeiculo, carModel: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm" required />
            <input type="number" placeholder="Ano inicial" value={novoVeiculo.carYearFrom} onChange={e => setNovoVeiculo({...novoVeiculo, carYearFrom: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm" />
            <input type="number" placeholder="Ano final" value={novoVeiculo.carYearTo} onChange={e => setNovoVeiculo({...novoVeiculo, carYearTo: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm" />
            <select value={novoVeiculo.vehicleType} onChange={e => setNovoVeiculo({...novoVeiculo, vehicleType: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
              <option value="">Tipo veículo</option>
              {tiposVeiculo.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={novoVeiculo.amperagem} onChange={e => setNovoVeiculo({...novoVeiculo, amperagem: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
              <option value="">Amperagem</option>
              {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={novoVeiculo.tipo} onChange={e => setNovoVeiculo({...novoVeiculo, tipo: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm bg-white">
              <option value="">Tecnologia</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Código bateria (Moura)" value={novoVeiculo.battery} onChange={e => setNovoVeiculo({...novoVeiculo, battery: e.target.value})} className="border border-slate-300 px-3 py-2 rounded-lg text-sm" />
            <div className="col-span-full flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="flex gap-2">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') carregar(1); }}
          placeholder="Buscar por marca ou modelo..."
          className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={() => carregar(1)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Buscar
        </button>
      </div>

      <p className="text-xs text-slate-500">{aplicacoes.length} resultado(s) — página {paginaAtual} de {totalPaginas}</p>

      {/* MUDANÇA: cards no mobile */}
      <div className="md:hidden space-y-3">
        {aplicacoes.map(app => (
          <AplicacaoCard
            key={app.id}
            app={app}
            onEditar={setAppEditandoMobile}
            onExcluir={excluir}
          />
        ))}
        {aplicacoes.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            Nenhuma aplicação encontrada.
          </div>
        )}
      </div>

      {/* MUDANÇA: tabela só no desktop com edição inline preservada */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Ano</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Amperagem</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Bateria</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {aplicacoes.map(app => (
              <tr key={app.id} className="hover:bg-slate-50">
                {editandoId === app.id ? (
                  <>
                    <td className="px-3 py-2"><input value={dadosEdit.carBrand || ''} onChange={e => setDadosEdit({...dadosEdit, carBrand: e.target.value})} className="border px-2 py-1 rounded w-24 text-sm" /></td>
                    <td className="px-3 py-2"><input value={dadosEdit.carModel || ''} onChange={e => setDadosEdit({...dadosEdit, carModel: e.target.value})} className="border px-2 py-1 rounded w-32 text-sm" /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input type="number" value={dadosEdit.carYearFrom || ''} onChange={e => setDadosEdit({...dadosEdit, carYearFrom: e.target.value ? parseInt(e.target.value) : null})} className="border px-2 py-1 rounded w-16 text-sm" />
                        <span className="text-slate-400">-</span>
                        <input type="number" value={dadosEdit.carYearTo || ''} onChange={e => setDadosEdit({...dadosEdit, carYearTo: e.target.value ? parseInt(e.target.value) : null})} className="border px-2 py-1 rounded w-16 text-sm" />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select value={dadosEdit.amperagem || ''} onChange={e => setDadosEdit({...dadosEdit, amperagem: e.target.value})} className="border px-2 py-1 rounded text-sm bg-white">
                        <option value="">—</option>
                        {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={dadosEdit.tipo || ''} onChange={e => setDadosEdit({...dadosEdit, tipo: e.target.value})} className="border px-2 py-1 rounded text-sm bg-white">
                        <option value="">—</option>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input value={dadosEdit.battery || ''} onChange={e => setDadosEdit({...dadosEdit, battery: e.target.value})} className="border px-2 py-1 rounded w-20 text-sm" /></td>
                    <td className="px-3 py-2">
                      <button onClick={salvarEdicaoDesktop} className="text-green-600 hover:underline mr-2 text-sm">Salvar</button>
                      <button onClick={() => setEditandoId(null)} className="text-slate-400 hover:underline text-sm">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{app.carBrand || '-'}</td>
                    <td className="px-4 py-2">{app.carModel || '-'}</td>
                    <td className="px-4 py-2">{app.carYearFrom}-{app.carYearTo}</td>
                    <td className="px-4 py-2">{app.amperagem || '-'}</td>
                    <td className="px-4 py-2">{app.tipo || '-'}</td>
                    <td className="px-4 py-2 font-mono text-xs">{app.battery || '-'}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => iniciarEdicao(app)} className="text-blue-600 hover:underline mr-3 text-sm">Editar</button>
                      <button onClick={() => excluir(app.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {aplicacoes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">Nenhuma aplicação encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center items-center gap-3">
        <button
          onClick={() => carregar(paginaAtual - 1)}
          disabled={paginaAtual <= 1}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">Página {paginaAtual} de {totalPaginas}</span>
        <button
          onClick={() => carregar(paginaAtual + 1)}
          disabled={paginaAtual >= totalPaginas}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
        >
          Próxima
        </button>
      </div>

      {/* MUDANÇA: modal de edição para mobile (bottom sheet) */}
      {appEditandoMobile && (
        <ModalEdicaoMobile
          app={appEditandoMobile}
          amperagens={amperagens}
          tipos={tipos}
          onSalvar={salvarEdicaoMobile}
          onCancelar={() => setAppEditandoMobile(null)}
        />
      )}
    </div>
  );
}
