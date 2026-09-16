import PaginaDocumento from '@/components/PaginaDocumento';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PaginaDocumento tipo="pedido-compra" id={(await params).id} />;
}
