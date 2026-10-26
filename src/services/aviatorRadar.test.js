import { advanceRadar, calculateRadarSchedule, createRadarState, normalizeRadarRecords, radarCountdown } from "./aviatorRadar";

const NOW = Date.parse("2026-10-19T13:00:00Z");
const round = (id, odd, offset = 0) => ({ id: String(id), odd: String(odd), dataTime: new Date(NOW + offset).toISOString() });
const history = () => [round(1, 6, -180000), round(2, 8, -120000), round(3, 12, 0)];

test("matches the radar's upper median, >5x reference and 150 second window", () => {
  const rows = normalizeRadarRecords([round(1, 6, -300000), round(2, 8, -240000), round(3, 5, -60000), round(4, 10)], NOW);
  const schedule = calculateRadarSchedule(rows, NOW);
  // Two intervals: 60s and 240s. The source selects the upper middle (240s).
  expect(schedule.medianIntervalMs).toBe(240000);
  expect(schedule.occurrenceCount).toBe(3);
  expect(schedule.projectedAtMs).toBe(NOW + 240000);
  expect(schedule.windowEndMs).toBe(NOW + 390000);
});

test("requires three occurrences and the current round above 5x", () => {
  expect(advanceRadar(createRadarState(), [round(1, 8, -30000), round(2, 6)], NOW).state.window).toBeNull();
  expect(advanceRadar(createRadarState(), [...history(), round(4, 5, 1000)], NOW + 1000).state.window).toBeNull();
  expect(advanceRadar(createRadarState(), [...history(), round(4, 4.5, 1000)], NOW + 1000).state.window).toBeNull();
});

test("limits the sample to 100 rounds, deduplicates IDs and rejects invalid/future rows", () => {
  const rows = Array.from({ length: 110 }, (_, index) => round(index + 1, index < 3 ? 10 : 2, (index - 109) * 1000));
  const clean = normalizeRadarRecords([...rows, rows[109], round(999, 99, 1000), { id: "bad", odd: "invalid", dataTime: "invalid" }], NOW);
  expect(clean).toHaveLength(100);
  expect(clean[0].id).toBe("11");
  expect(clean[99].id).toBe("110");
  expect(calculateRadarSchedule(clean, NOW)).toBeNull();
});

test("rejects delayed triggers and uses the exact 60s freshness boundary", () => {
  const stale = history().map(row => ({ ...row, dataTime: new Date(new Date(row.dataTime).getTime() - 60001).toISOString() }));
  const result = advanceRadar(createRadarState(), stale, NOW);
  expect(result.feedStatus).toBe("stale");
  expect(result.state.window).toBeNull();
  const boundary = stale.map(row => ({ ...row, dataTime: new Date(new Date(row.dataTime).getTime() + 1).toISOString() }));
  expect(advanceRadar(createRadarState(), boundary, NOW).state.window).not.toBeNull();
});

test("keeps one stable window across repeated polls and additional >5x before its start", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  expect(first.state.window.projectedAtMs).toBe(NOW + 120000);
  const second = advanceRadar(first.state, [...history(), round(4, 15, 20000)], NOW + 20000);
  expect(second.state.window).toBe(first.state.window);
  expect(advanceRadar(second.state, [...history(), round(4, 15, 20000)], NOW + 25000).state.window).toBe(first.state.window);
});

test("processes intervening >5x in a new batch even if the latest round is low", () => {
  const baseline = advanceRadar(createRadarState(), [...history().slice(0, 2), round(3, 2, -10000)], NOW - 10000);
  const next = advanceRadar(baseline.state, [...history().slice(0, 2), round(3, 2, -10000), round(4, 9), round(5, 2, 20000)], NOW + 20000);
  expect(next.state.window.triggerId).toBe("4");
});

test("a target hit inside the window confirms green without reusing that round as a trigger", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const records = [...history(), round(4, 8, 120000)];
  const closed = advanceRadar(first.state, records, NOW + 120000);
  expect(closed.state.window).toBeNull();
  expect(closed.state.lastOutcome).toMatchObject({ status: "GREEN", odd: 8, roundId: "4", occurredAt: NOW + 120000 });
  expect(advanceRadar(closed.state, records, NOW + 125000).state.window).toBeNull();
  expect(advanceRadar(closed.state, [...records, round(5, 8, 140000)], NOW + 140000).state.window.triggerId).toBe("5");
});

