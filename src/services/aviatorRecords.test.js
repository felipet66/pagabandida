import axios from "axios";
import { fetchAviatorRecords, analyzeRecords, recordsByHour } from "./aviatorRecords";
jest.mock("axios", () => ({ get: jest.fn() }));
const raw = [
  { roundId: "a", multiplier: 12, timestamp: "2026-10-10T17:33:19Z" },
  { roundId: "b", multiplier: 2.5, timestamp: "2026-10-10T17:32:59Z" },
  { roundId: "c", multiplier: 10, timestamp: "2026-10-10T17:32:19Z" },
];
beforeEach(() => axios.get.mockReset().mockResolvedValue({ data: { data: raw } }));

test.each([1, 2, 3])("consulta chartNumber %s sem sessão ou chave do BFF e adapta os horários", async chartNumber => {
  const signal = new AbortController().signal;
  const { records, pagination } = await fetchAviatorRecords(chartNumber, signal);
  const [url, config] = axios.get.mock.calls[0];
  expect(new URL(url).pathname).toBe("/functions/v1/aviator-history");
  expect(config).toEqual({ params: { betHouse: "ganhebetbr", chartNumber, limit: 100 }, signal, headers: { Accept: "application/json" } });
  expect(records[0]).toMatchObject({ id: "a", odd: "12", hour: "14:33:19", date: "10/10/2026", dataTime: raw[0].timestamp });
  expect(pagination.totalPages).toBe(1);
});

test("análises e contagem por hora continuam usando o formato adaptado", async () => {
  const { records } = await fetchAviatorRecords(1);
  const result = analyzeRecords(records, 10);
  expect(result.rows).toEqual([{ position: 2, intervalTime: "1m 0s", odd: "12", minutes: "1.00" }]);
  expect(result.quantities).toEqual([{ posicao: "2", quantidade: 1, porcentagem: "100.00" }]);
  expect(recordsByHour(records, 10)).toEqual({ oddsByHour: [{ hour: "14:00", count: 2 }] });
  expect(analyzeRecords([], 10)).toEqual({ rows: [], quantities: [] });
});

test("formato inesperado é erro visível, sem tratar como histórico vazio", async () => {
  axios.get.mockResolvedValue({ data: { data: {} } });
  await expect(fetchAviatorRecords(1)).rejects.toThrow("Histórico indisponível");
});

test("ordena resultados e converte UTC para São Paulo inclusive na mudança de dia", async () => {
  axios.get.mockResolvedValue({ data: { data: [
    { roundId: "early", multiplier: 3, timestamp: "2026-10-10T01:30:00Z" },
    { roundId: "late", multiplier: 2, timestamp: "2026-10-10T22:45:00Z" },
  ] } });
  const result = await fetchAviatorRecords(1, undefined, 1, 1);
  expect(result.records).toHaveLength(1);
  expect(result.records[0].hour).toBe("19:45:00");
  const { records } = await fetchAviatorRecords(1);
  expect(records[1].hour).toBe("22:30:00");
  expect(records[1].date).toBe("09/10/2026");
});

test("filtra ODD > 10 localmente em uma janela mínima de 100 rodadas", async () => {
  const result = await fetchAviatorRecords(2, undefined, 1, 50, 10);
  expect(result.records.map(item => item.id)).toEqual(["a"]);
  expect(result.sampleRecords.map(item => item.id)).toEqual(["a", "b", "c"]);
  expect(axios.get.mock.calls[0][1].params).toEqual({ betHouse: "ganhebetbr", chartNumber: 2, limit: 100 });
});

