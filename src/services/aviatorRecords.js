import axios from "axios";
import { matchesHistoryOddFilter } from "../helpers/historyOddFilter";

const HISTORY_URL = "https://wxjldojdscizbemlpyib.supabase.co/functions/v1/aviator-history";

export async function fetchAviatorRecords(chartNumber = 1, signal, page = 1, limit = 100, candleGreaterThan) {
  if (![1, 2, 3].includes(chartNumber)) throw new Error("Versão do Aviator inválida");
  if (page !== 1) throw new Error("O histórico público oferece somente uma página de rodadas");
  const sampleLimit = Math.max(1, Math.min(1000, Math.floor(Number(limit)) || 100));
  const requestLimit = Math.max(100, sampleLimit);
  const response = await axios.get(HISTORY_URL, {
    params: { betHouse: "ganhebetbr", chartNumber, limit: requestLimit }, signal,
    headers: { Accept: "application/json" },
  });
  if (response.data?.error) {
    throw new Error(response.data?.error?.message || "Erro ao buscar histórico");
  }
  const history = response.data.data;
  if (!Array.isArray(history)) throw new Error("Histórico indisponível");
  const sampleRecords = history.filter(record => record.multiplier != null && String(record.multiplier).trim() !== "" && Number.isFinite(Number(record.multiplier)))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, requestLimit)
    .map(record => {
    const timestamp = new Date(record.timestamp);
    const validDate = record.timestamp && Number.isFinite(timestamp.getTime());
    const hour = validDate ? timestamp.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hourCycle: "h23" }) : "—";
    const date = validDate ? timestamp.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
    return { id: record.roundId, roundId: record.roundId, odd: String(record.multiplier), dataTime: record.timestamp,
      data: date, time: hour, hour, date, formattedDate: `${date} ${hour}`, betHouse: "ganhebetbr", chartNumber };
  });
  const records = sampleRecords
    .filter(record => matchesHistoryOddFilter(record.odd, candleGreaterThan))
    .slice(0, sampleLimit);
  return {
    records,
    sampleRecords,
    pagination: { page: 1, limit: sampleLimit, total: records.length, totalPages: 1 },
  };
}

export function analyzeRecords(records, threshold) {
  const hits = records.map((record, index) => ({ ...record, index })).filter(record => Number(record.odd) >= Number(threshold));
  const rows = hits.slice(0, -1).map((hit, index) => {
    const previous = hits[index + 1];
    const seconds = Math.abs(new Date(hit.dataTime) - new Date(previous.dataTime)) / 1000;
    return {
      position: previous.index - hit.index,
      intervalTime: Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s` : "—",
      odd: hit.odd,
      minutes: Number.isFinite(seconds) ? (seconds / 60).toFixed(2) : "—",
    };
  });
  const counts = rows.reduce((result, row) => { result[row.position] = (result[row.position] || 0) + 1; return result; }, {});
  const quantities = Object.entries(counts).map(([posicao, quantidade]) => ({ posicao, quantidade, porcentagem: (quantidade / rows.length * 100).toFixed(2) })).sort((a, b) => b.quantidade - a.quantidade);
  return { rows, quantities };
}

export function recordsByHour(records, threshold) {
  const counts = records.filter(record => Number(record.odd) >= threshold).reduce((result, record) => {
    const hour = record.hour?.slice(0, 2);
    if (hour) result[hour] = (result[hour] || 0) + 1;
    return result;
  }, {});
  return { oddsByHour: Object.entries(counts).sort(([a], [b]) => b.localeCompare(a)).map(([hour, count]) => ({ hour: `${hour}:00`, count })) };
}
