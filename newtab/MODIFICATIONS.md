# Tabliss 2.6.0 na Super Extensão

## Extração final — Super Extensão 1.7.55

A Nova guia usa o código e o lockfile deste diretório, com inicialização Chromium e build mantidos pela Super Extensão. Os widgets, fundos e componentes adaptados preservam a atribuição do Tabliss 2.6.0 e os avisos GPL-3.0. Os namespaces de armazenamento, o cache, os IDs dos plugins e os formatos de configuração foram preservados.

## Identidade visual — Super Extensão 1.7.46

A marca do editor e do botão principal usa o SVG S/escudo do host. A paleta compartilhada adota #121015 e tons grafite, incluindo o fundo da Nova guia antes de carregar. O gradiente padrão sem cores salvas passa a #121015 nas duas pontas; cores/imagens explicitamente salvas permanecem. Tema claro continua disponível. O vetor não contém título ou margem de prancheta; os PNGs mantêm as proporções em um quadrado.

## Editor e catálogo — Super Extensão 1.7.45

O editor foi transferido a `newtab/editor`, com contexto de serviços explícito, ações próprias, modelos compatíveis e sessões próprias para os painéis de plugins. O catálogo passa a registrar IDs, nomes/descrições, suporte a backdrop e disponibilidade no destino web em `newtab/engine/catalog.ts`; o fornecedor fornece somente o mapa de componentes. As entradas antigas são fachadas. Posições, aparência, dados/imagens e JSON continuam compatíveis. Extraídas as folhas de estilo com atribuição; o componente inativo Persist foi removido. Widget desconhecido continua removível; um fundo desconhecido pode ser substituído. Importação/confirmação de reset pendentes não são aplicadas após fechar o editor. Componentes/provedores internos e adaptadores visuais ainda permanecem na árvore Tabliss; não há declaração de independência completa.

## Dashboard e sessões — Super Extensão 1.7.44

Composição, agrupamento, estilo dos widgets e projeção reativa do dashboard passam a `newtab/dashboard` e `newtab/engine/dashboard.ts`. `plugin-session.ts` controla cada instância montada: descarta gravações tardias e libera carregamentos pendentes no descarte, inclusive em foco/remoção e remonta StrictMode. Os antigos componentes de composição foram removidos; o caminho Dashboard original é um adaptador para bancos, catálogo, overlay e apresentação de erros. Estilos foram preservados com atribuição GPL. Editor, catálogo, controles do overlay, componentes dos widgets e suas rotinas internas de timers/rede continuam adaptados do Tabliss.

## Primeira extração do núcleo — Super Extensão 1.7.18

Estado reativo, defaults, ações de configuração, validação/conversão v2/v3, importação/exportação, fila de persistência e coordenação de migração usam `newtab/engine`. Os módulos nos caminhos antigos são fachadas para esse núcleo. O adaptador de plataforma preserva `tabliss/config`, IndexedDB/cache e preferências compartilhadas. Importação inválida não limpa mais o estado antes de ser validada; gravações são ordenadas e a origem legada só é removida após confirmação. Dashboard/editor e widgets/provedores ainda usam Tabliss. [Escopo e limites](../docs/newtab-engine.md).

## Alinhamento dos controles — Super Extensão 1.6.11

A barra esquerda e o botão direito usam o mesmo recuo superior/lateral de 12 px e altura de 46 px, inclusive em telas estreitas. A barra esquerda tem opacidade de 50% em repouso, com 100% ao passar o mouse ou focar um controle pelo teclado. O movimento reduzido desativa a transição. Os comportamentos dos botões foram preservados.

## Barra de controles — Super Extensão 1.6.10

A barra de configurações, widgets e tela cheia passa a usar `UiActions` e `UiButton`. Removidos o azul fixo e o fundo de hover herdados, adotando paleta, borda, raio e foco do projeto. As ações agora são botões nativos de 36 px, com nomes acessíveis, estados pressionados e ícones decorativos de 16 px. Os controles ficam visíveis; atalhos S/W/F, carregamento, erros e ações existentes foram preservados. Conferido nos temas claro e escuro no Helium com perfil temporário.

## Ajustes visuais — Super Extensão 1.6.9

Separados os campos de idioma e fuso horário por 12 px, usando o agrupamento compartilhado `UiStack`. Adicionada margem entre o botão de seleção de arquivos e seu texto. Removido o atalho de pausa/reprodução das configurações Unsplash, mantendo o controle na página inicial e preservando a configuração de pausa existente.

## Componentização — Super Extensão 1.6.8

