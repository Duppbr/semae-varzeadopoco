import DetalheMovimento from '@/components/DetalheMovimento';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <DetalheMovimento tipo="entrada" id={(await params).id} />;
}
