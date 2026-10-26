# Gamificação — entrega e verificação

Implementada somente no frontend de `teleco-pro`, sem commits, dependências novas ou alterações no BFF. Alterações anteriores e simultâneas em artes, PWA e menu inferior foram preservadas.

## Comportamento

- `/gamificacao` encaminha para `/admin/gamificacao`, no layout administrativo atual.
- A sidebar ganhou Gamificação em Comunidade, após Ranking de Players. Os outros itens mantêm a ordem.
- No mobile, a barra mantém Histórico, Banca, Jogos, Depositar e Menu. Gamificação fica na folha de Menu existente; o link fecha a folha ao navegar.
- Nível, progresso, sequência, conquistas, histórico paginado e ranking semanal vêm do BFF. O interruptor **Aparecer no ranking** foi removido a pedido do usuário, junto com a chamada de alteração de privacidade e seus estados no hook. A tela mostra todos os players e a posição recebidos do BFF, sem aplicar flags antigas de ocultação. O Top 10 e o bloco da posição individual são mantidos.
- Check-in ocorre quando há sessão autenticada, com memória e `sessionStorage` guardando o dia de Brasília. Retomar a aba e a verificação por minuto permitem reconhecer o dia seguinte. O armazenamento guarda somente o dia, sem credenciais.
- Toast de XP positivo dura quatro segundos, tem `role="status"` e substitui o anterior. Celebrações entram em fila, com modal Reactstrap, foco gerenciado, Esc e confirmação de visto depois do fechamento da fila.
- Movimento reduzido e aparelhos com até quatro núcleos ou até 4 GB mantêm selo estático e brilho. Há também respeito a `prefers-reduced-motion`.
- Aulas: conclusão é o clique explícito em **Marcar como assistida**, conforme confirmado pelo usuário. IDs estáveis derivam do ID do vídeo do YouTube; abrir o iframe não concede XP.
- Banca: a primeira geração válida do plano chama `bankroll_configured`, conforme confirmado pelo usuário, pois não existe ação de salvar nessa tela. O BFF decide o XP e impede ganhos repetidos; nenhuma informação financeira é enviada ao track.
- Nenhum gancho de `notifications_enabled`, depósito ou saque foi conectado.

## Arquivos criados

- `src/services/gamificationApi.js`
- `src/services/gamificationApi.test.js`
- `src/hooks/useGamification.js`
- `src/contexts/GamificationContext.js`
- `src/contexts/GamificationContext.test.js`
- `src/components/Gamification/AchievementIcon.js`
- `src/components/Gamification/GamificationFeedback.js`
- `src/components/Gamification/GamificationFeedback.test.js`
- `src/components/Gamification/Gamification.css`
- `src/views/Gamification.js`
- `src/views/Gamification.test.js`
- `src/views/Aulas.test.js`
- `src/testSupport/gamificationFixtures.js`
- `docs/design/GAMIFICACAO-IMPLEMENTACAO.md`
- `docs/design/revisao-gamificacao/escuro-mobile.jpg`
- `docs/design/revisao-gamificacao/escuro-desktop.jpg`
- `docs/design/revisao-gamificacao/claro-mobile.jpg`
- `docs/design/revisao-gamificacao/claro-desktop.jpg`
- `docs/design/revisao-gamificacao/celebracao-mobile.jpg`

## Arquivos alterados nesta entrega

- `src/index.js`
- `src/routes.js`
- `src/layouts/Admin/Admin.js`
- `src/components/Sidebar/Sidebar.js`
- `src/components/AccountDrawer/AccountDrawer.js`
- `src/components/AccountDrawer/AccountDrawer.css`
- `src/components/AccountDrawer/AccountDrawer.test.js`
- `src/components/InvestmentTable/InvestmentTable.js`
- `src/components/InvestmentTable/InvestmentTable.test.js`
- `src/services/appStorage.js`
- `src/views/Login.js`
- `src/views/Aulas.js`

Nenhum arquivo removido. `package.json`, `package-lock.json` e `.env*` não foram alterados nesta entrega; `.env` e `.env.local` continuam ignorados pelo Git.

## Atualização: remoção do interruptor de ranking

Alterados `src/views/Gamification.js`, `src/hooks/useGamification.js`, `src/services/gamificationApi.js`, `src/components/Gamification/Gamification.css` e os testes da tela e do serviço. Naquela etapa, a cobertura verificou a ausência do interruptor, o destaque da linha do usuário e a mensagem para participação oculta pelo BFF. As verificações de privacidade descritas abaixo registram a entrega original, anterior à remoção.

Validação após a remoção: `CI=true npm test -- --watchAll=false --runInBand` aprovou **43 suítes e 241 testes**, sem falhas, em **22,014 s**. `npm run build` aprovado com os avisos existentes; ESLint dos arquivos alterados e `git diff --check` aprovados.

## Atualização: participação automática

