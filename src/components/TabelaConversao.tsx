'use client';

import { useState } from 'react';
import { X, Search, ArrowLeftRight } from 'lucide-react';

const MARCAS = ['PIONEIRO', 'MOURA', 'YAUSA', 'ERBS', 'HELIAR', 'BOSCH', 'ROUTE'] as const;
type Marca = typeof MARCAS[number];

const TABELA: Record<Marca, string>[] = [
  { PIONEIRO: 'MBR 4-BS',    MOURA: 'MA3-D',     YAUSA: 'YTX4L-BS',             ERBS: 'ERX 4BS',    HELIAR: '-',             BOSCH: '-',         ROUTE: 'YTX4L-BS'     },
  { PIONEIRO: 'MBR 5-BS',    MOURA: 'MA5-D',     YAUSA: 'YTX5L-BS',             ERBS: 'ERX 5BS',    HELIAR: 'HTZ5L/HTZ6L',   BOSCH: 'BTZ5LBS',   ROUTE: 'YTX5L-BS'     },
  { PIONEIRO: 'MBR 6-BS',    MOURA: '-',         YAUSA: 'YTX6-V',               ERBS: 'ERX 6BS',    HELIAR: '-',             BOSCH: '-',         ROUTE: 'YTX6LS'       },
  { PIONEIRO: 'MBR 7-BS',    MOURA: 'MA6-D',     YAUSA: 'YTX7L-BS',             ERBS: 'ETX 7BS',    HELIAR: 'HTZ7L',         BOSCH: '-',         ROUTE: 'YTX7L-BS'     },
  { PIONEIRO: 'MBR 5-VP',    MOURA: 'MV5-D',     YAUSA: 'YB5L-B',               ERBS: 'ETX 6LBS',   HELIAR: '-',             BOSCH: '-',         ROUTE: 'YTX6LB-BS'    },
  { PIONEIRO: 'MBR 5,5-BS',  MOURA: 'MV5,5-D',   YAUSA: '12N5,5-3B',            ERBS: 'ETX 5,5BS',  HELIAR: '-',             BOSCH: '-',         ROUTE: 'YTX6L-BS'     },
  { PIONEIRO: 'MBR 7A-BS',   MOURA: 'MA6-E',     YAUSA: 'YTX7A-BS',             ERBS: 'ETX 7HBS',   HELIAR: 'HTX7A-BS',      BOSCH: '-',         ROUTE: 'YTX7A-BS'     },
  { PIONEIRO: 'MBR 7-VP',    MOURA: 'MV7X-EI',   YAUSA: 'YB7B-B',               ERBS: 'ERX 8BS',    HELIAR: '-',             BOSCH: '-',         ROUTE: 'YTX8-BS'      },
  { PIONEIRO: 'MBR 8-VP',    MOURA: 'MA8-E',     YAUSA: 'YTX9-BS',              ERBS: 'ETX 9BS',    HELIAR: 'HTX9-BS',       BOSCH: 'BT8BBS',    ROUTE: 'YTX9-BS'      },
  { PIONEIRO: 'MBR 9A-YS',   MOURA: 'MV8-E',     YAUSA: 'YB7-A',                ERBS: 'ETX 8ABS',   HELIAR: '-',             BOSCH: '-',         ROUTE: 'YTX9A-BS'     },
  { PIONEIRO: 'MBR 9 BL-BS', MOURA: 'MA9-E',     YAUSA: '-',                    ERBS: '-',          HELIAR: '-',             BOSCH: '-',         ROUTE: '-'            },
  { PIONEIRO: 'MBR 10-BS',   MOURA: 'MA8,6-E',   YAUSA: 'YTZ10-S',              ERBS: 'ETX 8,6BS',  HELIAR: 'HTZ10S-BS',     BOSCH: '-',         ROUTE: 'YTX10S'       },
  { PIONEIRO: 'MBR 11-VP',   MOURA: 'MA10-E',    YAUSA: 'YTX12-BS',             ERBS: 'ETX 10BS',   HELIAR: 'HTX12-BS',      BOSCH: '-',         ROUTE: 'YTX12-BS'     },
  { PIONEIRO: 'MBR 12L-VP',  MOURA: '-',         YAUSA: 'YTX12A-BS / YTZ14-S',  ERBS: '-',          HELIAR: 'HTZ12-SBS',     BOSCH: '-',         ROUTE: 'YTZ14-S'      },
  { PIONEIRO: 'MBR 12BL-BS', MOURA: 'MA11-E',    YAUSA: '-',                    ERBS: '-',          HELIAR: '-',             BOSCH: '-',         ROUTE: '-'            },
  { PIONEIRO: 'MBR 14-BS',   MOURA: 'MA12-E',    YAUSA: 'YTX14-BS',             ERBS: '-',          HELIAR: 'HTX14',         BOSCH: 'BTX12LBS',  ROUTE: 'YTX14-BS'     },
  { PIONEIRO: 'MBR 14-RBS',  MOURA: 'MA12-D',    YAUSA: 'YTX14L-BS',            ERBS: '-',          HELIAR: '-',             BOSCH: 'BTX14BS1',  ROUTE: 'YTX14L-BSHD'  },
  { PIONEIRO: 'MBR 14AL-YS', MOURA: 'MV14-EI',   YAUSA: 'YB14-A2',              ERBS: 'ETX 10ABS',  HELIAR: '-',             BOSCH: '-',         ROUTE: '-'            },
  { PIONEIRO: 'MBR 16L-BS',  MOURA: 'MV14-E',    YAUSA: 'YTX16LL-BS',           ERBS: '-',          HELIAR: '-',             BOSCH: '-',         ROUTE: '-'            },
  { PIONEIRO: 'MBR 18-BS',   MOURA: 'MA18-D',    YAUSA: 'YTX20L-BS',            ERBS: '-',          HELIAR: '-',             BOSCH: 'BTX18LBS',  ROUTE: 'YTX20L-BS'    },
  { PIONEIRO: 'MBR 18L-BS',  MOURA: '-',         YAUSA: '-',                    ERBS: '-',          HELIAR: '-',             BOSCH: '-',         ROUTE: '-'            },
  { PIONEIRO: 'MBR 28-BS',   MOURA: 'MA30-D',    YAUSA: 'YIX30L-BS',            ERBS: '-',          HELIAR: '-',             BOSCH: 'BTX30LBS',  ROUTE: '-'            },
];

