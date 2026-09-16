import PaginaDocumento from '@/components/PaginaDocumento';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PaginaDocumento tipo="descarte" id={(await params).id} />;
}
