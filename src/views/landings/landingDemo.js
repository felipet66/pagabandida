// Public, deterministic demonstration data. Never includes customer or live game data.
export const DEMO_TIME = Date.parse('2026-10-15T15:00:00Z');
const sampleOdds = [1.24, 3.62, 12.48, 1.08, 2.17, 1.53, 28.96, 4.21, 1.02, 7.85,
  2.43, 1.16, 3.62, 51.24, 1.88, 2.06, 1.31, 14.07, 3.04, 1.09];
export function getDemoRecords(version = 0) {
  return Array.from({ length: 100 }, (_, index) => {
    const timestamp = DEMO_TIME - (index + 1) * 17000;
    const date = new Date(timestamp);
    return {
      id: `demo-${version}-${index}`, roundId: `D${100 - index}`,
      odd: sampleOdds[(index + version * 5) % sampleOdds.length],
      dataTime: date.toISOString(), formattedDate: '15/10/2026 · amostra demonstrativa',
      hour: date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23' }),
    };
  });
}
