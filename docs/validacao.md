# Validação da Super Extensão

## Controles unificados e menus escuros — 1.7.50 (17/11/2026)

Unificados fundo/blur/borda/sombra/opacidade da barra esquerda e do botão direito na Nova guia. Tokens compartilhados: 50% em repouso/100% em hover ou foco, blur 12px, raio 12px, superfície translúcida com 61%/85% da cor base. As listas dos seletores usam paleta escura dedicada nos dois temas; o campo fechado continua seguindo o tema da interface. Mantido fallback nativo e cores forçadas do sistema.

**36 verificações direcionadas passaram** (componentes compartilhados claro/escuro e interface VPN). Nova guia e painéis recompilados; `check:ui`, `check:integrity` e whitespace aprovados. A validação DOM não mede transparência composta, blur nem o picker nativo; conferência visual final no Helium/perfil pessoal continua pendente.

## Listas dos seletores — 1.7.49 (17/11/2026)

Aplicado estilo compartilhado às opções e ao picker nativo personalizável, com fallback sem JavaScript para motores antigos e tratamento de cores forçadas. Menus com borda/radius/sombra, opções espaçadas, hover/foco do tema e visto nativo de seleção. Multiselect/listbox explícito não foi alterado. O botão translúcido da Nova guia permanece na versão final, herdado da 1.7.48.

