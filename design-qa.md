# QA visual — Aulas, opção 1

final result: passed

Relatório anterior de HistoryOdds preservado em `docs/qa/history-odds-design-qa.md`.

## Referência e escopo

- Fonte visual selecionada: `/Users/felipeteles/.codex/generated_images/01a13174-9476-7f60-9f8a-059400103fed/exec-3f7c563d-9586-4efd-8760-a448d9654fb8.png` (opção 1 na ordem exibida).
- Implementação: http://localhost:3000/admin/aulas, Chrome existente do usuário, tema escuro, sessão autenticada, uma aula real publicada, catálogo fechado inicialmente.
- Diretório das evidências: `/Users/felipeteles/.codex/visualizations/2026/10/12/01a13174-9476-7f60-9f8a-059400103fed/aulas-design/`.
- Menu lateral, navbar, barra inferior, relógio, rotas, autenticação e backend preservados. A navegação diferente desenhada no mock foi excluída da comparação por solicitação explícita do usuário.
- Arte de apoio gerada em `src/assets/img/lessons-cinema-hero.webp` (1832 × 859, 35.152 bytes). Capas cadastradas têm prioridade; nenhuma aula fictícia foi adicionada.

## Capturas e normalização

- Fonte: 1487 × 1058 pixels. Comparação usa região de conteúdo x=88, y=0, 1399 × 1058; redimensionada proporcionalmente para 1169 px de largura.
- Desktop: viewport CSS 1440 × 1024; captura `13-desktop-final.png`, 1429 × 1016 pixels retornados pelo Chrome. Região de conteúdo x=260, y=76, 1169 × 900, salva em `desktop-content-final.png`. A captura exclui a barra de rolagem; não foi tratada como imagem @2x. Não houve esticamento da fonte.
- Comparação conjunta efetivamente aberta: `14-comparison-final.png` (2358 × 920; fonte à esquerda, implementação à direita). O conteúdo foi alinhado pela largura útil; a separação do cabeçalho existente e o padding do shell são diferenças intencionais.
- Região ampliada de tipografia/CTA efetivamente aberta: `15-typography-final.png` (1220 × 360). Recortes proporcionais legíveis da fonte e do resultado; usados para julgar família, peso, quebras, botões e contraste, sem alegar medição pixel a pixel.
- Tablet: 834 × 1194 CSS/pixels, `17-tablet-final.png`.
- Celular: 390 × 844 CSS; `18-mobile-viewport-final.png` e `19-mobile-catalog-final.png`, capturas do viewport (379 × 820 pixels, Chrome excluindo a barra de rolagem), primeira e segunda posições de rolagem. Também verificado em 360 × 800 CSS/pixels.
- Player móvel: `11-player-mobile-final.png` em 360 × 800; player desktop: `16-player-desktop-final.png`.
- `12-mobile-final.png` é captura integral auxiliar e não foi usada como evidência de posicionamento dos elementos fixos: o modo de captura integral desloca esses elementos. As capturas de viewport e retângulos do DOM confirmam o relógio existente em top=8 e o cabeçalho em top=96 com scrollY=0.
- Capturas são 1 pixel por CSS pixel útil, sem duplicação @2x. Diferenças de borda/scrollbar do navegador foram excluídas da avaliação.

## Histórico de comparação e correções

1. Primeira comparação conjunta: `09-comparison.png` e `10-typography-comparison.png`.
   - [P2, corrigido] Miniatura excessivamente grande (três colunas), mudando a densidade do catálogo em relação à opção 1. Ajustado para quatro colunas no desktop, duas no tablet e uma no celular; número da aula movido para dentro da capa. Evidência final: `14-comparison-final.png`, card desktop com 263,75 px na área útil atual.
   - [P2, corrigido] CTA e texto auxiliar pequenos em relação ao alvo. Ajustados CTA para 14 px, resumo para 14 px e link da descrição para 12 px. Evidência final: `15-typography-final.png`.
2. Verificação do player em 360 × 800.
   - [P2, corrigido] Barra inferior e relógio existentes apareciam acima da janela e escondiam a ação inferior (`06-player-mobile.png`/primeira inspeção). Janela com z-index 1200 e backdrop 1190, superiores à navegação (1060), relógio (1070) e sidebar (1120). Evidência final: `11-player-mobile-final.png`; DOM confirmou os dois valores finais. Fechar e marcar como assistida permanecem acessíveis por rolagem.
3. Comparação final conjunta aberta, regiões ampliadas e responsividade: sem P0/P1/P2 acionável remanescente na tela de aulas.

## Superfícies obrigatórias

