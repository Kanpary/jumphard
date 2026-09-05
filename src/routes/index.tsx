import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Coins, ShieldCheck, Users, Wallet } from "lucide-react";

import { PageMain, PageShell, TopBar } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchBanners, fetchPublicSettings } from "@/lib/settings";
import gamePreview from "@/assets/jumpcash-preview.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jump Cash | Jogue o Jump Cash e saque via PIX" },
      {
        name: "description",
        content:
          "Deposite via PIX, jogue o Jump Cash, colete moedas e saque seus ganhos na hora. Programa de afiliados com comissão em dois níveis.",
      },
      { property: "og:title", content: "Jump Cash | Jogue o Jump Cash e saque via PIX" },
      {
        property: "og:description",
        content: "Depósito e saque via PIX, jogo de habilidade e comissões de afiliado em dois níveis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Wallet,
    title: "Deposite via PIX",
    text: "Gere o QR Code ou copia e cola e receba o saldo após a confirmação.",
  },
  {
    icon: Coins,
    title: "Jogue e colete moedas",
    text: "Cada moeda vale dinheiro. Saia da partida quando quiser para garantir o prêmio.",
  },
  {
    icon: Users,
    title: "Indique e ganhe",
    text: "Comissão em dois níveis sobre os depósitos de quem você indicar.",
  },
];

function Landing() {
  const { user, loading } = useAuth();
  const settings = useQuery({ queryKey: ["public-settings"], queryFn: fetchPublicSettings });
  const banners = useQuery({ queryKey: ["banners", "landing"], queryFn: () => fetchBanners("landing") });

  const title = settings.data?.game?.game_title ?? "Jump Cash";
  const subtitle =
    settings.data?.game?.game_subtitle ?? "Pule, colete moedas e transforme habilidade em dinheiro real.";
  const minDeposit = Number(settings.data?.financial?.min_deposit ?? 10);
  const banner = banners.data?.[0];

  return (
    <PageShell>
      <TopBar>
        {!loading && user ? (
          <Button asChild size="sm">
            <Link to="/dashboard">Minha conta</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ mode: "login" }}>
                Entrar
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "register" }}>
                Criar conta
              </Link>
            </Button>
          </>
        )}
      </TopBar>

      <PageMain className="pt-8">
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              Saque via PIX em minutos
            </span>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">{subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to={user ? "/jogar" : "/auth"} search={user ? {} : { mode: "register" }}>
                  {user ? "Jogar agora" : "Começar agora"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth" search={{ mode: "login" }}>
                  Já tenho conta
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Depósito mínimo de R$ {minDeposit.toFixed(2)} · +18 anos · Jogue com responsabilidade.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <img
              src={banner?.image_url ?? gamePreview}
              alt={banner?.title ?? "Prévia do jogo Jump Cash com o personagem saltando entre plataformas e moedas"}
              className="h-56 w-full object-cover sm:h-72"
              width={1280}
              height={960}
              loading="lazy"
              decoding="async"
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Como funciona</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <li key={item.title} className="rounded-xl border border-border bg-card p-5">
                <item.icon className="size-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {index + 1}. {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </PageMain>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1.5 px-4 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Pagamentos processados via PIX
          </span>
          <span>© {new Date().getFullYear()} Jump Cash. Proibido para menores de 18 anos.</span>
        </div>
      </footer>
    </PageShell>
  );
}
