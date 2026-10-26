export function parseMoneyAmount(value) {
  const text = value.trim();
  let normalized;
  if (/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(text)) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+\.\d{1,2}$/.test(text)) {
    normalized = text;
  } else return 0;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 && Number.isSafeInteger(Math.round(amount * 100)) ? amount : 0;
}

