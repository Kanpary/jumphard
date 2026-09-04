import type { Database } from "@/integrations/supabase/types";

type Enums = Database["public"]["Enums"];

/* ------------------------------------------------------------------ */
/* Status filters — espelham exatamente os enums do banco              */
/* ------------------------------------------------------------------ */

export type DepositStatus = Enums["deposit_status"];
export type WithdrawalStatus = Enums["withdrawal_status"];
export type CommissionStatus = Enums["commission_status"];

export type StatusFilter<T extends string> = "all" | T;

export const DEPOSIT_STATUSES: DepositStatus[] = [
  "pending",
  "paid",
  "failed",
  "rejected",
  "canceled",
];

export const WITHDRAWAL_STATUSES: WithdrawalStatus[] = [
  "pending",
  "approved",
  "processing",
  "paid",
  "rejected",
  "canceled",
];

export const COMMISSION_STATUSES: CommissionStatus[] = [
  "pending",
  "available",
  "paid",
  "canceled",
];

export const STATUS_LABELS: Record<string, string> = {
  all: "Todos",
  pending: "Pendente",
  approved: "Aprovado",
  processing: "Processando",
  paid: "Pago",
  available: "Disponível",
  failed: "Falhou",
  rejected: "Recusado",
  canceled: "Cancelado",
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export function statusTone(status: string | null | undefined): StatusTone {
  switch (status) {
    case "paid":
    case "available":
    case "approved":
      return "success";
    case "pending":
    case "processing":
      return "warning";
    case "rejected":
    case "failed":
    case "canceled":
      return "danger";
    default:
      return "neutral";
  }
}

/* ------------------------------------------------------------------ */
/* Mensagens de erro                                                   */
/* ------------------------------------------------------------------ */

export function isForbiddenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /forbidden|unauthorized|not allowed|permission|403|401/i.test(message);
}

export function friendlyError(error: unknown): string {
  if (!error) return "Ocorreu um erro inesperado.";
  const message = error instanceof Error ? error.message : String(error);
  if (isForbiddenError(error)) {
    return "Acesso restrito: sua conta não tem permissão de administrador para esta ação.";
  }
  if (/network|fetch failed|failed to fetch/i.test(message)) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }
  if (/not found|404/i.test(message)) return "Registro não encontrado.";
  return message || "Ocorreu um erro inesperado.";
}

/* ------------------------------------------------------------------ */
/* Configurações — rótulos, grupos e controles por campo               */
/* ------------------------------------------------------------------ */

export type FieldControl = "text" | "number" | "currency" | "percent" | "switch" | "url" | "select";

export type FieldMeta = {
  label: string;
  help?: string;
  control?: FieldControl;
  group?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
};