test("elapsed wall time without new data waits for confirmation and never invents a red", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const expired = advanceRadar(first.state, history(), NOW + 300000);
  expect(expired.state.window.id).toBe(first.state.window.id);
  expect(expired.state.lastOutcome).toBeNull();
  expect(advanceRadar(expired.state, [], NOW + 310000).state.lastOutcome).toBeNull();
});

test("a delayed batch resolves the old window before considering subsequent triggers", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const closed = advanceRadar(first.state, [...history(), round(4, 8, 250000), round(5, 2, 280000)], NOW + 280000);
  expect(closed.state.window).toBeNull();
  expect(closed.state.lastOutcome.status).toBe("GREEN");
});

test("empty input is distinct from a valid fresh feed and countdown never goes negative", () => {
  expect(advanceRadar(createRadarState(), [], NOW).feedStatus).toBe("empty");
  expect(radarCountdown(NOW + 61500, NOW)).toBe("01:02");
  expect(radarCountdown(NOW - 1, NOW)).toBe("00:00");
});

test.each([4, 4.5, 5, 12])("%sx confirms green at the lower target, including results above 5x", odd => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const result = advanceRadar(first.state, [...history(), round(4, odd, 130000)], NOW + 130000);
  expect(result.state.lastOutcome).toMatchObject({ id: first.state.window.id, status: "GREEN", odd, roundId: "4" });
  expect(result.state.window).toBeNull();
  const repeated = advanceRadar(result.state, [...history(), round(4, odd, 130000)], NOW + 135000);
  expect(repeated.state.lastOutcome).toBe(result.state.lastOutcome);
});

test.each([120000, 270000])("a hit exactly at the %sms boundary belongs to the window", offset => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  expect(advanceRadar(first.state, [...history(), round(4, 4, offset)], NOW + offset).state.lastOutcome.status).toBe("GREEN");
});

test("hits before or after the window do not produce green", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const before = advanceRadar(first.state, [...history(), round(4, 4, 119999)], NOW + 119999);
  expect(before.state.lastOutcome).toBeNull();
  const after = advanceRadar(before.state, [...history(), round(4, 4, 119999), round(5, 4, 270001)], NOW + 270001);
  expect(after.state.lastOutcome.status).toBe("NO_DATA");
});

const lowWindow = () => [120000, 150000, 180000, 220000, 260000].map((offset, index) => round(index + 4, 3.99, offset));
test("red needs at least five observed rounds and a result after the deadline", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const pending = advanceRadar(first.state, [...history(), ...lowWindow()], NOW + 280000);
  expect(pending.state.window).toBeTruthy();
  expect(pending.state.lastOutcome).toBeNull();
  const records = [...history(), ...lowWindow(), round(9, 2, 280000)];
  const red = advanceRadar(pending.state, records, NOW + 280000);
  expect(red.state.window).toBeNull();
  expect(red.state.lastOutcome).toMatchObject({ status: "RED", odd: null, roundCount: 5 });
  expect(advanceRadar(red.state, records, NOW + 285000).state.lastOutcome).toBe(red.state.lastOutcome);
});

test("too few rounds or missing coverage is inconclusive, never red", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  expect(advanceRadar(first.state, [...history(), ...lowWindow().slice(0, 2), round(10, 2, 280000)], NOW + 280000).state.lastOutcome.status).toBe("NO_DATA");
  // A disconnected client returns after the history has lost the beginning of the window.
  const gap = advanceRadar(first.state, [...lowWindow().map((row, index) => ({ ...row, dataTime: new Date(NOW + 150000 + index * 25000).toISOString() })), round(10, 2, 280000)], NOW + 280000);
  expect(gap.state.lastOutcome).toMatchObject({ status: "NO_DATA", coverageLost: true, roundCount: 5 });
});

test("positive evidence still confirms a green even when some of the history is missing", () => {
  const first = advanceRadar(createRadarState(), history(), NOW);
  const result = advanceRadar(first.state, [round(20, 6, 200000)], NOW + 200000);
  expect(result.state.lastOutcome).toMatchObject({ status: "GREEN", odd: 6, coverageLost: true });
});