**36 verificações direcionadas passaram** (componentes compartilhados em claro/escuro e interface VPN, incluindo regras de inclusão/exclusão e salvamento automático). Painéis recompilados, `check:ui`, `check:integrity` e whitespace aprovados. Não foi executado novo teste nativo: DOM simulado não desenha `::picker(select)` nem comprova clipping, seleção por teclado e apresentação real. Conferir esses estados no Helium/Chromium do perfil pessoal, incluindo o fallback e cores forçadas. [Compatibilidade e limites](ui-components.md#listas-dos-seletores--1749).

## Transparência do botão Nova guia — 1.7.48 (17/11/2026)

Restaurada a composição translúcida do botão Super Extensão, usando 61% da cor base do tema e 85% em hover/foco, com blur de 12px. Conferência direcionada dos componentes compartilhados, `check:ui`, `check:integrity` e whitespace aprovados. Alteração exclusivamente CSS; não houve nova execução em navegador nativo.

## Transparência dos ícones — 1.7.47 (17/11/2026)

Removido o fundo sólido do gerador de ícones. Conferidos os 30 PNGs (host, VPN e fontes VPN): dimensões corretas, canal alpha, cantos transparentes e pixels semitransparentes nas bordas. As cópias equivalentes possuem os mesmos bytes. `check:ui`, `check:integrity` e whitespace passaram. Não foi repetida a suíte funcional por ser uma correção exclusivamente visual nos ativos e no script de geração. A conferência da barra real no perfil pessoal permanece pendente.

## Identidade visual — 1.7.46 (17/11/2026)

Aplicada a paleta #121015/grafite/branco suave nos tokens compartilhados, interfaces e páginas auxiliares. A marca S/escudo substitui os ícones do host e da integração VPN. SVG recortado nos limites do caminho, PNGs em todos os tamanhos e fontes de reconstrução sincronizados. As variantes de status da VPN continuam sobrepondo seus sinais sem alterar a lógica de conexão.

**568 testes aprovados**, sem falhas ou ignorados, incluindo temas claro/escuro, componentes compartilhados, página de proteção e indicadores VPN. O contrato de prevenção de injeção na página de proteção foi atualizado para aceitar somente a imagem local conhecida da marca e continuar recusando imagens/atributos derivados de mensagens do serviço. Builds da Nova guia, worker/interface VPN e painéis passaram; checagens TypeScript, `check:ui`, `check:integrity` (66 arquivos) e whitespace aprovadas.

Símbolo rasterizado inspecionado em 16/32/48/128 px; contraste calculado para texto, texto secundário e destaque sobre as três superfícies: mínimo 7,34:1 no escuro e 5,61:1 no claro. SVG válido e PNGs opacos com fundo #121015, mantendo as proporções. A revisão de ativos não é teste de geometria das telas reais. Não houve nova execução nativa nesta rodada, devido à restrição de sockets já registrada; a conferência visual completa no perfil pessoal permanece pendente. [Arquivos e reprodução](identidade-visual.md).

## Editor e catálogo próprios — 1.7.45 (17/11/2026)

Editor de fundos/widgets, aparência/fontes/posições, idioma/fuso e importação/exportação/reset extraído para `newtab/editor`. Catálogo próprio registra IDs e metadados, preserva disponibilidade por plataforma e ordena os nomes pelo idioma atual. A implementação dos widgets/provedores permanece no adaptador.

**568 testes Node aprovados**, sem falhas ou ignorados. Os cinco cenários novos exercitam registro de 5 fundos/15 widgets Chromium, JS exclusivo web, idioma/ordenação dinâmica, validação de escolhas, edição tardia de fundo, preservação de plugins desconhecidos, editor React em StrictMode, adicionar/reordenar/configurar/remover, atualização de idioma, troca de fundo, Escape e descarte de listeners/loaders. Também cobrem fechamento durante leitura de arquivo e confirmação de reset, exportação compatível com revogação da URL, recusa de importação inválida sem perda, importação válida e reset cancelado. A suíte existente continua exercitando o bundle de produção e a persistência/importação/migração.

Build de produção, checagens TypeScript, `check:ui`, `check:integrity` e whitespace aprovados. Não houve nova execução nativa: a inicialização Chromium foi bloqueada por restrição de sockets na etapa 1.7.44. Editor com os dados existentes no perfil pessoal e integrações online dos provedores continuam pendentes; os testes novos usam DOM simulado e implementações fictícias dos painéis dos plugins, sem contas reais.

## Dashboard próprio e sessões — 1.7.44 (17/11/2026)

Extraídos composição, agrupamento, ordem, tema/foco e montagem/descarte dos widgets para `newtab/dashboard` e `newtab/engine`. Os componentes/provedores existentes são injetados por um adaptador, sem troca das chaves de configuração/cache.

**563 testes Node passaram**, sem falhas ou ignorados. Os três novos cenários verificam snapshot estável em edições de dados, ordem/posição/tema/foco, descarte de gravações tardias, balanceamento do loader, montagem React em StrictMode, propagação reativa sem remontagem desnecessária, ocultação/retorno, isolamento de provedor ausente, recuperação após troca de tipo e remoção de observadores no unmount. A suíte também executa o bundle recompilado da Nova guia com armazenamento simulado.

A compilação de produção passou. A tentativa de rodar `CHROMIUM_PATH=/usr/bin/chromium node scripts/check-newtab-native.cjs` foi impedida na inicialização do Chromium por `socket() failed: Operation not permitted`; nenhum cenário nativo desta versão foi executado. Os resultados históricos em navegador não são uma aprovação automática da 1.7.44; a conferência do perfil pessoal continua pendente.

### Sincronização entre dois navegadores — confirmação do usuário

Em 17/11/2026, o usuário confirmou que a sincronização entre dois navegadores está validada. A confirmação encerra essa pendência de convergência do roteiro. Não foram fornecidos navegador/versão, quantidade de favoritos ou resultados separados para concorrência, interrupções e reinícios; esses detalhes não são inferidos. Essa confirmação se refere à sincronização de favoritos, não à Nova guia.

## Espaçamento dos campos — 1.7.43

A classe local `.field` deixava o seletor em bloco e anulava o espaço do componente compartilhado. Foi removida a sobrescrita, preservando o grid de `.ui-field` e seu token de 6 px. No Edge 157.0.4341.60, a medição do HTML/CSS reais confirmou 6 px entre título e controle nos três seletores de limpeza, no campo de domínio e nos dois seletores de Favoritos. Captura inspecionada. `check:ui`, `check:integrity` e `git diff --check` passaram; não houve alteração na persistência ou nas regras de limpeza.

## Limpar lista de exclusão — 1.7.42

Em 15/11/2026, **560 testes passaram**, sem falhas ou testes ignorados. Templates/catálogos, `check:ui`, `check:integrity` e `git diff --check` foram verificados. Os casos novos cobrem limpar somente o tipo escolhido, confirmação/cancelamento, mudança de modo ou sites durante a confirmação e falha de gravação sem perder a lista.

O Edge 157.0.4341.60, em perfil temporário, confirmou o botão e verificou que inclusão, outras exclusões, cookies/localStorage dos dois sites locais e o registro de limpeza foram preservados. O mesmo runner validou novamente limpeza real de cookies/cache/localStorage por inclusão/exclusão e inclusão vazia. Captura do diálogo inspecionada. Não foram usados dados pessoais. [Funcionamento](limpeza-por-site.md).

## Inclusão e exclusão na limpeza — 1.7.41

Em 15/11/2026, **556 testes passaram**, sem falhas ou testes ignorados. Templates/catálogos foram gerados e `check:ui`, `check:integrity` e `git diff --check` passaram. Os modos por tipo preservam as listas antigas, não misturam inclusão/exclusão e não ampliam filtros vazios ou inválidos. Foram exercitados snapshots manuais, relatórios sem falso sucesso, falha de gravação, leituras antigas e troca de destino durante importação.

O Edge 157.0.4341.60 executou remoção real em perfil temporário com dois sites locais, sem dados pessoais: cookies, cache HTTP e localStorage seguiram inclusão e exclusão; inclusão vazia não removeu dados nem registrou sucesso. O cache foi comprovado por requisições ao servidor local. Capturas foram inspecionadas. [Regras, formatos e limites](limpeza-por-site.md).

## Módulos opcionais — 1.7.40

Em 15/11/2026, **543 testes passaram**, sem falhas ou testes ignorados. Workers/interfaces de sincronização e VPN, catálogos e templates foram compilados. TypeScript completo da origem VPN, `check:ui` e `check:integrity` passaram; a integridade inclui os recursos agora carregados dinamicamente e percorre 65 arquivos referenciados.

O Edge 157.0.4341.60 validou os seis interruptores em uma instalação temporária: desativação total, menus ocultos, motores sem inicialização, ausência de alarmes/scripts de conteúdo, liberação de proxy/WebRTC/DNR próprios, restauração do método de mídia numa página de teste e Nova guia sem carregar dashboard/polyfills/widgets. Reativar sincronização e VPN preservou perfis e credenciais OAuth sintéticos. A extensão completa e a persistência da Nova guia também passaram sem erros de página.

Os testes cobrem eventos recebidos antes da leitura das preferências (favoritos, alarmes, desafio do proxy e autorização externa), recusa de mudança durante sincronização e falhas de liberação/gravação sem declarar sucesso. Nenhuma conta real foi usada. [Arquitetura, efeitos e limites](modulos.md).

## Configurações automáticas — 1.7.39

Em 15/11/2026, **528 testes passaram**, sem falhas ou testes ignorados. Foram compiladas as interfaces de sincronização, VPN e Nova guia, os painéis e os templates estáticos; TypeScript da Nova guia, `check:ui` e `check:integrity` passaram (61 arquivos referenciados e versão 1.7.39).

Os testes exercitam gravação automática de perfis, credenciais Git/OAuth, criptografia, seleção de pasta e regras da VPN, inclusive importação/remoção de domínios. Gravações lentas, alterações rápidas, retorno ao valor original durante uma gravação, falhas com nova tentativa e espera antes da navegação são cobertos. Campos inválidos não substituem a configuração válida; o aviso permanece mesmo quando uma gravação anterior termina. Selecionar Favoritos depois do modo Abas só persiste IDs reais, sem destino intermediário vazio.

As chaves de Unsplash/GIPHY são gravadas ao editar/limpar. Testes cobrem escritas concorrentes preservando ambos os provedores, erro/nova tentativa, leitura inicial recusada sem sobrescrever o valor existente e notificação do fundo após pausa na digitação. Não foram adicionadas dependências.

No Edge 157.0.4341.60, os runners de interface, extensão completa e Nova guia passaram em perfis temporários com dados fictícios. O runner da sincronização alterou o nome do perfil e selecionou uma pasta, conferindo a persistência sem Salvar, além de Escape/foco, temas e assistente. A extensão abriu worker/painéis/editor sem erros de página, recuperou fusos inválidos e manteve o proxy livre sem login. A Nova guia preservou widgets, notas, idioma e imagem local após recarga/reinício; importação/exportação também passaram. Capturas foram inspecionadas. Google/Git/Proton reais e perfil pessoal não foram usados.

Aguarde a indicação de conclusão antes de fechar o popup. Navegação interna aguarda a fila; fechar o processo do navegador durante uma gravação não é uma garantia de conclusão. Criar/importar/remover continuam ações explícitas. A política de não usar Salvar/Aplicar para confirmar configurações foi registrada em `AGENTS.md`.

## Vue 3 e remoção de Sentry — 1.7.38

Em 15/11/2026, **514 testes passaram**, sem falhas ou testes ignorados. Interface/worker de sincronização e Nova guia foram recompilados; `check:ui` e `check:integrity` passaram (61 arquivos referenciados, versão 1.7.38). Os testes incluem os controles nativos, rascunhos e credenciais Git, criptografia, navegação por hash, exportação/importação de arquivos e autorização Google com permissão, PKCE e respostas de token/identidade sintéticas.

No Edge 157.0.4341.60 com perfil temporário, passaram os runners `check-interface-native.cjs`, `check-extension-native.cjs` e `check-newtab-native.cjs`: árvore/assistente/foco/temas, extensão completa com worker e painéis sem erros de página, recuperação de fuso corrompido, edição e persistência de widgets/notas/imagem local, idioma em duas abas e importação/exportação. Capturas foram inspecionadas. Autenticação e sincronização com contas reais continuam pendentes nesta rodada.

[Arquitetura, auditoria atual, licenças e limites](sync-migration.md).

## Varredura de integridade — 1.7.37

Em 15/11/2026, **506 testes passaram**, sem falhas ou testes ignorados. Todas as interfaces e workers foram recompilados; `check:ui`, TypeScript da Nova guia/núcleo/interface VPN/worker VPN e `check:integrity` passaram. A verificação estática percorreu 61 arquivos referenciados e conferiu as quatro declarações de versão (manifest, pacote, raiz do lock e pacote raiz do lock).

O Edge 157.0.4341.60 carregou a extensão completa, com perfil vazio temporário: worker, painéis de limpeza/sincronização/VPN, dois provedores, ausência de proxy assumido sem login e Nova guia/editor sem erros de página. O mesmo teste reabriu a Nova guia com fusos globais e de relógio deliberadamente corrompidos e confirmou relógio válido e editor acessível. As verificações já existentes de interface e persistência da Nova guia também passaram.

Os runners VPN de bloqueio/retorno estavam desatualizados para os imports `storedSplitTunneling` e `guard-routing`. Foram corrigidos, sem mudar o motor VPN, e passaram com servidores locais: bloqueio antes de conectar, proxy HTTP real, queda sem requisições diretas aos destinos protegidos, reinício, liberação explícita, inclusão/exclusão e host exato/subdomínios. O retorno GET preservou alvo/âncora e não repetiu POST. O desafio 407 cancelou a autenticação na restauração sem enviar credenciais; o worker compilado também passou com dados sintéticos de conta.

[Achados, dependências e limites da conclusão](auditoria-integridade.md). Não foram usadas contas reais Google/Git/Proton, perfil pessoal, captura de tráfego de sistema ou testes completos de DNS/IPv6/WebRTC.

## 1.7.36 — dois provedores e correções selecionadas do Tabliss

Em 15/11/2026, **502 testes automatizados passaram**, sem falhas ou testes ignorados. As compilações da interface de sincronização, worker e Nova guia, o TypeScript da Nova guia e `check:ui` passaram. Os testes também confirmam que perfis bloqueados não são regravados, que o estado transitório dos serviços desativados é limpo e que eles não registram visitas a favoritos.

A conferência nativa passou no Microsoft Edge 157.0.4341.60, com perfil temporário e dados fictícios. A interface confirmou apenas Google Drive/Git, o assistente, a árvore de pastas, cancelamento/Escape, restauração de foco e temas claro/escuro. A Nova guia preservou notas, configuração e imagem local depois de recarregar/reiniciar o navegador; criação/ordenação/remoção de widgets, idioma em duas abas e importação/exportação também passaram. A inicialização dentro do sandbox falhou; os mesmos runners passaram na execução autorizada fora dele, sem usar perfil pessoal.

A política de provedores é exercitada no bundle da interface com JSDOM e no worker com APIs simuladas: somente Google Drive/Git, cadastro Git, perfis existentes/rascunhos, bloqueio de cadastro/importação/edição de serviços removidos sem criação parcial, ausência do OAuth Dropbox na interface com preservação de sua chave armazenada, e bloqueio de execução/verificação/agendamento dos serviços desativados, inclusive sincronizar todos. O teste do serviço de IP usa respostas fictícias HTTPS/HTTP/JSON e cobre cache no formato existente, timestamp, falhas sem detalhes brutos e liberação de carregamento; os créditos Unsplash aceitam `name` e `title`.

Esta rodada não autentica contas Google/Git nem certifica o roteamento VPN pelo widget de IP. As fontes e decisões ficam em [atualizacoes-origens.md](atualizacoes-origens.md).

## Interface compartilhada — 1.7.35

**496 testes automatizados aprovados**, compilação de todas as interfaces, TypeScript da Nova guia, `check:ui` e `git diff --check` aprovados.

Componentes estruturais da sincronização (pastas, diálogo e assistente), cartões/seções dos editores React, estados de progresso/erro e confirmação da página de recuperação passam pela biblioteca comum. Testes cobrem foco/Escape/restauração, montagem sob demanda, preservação de rascunho/escopo, seleção de IDs exatos, expansão das pastas, texto seguro e progresso determinado/indeterminado. A confirmação da VPN é cancelada ao recuperar a conexão ou descartar a página.

A Nova guia foi exercitada no Edge 157.0.4341.46 em perfil temporário: editar/adicionar/ordenar/remover widgets, imagem local, duas abas/idioma, exportação, rejeição de importação futura sem perda, importação válida e reinício do navegador. Nenhum erro de página foi observado. O roteiro passa a conferir o aviso inline de importação, substituindo o alerta nativo. TypeScript da Nova guia e conferência dos templates estáticos foram verificados. Contas reais, dados pessoais e a matriz completa de provedores não são cobertos por esse teste.

O roteiro `check-interface-native.cjs` também passou no Edge 157.0.4341.46: carregou o bundle de sincronização com APIs simuladas, conferiu hierarquia/seleção de pastas, cancelamento sem alterar o escopo, Escape/restauração de foco, avanço do assistente, uma etapa ativa e foco no título. O diálogo também coube em 520 × 360, sem rolagem horizontal interna. Capturas dos temas claro/escuro e textos longos são geradas para inspeção em `work/ui-review` e foram inspecionadas. Nenhum erro de página foi observado.


Revisado em 13 de novembro de 2026, referência **1.7.26**. Esta página separa evidência automatizada de verificações ainda pendentes.

## Retorno à página após recuperação da VPN — 1.7.26

A página de bloqueio oferece **Voltar à página** quando existe destino válido e a VPN está confirmada. O clique revalida o estado com o worker antes de navegar na mesma aba. A regra 880005 preserva o endereço de navegações GET no fragmento local da página; 880004 mantém o bloqueio/redirecionamento dos demais métodos sem destino de retorno. Páginas antigas ou abertas sem destino continuam sem botão. Não há retorno automático nem repetição de corpos POST, formulários ou pagamentos; a liberação explícita sem VPN também não habilita o atalho.

**464 testes aprovados**, incluindo sete cenários novos de retorno, queda/erro durante a confirmação do clique, descarte da página, destino inseguro, separação de métodos e readback/atualização das regras. Build de produção, TypeScript do worker/interface e `check:ui` aprovados. A interface mostra somente o host do destino; o endereço completo fica no fragmento local, que pode integrar o histórico, sem gravação em storage ou logs.

Teste nativo focado no **Windows / Edge 157.0.4341.46**, perfil temporário e servidor HTTP local: regras DNR reais preservaram caminho, parâmetros escapados e âncora; nenhum pedido de navegação chegou ao servidor antes do clique; a página mostrou o botão após confirmação simulada do guard e retornou por GET ao clicar. Um POST interceptado abriu a página sem destino, não chegou ao servidor e continuou sem botão após liberação do guard. A apresentação visual da página conectada foi conferida. Reprodução em `scripts/check-vpn-return-native.cjs`; não usa conta pessoal ou conexão Proton real.

O runner Playwright anterior foi ampliado para oito cenários, incluindo retorno e POST, mas não foi executado nesta rodada: Playwright não está instalado na raiz local. A evidência nativa desta entrega corresponde ao runner focado via DevTools. A rodada não certifica ausência de vazamentos e mantém pendentes os testes de falha da conta real.

## Conta, plano e configurações no núcleo próprio — 1.7.25

A consulta/cache dos perfis VPN e da conta principal passa a `vpn/engine/account.ts`. O núcleo controla frescor, atualização em segundo plano, agrupamento de consultas por conta/geração, reautenticação e invalidação no logout. Gravações são aguardadas e remoções ficam ordenadas depois de escritas iniciadas. As chaves existentes e os caches legados continuam legíveis; novas gravações incluem `owner` com o UID já presente na sessão local, sem registrar esse dado no console. As restrições de plano e servidor usam funções próprias, com validação de tiers finitos e não negativos.

Na revisão foram corrigidos o filtro invertido das tentativas antigas de atualização forçada e a possibilidade de esconder um 401 por meio do cache. Atualização forçada de conta Free fica limitada a 20 tentativas por intervalo de frescor; renovação de autenticação respeita o orçamento já consumido pelo transporte. Respostas de conta trocada ou de um login anterior, inclusive com o mesmo UID e outra geração, não podem publicar sucesso ou restaurar cache após logout.

`vpn/engine/features.ts` assume carregamento agrupado de políticas e precedência entre instrução do dispositivo, preferência do usuário e padrão. Erros de armazenamento gerenciado não são convertidos em configuração permissiva. Os adaptadores conservam endpoints, formatos, traduções, flags e defaults específicos dos recursos; WebRTC obrigatório permanece. A extração não remove todo o código Proton.

Validação automatizada: **457 testes aprovados**, sendo 21 novos cenários de conta/configuração. Incluem caches legados, atualização Free/pago, resposta atrasada após logout, remoção durante gravação, troca de conta/login, falha de persistência, limite de atualização forçada, orçamento de autenticação e precedência/falha de políticas. Os contratos existentes de HTTP e interface foram adaptados para carregar o núcleo real. Build de produção, TypeScript do worker/interface, `check:ui`, whitespace e os quatro campos de versão iguais a 1.7.25 aprovados.

Validação nativa isolada: `node scripts/check-vpn-account-native.cjs` aprovado no **Windows / Edge 157.0.4341.46 / Node 24.20.0**, com perfil temporário, resolução externa bloqueada e respostas HTTP fictícias. Verificados: inicialização do worker de produção, leitura do cache legado, atualização de plano Free para pago, normalização da resposta da conta principal e persistência do vínculo de conta nos dois caches. O runner aguarda os contextos reais do worker e da página antes de consultar as APIs e remove seu perfil temporário ao terminar. Não usa Playwright nem conta pessoal.

Esta rodada não autentica nem conecta à Proton real, não mede pacotes e não amplia a certificação de privacidade. Repetir conta/plano/recursos e conexão na sessão pessoal após recarregar a extensão continua pendente, assim como os testes de falha descritos em [vpn-validacao-pc.md](vpn-validacao-pc.md). [Arquitetura e reprodução](vpn-engine.md#conta-plano-e-configurações-próprias--1725).

## Previsão de rede já desativada por outra extensão — 1.7.24

O usuário forneceu o diagnóstico `stage: proxy-apply`, `reason: VpnNetworkPredictionFailed` e a leitura nativa de `networkPredictionEnabled`: `{value: false, levelOfControl: "controlled_by_other_extensions"}`. O código exigia propriedade exclusiva da configuração, rejeitando o valor efetivo já desativado. Essa exigência explica a falha observada na etapa de aplicação do proxy; a conexão Proton completa ainda precisa ser repetida após atualizar.

A proteção agora aceita a previsão comprovadamente desativada por esta extensão, por outra extensão ou por política do navegador. Se a opção estiver disponível para controle, continua aplicando `false` e conferindo a leitura. O observador usa o mesmo critério e dispara a falha de privacidade se a previsão for ativada ou o estado deixar de ser confirmado. Valores ativos, ausentes e estados sem controle não são aceitos como proteção. A restauração não tenta alterar uma opção bloqueada por política e continua removendo somente a preferência desta extensão, sem habilitar a previsão ou alterar outra extensão.

A semântica de `value` e `levelOfControl` foi conferida na [documentação oficial de ChromeSetting/privacy](https://developer.chrome.com/docs/extensions/reference/api/privacy). O teste nativo em Edge com duas extensões temporárias reproduziu exatamente `false` com `controlled_by_other_extensions`: a proteção foi aceita e a reativação pela outra extensão disparou o observador de falha. As regressões também cobrem política que mantém a opção desativada, valores não protegidos e restauração. Nenhuma configuração pessoal ou de outra extensão foi alterada no Helium.

Validação final: **436 testes aprovados**, build de produção, TypeScript do worker/interface, `check:ui`, versões de manifest/projeto/lockfile iguais a 1.7.24 e whitespace sem erros.

## Diagnóstico local da conexão — 1.7.23

O usuário informou que o console e `getLogs()` não trouxeram registros da falha. O registro legado de serviço está condicionado a `debug`, desativado na configuração de produção. A indicação anterior de que esse comando bastaria para investigar a conexão era incompleta.

Foi acrescentado `getVpnDiagnostics()` ao worker. O comando retorna até 50 eventos recentes, somente com horário, etapa, resultado e código de uma lista fechada. As etapas cobrem leitura/aplicação do proxy, bloqueio, credenciais e sua validação, verificação do túnel e conexão confirmada. Falhas também geram um aviso `[Super VPN]` no console, mesmo com debug desativado. O erro original não é serializado ou enviado ao console; mensagens desconhecidas recebem `VpnConnectionFailed`. Não são coletados tokens, senhas, contas, IPs, servidores ou URLs. O histórico fica apenas na memória do worker e se perde quando ele reinicia; é necessário reproduzir a tentativa após recarregar a extensão.

A recusa da verificação do túnel agora recebe `VpnTunnelVerificationFailed` no diagnóstico; perda da configuração nessa etapa recebe `VpnProxyNotApplied`. A interface continua preservando o bloqueio de rede e sua mensagem genérica. Esta entrega permite identificar a etapa real, mas ainda não confirma a causa da falha da conta Proton pessoal.

Validação: **433 testes aprovados**, build de produção, TypeScript do worker/interface, `check:ui`, versões e whitespace. Os testes cobrem descarte de mensagens sensíveis, limite de 50 eventos, cópias independentes e a etapa correta nas sete esperas simuladas. Em Edge com perfil temporário e resolução de rede bloqueada, o worker compilado expôs `getVpnDiagnostics()` e retornou um array; não houve autenticação nem teste da sessão Proton pessoal.

## Chaves de teste nas dependências — 1.7.22

O Chromium sinalizou arquivos PEM dentro de `vendor/floccus-source/node_modules/public-encrypt/test`, pois a pasta principal do projeto também é usada para carregar a extensão sem compactação. Foram identificadas cinco fixtures públicas de testes do pacote: certificado, chave, par RSA e chave privada RSA criptografada. Nenhum desses arquivos é necessário aos pontos de entrada do pacote ou à extensão compilada.

O script `scripts/clean-dependency-fixtures.cjs` remove somente esses cinco arquivos locais conhecidos, sem percorrer ou remover outras chaves. `npm run setup:sync` agora executa essa limpeza após instalar as dependências. A execução local removeu cinco arquivos; a repetição removeu zero. Uma operação RSA de cifrar/decifrar usando `public-encrypt/browser.js` e chaves temporárias geradas em memória passou após a limpeza. A varredura completa da pasta não encontrou mais arquivos `.pem` ou `.key`. As chaves podem voltar com uma instalação direta das dependências que não use `setup:sync`; nesse caso, execute o script de limpeza.

Validação: **431 testes aprovados**, `check:ui`, versões de manifest/projeto/lockfile iguais a 1.7.22 e whitespace sem erros.

Esta manutenção não corrige nem valida a falha atual de conexão Proton relatada após a 1.7.21. Não foram alteradas a sessão pessoal ou as regras da VPN.

## Tentativa de conexão sem fim — 1.7.21

Após o relato de conexão permanente com CA-FREE#23, a revisão encontrou dois caminhos que sustentavam o sintoma: operações de conexão aguardadas sem prazo e falhas protegidas apresentadas novamente como “Conectando…”. A etapa exata que falhou na sessão Proton pessoal não foi capturada.

A tentativa agora tem prazo de 30 segundos e invalida respostas atrasadas. Falhas protegidas mantêm o servidor salvo e o bloqueio, mas passam a aparecer como “Conexão não concluída”, com opção de tentar novamente ou escolher outro servidor. O erro de prazo recebe texto traduzido. A recuperação automática aguarda pelo menos 20 segundos entre falhas; uma solicitação explícita permite nova tentativa. A liberação sem VPN continua exigindo confirmação.

As regressões simulam ausência de resposta em leitura do proxy, bloqueio, carregamento/obtenção/validação de credenciais, aplicação do proxy e liberação verificada; também cobrem cancelamento, respostas tardias, recuperação após conexão longa, falha antiga do bloqueio, cooldown e apresentação/restauração do estado público. O cenário de espera indefinida foi reproduzido antes da correção. Não houve novo teste na conta pessoal nem retomada de queda real, captura de tráfego, suspensão ou reinício do perfil autenticado.

Validação final: **431 testes aprovados**, build de produção, TypeScript do worker/interface, `check:ui`, quatro campos de versão iguais a 1.7.21 e whitespace sem erros. O runner nativo no Edge com perfil temporário aprovou os seis cenários de bloqueio/proxy/liberação, com zero pedidos diretos antes da liberação explícita; essa evidência continua restrita ao proxy local isolado e não comprova a recuperação da conta Proton pessoal.

## Abertura do login Proton 1.7.20

O usuário relatou `Error in invocation of tabs.create ... No matching signature` ao entrar na Proton. Foi identificado um caminho compatível com esse erro: o transporte aceita envelopes de aviso (`error.Warning`), e `requestFork` tratava qualquer resposta como URL. Assim, um objeto de aviso podia chegar ao helper de abas como propriedades de `tabs.create`. O conteúdo da resposta da sessão real não foi capturado; a causa específica desse relato permanece sem confirmação direta.

A resposta de `beginLogin` agora é validada na fronteira de login. Erros, inclusive avisos, são propagados antes de abrir uma aba; respostas inválidas recebem mensagem traduzida; apenas URL de autorização na origem Proton solicitada chega ao helper. Não são repetidos automaticamente pedidos de login nem alteradas sessões/credenciais.

Os quatro testes novos em `tests/vpn-login-tab.test.cjs` cobrem URL válida, aviso convertido anteriormente em propriedades inválidas da aba, respostas malformadas/origens e caminhos indevidos, e falha nativa após resposta válida. O teste de aviso reproduziu `No matching signature` antes da correção e passou depois. A suíte completa passou **423 testes**, além do build de produção, TypeScript do worker/interface, `check:ui`, consistência das quatro versões e whitespace.

Em Edge headless com perfil temporário e resolução de rede bloqueada, o bundle de produção foi exercitado com APIs nativas de abas e worker real. Apenas o estado inicial da interface foi simulado para exibir Entrar; no caso de sucesso, `beginLogin` usou a resposta real do worker e uma aba foi criada com `{url: string}`. No caso de aviso injetado, a interface mostrou o aviso e `tabs.create` não foi chamado. Não houve autenticação de uma conta pessoal nem retomada dos testes adiados de queda, captura de tráfego, suspensão e reinício do perfil autenticado.

## Repetição no Helium: regras por site e recuperação

Ainda em 12 de novembro de 2026, na 1.7.19, o agente retomou o controle e observou a conexão US-FREE#95 recuperada. Com autorização explícita para regras temporárias, foram medidas requisições novas no Helium:

| Configuração | Destino | Resultado externo e indicador |
| --- | --- | --- |
| Original: exclusão sem domínios | `www.cloudflare.com/cdn-cgi/trace` | US/MIA, usa VPN |
| Excluir `cloudflare.com` com subdomínios | `www.cloudflare.com/cdn-cgi/trace` | BR/GRU, não usa VPN |
| Incluir somente `cloudflare.com` com subdomínios | `www.cloudflare.com/cdn-cgi/trace` e `cloudflare.com/cdn-cgi/trace` | US/MIA, usa VPN nos dois destinos |
| Mesma inclusão, destino fora da lista | `one.one.one.one/cdn-cgi/trace` | BR/GRU, não usa VPN |
| Original restaurada: exclusão sem domínios | `one.one.one.one/cdn-cgi/trace` | US/MIA, usa VPN novamente |

As listas de inclusão e exclusão foram deixadas vazias, no modo original de exclusão, com regras ativadas, e a interface confirmou “Regras salvas”. As medições novas tinham timestamps diferentes; não foram consideradas respostas anteriores ainda visíveis durante recargas. Não foram publicados IPs ou dados de conta.

A tentativa anterior teve timeouts e bloqueios depois de salvar regras. Nela, uma navegação para o destino excluído abriu a página local; “Tentar reconectar” manteve o aviso de bloqueio até a página informar “Conexão VPN confirmada”. Houve outras tentativas ainda bloqueadas, antes da recuperação posterior. Esse comportamento observado não identifica a causa nem comprova ausência de tráfego direto durante as transições. Após a recuperação, os casos estáveis da tabela passaram sem alteração de código.

O runner nativo isolado foi repetido no Edge e passou novamente os seis cenários, com `directRequestsBeforeRelease:0`; os nove contratos de `tests/vpn-routing.test.cjs` também passaram. O `pktmon status` retornou **Acesso negado**, inclusive fora da sandbox. Assim, queda real com captura contínua, sockets já abertos, suspensão/reinício completo do perfil autenticado, confirmação/cancelamento da liberação e recursos de terceiros permanecem pendentes. O resultado aprovado das regras se limita aos destinos e estados estáveis da tabela.

## Proton real no Helium 1.7.19 — validação parcial

Em 12 de novembro de 2026, com fontes do commit `4ae6b9b`, a página de detalhes do Helium confirmou a extensão 1.7.19 carregada da pasta principal. Depois de nova autenticação feita pelo usuário, o painel reconheceu a conta e conectou ao US-FREE#95, em Miami. O diagnóstico Cloudflare mudou da referência sem VPN (BR/GRU) para US/MIA, com outro IP. A troca manual para CA-FREE#30, Montreal, foi seguida por uma terceira medição com IP diferente e localização CA/YUL. O indicador mostrou destino externo usando VPN e páginas internas fora dela.

No servidor dos EUA, o BrowserLeaks exibiu WebRTC “No Leak”, sem endereços WebRTC local/público, e oito resolvedores DNS de Datacamp/CDN77 em Miami. Não houve captura de pacotes, comparação DNS antes/depois nem referência IPv6 independente; esses resultados se limitam às páginas e ao estado saudável observados. Não comprovam proteção em todos os destinos, sockets existentes ou durante falhas.

O agente recarregou a extensão pela página de detalhes para reiniciar seu worker. O controle do computador foi interrompido por não conseguir determinar a URL atual com confiança; o usuário então confirmou **“conectou”**. Essa é evidência relatada de reconexão após recarga, sem comprovação da preservação do servidor ou da proteção durante a transição. A repetição acima acrescenta tráfego observado posteriormente, regras por site e uma recuperação pela página local. [Registro por cenário e limites](vpn-validacao-pc.md#registro-dos-resultados).

Não foram publicados IP residencial, identificador de conta, tokens ou capturas pessoais. Esta rodada registra evidências e mantém a versão 1.7.19; não altera a extensão.

## Execução no Windows 1.7.19

Após pull do commit `573eedc`, foram executados **419 testes automatizados**, todos aprovados, build de produção da VPN, TypeScript do worker/interface VPN, núcleo/aplicação da Nova guia e `check:ui`. As dependências locais Proton foram reinstaladas conforme o lockfile. O arquivo de avisos de licenças passa a ter checkout LF explícito para manter sua comparação reproduzível no Windows.

O runner nativo da VPN foi executado no **Microsoft Edge 157.0.4341.46, Windows**, headless, com perfil temporário, sem conta. Ele revelou que o proxy HTTP local gerava a diretiva PAC inválida `HTTP`, recebendo `DIRECT` na etapa saudável. A 1.7.19 usa `PROXY` para HTTP e mantém `HTTPS` para os servidores Proton; há um contrato de regressão. Após a correção passaram: bloqueio antes de conectar, passagem pelo proxy local, queda do proxy sem fallback direto, bloqueio após perda da configuração, persistência do bloqueio após reinício e liberação explícita. O destino recebeu zero pedidos diretos antes da liberação.

O bundle distribuído da Nova guia foi carregado em uma extensão mínima com armazenamento nativo e perfil temporário no mesmo Edge. Passaram: abertura de configuração preexistente fictícia com nota; adicionar/reordenar/reposicionar/remover widget pelo editor; upload de imagem local e recarga; idioma propagado entre duas abas; exportação v3; rejeição de importação futura preservando configuração e imagem; importação válida; notas, configuração e imagem após reiniciar o navegador. Não houve exceção de página nos documentos acompanhados. O runner reproduzível está em `scripts/check-newtab-native.cjs` e requer Playwright e `CHROMIUM_PATH`, assim como o runner da VPN.

Esses resultados cobrem o núcleo e os cenários isolados descritos, sem conferir dados pessoais existentes, o popup completo ou aparência de todos os temas. Permanecem pendentes login Proton, IP/DNS/WebRTC com túnel real, suspensão do PC, troca de servidor e regras por site no serviço, além da sincronização Google Drive entre instalações autenticadas. O teste HTTP local não comprova ausência de vazamentos no serviço Proton.

Exemplo no PowerShell, com Playwright disponível na resolução de módulos:

```powershell
$env:CHROMIUM_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node scripts/check-vpn-native.cjs
node scripts/check-newtab-native.cjs
```

## Nova guia: validação pelo usuário em casa — pendente

O usuário informou que fará os testes da 1.7.18 em casa e pediu apenas atualização da documentação neste momento. O [checklist da Nova guia](newtab-engine.md#próxima-ação-combinada-testes-em-casa--pendente) cobre configuração existente, editor/widgets, imagens locais, múltiplas abas, importação/exportação e reinício. Nenhum cenário manual novo foi marcado como aprovado. Esta atualização não executou testes, não alterou código e mantém a versão 1.7.18.

## Nova guia: primeira extração do Tabliss 1.7.18

A suíte completa passou **418 testes**, com 21 contratos novos do núcleo de estado/configuração/persistência, ações de widgets e importação/exportação. Eles cobrem importações inválidas sem apagar dados, v2/v3 e IDs, isolamento de namespace, filas e falhas de gravação, eco antigo, atualizações entre abas, imagens binárias reabertas em IndexedDB, migração com confirmação e inicialização do bundle de produção em DOM simulado. O núcleo não importa Tabliss/React; os componentes atuais usam suas fachadas.

Build da Nova guia, TypeScript do núcleo isolado e da aplicação adaptada, `check:ui` e `git diff --check` passaram. São testes simulados; a conferência com dados existentes, imagens, editor, várias abas e reinício no navegador pessoal continua pendente. [Responsabilidades, limites e reprodução](newtab-engine.md).

## Próxima execução no PC do usuário — pendente

O usuário pediu para documentar a validação com tráfego real e informou que solicitará a execução quando estiver em casa. O [roteiro de retomada](vpn-validacao-pc.md) registra preparação, ordem dos testes, critérios e tabela de evidências ainda não preenchida. Abrange IP/DNS/WebRTC, queda/bloqueio/aviso, troca de servidor, suspensão/reinício e reconexão/liberação explícita. Nenhum teste real novo foi executado nesta atualização documental.

## Dependências da VPN 1.7.17

O usuário informou que validou a navegação da 1.7.16. Nesta etapa foram atualizadas dependências compatíveis, removidos `decompress` e `archiver`, substituído o reempacotamento por ZIP em memória e corrigida a resolução AJV do Webpack. Instalação limpa (`npm ci --ignore-scripts --legacy-peer-deps`), build de produção, TypeScript do worker/interface, UI e whitespace passaram.

A suíte completa passou **397 testes**. Os sete novos contratos cobrem nomes com espaços/metacaracteres, preservação de caminhos e conteúdo sem extração, ordenação/data determinísticas em fusos diferentes, rejeição de caminhos inválidos preservando a origem, erro CLI sem sobrescrever destino, limite antes de descompressão, data inválida configuração desativada do cliente Sentry real atualizado e avisos completos/reproduzíveis de licenças das dependências de produção. [Versões e snapshots de auditoria](vpn-dependencias.md): zero alertas críticos/altos, 31 baixos/moderados em ferramentas; zero na árvore npm de produção. Isso não constitui certificação de segurança dos bundles ou da VPN. Conexão e tráfego reais continuam pendentes nesta versão.

## Redirecionamento com VPN conectada 1.7.16

O usuário relatou que todas as navegações abriam a página local já exibindo conexão confirmada. A correção declara a cobertura de navegação principal explicitamente na permissão de sessão e no bloqueio; o readback não aceita mais uma lista vazia legada como comprovação dessa cobertura.

A suíte completa passou **390 testes**, com três regressões novas: seleção de redirecionamento/permissão por tipo real do pedido e prioridade, rejeição da permissão legada com exclusões vazias e rejeição da permissão sem `main_frame`. Os contratos anteriores de tipos e reordenação também foram ajustados. Compilação de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram.

Esta rodada usou APIs simuladas e a semântica de tipos DNR. Não foi medida uma conexão Proton nem executado o runner nativo. Após carregar a 1.7.16, conferir em navegador real abertura de sites conectado, nova falha, reconexão e liberação explícita, além da validação de tráfego/IP/DNS já pendente.

## Página de bloqueio 1.7.15

A suíte completa passou **387 testes**: 15 contratos novos verificam carregamento sem comandos automáticos, tentativa que mantém o bloqueio, confirmação de liberação e readback, falhas/resultado desconhecido, consulta atrasada durante liberação, temas/idiomas e descarte, motivo sem dados do serviço, recuperação indisponível após desconectar/logout, recurso público inerte quando embutido, geração alterada, falha de leitura do guard, prioridades da página/permissão/WebTransport, atualização de regras antigas rejeição de destino adulterado e inicialização do bundle de produção da página. Os testes usam DOM, worker e DNR simulados.

Compilação de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. O runner nativo `scripts/check-vpn-native.cjs` foi atualizado para verificar o redirecionamento local antes da conexão, após perda de configuração e após reiniciar. Ele preserva a verificação de falha do proxy sem fallback direto. **O runner não foi executado nesta etapa**, e continuam pendentes a instalação real, o redirecionamento DNR, a notificação clicável, login, reconexão e medições IP/DNS/tráfego. Não há certificação de ausência de vazamentos.

## Prazos de armazenamento e mensagens 1.7.14

A suíte completa passou **372 testes**. Os 15 contratos novos cobrem leitura sem resposta e nova tentativa, descarte de resposta tardia, escrita que vence o prazo sem liberar a fila, remoção após conclusão tardia, leitura vencida atrás de escrita pendente, recuperação após rejeição, cancelamento de consultas ao enviar comando, deduplicação de comandos pendentes, sanitização de erros, callbacks/Promises nativos, ausência de política versus timeout, logout após falha de leitura, política sem cache permissivo interface com estado não confirmado e nova consulta e compatibilidade com a Promise do módulo de sincronização (sem `finally`). Os testes anteriores foram adaptados para executar o novo adaptador compartilhado.

Build de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. Foram usados IO e APIs nativas simulados; não foram executados login, conexão Proton, captura de IP/DNS ou testes nativos de suspensão/reinício. A validação real permanece pendente, conforme a auditoria abaixo. Página de bloqueio e atualização de dependências ficam para etapas seguintes.

## Revisão de privacidade 1.7.13 — aprovação real pendente

A suíte completa passou **357 testes**, além de build, TypeScript do worker/interface, UI e whitespace. Foram adicionados testes de bloqueio durável/liberação por sessão, falhas/readback, cancelamento de autenticação, probe HTTPS sem credenciais, PAC obrigatório sem DNS, previsão de rede, alertas de privacidade, ícone vermelho e liberação explícita no painel.

A tentativa de execução nativa com Chromium foi bloqueada por `socket() failed: Operation not permitted`. Nenhum resultado de IP, DNS, tráfego Proton ou ausência de vazamentos é declarado. O runner isolado está em `scripts/check-vpn-native.cjs`. [Achados, correções, riscos residuais e roteiro de aprovação](auditoria-vpn.md). A extensão não substitui um kill switch/firewall do sistema operacional.

## Login e WebRTC próprios 1.7.12

A suíte completa passou **329 testes**, com 22 novos testes de login/privacidade e ampliação da validação de origens. Compilação de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. Foram exercitados o núcleo e os adaptadores reais com rede/armazenamento/APIs simulados: nonce/URL do serviço, TTL, suspensão, consumo único, duplicatas, logout/novo login durante troca, dados inválidos, erros de armazenamento, confirmação pública sem segredos, escrita/restauração WebRTC ordenadas, propriedade efetiva, erros de callback e UI antiga após desconexão.

O usuário relatou funcionamento aparente da 1.7.11 e pediu uma revisão minuciosa posterior. Essa revisão continua pendente. Na 1.7.12 ainda faltam login/MFA e sessão reais, teste de IP/WebRTC com tráfego, restauração da preferência no navegador, conflito com outra extensão, encerramento/reinício e cenários de falha nativa. Esta rodada não realizou login nem mediu vazamento real. Abas de autorização iniciadas antes da atualização devem ser reabertas pela extensão.

## Catálogo e seleção próprios 1.7.11

A suíte completa passou **307 testes**: 28 novos contratos de catálogo/seleção e ampliação do contrato de recente manual. Compilação de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. A suíte executa o núcleo e os adaptadores v1/v2/estado reais com rede e armazenamento simulados: cache por conta/plano, requisições concorrentes, 304, falhas transitórias, logout durante busca/escrita, descarte de respostas antigas, inserção por ID, persistência de carga, ranking estável, disponibilidade, tier, failover e restauração de uma escolha manual não automática.

O usuário confirmou funcionamento da 1.7.10 antes de autorizar esta etapa. A conexão Proton real, manutenção de um servidor manual, failover automático e reinício do navegador ainda precisam ser conferidos na 1.7.11. Não foi realizado login real nem medido IP/tráfego nesta rodada.

## Transporte HTTP próprio 1.7.10

A suíte completa passou **279 testes**, incluindo 29 contratos HTTP novos e um contrato adicional para integração com credenciais. Compilação de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. Foram executados o núcleo, a fachada API e o adaptador HTTP reais com rede e armazenamento simulados; o SessionStore próprio foi exercitado no refresh concorrente. Testes cobrem prazos e cancelamento durante envio/corpo/refresh, cabeçalhos sem mutação e com token renovado, preservação de erros/builders/304/binário, upgrade, bloqueio HTML sem exposição do corpo, Retry-After entre instâncias, isolamento entre contas/métodos e ausência de repetição automática de mutações.

O usuário confirmou funcionamento da 1.7.9 antes de autorizar esta etapa. Essa confirmação é evidência manual relatada, sem logs específicos. A API Proton real e seus redirecionamentos/cabeçalhos/limites não foram acessados nesta rodada; login, troca de servidor e refresh reais precisam ser conferidos novamente na 1.7.10.

## Credenciais temporárias próprias 1.7.9

A suíte completa passou **249 testes**, incluindo 27 contratos novos de credenciais. A compilação de produção, as checagens TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. Os testes exercitam o núcleo próprio e os adaptadores de protocolo/armazenamento reais com rede e APIs nativas simuladas. Cobrem concorrência, TTL e expiração JWT da resposta nova, cache legado, renovação em wake, timeout, erros transitórios, reautorização limitada, logout/troca de conta durante pedidos e gravações, armazenamento sem confirmação e isolamento entre páginas da extensão.

O usuário informou ter validado a versão 1.7.8 antes de autorizar esta etapa; não forneceu logs ou resultados separados por cenário. Esta confirmação não cobre a nova renovação 1.7.9: conta Proton real, passagem pelo prazo de renovação e suspensão/reinício nativos continuam pendentes nesta versão. Não foram usados tokens reais nem houve alteração de dados de uma conta durante a implementação.

## Indicador após troca manual de servidor 1.7.8

A suíte completa passou **222 testes**. Os dois contratos novos reproduzem o ícone perdido com a fonte 1.7.7 e passam com a correção: troca manual cujos eventos intermediários são agrupados, seleções sucessivas com mesma cor e mudança do proxy sem mudança de cor/estado. Cobrem tanto o indicador verde quanto o azul, perda de controle e preservação do badge de pausa. O cache de ações por aba agora inclui a revisão da conexão, fornecida pelo worker a partir de `connectionLifecycle.capture()`; eventos de alteração do proxy invalidam as ações aplicadas. Os pixels renderizados continuam em cache, sem recriar o desenho em cada troca.

Compilação de produção, TypeScript do worker/interface, `check:ui` e `git diff --check` passaram. As APIs e o canvas são simulados; não foi observada uma troca com conta Proton real nesta rodada.

## Limpeza Geral 1.7.7

Rótulos Geral e Arm. Local, submenu com cinco colunas e automação/pausa restritas a Geral. Os contratos existentes de navegação e idioma verificam a visibilidade do rodapé e as novas traduções. Conferência visual nativa continua limitada pelo ambiente já documentado.

## Abas e exceções de limpeza 1.7.6

A suíte completa passou **220 testes**. As novas verificações executam o popup em JSDOM e o worker com APIs simuladas: listas independentes, inclusão/remoção, importação de favoritos com destino e contagem de duplicados por lista, restauração da aba, troca de idioma sem perda de rascunhos, ações manuais visíveis somente em O que apagar, exclusão global de histórico independente das exceções, origem com porta e cancelamento antes de qualquer remoção se houver lista inválida. Snapshots manuais antigos preservam as novas listas armazenadas quando os campos forem omitidos. `build:ui`, `build:i18n`, `check:ui` e `git diff --check` passaram.

A tentativa de conferência visual no Chromium local foi bloqueada por `socket() failed: Operation not permitted`. Não houve exclusão real de dados do navegador nesta rodada. Conferir geometria e preservação real de cache/localStorage em perfil de teste permanece pendente. O escopo por origem segue [browsingData](https://developer.chrome.com/docs/extensions/reference/api/browsingData).

## Alternância de servidores 1.7.5

A suíte completa passou **214 testes**. Os sete contratos novos cobrem intervalo após troca automática (impedindo verificação imediata do próximo servidor), respostas v2 sem status, integração com os status binários já decodificados, dados ausentes, cache `_up` obsoleto, visibilidade independente da disponibilidade, IDs numéricos/textuais, falha ao buscar cargas e detecção de indisponibilidade v1. O helper de saúde e os adaptadores reais são executados com IO simulado. Compilação de produção, TypeScript do worker/interface e `check:ui` passaram. Não foi acessada uma conta Proton nem observada uma conexão real durante esta correção.

## Estado e recuperação da VPN 1.7.4

A suíte completa passou **207 testes**. Compilação de produção, checagens TypeScript do worker/interface e `check:ui` passaram. Máquina de estados extraída para `vpn/engine/state.ts`, com dependências de IO/protocolo injetadas. A suíte cobre restauração única, comandos durante a inicialização, prontidão sem esperar rede, credenciais tardias após desconexão/logout, alteração de servidor/regras, avisos de rede e retomada por wake, perda de proxy, falhas de permissão, throttling e retomada de retry adiado, verificações de saúde atrasadas, limpeza repetida após falha e persistência ordenada. Os contratos do adaptador executam a nova máquina real com transporte simulado. Não foi acessada uma conta Proton nem validado tráfego/IP real; esse limite permanece.

## Abertura da VPN 1.7.2

A suíte completa passou **183 testes**. Os sete novos contratos cobrem a primeira renderização conectada com carregamento de rede pendente, estados realmente conectando/desconectados, logout durante a leitura inicial, ausência de segredos no resumo público e inicialização do painel antes da barreira de primeiro frame. O shell pré-consulta o worker e acompanha eventos durante o carregamento dos scripts; uma resposta inicial antiga não sobrepõe desconexão/logout. O adaptador não deduz conexão em andamento da mera presença de servidor salvo.

A mensagem `connectionState` entrega somente resumo público do servidor, estado e erro de apresentação; confirma o proxy no navegador e não busca plano ou lista de servidores. Conta e servidores podem continuar carregando sem trocar o cartão conectado por um spinner. Abrir o painel não envia comando `connect`. O estado não é persistido como uma tela conectada para a próxima abertura. Quando o worker ainda está restaurando uma conexão, ela continua sendo apresentada como conectando.

Compilação de produção, checagens TypeScript e `check:ui` passaram. A evidência desta rodada usa APIs simuladas/JSDOM; não foi medida a primeira pintura de um popup nativo com conta Proton. A limitação de inicialização nativa registrada na rodada 1.7.1 permanece.

## Indicador VPN 1.7.1

A suíte completa passou **177 testes**; os seis testes do indicador passaram, incluindo três cenários novos de navegação/recarga sem mudança de cor, ativação/substituição de aba e eventos em sequência. O teste remove o estado de action do navegador simulado antes do evento de conclusão, inclusive quando a URL não muda. Os testes novos reproduzem a perda do ícone com a fonte 1.7.0 e passam com a correção. Perder o controle do proxy agora restaura ícone/título normais, em vez de exibir azul com a mensagem de VPN ativa.

O cache `applied` era mantido apenas por aba/cor/idioma. O Chromium limpa valores de action da aba ao navegar entre documentos ([código do navegador](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/extensions/extension_action_runner.cc)); o cache passa a ser invalidado em mudanças de URL, início/conclusão da carga, ativação e substituição da aba. Eventos pendentes têm revisão própria para descartar trabalho ultrapassado. O badge de pausa não é modificado.

A tentativa de validar uma extensão isolada no Chromium 156 desta rodada foi bloqueada na inicialização por `socket() failed: Operation not permitted`. Portanto, a evidência nova é automatizada com APIs simuladas e inspeção da implementação do Chromium; não comprova login/tráfego real nem uma execução nativa desta versão. `check:ui`, consistência de versões e `git diff --check` passaram.

## Motor VPN 1.7.0

A suíte completa passou **174 testes**, incluindo 20 novos contratos da VPN. A compilação de produção, as checagens TypeScript do worker/interface e `check:ui` passaram. Os novos contratos exercitam o controlador próprio, gerações, recuperação por alarmes e persistência/rotação de tokens. Incluem cancelamento enquanto credenciais ou `settings.set` estão pendentes, troca rápida de servidor, erro de `set/get/clear`, perda de controle, rollback, notificações somente após confirmação, desafios de host/porta incorretos e refresh/fork concluídos após logout. Há testes que executam o `state.ts` e o interceptor reais com portas simuladas. Não foi acessada uma conta Proton nem medido tráfego/IP nesta rodada. O restante da máquina de estados e do transporte continua no adaptador.

## Alinhamento e opacidade 1.6.11

Após recompilar a nova guia, os controles foram medidos no Helium com perfil temporário, em viewports de 1280, 520 e 320 px. Ambos ficaram a 12 px do topo, com 46 px de altura e borda inferior em 58 px. A barra esquerda ficou em 50% de opacidade em repouso e em 100% com hover e foco de teclado. Não houve exceção de página nos estados verificados. `check:ui` e a conferência de consistência das quatro versões passaram. Esta rodada de CSS usou a verificação direcionada no navegador, sem repetir a suíte completa.

## Barra de controles 1.6.10

Conferida no Helium com perfil temporário nos temas claro e escuro. A barra acompanha a superfície do tema, tem raio de 12 px e botões de 36 × 36 px com nomes acessíveis. Foram exercitados a abertura de configurações por Enter, fechamento por Escape, alternância dos widgets e entrada/saída de tela cheia. Não houve exceções de página nos cenários verificados. Os 17 testes existentes de imagens da nova guia e componentes visuais passaram.

## Ajustes visuais 1.6.9

Os 17 testes de imagens da nova guia e componentes visuais passaram. A nova guia foi recompilada e conferida no Helium com perfil temporário. Em larguras de 520 e 320 px, os campos de idioma e fuso horário ficaram separados por 12 px sem estouro horizontal. O botão nativo de arquivos reservou 12 px até o texto do arquivo. O editor do Unsplash não exibe mais o controle de pausa; o componente de créditos da página inicial permanece inalterado. Não foram usadas contas ou credenciais pessoais.

## Evidência disponível

A suíte da versão 1.6.8 passou **154 testes** com `npm test`. Além da cobertura anterior dos motores, preferências e interfaces, foram adicionados contratos dos componentes HTML/DOM, Vue e React, semântica de formulário, modelos, referências, conteúdo seguro e correspondência dos artefatos estáticos com suas fontes. O teste de exportação de logs agora aceita as quebras de linha nativas do Windows e do Linux. Nenhuma conta real foi acessada durante os testes.

| Área | Cobertura automatizada | Limite da evidência |
| --- | --- | --- |
| Limpeza e abas | Exceções, importação de domínios, falhas, pausa, recuperação e transições de abas com APIs simuladas | Não comprova encerramento nativo nem tempo de conclusão antes de o navegador fechar |
| Sincronização atual | Bundle da interface em JSDOM, perfis, rascunhos, backup de perfis, assistente e bloqueio | Não comprova autenticação e sincronização com contas reais |
| Núcleo próprio Drive | Reconciliação, escrita condicional, bloqueios, aplicação local, criptografia, migração de IDs, dois dispositivos e injeção de falhas nos checkpoints | Transporte, armazenamento e favoritos são simulados; ainda não comprova o serviço real |
| VPN | Interface/adaptador, isolamento, limites de plano, regras, estados e indicador por aba | Não comprova túnel, IP, WebRTC ou recuperação no serviço real |
| Interface compartilhada | Contratos HTML/DOM/Vue/React, comparação de estilos e temas, artefatos estáticos e testes de idioma/navegação | JSDOM não mede geometria; a conferência real abaixo cobre somente os estados descritos |

A ponte VPN também passou novamente pela checagem TypeScript na rodada 1.6.8. Para repeti-la, use o compilador das dependências Proton com `--noEmit -p vpn/tsconfig.interface.json`.

Em rodadas anteriores, o Chromium não iniciou por `socket() failed: Operation not permitted`. Na 1.6.8, foi possível executar o Helium em modo headless com um perfil temporário, separado do perfil pessoal. Foram carregados os bundles reais da extensão e conferidos os estados abaixo, sem login Google/Proton nem credenciais pessoais.

| Estado medido no Helium | Resultado |
| --- | --- |
| Abertura nativa por `chrome.action.openPopup()` | Popup de 520 px, conteúdo de 520 px, controles compartilhados disponíveis após o carregamento |
| Perfis de sincronização e VPN sem login | Painéis de 480 px sem estouro horizontal |
| Novo perfil de sincronização | Seleção de serviços abriu e permitiu navegação interna |
| Conexões OAuth | Campos com 6 px entre texto do rótulo e input; navegação interna preservada |
| Chave GIPHY na nova guia, viewports de 520 e 320 px | 6 px entre rótulo e campo, 12 px até a descrição e entre botão e link; sem estouro horizontal no bloco |

Não houve exceção de página não tratada nos cenários medidos. As capturas locais foram inspecionadas durante a implementação. O teste do popup nativo usou janela de 1280 px; o popup mantém largura mínima de 520 px, portanto janelas menores que essa largura não estão cobertas por esse resultado. Não foram medidos todos os widgets, diálogos, temas, estados conectados ou tempos de rede. Os registros históricos de Edge nas versões 1.3/1.4 também não certificam os cenários restantes.

## Evidência relatada pelo usuário

Em **11 de novembro de 2026**, após a publicação da **1.6.2**, o usuário confirmou “Deu certo agora” no fluxo de sincronização Google Drive que havia retornado erro. O cenário em discussão era um perfil com a raiz geral do navegador. Essa é uma confirmação de uso real relatada pelo usuário, separada dos testes automatizados. Navegador/versão, sistema operacional e quantidade de favoritos não foram informados nesse teste. Não comprova os cenários de dois dispositivos, falhas, criptografia, retomada ou ausência de duplicações por inspeção detalhada; eles permanecem no checklist.

## Reproduzir a suíte

Node.js 20 ou superior, na raiz:

```sh
npm ci
npm run setup:vpn
npm run setup:newtab
npm run setup:sync
npm test
npm run check:ui
```

A instalação das dependências Proton é necessária ao teste CSS que usa PostCSS. As dependências Tabliss são necessárias aos testes React das imagens da Nova guia; as dependências Floccus são necessárias aos contratos Vue. Para reconstruir a sincronização, execute também `npm run setup:sync`, seguido de `npm run build:sync-engine` (worker) e `npm run build:sync` (interface).

Ao alterar o motor Proton, execute `npm run build:vpn`. Para alterar somente sua interface, use `npm run build:vpn-ui`. Esses comandos exigem `setup:vpn`. Recompilações da Sincronização usam `setup:sync` e `setup:vpn`, pois também geram os estilos dos painéis.

## Checklist manual

Use perfis de teste e favoritos fictícios. Registre a versão instalada e o resultado; os passos abaixo são verificações pendentes, não operações já executadas.

### Layout e preferências

- [ ] Abrir todas as abas, assistentes e diálogos nos temas claro, escuro e sistema e em PT-BR/inglês.
- [ ] Conferir aba de reserva e configurações da Nova guia com tema explícito diferente do sistema e após mudança do sistema.
- [ ] Rolar com mouse/teclado e ajustar a altura do popup ao mínimo e máximo.
- [ ] Confirmar cabeçalho/submenus fixos, ausência de rolagem horizontal e acesso aos últimos controles.
- [ ] Focar buscas, campos e países pela tecla Tab; conferir o contorno inteiro.
- [ ] Expandir/recolher países da VPN, incluindo nomes longos; conferir as setas dos dois estados.
- [ ] Fechar/reabrir o popup e verificar seção, página da VPN e rolagem preservadas.

### Google Drive

- [ ] Configurar OAuth para o endereço mostrado em Conexões e autorizar um perfil de teste.
- [ ] Sincronizar pelo botão normal e conferir migração de IDs sem duplicações.
- [ ] Criar, editar, mover, reordenar e remover alguns itens nos dois lados, usando duas instalações de teste.
- [ ] Conferir conflito no mesmo campo e uso deliberado de Enviar/Receber uma vez.
- [ ] Conferir a proteção para exclusão total/grande antes de qualquer alteração.
- [ ] Validar arquivo ausente, nomes duplicados, autorização revogada, bloqueio de outro dispositivo e revisão rejeitada.
- [ ] Conferir o conteúdo criptografado após sincronizar um perfil com senha.
- [ ] Fechar o popup durante a execução e depois interromper o worker; conferir retomada sem criar cópias repetidas.
- [ ] Inspecionar backup, diário e logs sem publicar favoritos pessoais ou credenciais.
- [ ] Confirmar que outros provedores e perfis de abas continuam no legado.

### VPN

- [ ] Autorizar uma conta de teste, conectar e conferir o IP por um serviço externo escolhido para o teste.
- [ ] Testar os modos excluir e incluir, com domínio exato e subdomínios.
- [ ] Confirmar verde para endereço roteado e azul para endereço fora do túnel; navegar e trocar de aba.
- [ ] Conferir páginas internas, rede local e modo anônimo autorizado.
- [ ] Desconectar e verificar retorno do ícone original, preservando a pausa da limpeza.
- [ ] Testar perda de rede, reinício e tomada do proxy por outra extensão/política.
- [ ] Conferir as regras/PAC próprios da 1.6.5 no tráfego real: inclusão/exclusão, subdomínios, redes locais e API de login.

### Limpeza, abas e Nova guia

- [ ] Fechar a última janela pelo X e verificar o relatório na próxima abertura.
- [ ] Interromper uma limpeza de teste e conferir a recuperação posterior.
- [ ] Conferir cookies protegidos e escopo da limpeza com dados fictícios.
- [ ] Conferir várias janelas e as reservas criadas pela extensão.
- [ ] Exportar/importar configurações da Nova guia e selecionar novamente imagens próprias.
- [ ] Salvar chaves válidas de Unsplash/GIPHY nas opções do fundo e conferir imagens, créditos, limites e repetição após falhas reais.

## Registro de novas evidências

Para cada rodada manual, registre: data, versão/commit, navegador/versão, sistema, cenário, dados fictícios usados e resultado observado. Não inclua senhas, tokens, arquivos de perfis com credenciais ou favoritos pessoais em logs e capturas publicados.

As próximas entregas e os critérios para substituir os motores estão em [PROXIMOS-PASSOS.md](../PROXIMOS-PASSOS.md).
