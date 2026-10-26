import { summarizeRecentResults } from "./recentResultsStatistics";

const records = odds => odds.map(odd => ({ odd }));

test("classifica limites exatos sem sobreposição e calcula frequências cumulativas", () => {
  const stats = summarizeRecentResults(records([1, 1.99, 2, 5, 9.99, 10, 30, 50, 100]));
  expect(stats.bands.map(band => band.count)).toEqual([2, 3, 4]);
  expect(stats.bands.reduce((sum, band) => sum + band.percentage, 0)).toBeCloseTo(100);
  expect(stats.thresholds.map(item => item.count)).toEqual([7, 6, 4, 3, 2, 1]);
  expect(stats.thresholds.find(item => item.threshold === 10).roundsSince).toBe(5);
  expect(stats.min).toBe(1);
  expect(stats.max).toBe(100);
});

test("calcula dispersão populacional e resumos sem alterar a ordem dos resultados", () => {
  const source = records([5, 1, 1, 5]);
  const original = JSON.stringify(source);
  const stats = summarizeRecentResults(source);
  expect(stats.mean).toBe(3);
  expect(stats.median).toBe(3);
  expect(stats.range).toBe(4);
  expect(stats.standardDeviation).toBe(2);
  expect(stats.mode).toEqual(expect.arrayContaining([1, 5]));
  expect(JSON.stringify(source)).toBe(original);
});

test("conta sequência atual a partir da rodada mais recente e maiores sequências por faixa", () => {
  const stats = summarizeRecentResults(records([1, 1.5, 10, 20, 30, 2, 5, 1.2]));
  expect(stats.currentStreak).toEqual({ label: "Abaixo de 2x", count: 2 });
  expect(stats.bands.map(band => band.longestRun)).toEqual([2, 2, 3]);
  expect(stats.thresholds.find(item => item.threshold === 100).roundsSince).toBe(-1);
  expect(stats.thresholds.find(item => item.threshold === 10).roundsSince).toBe(2);
  expect(summarizeRecentResults(records([100])).thresholds[0].roundsSince).toBe(0);
});

test("amostra vazia ou inválida não produz números artificiais; uma vela tem dispersão zero", () => {
  expect(summarizeRecentResults()).toBeNull();
  expect(summarizeRecentResults(records([null, "", "abc", Infinity, 0, -1]))).toBeNull();
  const single = summarizeRecentResults(records(["2.50"]));
  expect(single.count).toBe(1);
  expect(single.mean).toBe(2.5);
  expect(single.standardDeviation).toBe(0);
  expect(single.range).toBe(0);
  expect(single.mode).toEqual([]);
});

test("dados inválidos não entram no denominador nem unem sequências separadas", () => {
  const stats = summarizeRecentResults(records([1, 1.2, "abc", 1.5, 1.8]));
  expect(stats.count).toBe(4);
  expect(stats.completeSequence).toBe(false);
  expect(stats.bands[0].percentage).toBe(100);
  expect(stats.bands[0].longestRun).toBe(2);
});
