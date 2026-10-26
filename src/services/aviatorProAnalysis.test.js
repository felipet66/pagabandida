import { analyzeAviatorTiming } from "./aviatorProAnalysis";
const record = (dataTime, odd = "12") => ({ dataTime, odd });

test("calcula intervalo atravessando meia-noite e apresenta estimativa em Brasília", () => {
  const result = analyzeAviatorTiming([
    record("2026-10-11T03:01:00Z"), record("2026-10-11T02:59:00Z")
  ], 10, Date.parse("2026-10-11T03:02:00Z"));
  expect(result).toEqual({ count: 2, interval: "2m 00s", next: "00:03:00", nextTimestamp: Date.parse("2026-10-11T03:03:00Z"), nextDate: "11/10/2026" });
});

test("elimina timestamps repetidos e inválidos e exige odd estritamente maior", () => {
  const result = analyzeAviatorTiming([
    record("2026-10-10T22:40:00Z"), record("2026-10-10T22:40:00Z"),
    record("2026-10-10T22:42:00Z", "10"), record("inválido"), record(null),
    record("2026-10-10T22:44:00Z")
  ], 10, Date.parse("2026-10-10T22:45:00Z"));
  expect(result.count).toBe(2);
  expect(result.interval).toBe("4m 00s");
  expect(result.next).toBe("19:48:00");
});

test("não inventa horários quando há menos de duas ocorrências", () => {
  expect(analyzeAviatorTiming([], 3)).toEqual({ count: 0, interval: null, next: null });
  expect(analyzeAviatorTiming([record("2026-10-10T22:40:00Z", "4")], 3, Date.parse("2026-10-10T22:45:00Z"))).toEqual({ count: 1, interval: null, next: null });
});

test("média de intervalos irregulares usa n-1 e independe da ordem da API", () => {
  const records = [record("2026-10-10T22:47:00Z"), record("2026-10-10T22:40:00Z"), record("2026-10-10T22:43:00Z"), record("2026-10-10T22:41:00Z")];
  const now = Date.parse("2026-10-10T22:48:00Z");
  // Gaps: 60, 120, 240 seconds; average: 140 seconds.
  const result = analyzeAviatorTiming(records, 10, now);
  expect(result.interval).toBe("2m 20s");
  expect(result.nextTimestamp).toBe(Date.parse("2026-10-10T22:49:20Z"));
  expect(analyzeAviatorTiming([...records].reverse(), 10, now)).toEqual(result);
});

test("ignora odds não finitas e registros futuros para não deslocar a média", () => {
  const result = analyzeAviatorTiming([
    record("2026-10-10T22:40:00Z"), record("2026-10-10T22:42:00Z"),
    record("2026-10-10T22:41:00Z", "Infinity"), record("2026-10-10T22:41:30Z", "NaN"),
    record("2026-10-10T23:00:00Z"),
  ], 10, Date.parse("2026-10-10T22:43:00Z"));
  expect(result.count).toBe(2);
  expect(result.interval).toBe("2m 00s");
  expect(result.next).toBe("19:44:00");
});

test("limiar 3 também é estrito e estimativa preserva precisão de milissegundos", () => {
  const result = analyzeAviatorTiming([
    record("2026-10-10T22:40:00.000Z", "3"),
    record("2026-10-10T22:41:00.100Z", "3.01"), record("2026-10-10T22:41:01.600Z", "4"),
  ], 3, Date.parse("2026-10-10T22:41:01.600Z"));
  expect(result.count).toBe(2);
  expect(result.interval).toBe("0m 02s");
  expect(result.nextTimestamp).toBe(Date.parse("2026-10-10T22:41:03.100Z"));
});

test("avança intervalos sem loop e retorna próximo horário após o instante atual", () => {
  const now = Date.parse("2026-10-10T22:45:00Z");
  const result = analyzeAviatorTiming([record("2026-10-09T22:40:00Z"), record("2026-10-09T22:41:00Z")], 3, now);
  expect(result.nextTimestamp).toBe(now + 60000);
  expect(result.next).toBe("19:46:00");
});
