import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/** Marca do produto, usada no topo de todas as páginas. */
export function BrandMark({ to = "/" as const }: { to?: "/" }) {
  return (
    <Link to={to} className="inline-flex items-baseline text-base font-semibold tracking-tight text-foreground">
      Jump<span className="text-primary">Cash</span>
    </Link>
  );
}

/** Barra superior fixa em largura, com marca à esquerda e ações à direita. */
export function TopBar({ left, children }: { left?: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-b border-border/70 bg-background/95">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">{left ?? <BrandMark />}</div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

/** Container padrão de conteúdo das páginas. */
export function PageMain({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return <main className={cn("mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6", className)}>{children}</main>;
}

/** Casca da página: fundo, cabeçalho e conteúdo. */
export function PageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}

/** Título de seção com espaçamento consistente. */
export function SectionTitle({ title, description }: { title: string; description?: string | undefined }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