export default function TabelaConversao({ onFechar }: { onFechar: () => void }) {
  const [busca, setBusca] = useState('');

  const linhasFiltradas = busca.trim()
    ? TABELA.filter(row =>
        Object.values(row).some(v => v !== '-' && v.toLowerCase().includes(busca.toLowerCase()))
      )
    : TABELA;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[92dvh] md:max-h-[85dvh] rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
              <ArrowLeftRight size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-950 text-base leading-tight">Tabela de conversao</h2>
              <p className="text-xs text-slate-500">Equivalencias entre marcas — baterias de moto</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
            <X size={20} />
          </button>
        </div>

        {/* Busca */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por qualquer referencia (ex: YTX7L, MA6-D...)"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-auto flex-1 px-5 pb-5">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead className="sticky top-0 z-10">
              <tr>
                {MARCAS.map((marca, i) => (
                  <th
                    key={marca}
                    className={`py-2 px-2.5 text-left font-bold tracking-wide uppercase border-b-2 border-slate-200 whitespace-nowrap ${
                      i === 0
                        ? 'bg-yellow-400 text-yellow-900 rounded-tl-lg'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {marca}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhasFiltradas.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  {MARCAS.map((marca, j) => (
                    <td
                      key={marca}
                      className={`py-2 px-2.5 border-b border-slate-100 font-mono ${
                        row[marca] === '-'
                          ? 'text-slate-300'
                          : j === 0
                          ? 'font-bold text-slate-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {row[marca]}
                    </td>
                  ))}
                </tr>
              ))}
              {linhasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma referencia encontrada para &quot;{busca}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Fonte: Tabela de conversao Pioneiro Baterias
          </p>
        </div>
      </div>
    </div>
  );
}