export const SETTINGS_SECTIONS = [
  {
    key: "game",
    table: "game_settings",
    label: "Jogo",
    description: "Identidade, dificuldade e economia da partida.",
    groups: ["Identidade", "Dificuldade", "Física", "Economia", "Imagens"],
  },
  {
    key: "character",
    table: "character_settings",
    label: "Personagem e áudio",
    description: "Aparência do personagem e sons do jogo.",
    groups: ["Personagem", "Áudio"],
  },
  {
    key: "financial",
    table: "financial_settings",
    label: "Financeiro",
    description: "Limites de depósito e saque, taxas e bônus.",
    groups: ["Depósitos", "Saques", "Rollover", "Bônus", "Atalhos de valor"],
  },
  {
    key: "commission",
    table: "commission_settings",
    label: "Comissões de afiliados",
    description: "Percentuais e regras do programa de indicação.",
    groups: ["Regras", "Percentuais"],
  },
  {
    key: "influencer",
    table: "influencer_settings",
    label: "Influencers",
    description: "Ajustes exclusivos para contas marcadas como influencer.",
    groups: ["Modo de cálculo", "Vantagens"],
  },
  {
    key: "onixpay",
    table: "onixpay_config",
    label: "Gateway PIX (OnixPay)",
    description: "Integração de pagamentos. Chaves secretas ficam no servidor.",
    groups: ["Status", "Endpoints"],
  },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const FIELD_META: Record<string, FieldMeta> = {
  /* --- game_settings --- */
  game_title: {
    label: "Título do jogo",
    help: "Nome exibido no topo da tela do jogo e nas telas públicas.",
    group: "Identidade",
    control: "text",
  },
  game_subtitle: {
    label: "Subtítulo do jogo",
    help: "Frase curta mostrada abaixo do título. Use para chamadas promocionais.",
    group: "Identidade",
    control: "text",
  },
  difficulty: {
    label: "Dificuldade base",
    help: "Ponto de partida da dificuldade de toda partida. Acima de 1 deixa as plataformas mais distantes e estreitas; abaixo de 1 facilita.",
    group: "Dificuldade",
    control: "number",
    step: 0.1,
  },
  difficulty_per_level: {
    label: "Acréscimo de dificuldade por nível",
    help: "Quanto a dificuldade sobe a cada nível alcançado dentro da mesma partida. 0 mantém a dificuldade constante.",
    group: "Dificuldade",
    control: "number",
    step: 0.01,
  },
  difficulty_rtp_balance: {
    label: "Equilíbrio dificuldade x RTP",
    help: "Define o que manda no ajuste da partida: valores baixos priorizam a dificuldade configurada, valores altos priorizam o RTP alvo.",
    group: "Dificuldade",
    control: "number",
    step: 0.01,
  },
  progressive_distance_multiplier: {
    label: "Multiplicador de distância progressiva",
    help: "Multiplica o aumento de distância entre plataformas conforme o jogador sobe. 1 = progressão padrão.",
    group: "Dificuldade",
    control: "number",
    step: 0.01,
  },
  game_speed: {
    label: "Velocidade do jogo",
    help: "Multiplicador da velocidade geral da partida. 1 = padrão; acima disso o jogo fica mais rápido e mais difícil.",
    group: "Física",
    control: "number",
    step: 0.1,
  },
  jump_height: {
    label: "Altura do pulo",
    help: "Multiplicador da altura do salto do personagem. Acima de 1 facilita alcançar plataformas distantes.",
    group: "Física",
    control: "number",
    step: 0.1,
  },
  spring_boost: {
    label: "Impulso da mola",
    help: "Quantas vezes o pulo normal a mola impulsiona. Ex.: 1.5 = 50% mais alto que o pulo comum.",
    group: "Física",
    control: "number",
    step: 0.1,
  },
  spring_frequency: {
    label: "Frequência de molas",
    help: "Chance de cada plataforma nascer com mola. 0.1 = aproximadamente 10% das plataformas.",
    group: "Física",
    control: "number",
    step: 0.01,
  },
  moving_platform_speed_multiplier: {
    label: "Velocidade das plataformas móveis",
    help: "Multiplica a velocidade lateral das plataformas que se movem. Acima de 1 aumenta a dificuldade.",
    group: "Física",
    control: "number",
    step: 0.1,
  },
  coin_frequency: {
    label: "Frequência de moedas",
    help: "Quantidade relativa de moedas geradas no cenário. Afeta diretamente o ritmo de ganho do jogador.",
    group: "Economia",
    control: "number",
    step: 0.01,
  },
  coin_return: {
    label: "Retorno por moeda (R$)",
    help: "Valor base convertido para o jogador a cada moeda coletada, antes dos ajustes de RTP e percentual do jogador.",
    group: "Economia",
    control: "currency",
  },
  common_player_coin_percentage: {
    label: "Percentual de moedas — jogador comum",
    help: "Percentual do valor da moeda que o jogador comum realmente recebe. 50% significa metade do retorno base.",
    group: "Economia",
    control: "percent",
  },
  rtp_global: {
    label: "RTP global",
    help: "Retorno teórico ao jogador em toda a plataforma. 90% significa que, no longo prazo, R$ 90 de cada R$ 100 apostados voltam em prêmios. Pode ser sobrescrito por jogador na aba Usuários.",
    group: "Economia",
    control: "percent",
  },
  login_banner_url: {
    label: "Banner da tela de login",
    help: "URL pública de uma imagem exibida na tela de login. Deixe vazio para não exibir banner.",
    group: "Imagens",
    control: "url",
  },
  register_banner_url: {
    label: "Banner da tela de cadastro",
    help: "URL pública de uma imagem exibida na tela de cadastro. Deixe vazio para não exibir banner.",
    group: "Imagens",
    control: "url",
  },

  /* --- character_settings --- */
  character_name: {
    label: "Nome do personagem",
    help: "Nome do personagem controlado pelo jogador, exibido nas telas do jogo.",
    group: "Personagem",
    control: "text",
  },
  character_image_url: {
    label: "Imagem do personagem",
    help: "URL pública da imagem usada como sprite do personagem. Prefira PNG com fundo transparente.",
    group: "Personagem",
    control: "url",
  },
  bg_music_enabled: {
    label: "Música de fundo ativa",
    help: "Liga ou desliga a música durante a partida para todos os jogadores.",
    group: "Áudio",
    control: "switch",
  },
  bg_music_url: {
    label: "Música de fundo (URL)",
    help: "URL pública de um arquivo de áudio (MP3/OGG) tocado em loop durante a partida.",
    group: "Áudio",
    control: "url",
  },
  jump_sound_url: {
    label: "Som de pulo (URL)",
    help: "Efeito sonoro reproduzido a cada salto do personagem.",
    group: "Áudio",
    control: "url",
  },
  land_sound_url: {
    label: "Som de aterrissagem (URL)",
    help: "Efeito sonoro reproduzido quando o personagem toca uma plataforma.",
    group: "Áudio",
    control: "url",
  },
  coin_sound_url: {
    label: "Som de moeda (URL)",
    help: "Efeito sonoro reproduzido ao coletar uma moeda.",
    group: "Áudio",
    control: "url",
  },
  spring_sound_url: {
    label: "Som da mola (URL)",
    help: "Efeito sonoro reproduzido ao usar uma mola.",
    group: "Áudio",
    control: "url",
  },

  /* --- financial_settings --- */
  pix_enabled: {
    label: "Depósitos via PIX ativos",
    help: "Desligue para bloquear a criação de novos depósitos PIX sem afetar os depósitos já gerados.",
    group: "Depósitos",
    control: "switch",
  },
  min_deposit: {
    label: "Depósito mínimo",
    help: "Menor valor aceito em um depósito PIX. O campo de valor no app usa este limite.",
    group: "Depósitos",
    control: "currency",
  },
  min_withdrawal_player: {
    label: "Saque mínimo — jogador",
    help: "Valor mínimo por solicitação de saque da carteira de jogo.",
    group: "Saques",
    control: "currency",
  },
  min_withdrawal_affiliate: {
    label: "Saque mínimo — afiliado",
    help: "Valor mínimo por solicitação de saque da carteira de comissões.",
    group: "Saques",
    control: "currency",
  },
  withdrawal_fee_percent: {
    label: "Taxa de saque (%)",
    help: "Percentual descontado do valor solicitado. Somado à taxa fixa para calcular o valor líquido.",
    group: "Saques",
    control: "percent",
  },
  withdrawal_fee_fixed: {
    label: "Taxa de saque fixa",
    help: "Valor fixo em reais descontado de cada saque, além da taxa percentual.",
    group: "Saques",
    control: "currency",
  },
  rollover_enabled: {
    label: "Rollover de depósito ativo",
    help: "Quando ativo, o jogador só consegue sacar da carteira de jogo depois de apostar o valor exigido.",
    group: "Rollover",
    control: "switch",
  },
  rollover_multiplier: {
    label: "Multiplicador de rollover (x)",
    help: "Multiplica o valor creditado no depósito. Ex.: 1 exige apostar 1x o depósito; 2 exige 2x. Pode ser sobrescrito por jogador na aba Usuários.",
    group: "Rollover",
    control: "number",
    step: 0.1,
  },
  deposit_bonus_enabled: {
    label: "Bônus de depósito ativo",
    help: "Liga o crédito automático de bônus sobre depósitos confirmados.",
    group: "Bônus",
    control: "switch",
  },
  deposit_bonus_percent: {
    label: "Percentual do bônus",
    help: "Percentual do valor depositado creditado como bônus. Ex.: 10% em um depósito de R$ 100 credita R$ 110.",
    group: "Bônus",
    control: "percent",
  },
  deposit_bonus_min_amount: {
    label: "Depósito mínimo para bônus",
    help: "Depósitos abaixo deste valor não recebem bônus.",
    group: "Bônus",
    control: "currency",
  },
  deposit_card_1: {
    label: "Atalho de valor 1",
    help: "Primeiro botão de valor rápido mostrado na tela de depósito.",
    group: "Atalhos de valor",
    control: "currency",
  },
  deposit_card_2: {
    label: "Atalho de valor 2",
    help: "Segundo botão de valor rápido mostrado na tela de depósito.",
    group: "Atalhos de valor",
    control: "currency",
  },
  deposit_card_3: {
    label: "Atalho de valor 3",
    help: "Terceiro botão de valor rápido mostrado na tela de depósito.",
    group: "Atalhos de valor",
    control: "currency",
  },
  deposit_card_4: {
    label: "Atalho de valor 4",
    help: "Quarto botão de valor rápido mostrado na tela de depósito.",
    group: "Atalhos de valor",
    control: "currency",
  },

  /* --- commission_settings --- */
  is_active: {
    label: "Programa ativo",
    help: "Desligue para parar de gerar novas comissões. Comissões já registradas continuam válidas.",
    group: "Regras",
    control: "switch",
  },
  first_deposit_only: {
    label: "Comissionar apenas o primeiro depósito",
    help: "Ativo: o afiliado ganha comissão somente no primeiro depósito de cada indicado. Desligado: ganha em todos.",
    group: "Regras",
    control: "switch",
  },
  min_deposit_for_commission: {
    label: "Depósito mínimo para gerar comissão",
    help: "Depósitos abaixo deste valor não geram comissão para o afiliado.",
    group: "Regras",
    control: "currency",
  },
  affiliate_skip_interval: {
    label: "Intervalo de dispensa entre comissões",
    help: "Quantidade de eventos ignorados entre comissões pagas. 0 comissiona todos os eventos elegíveis.",
    group: "Regras",
    control: "number",
    step: 1,
  },
  default_commission_percent: {
    label: "Comissão nível 1 (%)",
    help: "Percentual pago a quem indicou diretamente o jogador. Pode ser sobrescrito por usuário na aba Usuários.",
    group: "Percentuais",
    control: "percent",
  },
  default_commission_percent_level2: {
    label: "Comissão nível 2 (%)",
    help: "Percentual pago a quem indicou o afiliado. 0 desativa o segundo nível.",
    group: "Percentuais",
    control: "percent",
  },

  /* --- influencer_settings --- */
  influencer_calculation_mode: {
    label: "Modo de cálculo",
    help: "Define como o ganho por moeda do influencer é calculado: percentual do valor base, valor fixo por moeda ou multiplicador sobre o ganho comum.",
    group: "Modo de cálculo",
    control: "select",
    options: [
      { value: "percentage", label: "Percentual das moedas" },
      { value: "fixed", label: "Valor fixo por moeda" },
      { value: "multiplier", label: "Multiplicador de ganho" },
    ],
  },
  influencer_coin_percentage: {
    label: "Percentual de moedas — influencer",
    help: "Usado no modo Percentual: parcela do valor base da moeda recebida pelo influencer.",
    group: "Modo de cálculo",
    control: "percent",
  },
  influencer_fixed_coin_value_v2: {
    label: "Valor fixo por moeda",
    help: "Usado no modo Valor fixo: quanto o influencer recebe por moeda, independente das demais regras.",
    group: "Modo de cálculo",
    control: "currency",
  },
  gain_multiplier: {
    label: "Multiplicador de ganho",
    help: "Usado no modo Multiplicador: multiplica o ganho que um jogador comum teria na mesma partida.",
    group: "Vantagens",
    control: "number",
    step: 0.1,
  },
  influencer_double_coins_v2: {
    label: "Moedas em dobro",
    help: "Cada moeda coletada conta em dobro para o influencer.",
    group: "Vantagens",
    control: "switch",
  },
  influencer_jump_multiplier_v2: {
    label: "Multiplicador de pulo (v2)",
    help: "Ajuste adicional de altura de pulo aplicado somente a contas influencer.",
    group: "Vantagens",
    control: "number",
    step: 0.1,
  },
  jump_multiplier: {
    label: "Multiplicador de pulo",
    help: "Multiplicador de altura de pulo do influencer sobre a configuração global.",
    group: "Vantagens",
    control: "number",
    step: 0.1,
  },
  difficulty_reduction: {
    label: "Redução de dificuldade",
    help: "Quanto a dificuldade é reduzida para influencers. 0 mantém a dificuldade normal.",
    group: "Vantagens",
    control: "number",
    step: 0.01,
  },

  /* --- onixpay_config --- */
  is_enabled: {
    label: "Gateway habilitado",
    help: "Desligue para suspender a criação de cobranças e saques na OnixPay sem perder a configuração.",
    group: "Status",
    control: "switch",
  },
  api_base_url: {
    label: "URL base da API",
    help: "Endereço da API da OnixPay usado pelo servidor. Altere apenas se a OnixPay informar um novo endpoint.",
    group: "Endpoints",
    control: "url",
  },
  deposit_callback_url: {
    label: "Callback de depósito",
    help: "URL que a OnixPay chama ao confirmar um PIX. Deve apontar para o webhook público desta plataforma.",
    group: "Endpoints",
    control: "url",
  },
  withdrawal_callback_url: {
    label: "Callback de saque",
    help: "URL que a OnixPay chama ao atualizar o status de um saque.",
    group: "Endpoints",
    control: "url",
  },
};

/** Sobrescritas quando o mesmo nome de coluna existe em tabelas diferentes. */
export const FIELD_META_BY_TABLE: Record<string, FieldMeta> = {
  "onixpay_config.is_active": {
    label: "Conexão ativa",
    help: "Indica se esta configuração de conexão está em uso pelo servidor.",
    group: "Status",
    control: "switch",
  },
  "influencer_settings.coin_return": {
    label: "Retorno por moeda — influencer (R$)",
    help: "Valor por moeda aplicado somente a contas influencer, substituindo o retorno global.",
    group: "Vantagens",
    control: "currency",
  },
};

/* ------------------------------------------------------------------ */
/* Tutoriais por aba do painel                                         */
/* ------------------------------------------------------------------ */

export type TabGuide = {
  summary: string;
  steps: string[];
};

export const TAB_GUIDES: Record<string, TabGuide> = {
  overview: {
    summary: "Visão geral dos números da plataforma em tempo real.",
    steps: [
      "Acompanhe totais de usuários, depósitos confirmados, saques e comissões.",
      "Use estes indicadores para conferir se os valores batem com o saldo da sua conta OnixPay.",
      "Os cartões são apenas leitura: qualquer alteração é feita nas outras abas.",
    ],
  },
  users: {
    summary: "Cadastro, saldo e regras individuais de cada jogador.",
    steps: [
      "Busque pelo e-mail, nome ou CPF para localizar a conta.",
      "Use Creditar/Debitar para ajustar manualmente a carteira — todo ajuste fica registrado na aba Logs.",
      "Em Configurações do jogador defina RTP, rollover, dificuldade, velocidade, pulo, bônus e comissão só para aquela conta. Campos vazios usam o valor global.",
      "Marcar como influencer faz a conta usar as regras da seção Influencers nas Configurações.",
    ],
  },
  deposits: {
    summary: "Depósitos PIX gerados pelos jogadores e sua confirmação.",
    steps: [
      "Depósitos pagos pelo banco do jogador são confirmados automaticamente pelo webhook da OnixPay.",
      "Se um depósito ficar pendente, clique em Verificar na OnixPay para consultar o status real da cobrança no gateway.",
      "Aprovar só credita o jogador quando a OnixPay confirma o pagamento como PAID.",
      "Forçar crédito ignora o gateway e exige um motivo; use apenas em casos comprovados, pois fica registrado nos logs.",
    ],
  },
  withdrawals: {
    summary: "Solicitações de saque PIX dos jogadores e afiliados.",
    steps: [
      "Confira a chave PIX e o valor líquido (já com as taxas configuradas em Financeiro).",
      "Aprovar envia o pagamento pela OnixPay; recusar devolve o valor para a carteira do jogador.",
      "Saques bloqueados por rollover não chegam aqui: o jogador precisa antes concluir a exigência de apostas.",
    ],
  },
  settings: {
    summary: "Todas as regras globais do jogo, do financeiro e do gateway.",
    steps: [
      "Cada seção corresponde a um conjunto de regras; abra a seção, ajuste os campos e clique em Salvar.",
      "Passe o olho no texto abaixo de cada campo: ele explica o efeito prático da mudança.",
      "Alterações valem imediatamente para novas partidas, depósitos e saques.",
      "As chaves secretas da OnixPay ficam somente no servidor e nunca aparecem aqui.",
    ],
  },
  banners: {
    summary: "Imagens promocionais exibidas nas telas públicas.",
    steps: [
      "Informe a URL pública da imagem e escolha onde ela aparece.",
      "Use a ordem para controlar a sequência quando houver mais de um banner no mesmo lugar.",
      "Desative um banner em vez de excluí-lo se pretende reutilizá-lo depois.",
    ],
  },
  commissions: {
    summary: "Comissões geradas pelo programa de afiliados.",
    steps: [
      "Cada linha mostra o afiliado, o indicado, a origem e o status da comissão.",
      "Os percentuais e regras que geram estes valores ficam em Configurações › Comissões de afiliados.",
      "Comissões disponíveis podem ser sacadas pelo afiliado na carteira de comissões.",
    ],
  },
  logs: {
    summary: "Trilha de auditoria de todas as ações administrativas.",
    steps: [
      "Registra créditos e débitos manuais, aprovações, recusas e créditos forçados.",
      "Use para investigar divergências entre o saldo da plataforma e o da OnixPay.",
      "Os registros são somente leitura e não podem ser apagados.",
    ],
  },
};


export function fieldMeta(table: string, key: string): FieldMeta {
  const meta = FIELD_META_BY_TABLE[`${table}.${key}`] ?? FIELD_META[key];
  if (meta) return meta;
  return {
    label: key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    group: "Outros",
    control: "text",
  };
}

/* ------------------------------------------------------------------ */
/* Validação de campos do painel                                       */
/* ------------------------------------------------------------------ */

/** Valida uma URL http(s) usada em banners e imagens do painel. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Valida o valor de um campo de configuração conforme o tipo/limites do metadado. */
export function validateSettingValue(meta: FieldMeta, value: unknown): string | null {
  const control = meta.control ?? "text";
  if (control === "switch" || control === "select") return null;

  if (control === "url") {
    const raw = typeof value === "string" ? value.trim() : "";
    if (raw === "") return null;
    return isValidHttpUrl(raw) ? null : "Informe uma URL válida iniciando com https://";
  }

  if (control === "number" || control === "currency" || control === "percent") {
    if (value === null || value === "" || value === undefined) return "Campo obrigatório.";
    const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (!Number.isFinite(parsed)) return "Informe um número válido.";
    const min = meta.min ?? (control === "percent" || control === "currency" ? 0 : undefined);
    const max = meta.max ?? (control === "percent" ? 100 : undefined);
    if (min !== undefined && parsed < min) return `Valor mínimo: ${min}.`;
    if (max !== undefined && parsed > max) return `Valor máximo: ${max}.`;
    return null;
  }

  if (typeof value === "string" && value.length > 300) return "Máximo de 300 caracteres.";
  return null;
}

/** Valida um valor individual por jogador (vazio = usar configuração global). */
export function validatePlayerOverride(
  label: string,
  raw: string,
  limits?: { min?: number; max?: number },
): string | null {
  const value = raw.trim().replace(",", ".");
  if (value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `Valor inválido em "${label}".`;
  const min = limits?.min ?? 0;
  if (parsed < min) return `Valor mínimo: ${min}.`;
  if (limits?.max !== undefined && parsed > limits.max) return `Valor máximo: ${limits.max}.`;
  return null;
}
