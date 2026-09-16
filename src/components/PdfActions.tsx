'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, Share2 } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { Documento } from '@/lib/documento';
import { gerarPdf } from '@/lib/gerar-pdf';

const native = registerPlugin<{ print(o: { title: string }): Promise<void>; sharePdf(o: { base64: string; filename: string }): Promise<void> }>('SemaePdf');

export default function PdfActions({ documento }: { documento: Documento }) {
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [logo, setLogo] = useState<string>();
  useEffect(() => {
    let ativo = true;
    fetch('/logo-semae.png').then(r => { if (!r.ok) throw new Error(); return r.blob(); }).then(blob => {
      const reader = new FileReader();
      reader.onload = () => { if (ativo) setLogo(String(reader.result)); };
      reader.readAsDataURL(blob);
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);

  async function executar(acao: 'imprimir' | 'compartilhar' | 'baixar') {
    if (ocupado) return;
    setOcupado(true); setErro('');
    try {
      if (acao === 'imprimir') {
        if (Capacitor.isNativePlatform()) await native.print({ title: documento.titulo });
        else window.print();
      } else {
        const pdf = gerarPdf(documento, logo);
        if (Capacitor.isNativePlatform()) {
          await native.sharePdf({ base64: pdf.output('datauristring').split(',')[1], filename: documento.arquivo });
        } else {
          const file = new File([pdf.output('blob')], documento.arquivo, { type: 'application/pdf' });
          if (acao === 'compartilhar' && navigator.canShare?.({ files: [file] }))
            await navigator.share({ files: [file], title: documento.titulo });
          else pdf.save(documento.arquivo);
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        setErro(Capacitor.isNativePlatform() ? 'Nao foi possivel abrir a acao. Instale o APK atualizado com suporte a PDF e tente novamente.' : 'Nao foi possivel concluir. Tente baixar o PDF.');
    } finally { setOcupado(false); }
  }
  return <div className="pdf-actions">
    <nav aria-label="Documento">
      <Link href={documento.voltar} title="Voltar"><ArrowLeft size={18} /> Voltar</Link>
      <button disabled={ocupado} onClick={() => executar('compartilhar')} title="Compartilhar arquivo PDF"><Share2 size={18} /> Compartilhar</button>
      <button disabled={ocupado} onClick={() => executar('baixar')} title="Baixar PDF ou salvar pelo menu Android"><Download size={18} /> PDF</button>
      <button disabled={ocupado} onClick={() => executar('imprimir')} title="Imprimir"><Printer size={18} /> Imprimir</button>
    </nav>
    {erro && <p role="alert">{erro}</p>}
  </div>;
}