- **Fontes:** Chakra Petch nos títulos e Sora no corpo, confirmadas por estilos computados. Título do destaque mantém hierarquia e duas linhas com o conteúdo real; textos longos quebram sem alargar a tela. Títulos e descrição completos disponíveis na janela/expansão. Resumos limitados intencionalmente no catálogo.
- **Espaçamento:** destaque fotográfico amplo, texto à esquerda, catálogo abaixo e miniaturas 16:9. Desktop com quatro colunas, tablet com duas e celular com uma; arte acima do texto no celular. Sem overflow horizontal: scrollWidth 1429/1440 no desktop, 834/834 no tablet, 379/390 e 360/360 no celular. Padding inferior reserva espaço para a navegação atual.
- **Cores:** paleta roxa existente, texto claro sobre fundo escuro. Tokens do produto reutilizados para tipografia, superfícies, cores semânticas e foco. Capa personalizada recebe fundo escuro sólido translúcido sob a cópia para manter legibilidade. Sem mudança global de tema.
- **Imagens:** fotografia raster local com laptop à direita e espaço escuro à esquerda, coerente com o alvo. WebP otimizado; sem distorção de proporção ou desenho de arte por CSS/SVG. Ícones Lucide já usados no produto. Tela e objetos da arte são variação visual gerada, não reprodução literal do laptop do mock.
- **Conteúdo:** título/descrição/capa/vídeo e contagem vêm do BFF. Uma única aula real na captura; sem durações, cursos, progresso persistido ou contagens inventadas. Resumo preserva o texto cadastrado, com descrição completa expansível.

## Interações e acessibilidade

- Botão principal e card abrem a aula correta; o catálogo não monta iframes antecipadamente.
- Ver descrição/Ocultar descrição funciona, com aria-expanded e conteúdo completo.
- Fechar por botão e Escape desmonta o vídeo e devolve foco ao botão que abriu a janela; verificado tanto a partir do destaque quanto do card.
- Foco contido na janela (`trapFocus`): Shift+Tab a partir de Fechar retorna à ação final, confirmado no DOM. Foco visível, rótulo do diálogo e botões com nome acessível.
- Link original HTTPS disponível para todos os provedores, com noopener/noreferrer. Não foi tentado contornar restrições de idade ou reprodução do YouTube; a reprodução interna do vídeo real depende do provedor e não foi comprovada nesta revisão.
- Marcação de assistida testada com mock para não alterar XP da conta real. Dispara uma vez por UUID e somente na ação explícita. Paginação, recuperação após erro, vazio, capa quebrada, vídeo direto e link externo cobertos em testes.
- Console consultado: avisos anteriores de ReactDOM.render no React 18/Google Maps e erros de extensões já presentes antes da mudança; nenhuma mensagem nova identificada do componente Aulas durante a revisão. Esses itens do shell não foram alterados.
- Tema claro não foi exercitado no navegador: alvo e sessão estão em tema escuro. CSS usa tokens existentes fora da arte cinematográfica; isso não é alegação de QA do tema claro.

## Validação e checklist

- [x] `CI=true npm test -- --watchAll=false --runInBand`: **49 suites e 313 testes passaram**, zero falhas (log `/tmp/teleco-aulas-tests-final.log`).
- [x] `npm run build`: exit 0, compilação e gulp licenses concluídos (log `/tmp/teleco-aulas-build-verified.log`). Avisos já existentes fora de Aulas; sem aviso apontando o componente/serviço desta entrega.
- [x] `git diff --check`: sem problemas de whitespace.
- [x] Fonte e implementação abertas juntas, comparação ampliada e capturas finais revisadas.
- [x] Menu atual preservado, viewport temporário restaurado e aba local mantida aberta.
- [x] Sem commit ou publicação nesta alteração visual.

## Ajustes opcionais

Sem P3 obrigatório. As capas específicas cadastradas por aula podem substituir a arte padrão conforme o catálogo crescer. O relógio flutuante mantém o comportamento anterior de sobrepor conteúdo durante rolagem; sua posição e navegação do app estão fora do escopo desta alteração visual.

## Complemento solicitado — acesso pelo menu e card inicial

Após a aprovação do visual, o usuário pediu explicitamente o item Aulas no menu lateral e um card avisando da aula sobre o aplicativo. A preservação do menu descrita acima agora admite essa adição solicitada, mantendo estrutura e demais itens.

- Rota `/admin/aulas` visível em Ferramentas, ícone BookOpen e indicação de link ativo.
- Card “Aula disponível / Como usar o aplicativo / Assistir aula” no início de Jogos e ferramentas, tela após login. Link inteiro acessível por teclado e destino `/admin/aulas`; sem alterar a abertura dos jogos.
- Arte existente reutilizada, fontes e tokens do app, sem nova imagem ou alteração da composição da tela Aulas.
- Evidências no mesmo diretório: `20-menu-card-desktop.png` (recorte 1459 × 580 da viewport 1470 × 705), `21-menu-card-mobile.png` e `22-sidebar-mobile.png` (recortes 379 × 660 da viewport 390 × 844).
- Conferência real no Chrome: card desktop 1072 × 114; celular 347 × 176,6 com botão em linha própria. Sem overflow horizontal (scrollWidth 1459/1470 e 379/390). Item do menu móvel abre Aulas e recolhe o menu; rota ativa confirmada. Tamanho do navegador restaurado; tela inicial mantida aberta.
- `CI=true npm test -- --watchAll=false --runInBand`: 49 suítes, 313 testes passaram, zero falhas (log `/tmp/teleco-aulas-menu-tests.log`).
- `npm run build`: exit 0, compilação e licenças concluídas, avisos preexistentes (log `/tmp/teleco-aulas-menu-build.log`). `git diff --check` passou.
- Sem commit ou publicação. Nenhum P0/P1/P2 observado no complemento.

final result: passed
