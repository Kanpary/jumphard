import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Coins, Gamepad2, ShieldCheck, Users, Wallet, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function Landing() {
  const { user, loading } = useAuth();
  const settings = useQuery({ queryKey: ["public-settings"], queryFn: fetchPublicSettings });
  const banners = useQuery({ queryKey: ["banners", "landing"], queryFn: () => fetchBanners("landing") });

  const title = settings.data?.game?.game_title ?? "Jump Cash";
  const subtitle =
    settings.data?.game?.game_subtitle ?? "Pule, colete moedas e transforme habilidade em dinheiro real.";
  const minDeposit = Number(settings.data?.financial?.min_deposit ?? 10);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="text-lg font-black tracking-tight text-foreground">
          Jump<span className="text-primary">Cash</span>
        </span>
        <nav className="flex items-center gap-2">
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
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-8 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="size-3.5 text-accent" /> Saque via PIX em minutos
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-foreground md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">{subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
                <Link to={user ? "/jogar" : "/auth"} search={user ? {} : { mode: "register" }}>
                  {user ? "Jogar agora" : "Começar agora"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ mode: "login" }}>
                  Já tenho conta
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Depósito mínimo de R$ {minDeposit.toFixed(2)} · +18 anos · Jogue com responsabilidade.
            </p>
          </div>

          <Card className="overflow-hidden border-border/60 bg-card/70 shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-0">
              {banners.data?.[0] ? (
                <img
                  src={banners.data[0].image_url}
                  alt={banners.data[0].title ?? "Jump Cash"}
                  className="h-64 w-full object-cover md:h-80"
                  loading="lazy"
                />
              ) : (
                <div className="relative">
                  <img
                    src={gamePreview}
                    alt="Prévia animada do jogo Jump Cash com o personagem saltando entre plataformas e moedas"
                    className="h-64 w-full object-cover md:h-80"
                    width={1280}
                    height={960}
                    loading="lazy"
                  />
                  <p className="absolute bottom-0 w-full bg-background/70 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur">
                    Prévia do Jump Cash
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="text-2xl font-bold text-foreground">Como funciona</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Wallet,
                title: "1. Deposite via PIX",
                text: "Gere o QR Code copia e cola e receba o saldo automaticamente após a confirmação.",
              },
              {
                icon: Coins,
                title: "2. Jogue e colete moedas",
                text: "Cada moeda vale dinheiro. Saia da partida quando quiser para garantir o prêmio.",
              },
              {
                icon: Users,
                title: "3. Indique e ganhe",
                text: "Comissão em dois níveis sobre os depósitos das pessoas que você indicar.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/60 bg-card/70">
                <CardContent className="p-6">
                  <item.icon className="size-6 text-primary" />
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 text-center text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Pagamentos processados via PIX
          </span>
          <span>© {new Date().getFullYear()} Jump Cash. Proibido para menores de 18 anos.</span>
        </div>
      </footer>
    </div>
  );
}
