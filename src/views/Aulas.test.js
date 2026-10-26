import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Aulas from "./Aulas";
import { trackGamification } from "../services/gamificationApi";
import { getLessons } from "../services/lessonsApi";
import cinemaCover from "../assets/img/lessons-cinema-hero.webp";
jest.mock("../services/gamificationApi", () => ({ trackGamification: jest.fn().mockResolvedValue(null) }));
jest.mock("../services/lessonsApi", () => ({ ...jest.requireActual("../services/lessonsApi"), getLessons: jest.fn() }));
jest.mock("../services/bffApi", () => ({ __esModule: true, default: { request: jest.fn() } }));

const lesson = { id: '10000000-0000-4000-8000-000000000001', title: 'Primeira aula', description: 'Texto completo da primeira aula', videoUrl: 'https://youtu.be/QsVpb6cxnCU', coverUrl: null };
beforeEach(() => {
  jest.clearAllMocks();
  getLessons.mockReset().mockResolvedValue({ items: [lesson], total: 1, hasMore: false });
});

test("catálogo não carrega player antes do clique e gancho só dispara na marcação explícita", async () => {
  render(<Aulas />);
  fireEvent.click(await screen.findByRole('button', { name: 'Assistir aula', exact: true }));
  expect(trackGamification).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: 'Primeira aula' })).toBeTruthy();
  expect(screen.getByTitle('Primeira aula').src).toBe('https://www.youtube-nocookie.com/embed/QsVpb6cxnCU');
  const button = screen.getByRole('button', { name: 'Marcar como assistida' });
  fireEvent.click(button); fireEvent.click(button);
  expect(trackGamification).toHaveBeenCalledTimes(1);
  expect(trackGamification).toHaveBeenCalledWith('lesson_watched', lesson.id);
  expect(screen.getByRole('button', { name: 'Aula marcada como assistida' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Fechar aula' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
  expect(screen.getByText('Assistida')).toBeTruthy();
});

test('player é aberto também pelo card e fechar permite retornar ao catálogo', async () => {
  render(<Aulas />);
  const card = await screen.findByRole('button', { name: 'Assistir: Primeira aula' });
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
  fireEvent.click(card);
  expect(document.querySelectorAll('iframe')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Fechar aula' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(trackGamification).not.toHaveBeenCalled();
});

test('descrição completa pode ser expandida e recolhida', async () => {
  render(<Aulas />);
  const toggle = await screen.findByRole('button', { name: 'Ver descrição' });
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(toggle);
  expect(screen.getByRole('heading', { name: 'Sobre esta aula' })).toBeTruthy();
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Ocultar descrição' }));
  expect(screen.queryByRole('heading', { name: 'Sobre esta aula' })).toBeNull();
});

test('lista vazia não usa os vídeos antigos como fallback', async () => {
  getLessons.mockResolvedValue({ items: [], total: 0, hasMore: false });
  render(<Aulas />);
  await screen.findByText('Nenhuma aula publicada por enquanto.');
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
  expect(screen.queryByRole('button', { name: 'Assistir aula' })).toBeNull();
});

test('falha tem tentativa novamente e recupera as aulas', async () => {
  getLessons.mockRejectedValueOnce(new Error('offline'));
  render(<Aulas />);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByRole('button', { name: 'Assistir: Primeira aula' });
  expect(getLessons).toHaveBeenCalledTimes(2);
});

test('contagem usa total do BFF e paginação abre a aula correta sem perder a primeira', async () => {
  getLessons.mockResolvedValueOnce({ items: [lesson], total: 2, hasMore: true })
    .mockResolvedValueOnce({ items: [{ ...lesson, id: 'second', title: 'Segunda aula', videoUrl: 'https://vimeo.com/123456' }], total: 2, hasMore: false });
  render(<Aulas />);
  fireEvent.click(await screen.findByRole('button', { name: 'Carregar mais aulas' }));
  expect(screen.getByText('2 aulas')).toBeTruthy();
  fireEvent.click(await screen.findByRole('button', { name: 'Assistir: Segunda aula' }));
  expect(screen.getByRole('button', { name: 'Assistir: Primeira aula' })).toBeTruthy();
  expect(screen.getByTitle('Segunda aula').src).toBe('https://player.vimeo.com/video/123456');
  await waitFor(() => expect(screen.queryByText('Carregar mais aulas')).toBeNull());
  expect(getLessons.mock.calls[1][0]).toBe(1);
});

test('URL externa abre com proteção e não vira iframe arbitrário', async () => {
  getLessons.mockResolvedValue({ items: [{ ...lesson, videoUrl: 'https://example.com/aula' }], total: 1, hasMore: false });
  render(<Aulas />);
  fireEvent.click(await screen.findByRole('button', { name: 'Assistir aula', exact: true }));
  const link = screen.getByRole('link', { name: 'Abrir vídeo em outra página' });
  expect(link.rel).toBe('noopener noreferrer');
  expect(link.href).toBe('https://example.com/aula');
  expect(document.querySelectorAll('iframe')).toHaveLength(0);
});

test('vídeo direto mantém controles e link externo de alternativa', async () => {
  getLessons.mockResolvedValue({ items: [{ ...lesson, videoUrl: 'https://example.com/aula.mp4' }], total: 1, hasMore: false });
  render(<Aulas />);
  fireEvent.click(await screen.findByRole('button', { name: 'Assistir aula', exact: true }));
  expect(document.querySelector('video').controls).toBe(true);
  expect(screen.getByRole('link', { name: 'Abrir vídeo em outra página' }).href).toBe('https://example.com/aula.mp4');
});

test('capa cadastrada tem prioridade e falha volta para arte local', async () => {
  getLessons.mockResolvedValue({ items: [{ ...lesson, coverUrl: 'https://example.com/capa.jpg' }], total: 1, hasMore: false });
  const { container } = render(<Aulas />);
  await screen.findByRole('button', { name: 'Assistir aula', exact: true });
  const images = [...container.querySelectorAll('img')];
  expect(images).toHaveLength(2);
  images.forEach(img => expect(img.getAttribute('src')).toBe('https://example.com/capa.jpg'));
  fireEvent.error(images[0]);
  expect(images[0].getAttribute('src')).toBe(cinemaCover);
  expect(images[1].getAttribute('src')).toBe('https://example.com/capa.jpg');
});
