export const couponText = value => typeof value === "string" && value.trim() ? value.trim() : null;
export const couponNumber = value => value == null || String(value).trim() === "" || typeof value === "boolean" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const normalized = value => typeof value === "string" ? value.trim().toLowerCase().replace(/[ -]/g, "_") : "";
const statuses = {
  pending_requirements: "Requisitos pendentes", pending: "Pendente", awaiting_requirements: "Aguardando requisitos",
  registered: "Registrado", redeemed: "Resgatado", processing: "Em processamento", in_progress: "Em andamento",
  approved: "Aprovado", completed: "Concluído", fulfilled: "Concluído", satisfied: "Concluído", met: "Concluído",
  released: "Liberado", rewarded: "Recompensa concedida", granted: "Concedido", credited: "Creditado", claimed: "Resgatado",
  expired: "Expirado", failed: "Falhou", rejected: "Recusado", cancelled: "Cancelado", canceled: "Cancelado",
  not_started: "Não iniciado", awaiting_deposit: "Aguardando depósito", eligible: "Elegível", active: "Ativo",
  success: "Concluído", locked: "Bloqueado", available: "Disponível", pending_release: "Aguardando liberação",
};
export const couponStatus = value => statuses[normalized(value)] || "Status indisponível";
export const couponStatusTone = value => /^(released|rewarded|credited|completed|fulfilled|satisfied|met|success|granted|approved)$/.test(normalized(value)) ? "success" : /^(failed|rejected|expired|cancelled|canceled)$/.test(normalized(value)) ? "danger" : "pending";
export const couponCode = item => couponText(item?.code) || couponText(item?.couponCode) || couponText(item?.coupon?.code) || couponText(item?.redemption?.code) || "Código indisponível";
export const couponItemStatus = item => couponText(item?.status) || couponText(item?.redemption?.status);
export const couponResultStatus = data => couponItemStatus(data?.redemption) || couponItemStatus(data?.pendingReward) || couponItemStatus(data);
export const couponMoney = (value, currency = "BRL") => {
  const amount = couponNumber(value);
  if (amount == null) return "Valor não informado";
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: couponText(currency) || "BRL" }).format(amount); }
  catch { return `${amount.toLocaleString("pt-BR")} (moeda não informada)`; }
};
export function couponDate(value) {
  if (!couponText(value)) return "Data não informada";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  const raw = dateOnly ? value.trim() : value.trim().replace(" ", "T").replace(/(\.\d{3})\d+/, "$1").replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(dateOnly ? `${raw}T12:00:00-03:00` : raw);
  return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", ...(dateOnly ? {} : { timeStyle: "short" }) });
}

const typeLabels = { deposit: "Depósito", min_deposit: "Depósito mínimo", minimum_deposit: "Depósito mínimo", first_deposit: "Primeiro depósito", kyc: "Verificação da conta", verification: "Verificação da conta", wager: "Requisito de apostas", wagering: "Requisito de apostas", turnover: "Requisito de uso", registration: "Cadastro", email_verification: "Verificação de e-mail" };
export const requirementType = requirement => normalized(requirement?.type || requirement?.kind || requirement?.key);
export function couponRequirements(value) {
  if (Array.isArray(value)) return value.filter(item => item && typeof item === "object");
  if (!value || typeof value !== "object") return [];
  if (value.type || value.kind) return [value];
  return Object.entries(value).filter(([, item]) => item != null).map(([type, item]) => typeof item === "object" ? { type, ...item } : typeof item === "boolean" ? { type, completed: item } : { type, description: couponText(item) });
}
export const requirementTitle = requirement => couponText(requirement.label) || couponText(requirement.name) || typeLabels[requirementType(requirement)] || "Requisito do cupom";
export function requirementProgress(requirement) {
  const progress = requirement.progress && typeof requirement.progress === "object" ? requirement.progress : {};
  const current = couponNumber(requirement.progressAmount ?? progress.current ?? progress.currentAmount ?? requirement.current ?? requirement.currentAmount);
  const target = couponNumber(requirement.targetAmount ?? progress.target ?? progress.required ?? progress.requiredAmount ?? requirement.target ?? requirement.requiredAmount ?? requirement.minAmount);
  const explicit = couponNumber(progress.percentage ?? progress.percent ?? requirement.percentage ?? requirement.progressPercent);
  const completed = requirement.completed === true || requirement.satisfied === true || /^(completed|fulfilled|satisfied|met|success)$/.test(normalized(requirement.status));
  const percent = completed ? 100 : explicit != null ? Math.min(100, Math.max(0, explicit)) : current != null && target > 0 ? Math.min(100, Math.max(0, current / target * 100)) : null;
  const monetary = /deposit|wager|turnover/.test(requirementType(requirement));
  const format = number => monetary ? couponMoney(number, requirement.currency) : number.toLocaleString("pt-BR");
  return { completed, percent, detail: current != null && target != null ? `${format(current)} de ${format(target)}` : percent != null ? `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% concluído` : null };
}

