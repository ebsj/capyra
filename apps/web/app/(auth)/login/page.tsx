import { EmailLinkLoginForm } from "@/features/auth";

export const metadata = {
  title: "Entrar",
};

type PageProps = {
  searchParams: Promise<{
    next?: string;
    reason?: string;
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return <EmailLinkLoginForm nextHref={params.next} reason={params.reason} initialEmail={params.email} />;
}
