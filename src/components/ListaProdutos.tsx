'use client';

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import ProdutoCard from './ProdutoCard';
import {
  BatteryCharging,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react';

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

interface ProdutoConsulta {
  produto: {
    id: number;
    sku: string;
    nome: string;
    marca: string;
    amperagem: string | null;
    tipo: string | null;
    cca: number | null;
    garantia: string | null;
  };
  precoCartao: number | null;
  precoCartao3x: number | null;
  precoAvista: number | null;
  precoAvistaMinimo: number | null;
  quantidadeEstoque: number;
}

type ModoConsulta = 'atalhos' | 'veiculo' | 'busca';

export default function ListaProdutos({
  produtosIniciais,
  userRole,
}: {
  produtosIniciais: ProdutoConsulta[];
  userRole?: string;
}) {
  const [modo, setModo] = useState<ModoConsulta>('atalhos');
  const [atalhos, setAtalhos] = useState<Atalho[]>([]);
  const [expandedAtalhos, setExpandedAtalhos] = useState(false);
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);

  const [filtroAmperagem, setFiltroAmperagem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroGarantia, setFiltroGarantia] = useState('');
  const [busca, setBusca] = useState('');
  const [atalhoSelecionadoId, setAtalhoSelecionadoId] = useState<number | null>(null);

  const [veiculoBusca, setVeiculoBusca] = useState('');
  const [sugestoesVeiculos, setSugestoesVeiculos] = useState<VeiculoSugestao[]>([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<VeiculoSugestao | null>(null);
  const [mostrarDetalhesVeiculo, setMostrarDetalhesVeiculo] = useState(false);

  const podeVerEstoque = userRole === 'admin' || userRole === 'supervisor';

  useEffect(() => {
    Promise.all([
      fetch('/api/atalhos').then(res => res.json()),
      fetch('/api/opcoes').then(res => res.json()),
    ])
      .then(([atalhosData, opcoesData]) => {
        setAtalhos(atalhosData);
        setOpcoes(opcoesData);
      })
      .catch(() => {});
  }, []);

  const amperagens = useMemo(() => opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor), [opcoes]);
  const tipos = useMemo(() => opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor), [opcoes]);
  const marcas = useMemo(() => opcoes.filter(o => o.categoria === 'marca').map(o => o.valor), [opcoes]);
  const garantias = useMemo(() => opcoes.filter(o => o.categoria === 'garantia').map(o => o.valor), [opcoes]);

  const limparFiltros = () => {
    setFiltroAmperagem('');
    setFiltroTipo('');
    setFiltroMarca('');
    setFiltroGarantia('');
    setBusca('');
    setAtalhoSelecionadoId(null);
    setVeiculoSelecionado(null);
    setVeiculoBusca('');
    setSugestoesVeiculos([]);
  };

  const trocarModo = (novoModo: ModoConsulta) => {
    setModo(novoModo);
    limparFiltros();
  };

  const aplicarAtalho = (a: Atalho) => {
    setAtalhoSelecionadoId(a.id);
    setFiltroAmperagem(a.amperagem);
    setFiltroTipo(a.tipo || '');
    setFiltroMarca(a.marca || '');
    setFiltroGarantia('');
    setBusca('');
  };

  const aplicarVeiculo = (v: VeiculoSugestao) => {
    setVeiculoSelecionado(v);
    setVeiculoBusca(`${v.carBrand} ${v.carModel} (${v.carYearFrom}-${v.carYearTo})`);
    setSugestoesVeiculos([]);
    setFiltroAmperagem(v.amperagem || '');
    setFiltroTipo(v.tipo || '');
    setFiltroMarca('');
    setFiltroGarantia('');
    setBusca('');
  };

  const buscarVeiculos = async (termo: string) => {
    setVeiculoBusca(termo);
    setVeiculoSelecionado(null);
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

  const temCriterio =
    Boolean(busca || filtroAmperagem || filtroTipo || filtroMarca || filtroGarantia || veiculoSelecionado || atalhoSelecionadoId);

  const produtosProcessados = useMemo(() => {
    let lista = (produtosIniciais || []).filter(p => p.quantidadeEstoque > 0);

    if (busca) {
      const b = busca.toLowerCase();
      lista = lista.filter(p =>
        p.produto.nome.toLowerCase().includes(b) ||
        p.produto.sku.toLowerCase().includes(b) ||
        p.produto.marca.toLowerCase().includes(b)
      );
    }
    if (filtroAmperagem) lista = lista.filter(p => p.produto.amperagem === filtroAmperagem);
    if (filtroTipo) lista = lista.filter(p => p.produto.tipo === filtroTipo);
    if (filtroMarca) lista = lista.filter(p => p.produto.marca === filtroMarca);
    if (filtroGarantia) lista = lista.filter(p => (p.produto.garantia || '') === filtroGarantia);

    return [...lista].sort((a, b) => (b.precoCartao || b.precoAvista || 0) - (a.precoCartao || a.precoAvista || 0));
  }, [produtosIniciais, filtroAmperagem, filtroTipo, filtroMarca, filtroGarantia, busca]);

  const atalhosVisiveis = expandedAtalhos ? atalhos : atalhos.slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          <ModoButton ativo={modo === 'atalhos'} onClick={() => trocarModo('atalhos')} icon={Zap} label="Atalhos" />
          <ModoButton ativo={modo === 'veiculo'} onClick={() => trocarModo('veiculo')} icon={CarFront} label="Veiculo" />
          <ModoButton ativo={modo === 'busca'} onClick={() => trocarModo('busca')} icon={Search} label="Busca" />
        </div>
      </div>

      {modo === 'atalhos' && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <CabecalhoModo
            icon={Zap}
            titulo="Atalhos rapidos"
            descricao="Escolha uma combinacao pronta para consultar as baterias mais comuns."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
            {atalhosVisiveis.map(a => {
              const selecionado = atalhoSelecionadoId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => aplicarAtalho(a)}
                  className={`border rounded-xl p-3 active:scale-95 transition text-left ${
                    selecionado
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-slate-950">{a.amperagem.replace('ah', '')} Ah</span>
                    {selecionado && <CheckCircle2 size={18} className="text-blue-600" />}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-1">{a.tipo || 'Todos os tipos'}</div>
                  {a.marca && <div className="text-xs text-slate-500 mt-0.5">{a.marca}</div>}
                </button>
              );
            })}
          </div>
          {atalhos.length > 8 && (
            <button
              onClick={() => setExpandedAtalhos(!expandedAtalhos)}
              className="mt-4 text-blue-600 text-sm font-medium inline-flex items-center gap-1"
            >
              {expandedAtalhos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {expandedAtalhos ? 'Mostrar menos' : `Ver todos (${atalhos.length})`}
            </button>
          )}
        </section>
      )}

      {modo === 'veiculo' && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <CabecalhoModo
            icon={CarFront}
            titulo="Consultar por veiculo"
            descricao="Digite o modelo do carro e selecione uma aplicacao. O sistema mostra a bateria indicada."
          />
          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Ex: Corsa, Gol, Honda..."
              value={veiculoBusca}
              onChange={e => buscarVeiculos(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {sugestoesVeiculos.length > 0 && !veiculoSelecionado && (
              <ul className="bg-white border border-slate-200 rounded-xl mt-2 shadow-lg max-h-64 overflow-y-auto z-10 absolute left-0 right-0">
                {sugestoesVeiculos.map(v => (
                  <li
                    key={v.id}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                    onClick={() => aplicarVeiculo(v)}
                  >
                    <div className="font-medium text-slate-950">{v.carBrand} {v.carModel}</div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-2 mt-1">
                      <span>{v.carYearFrom} - {v.carYearTo}</span>
                      <span>{v.amperagem} {v.tipo}</span>
                      <span>Bateria: {v.battery}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {veiculoSelecionado && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h4 className="font-bold text-slate-950">
                    {veiculoSelecionado.carBrand} {veiculoSelecionado.carModel}
                  </h4>
                  <p className="text-sm text-slate-600">{veiculoSelecionado.carYearFrom}-{veiculoSelecionado.carYearTo}</p>
                  <div className="flex flex-wrap gap-2 mt-3 text-sm">
                    <InfoPill>{veiculoSelecionado.vehicleType}</InfoPill>
                    <InfoPill>{veiculoSelecionado.amperagem} {veiculoSelecionado.tipo}</InfoPill>
                    <InfoPill>{veiculoSelecionado.battery}</InfoPill>
                    {veiculoSelecionado.batteryAlt && <InfoPill>Alternativa: {veiculoSelecionado.batteryAlt}</InfoPill>}
                  </div>
                  {mostrarDetalhesVeiculo && (
                    <div className="mt-3 text-sm text-slate-600 grid grid-cols-2 gap-2">
                      <span>Comprimento: {veiculoSelecionado.length} mm</span>
                      <span>Largura: {veiculoSelecionado.width} mm</span>
                      <span>Altura: {veiculoSelecionado.height} mm</span>
                      <span>CCA: {veiculoSelecionado.cca}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setMostrarDetalhesVeiculo(!mostrarDetalhesVeiculo)}
                    className="text-blue-700 text-xs mt-3 inline-flex items-center gap-1 font-medium"
                  >
                    {mostrarDetalhesVeiculo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {mostrarDetalhesVeiculo ? 'Menos detalhes' : 'Detalhes tecnicos'}
                  </button>
                </div>
                <button onClick={limparFiltros} className="text-slate-400 hover:text-red-500" aria-label="Limpar veiculo">
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {modo === 'busca' && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <CabecalhoModo
            icon={SlidersHorizontal}
            titulo="Busca manual"
            descricao="Filtre por texto, amperagem, tipo, marca ou garantia."
          />
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou marca..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <SelectFiltro value={filtroAmperagem} onChange={setFiltroAmperagem} label="Amperagem" values={amperagens} />
              <SelectFiltro value={filtroTipo} onChange={setFiltroTipo} label="Tipo" values={tipos} />
              <SelectFiltro value={filtroMarca} onChange={setFiltroMarca} label="Marca" values={marcas} />
              <SelectFiltro value={filtroGarantia} onChange={setFiltroGarantia} label="Garantia" values={garantias} />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <BatteryCharging size={20} className="text-blue-600" />
              Resultados
            </h3>
            <p className="text-sm text-slate-500">
              {temCriterio ? `${produtosProcessados.length} bateria(s) encontrada(s)` : 'Escolha um criterio acima para consultar.'}
            </p>
          </div>
          {temCriterio && (
            <button onClick={limparFiltros} className="inline-flex items-center gap-1 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
              <X size={14} />
              Limpar
            </button>
          )}
        </div>

        {temCriterio ? (
          produtosProcessados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtosProcessados.map((item) => (
                <ProdutoCard key={item.produto.id} {...item} podeVerEstoque={podeVerEstoque} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              Nenhuma bateria encontrada para esse criterio.
            </div>
          )
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
            Use atalhos, selecione um veiculo ou faca uma busca manual.
          </div>
        )}
      </section>
    </div>
  );
}

function ModoButton({
  ativo,
  onClick,
  icon: Icon,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
        ativo ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function CabecalhoModo({
  icon: Icon,
  titulo,
  descricao,
}: {
  icon: ElementType;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-950">{titulo}</h3>
        <p className="text-sm text-slate-500">{descricao}</p>
      </div>
    </div>
  );
}

function SelectFiltro({
  value,
  onChange,
  label,
  values,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  values: string[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="p-3 border border-slate-300 rounded-xl text-sm bg-white">
      <option value="">{label}</option>
      {values.map(item => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}

function InfoPill({ children }: { children: ReactNode }) {
  return <span className="bg-white rounded-lg px-2 py-1 text-slate-700 border border-blue-100">{children}</span>;
}