O editor, as configurações dos fundos/widgets e seus controles auxiliares usam `newtab/src/ui/index.tsx`, adaptador React do catálogo em `ui/catalog.json`. O painel de chaves Unsplash/GIPHY usa os componentes compartilhados de campo, descrição, ações e aviso. Valores controlados, eventos, cache e armazenamento permanecem nos componentes funcionais existentes. A página `index.html` passa a ser gerada de `ui/templates/newtab.html` por `npm run build:ui`.

Para reconstruir, use a raiz completa do projeto e `npm run build:newtab`; o catálogo de componentes compartilhados fica em `ui/`. [Arquitetura e comandos](../docs/ui-components.md). Fontes, licenças e atribuições da origem permanecem preservadas.

Este diretório contém a Nova guia baseada no Tabliss 2.6.0, com núcleo próprio de configuração/persistência desde a 1.7.18 e componentes de interface/provedores ainda adaptados do original GPL-3.0. O texto da licença está em [LICENSE.txt](LICENSE.txt), os avisos das dependências em [main.js.LICENSE.txt](main.js.LICENSE.txt) e o código-fonte correspondente em [src](src/).

Origem: [joelshepherd/tabliss, tag 2.6.0](https://github.com/joelshepherd/tabliss/tree/2.6.0), commit `a273d6329cec1f0813e04fde907111e648821946`. O bundle de produção foi obtido da instalação 2.6.0 do Tabliss, ID `hipekcciheckooncpjeljhnekcoolahp`. A atribuição, os avisos e a licença do componente permanecem neste diretório e no código-fonte correspondente.

## Alterações em 2026-11-09

- Entrada HTML adaptada para `newtab/`, com caminhos relativos, ícone da Super Extensão e viewport com zoom permitido.
- Botão separado para abrir as configurações de limpeza, autoplay e abas da Super Extensão, sem modificar os controles nativos do dashboard.
- Envio de erros ao Sentry desativado: DSN vazio e `enabled: false`, tanto no bundle quanto em `src/errorHandler.ts`.
- Fundo inicial alterado de Unsplash para o gradiente local do próprio Tabliss, tanto no bundle quanto em `src/db/state.ts`. Todos os provedores originais continuam disponíveis nas configurações.
- `publicPath` do código-fonte ajustado para `./`, para gerar recursos relativos ao subdiretório.
- Na Super Extensão 1.2.1, logo do painel substituída pela marca própria. O painel usa largura de 460 px, os componentes visuais do projeto e sua preferência de tema Escuro/Claro/Sistema. A personalização visual dos widgets no dashboard não é alterada.
- Blocos de solicitação de armazenamento persistente, apoio/doação/links sociais e crédito de tradução removidos da interface, conforme solicitado. Importação, exportação e reset continuam disponíveis. As alterações de markup também estão em `src/views/settings/Settings.tsx` e `src/views/shared/Logo.tsx` no snapshot de fonte.
- Na versão 1.3.0, o dashboard foi recompilado a partir da fonte. A interface passou a contar com catálogos completos de PT-BR e inglês; os demais idiomas e suas listas auxiliares foram removidos. Os textos de interface são traduzidos na origem, sem inspecionar nem substituir conteúdo digitado pelo usuário. Foram traduzidos também os nomes exibidos dos ícones, mantendo seus identificadores internos.
- O idioma padrão passou a ser PT-BR. Configurações antigas são normalizadas para PT-BR ou inglês, preservando os demais dados. A troca de idioma atualiza o painel, os nomes dos widgets e a formatação de data/hora.
- A compilação Chromium usa uma entrada Node multiplataforma e Dart Sass no lugar de `node-sass`; um ponto e vírgula incompatível no Sass original foi corrigido.

Os widgets, o editor, os provedores, as traduções e a importação/exportação originais foram mantidos. A configuração usa o namespace original `tabliss/config` em `storage.sync` e o cache original `tabliss/cache` em IndexedDB, separados das configurações locais de limpeza/abas/autoplay. Imagens próprias são mantidas pelo armazenamento do dashboard. A limpeza da Super Extensão não solicita a remoção de dados de extensões.

Os provedores e widgets online fazem suas próprias requisições aos serviços escolhidos; podem estar sujeitos à disponibilidade e às cotas desses serviços. Não há migração automática da instalação separada do Tabliss: use a exportação/importação na interface original.

## Código-fonte e reconstrução

Na raiz do projeto, execute `npm run setup:newtab` seguido de `npm run build:newtab` com Node.js 20 ou superior. O build gera os bundles, estilos e avisos diretamente em `newtab/`, preservando a entrada HTML e o manifesto da extensão.

As chaves de Unsplash e GIPHY definidas na interface continuam armazenadas no navegador. Em builds com chaves configuradas via arquivo, use `newtab/.env` conforme `newtab/.env.example`.

## Super Extensão 1.6.6 — Imagens e diagnóstico

- Unsplash/GIPHY validam chaves, status HTTP, JSON e imagem antes de acessar os campos. O pacote anterior enviava chaves `undefined`; agora a ausência de chave é mostrada na interface, sem enviar a requisição.
- Campos de chaves próprios nas opções dos fundos, guardados apenas em `chrome.storage.local` sob `superNewtab:imageProviders`, sem exportação nem sincronização.
- Erros com opção de tentar novamente, manutenção da última imagem/créditos válidos, descarte de respostas atrasadas e correção do cursor para lotes pequenos.
- Removidas as requisições GIPHY duplicadas; todos os carregamentos terminam o indicador em sucesso/falha. URLs temporárias têm descarte corrigido.
- `npm run setup:newtab` e `npm run build:newtab` preparam/reconstroem o módulo sem substituir a integração HTML nem o manifesto principal.

As instruções e os limites estão em [docs/newtab-images.md](../docs/newtab-images.md). Nenhuma chave de terceiros foi adicionada ao repositório; Unsplash/GIPHY precisam de credenciais válidas do serviço.

## Correções selecionadas do upstream — 1.7.36

A comparação da tag 2.6.0 com `765a3f0b10968ee6e3a9ddf5c5360960fb4bf0ee` foi avaliada em 15/11/2026. Foram adaptadas a troca do serviço de IP para `https://ipwho.is/`, a centralização dos links recolhidos com múltiplas colunas, os números tabulares do relógio, o link para o perfil GitHub e a seleção dos elementos auxiliares do calendário, e o campo `location.name` do Unsplash (mantendo `title` como fallback).

O widget de IP preserva formato/cache, timestamp e intervalo configurado; valida HTTP/JSON e `success`, limita a espera a 30 segundos, não envia cookies e apresenta erro traduzido sem expor respostas do serviço. Falhas preservam o cache anterior e liberam o indicador de carregamento; respostas após desmontar/trocar configuração são ignoradas. O cache não é uma prova do roteamento VPN atual. Não foram incorporados novos widgets, motores de busca, idiomas ou a atualização geral das dependências. Detalhes e fontes em [atualizacoes-origens.md](../docs/atualizacoes-origens.md).

## Varredura de integridade — 1.7.37

O núcleo valida o fuso global e os fusos dos widgets de relógio antes de importar um backup, incluindo v2. Strings inválidas são recusadas sem substituir configurações/cache. O adaptador de horário usa `newtab/engine/time.ts` para manter uma data válida quando o armazenamento antigo contém valores inválidos ou o conversor falha. O horário local é o fallback; o editor continua acessível para corrigir o fuso.

O lockfile atualiza pacotes selecionados dentro das faixas existentes: nanoid 3.3.20, @babel/runtime e @babel/traverse 7.29.14, webpack 5.112.2, form-data 3.0.5, loader-utils 2.0.4, proxy-addr 2.0.8 e websocket-driver 0.7.5. As dependências transitivas correspondentes foram resolvidas pelo npm; não houve migração de versão principal. Builds, licenças extraídas, testes e validação nativa foram refeitos. [Relatório e alertas restantes](../docs/auditoria-integridade.md).

## Remoção de Sentry — 1.7.38

Removido `@sentry/browser`, o inicializador de telemetria e a chamada de captura no limite de erros dos widgets. O componente local `Crashed` continua tratando falhas e permitindo acesso ao editor. O bundle foi recompilado; esta mudança não altera configurações nem formatos de backup.

## Chaves de imagens automáticas — 1.7.39

Unsplash/GIPHY gravam a chave local ao editar ou limpar, sem Salvar. A leitura inicial bloqueia o campo até concluir; falhas de leitura podem ser repetidas sem sobrescrever uma chave desconhecida. Gravações do registro compartilhado são serializadas, e respostas antigas não alteram o estado de um novo formulário. O aviso mostra gravação/erro e permite nova tentativa. A imagem aguarda pausa de 300 ms na digitação para repetir a requisição; a persistência não espera essa pausa.

## Módulo opcional — 1.7.40

O HTML usa `newtab/loader.js` para verificar o interruptor antes de executar dashboard/polyfills/integração. Desligada, a Nova guia mostra uma página simples com acesso às configurações, sem montar widgets ou acessar provedores. A substituição declarada no manifesto continua. Notas, configuração, imagens e chaves não são removidas.