export function couponNextAction(item) {
  const action = item?.requirementsSummary?.nextAction;
  const actionType = normalized(typeof action === "string" ? action : action?.type || action?.action || action?.key);
  const requirements = couponRequirements(item?.requirements);
  const deposit = /deposit/.test(actionType) || requirements.some(requirement => /deposit/.test(requirementType(requirement)) && !requirementProgress(requirement).completed);
  const message = couponText(action?.message) || couponText(action?.description) || couponText(action?.label)
    || (actionType === "deposit" || /deposit/.test(actionType) ? "Faça um depósito para avançar nos requisitos." : typeLabels[actionType] ? `Próxima etapa: ${typeLabels[actionType].toLowerCase()}.` : typeof action === "string" && /\s/.test(action.trim()) ? action.trim() : null);
  return { deposit, message };
}

const rewardTypes = { cash: "Saldo", cash_credit: "Crédito em saldo", balance: "Saldo", bonus: "Bônus", bonus_credit: "Crédito de bônus", free_spins: "Rodadas grátis", freespins: "Rodadas grátis", free_spins_or_free_bet: "Apostas ou rodadas grátis", cashback: "Cashback", fixed: "Valor fixo", fixed_amount: "Valor fixo", percentage: "Percentual" };
const gameName = value => ({ aviator: "Aviator", "aviator-vip": "Aviator VIP", "aviator-premium": "Aviator Premium" }[value] || value?.replace(/[-_]/g, " ").replace(/^./, first => first.toUpperCase()));
export function couponRewardDetails(detail, currency = "BRL", rewardType) {
  if (Array.isArray(detail)) return detail.flatMap(item => couponRewardDetails(item, currency, rewardType));
  if (couponText(detail)) return [{ label: "Recompensa", value: detail.trim() }];
  if (!detail || typeof detail !== "object") return [];
  const entries = [];
  const add = (label, value) => { if (value != null && value !== "") entries.push({ label, value }); };
  const kind = normalized(detail.type || detail.rewardType || rewardType);
  if (kind) add("Tipo", rewardTypes[kind] || "Recompensa do cupom");
  const amount = detail.amount ?? detail.value ?? detail.bonusAmount;
  if (couponNumber(amount) != null) add(kind === "percentage" ? "Percentual" : "Valor da recompensa", kind === "percentage" ? `${couponNumber(amount).toLocaleString("pt-BR")}%` : couponMoney(amount, detail.currency || currency));
  add("Descrição", couponText(detail.description));
  if (couponNumber(detail.freeSpins ?? detail.spins) != null) add("Rodadas grátis", couponNumber(detail.freeSpins ?? detail.spins).toLocaleString("pt-BR"));
  if (couponNumber(detail.spinValue) != null) add("Valor por rodada", couponMoney(detail.spinValue, detail.currency || currency));
  if (couponNumber(detail.quantity) != null) add("Quantidade", couponNumber(detail.quantity).toLocaleString("pt-BR"));
  if (couponNumber(detail.betAmount) != null) add("Valor por aposta/rodada", couponMoney(detail.betAmount, detail.currency || currency));
  if (couponNumber(detail.percentage) != null) add("Percentual", `${couponNumber(detail.percentage).toLocaleString("pt-BR")}%`);
  if (couponNumber(detail.maxAmount) != null) add("Limite da recompensa", couponMoney(detail.maxAmount, detail.currency || currency));
  add("Jogo", couponText(detail.gameName) || couponText(detail.game?.name) || couponText(detail.game) || gameName(couponText(detail.gameSlug)));
  add("Provedor", gameName(couponText(detail.vendorSlug)));
  if (detail.expiresAt) add("Validade", couponDate(detail.expiresAt));
  if (detail.status) add("Status da recompensa", couponStatus(detail.status));
  return entries;
}

export function couponFieldError(error) {
  const details = error?.details;
  if (Array.isArray(details)) return couponText(details.find(item => item?.field === "code" || item?.path === "code")?.message);
  return couponText(details?.code) || couponText(details?.fields?.code);
}
