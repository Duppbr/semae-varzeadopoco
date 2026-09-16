'use client';
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="p-6 max-w-xl mx-auto space-y-4">
    <h1 className="text-xl font-bold">Não foi possível carregar os dados</h1>
    <p>Verifique a conexão e tente novamente. Se persistir, informe o código abaixo ao suporte.</p>
    {error.digest && <p>Código: {error.digest}</p>}
    <button onClick={retry} className="px-4 py-2 bg-blue-700 text-white rounded-lg">Tentar novamente</button>
  </main>;
}
