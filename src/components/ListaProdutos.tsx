'use client';

import { useState, useMemo, useEffect } from 'react';
import ProdutoCard from './ProdutoCard';
import { CarFront, Zap, Search, ChevronDown, ChevronUp, X, Info } from 'lucide-react';

interface Opcao {
  id: number;
  categoria: string;
  valor: string;
}

interface Atalho {
  id: number;
  amperagem: string;
  tipo: string | null;
  marca: string | null;
}

interface VeiculoSugestao {
  id: string;
  carBrand: string;
  carModel: string;
  carYearFrom: number;
  carYearTo: number;
  vehicleType: string;
  amperagem: string;
  tipo: string | null;
  battery: string;
  batteryAlt: string | null;
  cca: number;
  length: number;
  width: number;
  height: number;
}

export default function ListaProdutos({ produtosIniciais, userRole }: { produtosIniciais: any[]; userRole?: string }) {
  // Atalhos
  const [atalhos, setAtalhos] = useState<Atalho[]>([]);
  const [expandedAtalhos, setExpandedAtalhos] = useState(false);

  // Busca Avançada
  const [mostrarAvancado, setMostrarAvancado] = useState(false);

  // Filtros
  const [filtroAmperagem, setFiltroAmperagem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroGarantia, setFiltroGarantia] = useState('');
  const [busca, setBusca] = useState('');

  // Opções
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const podeVerEstoque = userRole === 'admin' || userRole === 'supervisor';

  // Veículo
  const [veiculoBusca, setVeiculoBusca] = useState('');
  const [sugestoesVeiculos, setSugestoesVeiculos] = useState<VeiculoSugestao[]>([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoSugestao | null>(null);
  const [mostrarDetalhesVeiculo, setMostrarDetalhesVeiculo] = useState(false);

  useEffect(() => {
    fetch('/api/atalhos')
      .then(res => res.json())
      .then(data => setAtalhos(data))
      .catch(() => {});
    fetch('/api/opcoes')
      .then(res => res.json())
      .then(data => setOpcoes(data))
      .catch(() => {});
  }, []);

  const amperagens = useMemo(() => opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor), [opcoes]);
  const tipos = useMemo(() => opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor), [opcoes]);
  const marcas = useMemo(() => opcoes.filter(o => o.categoria === 'marca').map(o => o.valor), [opcoes]);
  const garantias = useMemo(() => opcoes.filter(o => o.categoria === 'garantia').map(o => o.valor), [opcoes]);

  const aplicarAtalho = (a: Atalho) => {
    setMostrarAvancado(false);
    setFiltroAmperagem(a.amperagem);
    setFiltroTipo(a.tipo || '');
    setFiltroMarca(a.marca || '');
    setFiltroGarantia('');
    setBusca('');
    setVeiculoSelecionado(null);
    setVeiculoBusca('');
  };

  const aplicarVeiculo = (v: VeiculoSugestao) => {
    setVeiculoSelecionado(v);
    setVeiculoBusca(`${v.carBrand} ${v.carModel} (${v.carYearFrom}-${v.carYearTo})`);
    setSugestoesVeiculos([]);
    setFiltroAmperagem(v.amperagem || '');
    setFiltroTipo(v.tipo || '');
    setFiltroMarca('');
    setFiltroGarantia('');
    setMostrarAvancado(false);
  };

  const buscarVeiculos = async (termo: string) => {
    if (termo.length < 2) {
      setSugestoesVeiculos([]);
      return;
    }
    try {
      const res = await fetch(`/api/aplicacoes/buscar?q=${encodeURIComponent(termo)}`);
      const data = await res.json();
      setSugestoesVeiculos(data.slice(0, 10));
    } catch {
      setSugestoesVeiculos([]);
    }
  };

  const produtosProcessados = useMemo(() => {
    let lista = (produtosIniciais || []).filter((p: any) => p.quantidadeEstoque > 0);

    if (mostrarAvancado) {
      if (busca) {
        const b = busca.toLowerCase();
        lista = lista.filter((p: any) =>
          p.produto.nome.toLowerCase().includes(b) ||
          p.produto.sku.toLowerCase().includes(b) ||
          p.produto.marca.toLowerCase().includes(b)
        );
      }
      if (filtroAmperagem) lista = lista.filter((p: any) => p.produto.amperagem === filtroAmperagem);
      if (filtroTipo) lista = lista.filter((p: any) => p.produto.tipo === filtroTipo);
      if (filtroMarca) lista = lista.filter((p: any) => p.produto.marca === filtroMarca);
      if (filtroGarantia) lista = lista.filter((p: any) => (p.produto.garantia || '') === filtroGarantia);
    } else {
      if (filtroAmperagem) lista = lista.filter((p: any) => p.produto.amperagem === filtroAmperagem);
      if (filtroTipo) lista = lista.filter((p: any) => p.produto.tipo === filtroTipo);
      if (filtroMarca) lista = lista.filter((p: any) => p.produto.marca === filtroMarca);
      if (busca) {
        const b = busca.toLowerCase();
        lista = lista.filter((p: any) =>
          p.produto.nome.toLowerCase().includes(b) ||
          p.produto.sku.toLowerCase().includes(b) ||
          p.produto.marca.toLowerCase().includes(b)
        );
      }
    }

    lista.sort((a: any, b: any) => (b.precoCartao || b.precoAvista || 0) - (a.precoCartao || a.precoAvista || 0));
    if (!mostrarAvancado) lista = lista.slice(0, 6);
    return lista;
  }, [produtosIniciais, mostrarAvancado, filtroAmperagem, filtroTipo, filtroMarca, filtroGarantia, busca]);

  const atalhosVisiveis = expandedAtalhos ? atalhos : atalhos.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 1. ATALHOS RÁPIDOS (primeiro) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Zap size={20} className="text-yellow-500" />
          Atalhos Rápidos
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {atalhosVisiveis.map(a => {
            const tipoCor =
              a.tipo === 'AGM' ? 'text-green-700 border-green-200 bg-green-50' :
              a.tipo === 'EFB' ? 'text-blue-700 border-blue-200 bg-blue-50' :
              a.tipo === 'Convencional' ? 'text-gray-700 border-gray-300 bg-gray-50' :
              'text-gray-700 border-gray-200 bg-white';
            const selecionado =
              filtroAmperagem === a.amperagem &&
              filtroTipo === (a.tipo || '') &&
              filtroMarca === (a.marca || '');
            return (
              <button
                key={a.id}
                onClick={() => aplicarAtalho(a)}
                className={`border rounded-xl p-3 shadow-sm hover:shadow-md active:scale-95 transition-transform text-center ${
                  selecionado ? 'ring-2 ring-blue-500 bg-blue-100 border-blue-300' : tipoCor
                }`}
              >
                <div className="text-lg font-extrabold">{a.amperagem.replace('ah','')} <span className="text-sm font-medium">Ah</span></div>
                <div className="text-xs font-medium mt-1">{a.tipo || 'Todos'}</div>
                {a.marca && <div className="text-[10px] text-gray-500 mt-0.5">{a.marca}</div>}
              </button>
            );
          })}
        </div>
        {atalhos.length > 6 && (
          <button
            onClick={() => setExpandedAtalhos(!expandedAtalhos)}
            className="mt-3 mx-auto block text-blue-600 text-sm hover:underline"
          >
            {expandedAtalhos ? '− Mostrar menos' : `+ Ver todos (${atalhos.length})`}
          </button>
        )}
      </div>

      {/* 2. CONSULTA POR VEÍCULO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CarFront size={20} className="text-blue-600" />
          Consultar por Veículo
        </h3>
        <input
          type="text"
          placeholder="Ex: Corsa, Gol, Honda..."
          value={veiculoBusca}
          onChange={e => {
            setVeiculoBusca(e.target.value);
            buscarVeiculos(e.target.value);
            setVeiculoSelecionado(null);
          }}
          className="w-full p-3 border border-gray-300 rounded-xl text-sm"
        />
        {sugestoesVeiculos.length > 0 && !veiculoSelecionado && (
          <ul className="bg-white border rounded-xl mt-2 shadow-lg max-h-56 overflow-y-auto z-10 relative">
            {sugestoesVeiculos.map(v => (
              <li
                key={v.id}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                onClick={() => aplicarVeiculo(v)}
              >
                <div className="font-medium text-gray-900">{v.carBrand} {v.carModel}</div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                  <span>📅 {v.carYearFrom} - {v.carYearTo}</span>
                  <span>⚡ {v.amperagem} {v.tipo}</span>
                  <span className="text-gray-400">Bateria: {v.battery}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {veiculoSelecionado && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900">{veiculoSelecionado.carBrand} {veiculoSelecionado.carModel} ({veiculoSelecionado.carYearFrom}-{veiculoSelecionado.carYearTo})</h4>
                <div className="flex flex-wrap gap-2 mt-2 text-sm">
                  <span className="bg-white rounded-md px-2 py-1 text-gray-700">
                    🚗 {veiculoSelecionado.vehicleType === 'MOTO' ? '🏍️' : veiculoSelecionado.vehicleType === 'CAMINHAO' ? '🚛' : '🚗'} {veiculoSelecionado.vehicleType}
                  </span>
                  <span className="bg-white rounded-md px-2 py-1 text-gray-700">⚡ {veiculoSelecionado.amperagem} {veiculoSelecionado.tipo}</span>
                  <span className="bg-white rounded-md px-2 py-1 text-gray-700">🔋 {veiculoSelecionado.battery}</span>
                  {veiculoSelecionado.batteryAlt && (
                    <span className="bg-white rounded-md px-2 py-1 text-gray-700">🔄 {veiculoSelecionado.batteryAlt}</span>
                  )}
                </div>
                {mostrarDetalhesVeiculo && (
                  <div className="mt-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <span>📏 Comp: {veiculoSelecionado.length} mm</span>
                    <span>📐 Larg: {veiculoSelecionado.width} mm</span>
                    <span>📏 Alt: {veiculoSelecionado.height} mm</span>
                    <span>❄️ CCA: {veiculoSelecionado.cca}</span>
                  </div>
                )}
                <button
                  onClick={() => setMostrarDetalhesVeiculo(!mostrarDetalhesVeiculo)}
                  className="text-blue-600 text-xs mt-2 flex items-center gap-1 hover:underline"
                >
                  {mostrarDetalhesVeiculo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {mostrarDetalhesVeiculo ? 'Menos detalhes' : 'Detalhes técnicos'}
                </button>
              </div>
              <button
                onClick={() => {
                  setVeiculoSelecionado(null);
                  setVeiculoBusca('');
                  setFiltroAmperagem('');
                  setFiltroTipo('');
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. BUSCA AVANÇADA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <button
          onClick={() => setMostrarAvancado(!mostrarAvancado)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Search size={20} className="text-gray-500" />
            Busca Avançada
          </h3>
          {mostrarAvancado ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {mostrarAvancado && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou marca..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <select value={filtroAmperagem} onChange={e => setFiltroAmperagem(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
                <option value="">Amperagem</option>
                {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
                <option value="">Tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
                <option value="">Marca</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filtroGarantia} onChange={e => setFiltroGarantia(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
                <option value="">Garantia</option>
                {garantias.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* RESULTADOS */}
      {(mostrarAvancado || filtroAmperagem || veiculoSelecionado) && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info size={20} className="text-blue-600" />
            Resultados ({produtosProcessados.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtosProcessados.map((item: any) => (
              <ProdutoCard key={item.produto.id} {...item} podeVerEstoque={podeVerEstoque} />
            ))}
          </div>
          {produtosProcessados.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhuma bateria encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
}