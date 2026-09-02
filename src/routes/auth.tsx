import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { checkAvailability, registerPlayer } from "@/lib/auth.functions";
import { formatCPF, formatPhone, isValidCPF, onlyDigits } from "@/lib/money";


type Mode = "login" | "register";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: "login" | "register"; ref?: string } => {
    const mode = search["mode"] === "register" ? ("register" as const) : ("login" as const);
    const ref = typeof search["ref"] === "string" ? search["ref"] : null;
    return ref ? { mode, ref } : { mode };
  },
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | Jump Cash" },
      {
        name: "description",
        content:
          "Acesse sua conta Jump Cash ou cadastre-se em segundos para depositar via PIX e jogar o Jump Cash.",
      },
      { property: "og:title", content: "Entrar ou criar conta | Jump Cash" },
      { property: "og:description", content: "Login e cadastro da plataforma Jump Cash." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

function AuthPage() {
  const { mode, ref } = Route.useSearch();
  const navigate = useNavigate();
  const register = useServerFn(registerPlayer);
  const check = useServerFn(checkAvailability);

  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [remote, setRemote] = useState<{
    emailTaken: boolean | null;
    cpfTaken: boolean | null;
    referralValid: boolean | null;
  }>({ emailTaken: null, cpfTaken: null, referralValid: null });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    referralCode: ref ?? "",
  });

  const isRegister: boolean = mode === "register";

  const set =
    (key: keyof typeof form, mask?: (value: string) => string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      setForm((prev) => ({ ...prev, [key]: mask ? mask(raw) : raw }));
    };

  const blur = (key: string) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  // Consulta em tempo real (com debounce) se e-mail/CPF já existem e se o código de indicação é válido.
  useEffect(() => {
    if (!isRegister) return;
    const email = form.email.trim().toLowerCase();
    const cpf = onlyDigits(form.cpf);
    const code = form.referralCode.trim().toUpperCase();
    if (!EMAIL_RE.test(email) && cpf.length !== 11 && !code) {
      setRemote({ emailTaken: null, cpfTaken: null, referralValid: null });
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const result = await check({
          data: {
            email: EMAIL_RE.test(email) ? email : null,
            cpf: cpf.length === 11 ? cpf : null,
            referralCode: code || null,
          },
        });
        if (active) setRemote(result);
      } catch {
        /* consulta opcional: falha não bloqueia o cadastro */
      }
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isRegister, form.email, form.cpf, form.referralCode, check]);

  const errors = useMemo(() => {
    const out: Partial<Record<keyof typeof form, string>> = {};
    const email = form.email.trim();
    if (!email) out.email = "Informe seu e-mail.";
    else if (!EMAIL_RE.test(email)) out.email = "E-mail inválido.";
    else if (isRegister && remote.emailTaken) out.email = "Este e-mail já está cadastrado.";

    if (!form.password) out.password = "Informe sua senha.";
    else if (isRegister && form.password.length < 6)
      out.password = "A senha precisa de pelo menos 6 caracteres.";

    if (isRegister) {
      if (form.fullName.trim().length < 3) out.fullName = "Informe seu nome completo.";
      const cpf = onlyDigits(form.cpf);
      if (cpf.length !== 11) out.cpf = "O CPF deve ter 11 dígitos.";
      else if (!isValidCPF(cpf)) out.cpf = "CPF inválido.";
      else if (remote.cpfTaken) out.cpf = "Já existe uma conta com este CPF.";

      const phone = onlyDigits(form.phone);
      if (phone.length < 10 || phone.length > 11) out.phone = "Telefone inválido com DDD.";

      if (form.referralCode.trim() && remote.referralValid === false)
        out.referralCode = "Código de indicação não encontrado.";
    }
    return out;
  }, [form, isRegister, remote]);

  const hasErrors = Object.keys(errors).length > 0;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (hasErrors) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setTouched({
      fullName: true,
      cpf: true,
      phone: true,
      email: true,
      password: true,
      referralCode: true,
    });
    if (hasErrors) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setLoading(true);
    try {
      await register({
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          cpf: onlyDigits(form.cpf),
          phone: onlyDigits(form.phone),
          referralCode: form.referralCode.trim() || null,
        },
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw new Error(error.message);
      toast.success("Conta criada com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  const errorOf = (key: keyof typeof form) => (touched[key] ? errors[key] : undefined);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-5 py-10"
      style={{ background: "var(--gradient-hero)" }}
    >
      <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <Link to="/" className="text-sm font-black tracking-tight text-foreground">
            Jump<span className="text-primary">Cash</span>
          </Link>
          <CardTitle className="pt-2 text-2xl">{isRegister ? "Criar conta" : "Entrar"}</CardTitle>
          <CardDescription>
            {isRegister
              ? "Preencha seus dados para começar a jogar e sacar via PIX."
              : "Acesse sua conta para depositar, jogar e sacar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" noValidate onSubmit={isRegister ? handleRegister : handleLogin}>
            {isRegister ? (
              <>
                <Field
                  id="fullName"
                  label="Nome completo"
                  value={form.fullName}
                  onChange={set("fullName")}
                  onBlur={blur("fullName")}
                  autoComplete="name"
                  error={errorOf("fullName")}
                />
                <Field
                  id="cpf"
                  label="CPF"
                  value={form.cpf}
                  onChange={set("cpf", (v) => formatCPF(onlyDigits(v).slice(0, 11)))}
                  onBlur={blur("cpf")}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  error={errorOf("cpf")}
                />
                <Field
                  id="phone"
                  label="Telefone"
                  value={form.phone}
                  onChange={set("phone", (v) => formatPhone(onlyDigits(v).slice(0, 11)))}
                  onBlur={blur("phone")}
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  error={errorOf("phone")}
                />
              </>
            ) : null}
            <Field
              id="email"
              label="E-mail"
              type="email"
              value={form.email}
              onChange={set("email", (v) => v.replace(/\s/g, ""))}
              onBlur={blur("email")}
              inputMode="email"
              autoComplete="email"
              error={errorOf("email")}
            />
            <Field
              id="password"
              label="Senha"
              type="password"
              value={form.password}
              onChange={set("password")}
              onBlur={blur("password")}
              autoComplete={isRegister ? "new-password" : "current-password"}
              error={errorOf("password")}
              hint={isRegister ? "Mínimo de 6 caracteres." : undefined}
            />
            {isRegister ? (
              <Field
                id="referralCode"
                label="Código de indicação (opcional)"
                value={form.referralCode}
                onChange={set("referralCode", (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32))}
                onBlur={blur("referralCode")}
                error={errorOf("referralCode")}
                hint={
                  form.referralCode.trim() && remote.referralValid ? "Código válido." : undefined
                }
              />
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
            <Link
              to="/auth"
              search={{ mode: isRegister ? "login" : "register" }}
              className="font-medium text-primary hover:underline"
            >
              {isRegister ? "Entrar" : "Criar agora"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  ...props
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={Boolean(error)} {...props} />
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

