# HistoryOdds — painel compacto

## Alvo e evidências

- Referência visual original: `/var/folders/3g/mpfjtlj95yj_t9npsc69pxy80000gn/T/codex-clipboard-bcadf358-9544-4d59-a15f-215fcd774fe9.png` (2332 × 588 pixels).
- Pedido de ajuste: compactar o componente inteiro e ter pelo menos cinco velas lado a lado no mobile. A densidade solicitada substitui as dimensões maiores da primeira implementação, mantendo cores e organização da referência.
- Implementação: `http://localhost:3000/admin/dashboard`.
- Antes: `artifacts/history-layout/mobile-final.png`, três cards na primeira linha, 324 × 84 pixels, viewport de 390 × 844 CSS px.
- Depois: `artifacts/history-layout/compact-mobile-row.png`, cinco cards na primeira linha, 336 × 64 pixels, viewport de 390 × 1000 CSS px.
- Comparação conjunta: `artifacts/history-layout/compact-comparison.png` (antes acima, depois abaixo), sem ampliar nem reduzir os cards; um pixel por CSS px. Altura do viewport não muda o tamanho dos cards. A diferença na largura interna vem da redução do padding do painel.
- Painel mobile: `artifacts/history-layout/compact-mobile-390.png`, 358 × 654 pixels. Recorte dos controles e primeiras linhas: `artifacts/history-layout/compact-mobile-preview.png`, 358 × 448 pixels; usado no handoff para evitar overlays globais fixos de relógio/navegação na captura da página completa.
- Painel desktop: `artifacts/history-layout/compact-desktop-1440.png`, viewport 1440 × 1000 CSS px, captura de 1132 × 576 pixels.
- Estado: tema escuro, Premium, 50 velas solicitadas, 38 carregadas, todas as odds, rodadas visíveis, primeira vela selecionada e estatísticas recolhidas.

## Findings

Nenhum P0/P1/P2 restante no componente solicitado. A comparação conjunta mostra a mesma hierarquia e paleta com uma densidade maior, conforme o novo pedido.

## Superfícies avaliadas

- Tipografia: odd em destaque; rodada e horário menores, com números completos na amostra observada. Escala da odd ajustada para valores longos. Fontes de controles e títulos reduzidas sem alterar o restante das telas.
- Espaçamento: cards de 44px de altura no mobile e 52px no desktop. Menos padding, gaps e altura nos filtros; cabeçalho sem quebra desnecessária do botão Atualizar.
- Cores: azul/roxo/rosa preservados, com bordas, fundos, foco, seleção e padrões existentes. Variantes de tema claro preservadas.
- Assets: a região é formada por controles HTML e ícones da biblioteca já usada no app; não há novas imagens, placeholders ou ilustrações.
- Conteúdo: odds, rodadas e horários reais preservados. Estatísticas continuam completas e passam a ser abertas sob demanda em um disclosure nativo, inicialmente fechado.

## Responsividade medida no navegador

| Viewport | Colunas | Largura aproximada do card | Altura do card | Overflow horizontal | Texto cortado na amostra |
| --- | --- | --- | --- | --- | --- |
| 320px | 5 | 52px | 44px | Não | Não |
| 390px | 5 | 62px | 44px | Não | Não |
| 430px | 5 | 70px | 44px | Não | Não |
| 768px | 6 | 111px | 52px | Não | Não |
| 1440px | 10 | 105px | 52px | Não | Não |

## Interações e validação

- Seção de estatísticas abriu e fechou no navegador.
- “Exibir rodadas” mantém as rodadas dentro dos cards.
- Seleção das velas e indicadores continuam presentes.
- Selects mantêm opções e valores, com elipse nos rótulos longos do trigger e texto completo nas opções.
- 16 testes passaram nas suítes HistoryOdds, Home e AviatorPRO.
- A verificação visual é do tema escuro da referência. Tema claro preserva seus estilos, mas não teve comparação visual nesta rodada.
- O relógio flutuante tem posição global do usuário e pode sobrepor a página; a captura de preview exclui essa sobreposição. Seu comportamento não foi alterado.

## Histórico da comparação

A comparação anterior aprovou os cards maiores da referência. O novo pedido foi aplicado aos mesmos componentes: cinco colunas mobile, cards mais baixos, cabeçalho/filtros compactos e estatísticas recolhidas. Capturas finais e medições confirmam o novo alvo sem overflow.

## Implementation checklist

- [x] Cinco colunas em mobile, inclusive 320px.
- [x] Cabeçalho, filtros, cards, legenda e estatísticas compactados.
- [x] Números e horários conferidos.
- [x] Estatísticas e seleção funcionando.
- [x] Comparação visual com o estágio anterior e validação em tablet/desktop.

final result: passed

# AviatorPRO — verificação do painel compacto

- Fonte: capturas do app nesta revisão, `artifacts/aviator-pro-compact/01-before-empty.png` e `02-before-result.png`.
- Implementação: `http://localhost:3000/admin/horarios`, `04-after-empty.png`, `05-after-loading.png`, `03-after-result-locked.png` e `06-after-desktop.png`, na mesma pasta.
- Comparação conjunta: `artifacts/aviator-pro-compact/comparison-result.png`, antes à esquerda e depois à direita, aberta e inspecionada. Detalhes de tipografia/horários também conferidos na captura isolada do painel desktop.
- Viewport mobile: 390 × 1000 CSS px. Fonte: 390 × 909 pixels; implementação no mesmo estado: 390 × 506 pixels. Uma unidade de pixel por CSS px, sem redimensionamento. Tema escuro, Original, amostra de 100, mesmos horários e mesmo bloqueio para nova análise.
- O alvo é compactar a tela existente, preservando sua identidade, conteúdo e controles.

## Superfícies avaliadas

- Tipografia: títulos menores; horários continuam dominantes, com 20px em geral e 18px nas telas estreitas. Rótulos permanecem legíveis e não há corte dos horários observados.
- Espaçamento: redução de margens/padding, amostra e botão na mesma linha, duas colunas para resultados. Painel de análise de 674px para 325px no mesmo estado mobile; área superior de 235px para 181px.
- Cores: tokens existentes, diferenciação entre 3x e 10x e foco mantidos.
- Assets: nenhum novo asset; ícones e animação existentes preservados.
- Conteúdo: textos de horário estimado, amostra, atualização, bloqueio, vazio e aviso preservados. Player e regras da análise não foram alterados.

## Verificações

- 320px: duas colunas, painel de 314px no estado liberado, horários completos.
- 390px: duas colunas, painel de 302px no estado liberado, horários completos.
- 768px: duas colunas, painel de 286px, horários completos.
- 1440px: duas colunas no painel lateral, painel de 300px, horários completos.
- Nenhum overflow horizontal nessas larguras. Ação principal de 40px.
- Entrada, carregamento, resultado, seleção de versão e retorno à versão Original verificados no navegador.
- 14 testes passaram e build concluído. Nenhum erro de console do app local observado.
- Tema claro e leitor de tela não foram auditados nesta rodada; estilos e semântica existentes foram preservados. A captura anterior mostra parte do aviso coberto pela navegação fixa; o texto permanece no layout final.

Nenhum P0/P1/P2 restante no escopo solicitado. Relatório completo: `artifacts/aviator-pro-compact/audit.md`.

final result: passed
