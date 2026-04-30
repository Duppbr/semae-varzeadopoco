'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

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

export default function AdminAplicacoesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [aplicacoes, setAplicacoes] = useState<Aplicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [dadosEdit, setDadosEdit] = useState<any>({});
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [arquivoImport, setArquivoImport] = useState<File | null>(null);
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState({
    carBrand: '',
    carModel: '',
    carYearFrom: '',
    carYearTo: '',
    vehicleType: '',
    amperagem: '',
    tipo: '',
    battery: '',
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
    } catch (e) {
      alert('Erro ao carregar aplicações.');
    }
    setLoading(false);
  };

  const excluir = async (id: string) => {
    await fetch('/api/admin/aplicacoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    carregar();
  };

  const iniciarEdicao = (app: Aplicacao) => {
    setEditandoId(app.id);
    setDadosEdit({ ...app });
  };

  const salvarEdicao = async () => {
    await fetch('/api/admin/aplicacoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: dadosEdit.id, ...dadosEdit }),
    });
    setEditandoId(null);
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
      setNovoVeiculo({
        carBrand: '', carModel: '', carYearFrom: '', carYearTo: '',
        vehicleType: '', amperagem: '', tipo: '', battery: '',
      });
      carregar();
    } else {
      alert('Erro ao criar aplicação.');
    }
  };

  // Listas para selects
  const amperagens = opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor);
  const tipos = opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor);
  const marcasVeiculos = opcoes.filter(o => o.categoria === 'marca_veiculo').map(o => o.valor);
  const tiposVeiculo = ['CARRO', 'MOTO', 'CAMINHAO'];

  if (userLoading || loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🚗 Aplicações de Veículos</h1>

      {/* Upload CSV */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-2 items-end flex-wrap">
        <input type="file" accept=".csv" onChange={e => setArquivoImport(e.target.files?.[0] || null)} className="border p-2 rounded" />
        <button onClick={importar} disabled={!arquivoImport} className="bg-purple-600 text-white px-4 py-2 rounded">Importar CSV</button>
        <button onClick={() => setMostrarFormNovo(!mostrarFormNovo)} className="bg-green-600 text-white px-4 py-2 rounded">
          {mostrarFormNovo ? 'Cancelar' : '+ Novo Veículo'}
        </button>
      </div>

      {/* Formulário de novo veículo */}
      {mostrarFormNovo && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <form onSubmit={criarNovo} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={novoVeiculo.carBrand} onChange={e => setNovoVeiculo({...novoVeiculo, carBrand: e.target.value})} className="border p-2 rounded" required>
              <option value="">Marca *</option>
              {marcasVeiculos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="text" placeholder="Modelo *" value={novoVeiculo.carModel} onChange={e => setNovoVeiculo({...novoVeiculo, carModel: e.target.value})} className="border p-2 rounded" required />
            <input type="number" placeholder="Ano Inicial" value={novoVeiculo.carYearFrom} onChange={e => setNovoVeiculo({...novoVeiculo, carYearFrom: e.target.value})} className="border p-2 rounded" />
            <input type="number" placeholder="Ano Final" value={novoVeiculo.carYearTo} onChange={e => setNovoVeiculo({...novoVeiculo, carYearTo: e.target.value})} className="border p-2 rounded" />
            <select value={novoVeiculo.vehicleType} onChange={e => setNovoVeiculo({...novoVeiculo, vehicleType: e.target.value})} className="border p-2 rounded">
              <option value="">Tipo de veículo</option>
              {tiposVeiculo.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={novoVeiculo.amperagem} onChange={e => setNovoVeiculo({...novoVeiculo, amperagem: e.target.value})} className="border p-2 rounded">
              <option value="">Amperagem</option>
              {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={novoVeiculo.tipo} onChange={e => setNovoVeiculo({...novoVeiculo, tipo: e.target.value})} className="border p-2 rounded">
              <option value="">Tecnologia</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Bateria (cód. Moura)" value={novoVeiculo.battery} onChange={e => setNovoVeiculo({...novoVeiculo, battery: e.target.value})} className="border p-2 rounded" />
            <div className="col-span-full flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <input
        value={busca}
        onChange={e => setBusca(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') carregar(); }}
        placeholder="Buscar por marca ou modelo..."
        className="border p-2 rounded w-full mb-4"
      />

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Marca</th>
              <th className="px-4 py-2">Modelo</th>
              <th className="px-4 py-2">Ano</th>
              <th className="px-4 py-2">Amperagem</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Bateria</th>
              <th className="px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {aplicacoes.map(app => (
              <tr key={app.id}>
                {editandoId === app.id ? (
                  <>
                    <td><input value={dadosEdit.carBrand || ''} onChange={e => setDadosEdit({...dadosEdit, carBrand: e.target.value})} className="border p-1 w-24" /></td>
                    <td><input value={dadosEdit.carModel || ''} onChange={e => setDadosEdit({...dadosEdit, carModel: e.target.value})} className="border p-1 w-32" /></td>
                    <td>
                      <input type="number" value={dadosEdit.carYearFrom || ''} onChange={e => setDadosEdit({...dadosEdit, carYearFrom: e.target.value ? parseInt(e.target.value) : null})} className="border p-1 w-16" />
                      -
                      <input type="number" value={dadosEdit.carYearTo || ''} onChange={e => setDadosEdit({...dadosEdit, carYearTo: e.target.value ? parseInt(e.target.value) : null})} className="border p-1 w-16" />
                    </td>
                    <td>
                      <select value={dadosEdit.amperagem || ''} onChange={e => setDadosEdit({...dadosEdit, amperagem: e.target.value})} className="border p-1">
                        <option value="">Selecione...</option>
                        {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={dadosEdit.tipo || ''} onChange={e => setDadosEdit({...dadosEdit, tipo: e.target.value})} className="border p-1">
                        <option value="">Selecione...</option>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td><input value={dadosEdit.battery || ''} onChange={e => setDadosEdit({...dadosEdit, battery: e.target.value})} className="border p-1 w-20" /></td>
                    <td>
                      <button onClick={salvarEdicao} className="text-green-600 hover:underline mr-2">Salvar</button>
                      <button onClick={() => setEditandoId(null)} className="text-gray-500 hover:underline">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2">{app.carBrand || '-'}</td>
                    <td className="px-4 py-2">{app.carModel || '-'}</td>
                    <td className="px-4 py-2">{app.carYearFrom}-{app.carYearTo}</td>
                    <td className="px-4 py-2">{app.amperagem || '-'}</td>
                    <td className="px-4 py-2">{app.tipo || '-'}</td>
                    <td className="px-4 py-2">{app.battery || '-'}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => iniciarEdicao(app)} className="text-blue-600 hover:underline mr-2">Editar</button>
                      <button onClick={() => excluir(app.id)} className="text-red-600 hover:underline">Excluir</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => carregar(paginaAtual - 1)}
          disabled={paginaAtual <= 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm">Página {paginaAtual} de {totalPaginas}</span>
        <button
          onClick={() => carregar(paginaAtual + 1)}
          disabled={paginaAtual >= totalPaginas}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}