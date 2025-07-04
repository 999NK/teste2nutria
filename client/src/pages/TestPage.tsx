export default function TestPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Roteamento</h1>
      <p>Se você está vendo esta página, o roteamento está funcionando!</p>
      <div className="mt-4">
        <a href="/my-plan" className="text-blue-500 hover:underline">
          Ir para Meu Plano
        </a>
      </div>
    </div>
  );
}