"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ListVideo, LogOut, Plus, UserRound, Building2, Images, Send, ChartNoAxesCombined, Users, Wallet, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import type { AuthSessionResponseContract } from "@/lib/models";
import { signOutFirebaseAuth } from "@/lib/firebase";
import { clearClientAuthSession } from "@/lib/session";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getAppPathname } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { APP_HOME_PATH, VIDEO_ANALYSIS_ENABLED } from "@/lib/features";

type Props = {
  session: AuthSessionResponseContract;
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

function resolveShellMeta(pathname: string, t: (source: string) => string) {
  const appPathname = getAppPathname(pathname);

  if (appPathname === "/analyses/new") {
    return t("Nova análise");
  }

  if (appPathname.startsWith("/analyses/")) {
    return t("Análise");
  }

  if (appPathname === "/analyses") {
    return t("Histórico de análises");
  }

  if (appPathname === "/profile") {
    return t("Perfil");
  }

  const titles: Record<string, string> = {"/brands":"Marcas","/library":"Biblioteca","/social-publications":"Publicações","/social-metrics":"Métricas sociais","/team":"Equipe","/usage":"Uso","/notifications":"Notificações"};
  const section = Object.keys(titles).find((path) => appPathname === path || appPathname.startsWith(`${path}/`));
  return t(section ? titles[section] : "Dashboard");
}

function ShellBrand({
  session,
}: {
  session: AuthSessionResponseContract;
}) {
  const { href } = useI18n();

  return (
    <Link
      href={href(APP_HOME_PATH)}
      className="flex items-start gap-3 rounded-[1.6rem] border border-sidebar-border bg-sidebar-accent/25 p-4 transition-colors hover:bg-sidebar-accent/45 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-[1.15rem] group-data-[collapsible=icon]:p-0"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-sidebar-border bg-background/95 p-2 shadow-sm group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:rounded-[1rem]">
        <Image
          src="/brand/logo.png"
          alt="Capyra"
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      </div>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/70">
          Capyra
        </p>
        <p className="mt-1 font-display text-lg font-semibold leading-tight text-sidebar-foreground">
          {session.account.displayName}
        </p>
      </div>
    </Link>
  );
}

function ShellNavigation({
  pathname,
  onLogout,
  session,
}: {
  pathname: string;
  onLogout: () => void;
  session: AuthSessionResponseContract;
}) {
  const { href, t } = useI18n();
  const appPathname = getAppPathname(pathname);

  const navigationItems: NavigationItem[] = [
    { href: "/brands", label: t("Marcas"), icon: Building2 },
    { href: "/library", label: t("Biblioteca"), icon: Images },
    { href: "/social-publications", label: t("Publicações"), icon: Send },
    { href: "/social-metrics", label: t("Métricas sociais"), icon: ChartNoAxesCombined },
    ...(session.user.role === "owner" ? [{ href: "/team", label: t("Equipe"), icon: Users }] : []),
    { href: "/usage", label: t("Uso"), icon: Wallet },
    { href: "/notifications", label: t("Notificações"), icon: Bell },
    ...(VIDEO_ANALYSIS_ENABLED ? [{
      href: "/dashboard",
      label: t("Dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/analyses",
      label: t("Análises"),
      icon: ListVideo,
    }] : []),
    {
      href: "/profile",
      label: t("Perfil"),
      icon: UserRound,
    },
  ];

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="group-data-[collapsible=icon]:p-3 group-data-[collapsible=icon]:[&_[data-sidebar=sidebar]]:border-sidebar-border/55"
    >
      <SidebarHeader className="gap-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <ShellBrand session={session} />
        {VIDEO_ANALYSIS_ENABLED ? <Button
          asChild
          className="w-full justify-start rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/15 hover:bg-sidebar-primary/90 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Link href={href("/analyses/new")}>
            <Plus />
            <span className="group-data-[collapsible=icon]:hidden">
              {t("Nova análise")}
            </span>
          </Link>
        </Button> : null}
      </SidebarHeader>

      <SidebarSeparator className="group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8" />

      <SidebarContent className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel>{t("Superfícies")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {navigationItems.map((item) => {
                const active =
                  appPathname === item.href ||
                  appPathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const label = t(item.label);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={label}
                      className={cn(active && "shadow-sm")}
                    >
                      <Link href={href(item.href)}>
                        <Icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <div className="rounded-[1.4rem] border border-sidebar-border bg-sidebar-accent/20 p-4 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/60">
              {t("Sessão")}
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-sidebar-foreground">
              {session.user.name}
            </p>
            <p className="truncate text-sm text-sidebar-foreground/70">
              {session.user.email}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">
              {session.account.accountType}
            </p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <Button
          type="button"
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start rounded-2xl border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <LogOut />
          <span className="group-data-[collapsible=icon]:hidden">
            {t("Sair")}
          </span>
        </Button>
      </SidebarFooter>

      <SidebarRail className="group-data-[collapsible=icon]:hidden" />
    </Sidebar>
  );
}

export function AppShell({
  session,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { href, t } = useI18n();
  const shellMeta = useMemo(() => resolveShellMeta(pathname, t), [pathname, t]);

  const handleLogout = async () => {
    await signOutFirebaseAuth();
    clearClientAuthSession();
    router.replace(href("/login"));
  };

  return (
    <SidebarProvider defaultOpen>
      <ShellNavigation
        pathname={pathname}
        onLogout={handleLogout}
        session={session}
      />

      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <SidebarTrigger
              className="border border-border bg-card shadow-sm hover:bg-accent"
              label={t("Alternar sidebar")}
            />

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-xl font-semibold text-foreground sm:text-2xl">
                {shellMeta}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LocaleToggle />
              {VIDEO_ANALYSIS_ENABLED ? <Button
                asChild
                className="hidden rounded-2xl px-4 sm:inline-flex"
              >
                <Link href={href("/analyses/new")}>
                  <Plus />
                  {t("Nova análise")}
                </Link>
              </Button> : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-2xl border-border bg-card shadow-sm"
                    onClick={handleLogout}
                  >
                    <LogOut />
                    <span className="sr-only">{t("Encerrar sessão")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Encerrar sessão")}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6">
            {session.brands.some((brand) => !brand.confirmedAt && brand.status === "active") ? <div role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm"><Link href={href("/brands")} className="font-medium underline">{t("Confirme o nome e o fuso da sua Marca para começar.")}</Link></div> : null}
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
