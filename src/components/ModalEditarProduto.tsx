'use client';

import { useEffect, useState } from 'react';

type Produto = {
  id: number;
  sku: string;
  nome: string;
  marca: string;
  amperagem: string | null;
  tipo: string | null;
  cca: number | null;
  garantia: string | null;
};

type ProdutoLoja = {
  id: number;
  produtoId: number;
  lojaId: number;
  produto: Produto;
  precoCartao: number | null;
  precoCartao3x: number | null;
  precoAvista: number | null;
  precoAvistaMinimo: number | null;
  quantidadeEstoque: number;
  ativo: boolean;
  prioridade: string;
};

export default function ModalEditarProduto({
  produtoOriginal,
  onClose,
  onSave,
  carregarCallback,
}: {
  produtoOriginal: ProdutoLoja;
  onClose: () => void;
  onSave: (updates: { matriz?: any; filial?: any }, dadosComuns: any) => Promise<void>;
  carregarCallback?: () => void;
}) {
  const [dadosComuns, setDadosComuns] = useState({
    sku: produtoOriginal.produto.sku,
    nome: produtoOriginal.produto.nome,
    marca: produtoOriginal.produto.marca || '',
    amperagem: produtoOriginal.produto.amperagem || '',
    tipo: produtoOriginal.produto.tipo || '',
    cca: produtoOriginal.produto.cca || '',
    garantia: produtoOriginal.produto.garantia || '',
  });

  const [matriz, setMatriz] = useState<ProdutoLoja | null>(null);
  const [filial, setFilial] = useState<ProdutoLoja | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const produtoId = produtoOriginal.produtoId;

  const [opcoes, setOpcoes] = useState<{ id: number; categoria: string; valor: string }[]>([]);
  useEffect(() => {
    fetch('/api/admin/opcoes')
      .then(res => res.json())
      .then(data => setOpcoes(data))
      .catch(() => {});
  }, []);

  const marcas = opcoes.filter(o => o.categoria === 'marca').map(o => o.valor);
  const amperagens = opcoes.filter(o => o.categoria === 'amperagem').map(o => o.valor);
  const tipos = opcoes.filter(o => o.categoria === 'tipo').map(o => o.valor);
  const garantias = opcoes.filter(o => o.categoria === 'garantia').map(o => o.valor);

  const carregarRegistros = async () => {
    setLoading(true);
    const [resMatriz, resFilial] = await Promise.all([
      fetch(`/api/admin/produtos/by-produto?produtoId=${produtoId}&lojaId=1`),
      fetch(`/api/admin/produtos/by-produto?produtoId=${produtoId}&lojaId=2`),
    ]);
    const matrizData = await resMatriz.json();
    const filialData = await resFilial.json();
    setMatriz(matrizData && matrizData.id ? matrizData : null);
    setFilial(filialData && filialData.id ? filialData : null);
    setLoading(false);
  };

  useEffect(() => {
    carregarRegistros();
  }, [produtoId]);

  const criarRegistroLoja = async (lojaId: number) => {
    const res = await fetch('/api/admin/produtos/criar-registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produtoId, lojaId }),
    });
    if (res.ok) await carregarRegistros();
    else alert('Erro ao criar registro para a loja');
  };

  const copiarMatrizParaFilial = () => {
    if (!matriz) return;
    setFilial(prev => ({
      ...(prev || {
        id: -1, produtoId, lojaId: 2,
        produto: matriz.produto,
        precoCartao: null, precoCartao3x: null, precoAvista: null, precoAvistaMinimo: null,
        quantidadeEstoque: 0, ativo: true, prioridade: 'verde',
      }),
      precoCartao: matriz.precoCartao,
      precoCartao3x: matriz.precoCartao3x,
      precoAvista: matriz.precoAvista,
      precoAvistaMinimo: matriz.precoAvistaMinimo,
      quantidadeEstoque: matriz.quantidadeEstoque,
      ativo: matriz.ativo,
      prioridade: matriz.prioridade,
    }));
  };

  const copiarFilialParaMatriz = () => {
    if (!filial) return;
    setMatriz(prev => ({
      ...(prev || {
        id: -1, produtoId, lojaId: 1,
        produto: filial.produto,
        precoCartao: null, precoCartao3x: null, precoAvista: null, precoAvistaMinimo: null,
        quantidadeEstoque: 0, ativo: true, prioridade: 'verde',
      }),
      precoCartao: filial.precoCartao,
      precoCartao3x: filial.precoCartao3x,
      precoAvista: filial.precoAvista,
      precoAvistaMinimo: filial.precoAvistaMinimo,
      quantidadeEstoque: filial.quantidadeEstoque,
      ativo: filial.ativo,
      prioridade: filial.prioridade,
    }));
  };

  const handleSave = async () => {
    setSalvando(true);
    const updates: any = {};
    if (matriz && matriz.id !== -1) {
      updates.matriz = {
        id: matriz.id,
        precoCartao: matriz.precoCartao,
        precoCartao3x: matriz.precoCartao3x,
        precoAvista: matriz.precoAvista,
        precoAvistaMinimo: matriz.precoAvistaMinimo,
        quantidadeEstoque: matriz.quantidadeEstoque,
        ativo: matriz.ativo,
        prioridade: matriz.prioridade,
      };
    }
    if (filial && filial.id !== -1) {
      updates.filial = {
        id: filial.id,
        precoCartao: filial.precoCartao,
        precoCartao3x: filial.precoCartao3x,
        precoAvista: filial.precoAvista,
        precoAvistaMinimo: filial.precoAvistaMinimo,
        quantidadeEstoque: filial.quantidadeEstoque,
        ativo: filial.ativo,
        prioridade: filial.prioridade,
      };
    }
    await onSave(updates, dadosComuns);
    setSalvando(false);
    if (carregarCallback) carregarCallback();
    onClose();
  };

  if (loading) return <div className="p-8 text-center">Carregando dados das lojas...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Editar Produto: {dadosComuns.nome}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          {/* Dados comuns */}
          <div className="border rounded p-4 mb-6">
            <h3 className="font-bold mb-3">📋 Dados gerais do produto</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input type="text" placeholder="SKU" value={dadosComuns.sku} onChange={e => setDadosComuns({...dadosComuns, sku: e.target.value})} className="border p-2 rounded" />
              <input type="text" placeholder="Nome" value={dadosComuns.nome} onChange={e => setDadosComuns({...dadosComuns, nome: e.target.value})} className="border p-2 rounded" />
              <select value={dadosComuns.marca} onChange={e => setDadosComuns({...dadosComuns, marca: e.target.value})} className="border p-2 rounded">
                <option value="">Marca</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={dadosComuns.amperagem} onChange={e => setDadosComuns({...dadosComuns, amperagem: e.target.value})} className="border p-2 rounded">
                <option value="">Amperagem</option>
                {amperagens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={dadosComuns.tipo} onChange={e => setDadosComuns({...dadosComuns, tipo: e.target.value})} className="border p-2 rounded">
                <option value="">Tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="text" placeholder="CCA" value={dadosComuns.cca} onChange={e => setDadosComuns({...dadosComuns, cca: e.target.value})} className="border p-2 rounded" />
              <select value={dadosComuns.garantia} onChange={e => setDadosComuns({...dadosComuns, garantia: e.target.value})} className="border p-2 rounded">
                <option value="">Garantia</option>
                {garantias.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Matriz */}
            <div className="border rounded p-4">
              <h3 className="font-bold text-lg mb-2">🏢 Matriz Artêmia</h3>
              {matriz ? (
                <div className="space-y-2">
                  <label className="block text-sm">Preço Cartão</label>
                  <input type="number" step="0.01" value={matriz.precoCartao ?? ''} onChange={e => setMatriz({...matriz, precoCartao: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Preço Cartão 3x</label>
                  <input type="number" step="0.01" value={matriz.precoCartao3x ?? ''} onChange={e => setMatriz({...matriz, precoCartao3x: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Preço À vista</label>
                  <input type="number" step="0.01" value={matriz.precoAvista ?? ''} onChange={e => setMatriz({...matriz, precoAvista: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Preço À vista mínimo</label>
                  <input type="number" step="0.01" value={matriz.precoAvistaMinimo ?? ''} onChange={e => setMatriz({...matriz, precoAvistaMinimo: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Estoque</label>
                  <input type="number" value={matriz.quantidadeEstoque} onChange={e => setMatriz({...matriz, quantidadeEstoque: parseInt(e.target.value) || 0})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Prioridade</label>
                  <select value={matriz.prioridade} onChange={e => setMatriz({...matriz, prioridade: e.target.value})} className="w-full border p-2 rounded">
                    <option value="verde">🟢 Baixa</option>
                    <option value="amarelo">🟡 Média</option>
                    <option value="vermelho">🔴 Alta</option>
                  </select>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={matriz.ativo} onChange={e => setMatriz({...matriz, ativo: e.target.checked})} />
                    Ativo nesta loja
                  </label>
                </div>
              ) : (
                <button onClick={() => criarRegistroLoja(1)} className="text-blue-600 underline">Criar registro para Matriz</button>
              )}
            </div>

            {/* Setas */}
            <div className="flex flex-col justify-center items-center space-y-4">
              <button onClick={copiarMatrizParaFilial} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 w-12 h-12 text-2xl" title="Copiar da Matriz para Filial">→</button>
              <button onClick={copiarFilialParaMatriz} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 w-12 h-12 text-2xl" title="Copiar da Filial para Matriz">←</button>
            </div>

            {/* Filial */}
            <div className="border rounded p-4">
              <h3 className="font-bold text-lg mb-2">🏬 Filial Iguatemi</h3>
              {filial ? (
                <div className="space-y-2">
                  <label className="block text-sm">Preço Cartão</label>
                  <input type="number" step="0.01" value={filial.precoCartao ?? ''} onChange={e => setFilial({...filial, precoCartao: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Preço Cartão 3x</label>
                  <input type="number" step="0.01" value={filial.precoCartao3x ?? ''} onChange={e => setFilial({...filial, precoCartao3x: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Preço À vista</label>
                  <input type="number" step="0.01" value={filial.precoAvista ?? ''} onChange={e => setFilial({...filial, precoAvista: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Preço À vista mínimo</label>
                  <input type="number" step="0.01" value={filial.precoAvistaMinimo ?? ''} onChange={e => setFilial({...filial, precoAvistaMinimo: e.target.value === '' ? null : (parseFloat(e.target.value) || null)})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Estoque</label>
                  <input type="number" value={filial.quantidadeEstoque} onChange={e => setFilial({...filial, quantidadeEstoque: parseInt(e.target.value) || 0})} className="w-full border p-2 rounded" />
                  <label className="block text-sm">Prioridade</label>
                  <select value={filial.prioridade} onChange={e => setFilial({...filial, prioridade: e.target.value})} className="w-full border p-2 rounded">
                    <option value="verde">🟢 Baixa</option>
                    <option value="amarelo">🟡 Média</option>
                    <option value="vermelho">🔴 Alta</option>
                  </select>
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={filial.ativo} onChange={e => setFilial({...filial, ativo: e.target.checked})} />
                    Ativo nesta loja
                  </label>
                </div>
              ) : (
                <button onClick={() => criarRegistroLoja(2)} className="text-blue-600 underline">Criar registro para Filial</button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={handleSave} disabled={salvando} className="px-4 py-2 bg-blue-600 text-white rounded">
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}