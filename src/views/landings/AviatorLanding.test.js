import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import AviatorLanding from './AviatorLanding';

jest.mock('hooks/useTrackingParams', () => jest.fn());
jest.mock('react-slick', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ slickPause: jest.fn(), slickPlay: jest.fn() }));
    return <div>{props.children}</div>;
  });
});
beforeEach(() => {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn(), addListener: jest.fn(), removeListener: jest.fn() }));
});
function open(variant) {
  return render(<MemoryRouter initialEntries={[`/lp/${variant}`]}><Route path="/lp/:variant"><AviatorLanding /></Route></MemoryRouter>);
}

test('quiz completes, uses preferences, supports back and restart', () => {
  open('quiz');
  fireEvent.click(screen.getByRole('button', { name: /Entender o histórico/ }));
  expect(screen.getByText('2 de 3')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(screen.getByText('1 de 3')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Trocar ideias/ }));
  fireEvent.click(screen.getByRole('button', { name: /Falta gente/ }));
  fireEvent.click(screen.getByRole('button', { name: /Comunidade para comparar/ }));
  expect(screen.getByRole('heading', { name: 'Conheça a comunidade.' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /Criar conta e explorar/ }).getAttribute('href')).toBe('https://go.ganhebetbr.com/c/7ul');
  fireEvent.click(screen.getByRole('button', { name: 'Refazer quiz' }));
  expect(screen.getByText('1 de 3')).toBeTruthy();
});

test.each(['analise', 'comunidade'])('%s uses product components and a real registration CTA', variant => {
  open(variant);
  expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Histórico de velas' })).toBeTruthy();
  expect(screen.getByRole('link', { name: variant === 'analise' ? 'Criar conta e acessar o app' : 'Criar conta na ganhebetBR' }).getAttribute('href')).toBe('https://go.ganhebetbr.com/c/7ul');
  expect(screen.getByText('Amostra demonstrativa')).toBeTruthy();
});

test('history demo supports real odds filters, versions, stats and candle selection', () => {
  open('analise');
  let history = screen.getByRole('region', { name: 'Histórico de velas' });
  expect(history.querySelectorAll('.aviator-candle')).toHaveLength(10);
  fireEvent.click(screen.getByRole('combobox', { name: 'Filtrar odds' }));
  fireEvent.click(screen.getByRole('option', { name: 'ODD > 10', exact: true }));
  expect([...history.querySelectorAll('.aviator-candle strong')].every(node => parseFloat(node.textContent) > 10)).toBe(true);
  expect(screen.getByRole('combobox', { name: 'Padrão visual' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'VIP', exact: true }));
  expect(screen.getByRole('button', { name: 'VIP', exact: true }).getAttribute('aria-pressed')).toBe('true');
  history = screen.getByRole('region', { name: 'Histórico de velas' });
  const candle = history.querySelector('.aviator-candle');
  fireEvent.click(candle);
  expect(candle.getAttribute('aria-pressed')).toBe('true');
  expect(within(history).getByText('Estatísticas da amostra')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar', exact: true }));
  expect(screen.getByText(/resultados desta demonstração são fixos/).getAttribute('role')).toBe('status');
});

test('analysis tab renders the same panel as the authenticated analysis screen', () => {
  open('analise');
  fireEvent.click(screen.getByRole('tab', { name: 'Análise de horários' }));
  expect(screen.queryByRole('region', { name: 'Histórico de velas' })).toBeNull();
  expect(screen.getByRole('region', { name: 'Intervalos da amostra' })).toBeTruthy();
  expect(screen.getByText('ODD > 3x')).toBeTruthy();
  expect(screen.getByText('ODD > 10x')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Atualizar análise' }));
  expect(screen.getByRole('status').textContent).toContain('100 velas da demonstração');
});

test('version navigation and mobile menu expose the correct state', () => {
  open('quiz');
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
  expect(screen.getByRole('button', { name: 'Fechar menu' }).getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(screen.getByRole('link', { name: 'Análise', exact: true }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('O print chegou.');
  expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false');
});
