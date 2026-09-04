import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkDepositStatus, createDeposit } from "@/lib/payments.functions";
import { formatBRL } from "@/lib/money";

interface Props {
  minDeposit: number;
  onCredited?: () => void;
  trigger?: React.ReactNode;
}

export function DepositDialog({ minDeposit, onCredited, trigger }: Props) {
  const create = useServerFn(createDeposit);
  const check = useServerFn(checkDepositStatus);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(minDeposit || 10));
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ depositId: string; pixCode: string; amount: number } | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pix) {
      setQrImage(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(pix.pixCode, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (active) setQrImage(url);
      })
      .catch(() => {
        if (active) setQrImage(null);
      });
    return () => {
      active = false;
    };
  }, [pix]);

  useEffect(() => {
    if (!pix) return;
    timer.current = setInterval(async () => {
      try {
        const result = await check({ data: { depositId: pix.depositId } });
        if (result.status === "paid") {
          toast.success("Depósito confirmado! Saldo creditado.");
          setPix(null);
          setOpen(false);
          onCredited?.();
        }
      } catch {
        /* silencioso: continua tentando */
      }
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [pix, check, onCredited]);

  const parsedAmount = Number(amount.replace(",", "."));
  const amountError = !amount.trim()
    ? "Informe o valor do depósito."
    : !Number.isFinite(parsedAmount)
      ? "Valor inválido."
      : parsedAmount < minDeposit
        ? `O depósito mínimo é ${formatBRL(minDeposit)}.`
        : parsedAmount > 50000
          ? "Valor máximo por depósito: R$ 50.000,00."
          : Math.round(parsedAmount * 100) !== Number((parsedAmount * 100).toFixed(0))
            ? "Use no máximo 2 casas decimais."
            : null;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (amountError) {
      toast.error(amountError);
      return;
    }
    setLoading(true);
    try {
      const result = await create({ data: { amount: Number(parsedAmount.toFixed(2)) } });
      setPix({ depositId: result.depositId, pixCode: result.pixCode, amount: result.amount });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar o PIX.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPix(null);
      }}
    >
      <DialogTrigger asChild>{trigger ?? <Button>Depositar</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Depositar via PIX</DialogTitle>
          <DialogDescription>
            {pix
              ? "Escaneie o QR Code ou copie o código abaixo no app do seu banco. O saldo cai automaticamente."
              : `Depósito mínimo de ${formatBRL(minDeposit)}.`}
          </DialogDescription>
        </DialogHeader>

        {pix ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <QrCode className="size-4 text-primary" />
              Valor: <strong>{formatBRL(pix.amount)}</strong>
            </div>
            <div className="flex justify-center">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt={`QR Code PIX de ${formatBRL(pix.amount)} para depósito`}
                  className="size-56 rounded-lg border border-border bg-white p-2"
                  width={224}
                  height={224}
                />
              ) : (
                <div className="flex size-56 items-center justify-center rounded-lg border border-border bg-muted/40">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <Textarea readOnly value={pix.pixCode} rows={5} className="font-mono text-xs" />
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(pix.pixCode);
                toast.success("Código PIX copiado!");
              }}
            >
              <Copy className="mr-2 size-4" /> Copiar código PIX
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Aguardando confirmação do pagamento...
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-amount">Valor (R$)</Label>
              <Input
                id="deposit-amount"
                type="number"
                min={minDeposit}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[20, 50, 100, 200].map((value) => (
                <Button key={value} type="button" variant="secondary" size="sm" onClick={() => setAmount(String(value))}>
                  {formatBRL(value)}
                </Button>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Gerando PIX..." : "Gerar PIX"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
