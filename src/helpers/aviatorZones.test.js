import { analyzeAviatorZones } from "./aviatorZones";

const history = odds => odds.map((odd, index) => ({
  id: String(1000 - index), roundId: String(1000 - index), odd: String(odd),
  dataTime: new Date(Date.UTC(2026, 9, 15, 22) - index * 20000).toISOString(),
}));

test("usa exclusivamente as últimas 20 e 50 e exclui o resultado exato de 10x", () => {
  const odds = Array(100).fill(2);
  [2, 5, 10, 19, 20, 25, 35, 49, 50, 90].forEach(index => { odds[index] = 12; });
  odds[0] = 10;
  const source = history(odds), original = JSON.stringify(source);
  const stats = analyzeAviatorZones(source);
  expect(stats.windows[0]).toMatchObject({ size: 20, count: 4, rate: .2, zone: "hot" });
  expect(stats.windows[1]).toMatchObject({ size: 50, count: 8, rate: .16, zone: "neutral" });
  expect(stats.roundsSince).toBe(2);
  expect(JSON.stringify(source)).toBe(original);
});

test("limites de 5% e 20% são inclusivos, sem inventar percentuais para janela incompleta", () => {
  const odds = Array(50).fill(1);
  odds[0] = 15; odds[30] = 20;
  let stats = analyzeAviatorZones(history(odds));
  expect(stats.windows[0]).toMatchObject({ count: 1, rate: .05, zone: "cold" });
  expect(stats.windows[1]).toMatchObject({ count: 2, rate: .04, zone: "cold" });
  expect(stats.roundsSince).toBe(0);
  stats = analyzeAviatorZones(history(Array(49).fill(11)));
  expect(stats.windows[1]).toMatchObject({ complete: false, rate: null, zone: "unavailable", available: 49 });
  expect(analyzeAviatorZones(history(Array(50).fill(2))).roundsSince).toBeNull();
});

test("não cruza uma lacuna para completar janelas nem para encontrar a última ocorrência", () => {
  const source = history(Array(60).fill(2));
  source[30].roundId = "900";
  source[35].odd = "30";
  const stats = analyzeAviatorZones(source);
  expect(stats.available).toBe(30);
  expect(stats.interrupted).toBe(true);
  expect(stats.windows[0]).toMatchObject({ complete: true, count: 0, zone: "cold" });
  expect(stats.windows[1]).toMatchObject({ complete: false, available: 30 });
  expect(stats.roundsSince).toBeNull();
});

test.each([
  { odd: "invalid" }, { odd: null }, { roundId: "20261015_001" },
  { dataTime: "invalid" }, { dataTime: "2026-10-15T22:00:00Z" }, { roundId: "1000" },
])("interrompe sequências inválidas ou duplicadas: %j", invalid => {
  const source = history(Array(50).fill(2));
  source[1] = { ...source[1], ...invalid };
  expect(analyzeAviatorZones(source)).toMatchObject({ available: 1, interrupted: true });
});

test("amostra vazia não produz zona fria artificial", () => {
  const stats = analyzeAviatorZones();
  expect(stats.available).toBe(0);
  expect(stats.windows.every(window => window.zone === "unavailable")).toBe(true);
});
