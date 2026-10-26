import bffApi from './bffApi';
import { getLessons, videoSource } from './lessonsApi';

jest.mock('./bffApi', () => ({ __esModule: true, default: { request: jest.fn() } }));

test.each([
  ['https://youtu.be/QsVpb6cxnCU', 'https://www.youtube-nocookie.com/embed/QsVpb6cxnCU'],
  ['https://www.youtube.com/watch?v=QsVpb6cxnCU', 'https://www.youtube-nocookie.com/embed/QsVpb6cxnCU'],
  ['https://www.youtube.com/embed/QsVpb6cxnCU?si=anything', 'https://www.youtube-nocookie.com/embed/QsVpb6cxnCU'],
  ['https://vimeo.com/123456/abcdef', 'https://player.vimeo.com/video/123456?h=abcdef'],
  ['https://player.vimeo.com/video/123456?h=abcdef', 'https://player.vimeo.com/video/123456?h=abcdef'],
])('converte provedor conhecido em embed: %s', (input, expected) => {
  expect(videoSource(input)).toEqual({ type: 'embed', url: expected });
});

test('vídeos diretos usam player e sites externos usam link', () => {
  expect(videoSource('https://example.com/aula.mp4').type).toBe('file');
  expect(videoSource('https://example.com/aula').type).toBe('link');
  expect(videoSource('https://youtube.com.attacker.com/watch?v=QsVpb6cxnCU').type).toBe('link');
});

test.each(['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', null, 'invalid'])('recusa fonte insegura: %s', value => {
  expect(videoSource(value)).toBeNull();
});

test('consulta endpoint autenticado e valida envelope', async () => {
  const data = { items: [], total: 0, hasMore: false };
  bffApi.request.mockResolvedValueOnce({ data: { success: true, data } });
  expect(await getLessons(20)).toEqual(data);
  expect(bffApi.request).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'api/lessons', method: 'get', params: { limit: 20, offset: 20 } }));
  bffApi.request.mockResolvedValueOnce({ data: { success: false } });
  await expect(getLessons()).rejects.toThrow('Resposta de aulas inválida.');
});