test.each([
  ["blue", ["1", "1.99"]],
  ["purple", ["2", "2.01", "9.99"]],
  ["pink", ["10", "10.01", "100"]],
  [10, ["10.01", "100"]],
  [undefined, ["1", "1.99", "2", "2.01", "9.99", "10", "10.01", "100"]],
])("filtro %s respeita os limites de cor e preserva a amostra completa", async (filter, expected) => {
  const values = [1, 1.99, 2, 2.01, 9.99, 10, 10.01, 100];
  axios.get.mockResolvedValue({ data: { data: values.map((multiplier, index) => ({
    roundId: `boundary-${index}`, multiplier,
    timestamp: new Date(Date.UTC(2026, 9, 10) - index * 20000).toISOString(),
  })) } });
  const result = await fetchAviatorRecords(3, undefined, 1, 10, filter);
  expect(result.records.map(record => record.odd)).toEqual(expected);
  expect(result.sampleRecords.map(record => record.odd)).toEqual(values.map(String));
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get.mock.calls[0][1].params).toEqual({ betHouse: "ganhebetbr", chartNumber: 3, limit: 100 });
});

test("amostra sem filtro preserva pelo menos 50 rodadas mesmo com só 10 velas visíveis", async () => {
  axios.get.mockResolvedValue({ data: { data: Array.from({ length: 100 }, (_, index) => ({
    roundId: String(500 - index), multiplier: index % 10 === 0 ? 15 : 1.5,
    timestamp: new Date(Date.UTC(2026, 9, 15, 22) - index * 20000).toISOString(),
  })) } });
  const result = await fetchAviatorRecords(1, undefined, 1, 10, 10);
  expect(result.records).toHaveLength(10);
  expect(result.sampleRecords).toHaveLength(100);
  expect(result.sampleRecords.filter(record => Number(record.odd) < 2)).toHaveLength(90);
  expect(axios.get).toHaveBeenCalledTimes(1);
});

test("não inventa versões ou páginas que o endpoint não suporta", async () => {
  await expect(fetchAviatorRecords(4)).rejects.toThrow("Versão");
  await expect(fetchAviatorRecords(1, undefined, 2)).rejects.toThrow("uma página");
  expect(axios.get).not.toHaveBeenCalled();
});

test("ignora multiplicadores ausentes e inválidos e preserva histórico vazio", async () => {
  axios.get.mockResolvedValue({ data: { data: [...raw, { multiplier: null }, { multiplier: "" }, { multiplier: "invalid" }] } });
  expect((await fetchAviatorRecords(1)).records).toHaveLength(3);
  axios.get.mockResolvedValue({ data: { data: [] } });
  expect((await fetchAviatorRecords(1)).records).toEqual([]);
});

test.each([200, 500, 1000])("consulta e preserva %s rodadas sem truncar em 100", async limit => {
  const history = Array.from({ length: 1200 }, (_, index) => ({
    roundId: `round-${index}`, multiplier: 2,
    timestamp: new Date(Date.UTC(2026, 9, 10) + index * 20000).toISOString(),
  }));
  axios.get.mockResolvedValue({ data: { data: history } });
  const result = await fetchAviatorRecords(1, undefined, 1, limit);
  expect(axios.get.mock.calls[0][1].params.limit).toBe(limit);
  expect(result.records).toHaveLength(limit);
  expect(result.records[0].roundId).toBe("round-1199");
  expect(result.records[limit - 1].roundId).toBe(`round-${1200 - limit}`);
  expect(result.pagination.limit).toBe(limit);
});

test("filtro considera rodadas além da centésima na janela selecionada", async () => {
  const history = Array.from({ length: 501 }, (_, index) => ({
    roundId: `round-${index}`, multiplier: index === 350 || index === 500 ? 20 : 2,
    timestamp: new Date(Date.UTC(2026, 9, 10) - index * 20000).toISOString(),
  }));
  axios.get.mockResolvedValue({ data: { data: history } });
  const result = await fetchAviatorRecords(2, undefined, 1, 500, 10);
  expect(axios.get.mock.calls[0][1].params).toEqual({ betHouse: "ganhebetbr", chartNumber: 2, limit: 500 });
  expect(result.records.map(record => record.roundId)).toEqual(["round-350"]);
});