Removidos o filtro de players por `me.hidden`, a condição que escondia a posição individual e o aviso de participação oculta. Testes conferem que flags legadas não suprimem uma linha ou posição fornecida pelo BFF, e que a tela não oferece interruptor de participação. `CI=true npm test -- --watchAll=false --runInBand`: **43 suítes e 242 testes aprovados**, sem falhas, em **8,445 s**. Build, ESLint da tela/testes e `git diff --check` aprovados; avisos anteriores do build permanecem. O usuário confirmou manter o trabalho somente no frontend; a inclusão global no servidor fica fora deste escopo.

## Testes automatizados da entrega original

- Baseline: 38 suítes, 194 testes aprovados.
- `CI=true npm test -- --watchAll=false`: executado. Houve rodadas aprovadas com 236 e 240 testes durante a implementação. No código final, a última execução paralela terminou com **41 suítes aprovadas / 2 com falha; 238 testes aprovados / 3 com falha, total 241**, em 93,548 s. As falhas foram timeouts em Cadastro e no teste do modal. A máquina também apresentou timeouts de automação de navegador nessa fase; não foram alterados os timeouts dos testes para escondê-los.
- Verificação final com execução serial: `CI=true npm test -- --watchAll=false --runInBand` — **43 suítes aprovadas, 241 testes aprovados, zero falhas**, em **34,928 s**.
- `npm run build`: aprovado, incluindo a tarefa Gulp de licenças. Avisos existentes de ESLint/Autoprefixer permanecem; não houve avisos nos arquivos novos de Gamificação. Bundle principal: 319,27 kB JS e 100,59 kB CSS, comprimidos.
- ESLint dos módulos de Gamificação e dos ganchos de Aulas/Banca: aprovado. `git diff --check`: aprovado.
- BFF mockado cobre dia de Brasília, concorrência e mudança de sessão, armazenamento indisponível, XP zero/positivo, toast único e duração, fila, Esc, visto, erros silenciosos, 429, ícones conhecidos/desconhecidos, perfil inválido, quatro estados da tela, paginação, posição fora do top 10, privacidade com reversão, nível 10, IDs inválidos, movimento reduzido, entrada no Menu e ganchos de Aulas/Banca.

## Verificação manual

A aplicação que já estava em 3000 apontava para o BFF remoto. Foi aberta uma instância separada em **3001**, com `REACT_APP_BFF_URL=http://localhost:4000`, sem alterar arquivos de ambiente. O usuário fez o login na interface; nenhuma credencial foi solicitada ou copiada.

Conferido no BFF local:

- Tela autenticada normal, check-in presente no histórico e ausência de repetição de celebrações vistas após reload.
- Conquista e nível pendentes em fila, uma celebração por vez, com fechamento por Esc.
- Temas escuro e claro, em 390 × 844 e 1280 × 900, sem overflow horizontal.
- Ranking carregado com linha do usuário destacada.
- Privacidade desligada, confirmada após reload, e restaurada ao estado inicial.
- Primeira geração válida do plano de banca: toast **+75 XP · Banca configurada**, conquista correspondente e histórico atualizado. Nova leitura não repetiu a celebração vista.
- Movimento reduzido: animação computada `none`, com brilho estático mantido.
- Menu mobile abre a folha existente, oferece Gamificação e fecha ao selecionar o link.
- Preferências de tema/movimento e viewport temporário restaurados. Instância 3001 deixada aberta para revisão.

Não verificado com dados reais: virada de dia/semana, marcos de sequência de 7/30 dias, nível 10, ranking completo de dez usuários/posição fora do top 10, histórico com mais de vinte itens, falhas de rede/429 e reversão de privacidade sob falha, ganho de XP por aula e desempenho em aparelho físico fraco. Esses cenários foram cobertos por mocks; o aparelho físico não foi medido. O check-in após login já estava idempotente, portanto o toast positivo de check-in foi validado por teste automatizado; o toast positivo real foi observado no gancho da banca.

As quatro imagens da tela registram o estado final da conta de teste, depois do ganho de XP da banca. A captura da celebração registra um momento anterior. Não incluem nomes de players nem credenciais.

## BFF

O novo pedido de participação automática de todos exige atualizar a regra no BFF. O frontend já não oferece ocultação nem filtra as linhas recebidas por `me.hidden` ou `showInRanking`, mas não pode recuperar players ou posições omitidos pelo servidor.

Mudança necessária no servidor: incluir todos os usuários de Gamificação do app nas consultas do ranking e do cálculo de posição, independentemente da preferência antiga; tratar os registros anteriores com participação desativada; garantir participação para novas contas; retornar `showInRanking: true` em `/me` e `me.hidden: false` no ranking enquanto esses campos fizerem parte do contrato; e impedir que `PATCH /privacy` volte a aceitar `showInRanking: false`. Manter o período semanal de Brasília, o Top 10, os primeiros nomes e o cálculo de XP no BFF.

A implementação dessa regra no BFF está fora do escopo: o usuário confirmou manter o trabalho somente no frontend. Nenhuma alteração foi feita no servidor. O frontend não fabrica posições ou força valores de flags na resposta para simular a inclusão global; usuários omitidos pelo BFF continuam dependendo de uma futura mudança no servidor.
