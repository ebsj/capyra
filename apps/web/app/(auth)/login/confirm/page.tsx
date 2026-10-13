import { EmailLinkConfirmForm } from "@/features/auth";

export const metadata = {
  title: "Confirmar acesso",
};

type PageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return <EmailLinkConfirmForm nextHref={params.next} />;
}
