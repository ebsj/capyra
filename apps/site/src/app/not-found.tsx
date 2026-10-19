import Link from 'next/link';

export default function RootNotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase text-brand">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-navy">Página não encontrada</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          O endereço solicitado não existe na Capyra.
        </p>
        <Link
          className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          href="/pt-br"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
