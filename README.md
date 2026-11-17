# Super Extensão

<img src="icons/icon128.png" width="88" height="88" alt="Ícone da Super Extensão">

Extensão pessoal para Helium e navegadores Chromium, com Nova guia, sincronização de favoritos, VPN no navegador, limpeza ao sair, controle de autoplay e proteção da última aba.

**Versão instalada: 1.7.51.** Documentação revisada em 17 de novembro de 2026. Temas escuro, claro e sistema; idiomas PT-BR e inglês compartilhados entre os módulos. Requer Chromium 116 ou superior, conforme o manifest.

Para investigar uma falha da VPN, abra `chrome://extensions`, localize a Super Extensão e inspecione o **service worker**. Na aba Console, reproduza a tentativa e execute `getVpnDiagnostics()`. Os últimos 50 eventos registram somente horário, etapa, resultado e código conhecido, sem credenciais ou dados da conta; falhas novas também aparecem como avisos `[Super VPN]`. Esse histórico é temporário e reinicia com o worker. `getLogs()` é o registro legado, dependente de debug, e pode estar vazio.

Na **1.7.46**, a identidade visual usa **#121015** como base escura, superfícies grafite e destaques em branco suave. O símbolo S/escudo substitui a marca anterior no popup, Nova guia/editor, aba de reserva, favicons, notificações e ícones da VPN. O SVG é recortado nos limites do desenho, sem título nem margem de prancheta; na 1.7.47, os PNGs quadrados também têm fundo transparente, mantendo somente o símbolo e suas proporções. [Paleta, arquivos e reconstrução](docs/identidade-visual.md).

Na **1.7.49**, as listas dos seletores usam a paleta compartilhada, opções espaçadas, cantos arredondados e visto na seleção em navegadores com seletor personalizável. Teclado, formulário e mudança de valor continuam sob o controle nativo; navegadores antigos mantêm o seletor convencional.

Na **1.7.50**, os dois controles superiores da Nova guia compartilham fundo, blur, borda, sombra e opacidade (50% em repouso e 100% no hover/foco).

Na **1.7.51**, a interface atrás das opções escurece enquanto um seletor está aberto; fechar a lista remove o efeito. As opções voltam a acompanhar o tema escolhido. O botão da logo na Nova guia deixa de herdar o brilho de hover dos botões comuns, preservando a borda/superfície compartilhada com a barra esquerda.

## Estado atual

| Área | Implementado | O que ainda depende de trabalho |
| --- | --- | --- |
| Interface | Componentes comuns HTML/DOM, Vue e React; árvore de pastas, assistente, editores, diálogos, progresso e erros unificados | Ampliar a conferência visual para todos os diálogos e estados com contas reais |
| Sincronização | Google Drive/favoritos pelo núcleo próprio; Git e perfis de abas pelo motor legado | Convergência entre dois navegadores confirmada pelo usuário; faltam falhas/reinícios, restauração de backups por interface e migração do conector Git |
| Núcleo Google Drive | Reconciliação, escrita condicional, criptografia, backup e retomada pelo diário | Ampliar a validação real relatada pelo usuário, medir grandes importações e suportar pastas sobrepostas |
| VPN | Interface, regras, controlador de proxy, estado/recuperação, credenciais temporárias, transporte HTTP, catálogo/seleção, WebRTC e coordenação de login próprios | Revisão minuciosa e validação real; contratos do serviço e adaptadores Chromium/Proton permanecem |
| Limpeza, Autoplay e Abas | Controles locais e testes automatizados | Validar fechamento nativo e recuperação no Helium |
| Nova guia | Núcleo próprio de estado/configuração/persistência, importação/exportação, dashboard, editor, catálogo e sessões dos plugins | Extrair componentes/provedores, controles e inicialização e validar dados existentes no navegador real |

O roteiro com prioridades e critérios de conclusão fica em [PROXIMOS-PASSOS.md](PROXIMOS-PASSOS.md). A cobertura e as limitações dos testes ficam em [docs/validacao.md](docs/validacao.md).

## Instalar ou atualizar

1. Baixe o repositório em **Code → Download ZIP** e extraia-o, ou clone:

   ```sh
   git clone https://github.com/thequerobin/super-extensao.git
   ```

2. Abra `chrome://extensions/`, ative **Modo do desenvolvedor** e escolha **Carregar sem compactação**.
3. Selecione a pasta que contém `manifest.json` e mantenha-a em um local permanente.
4. Após atualizar os arquivos, clique em **Recarregar** no cartão da extensão. Recarregue sites já abertos para aplicar os scripts de autoplay e abra uma Nova guia para carregar o dashboard atualizado.

Os arquivos compilados já estão no repositório: instalar a extensão não exige Node.js nem compilação. Desative outras extensões que executem as mesmas rotinas ou disputem a Nova guia e o proxy. Acesso em modo anônimo depende da autorização separada do navegador.

## Usar

### Preferências e navegação

Em **Módulos**, ative somente o que você usa: Limpeza, Autoplay, Abas, Sincronização, VPN e Nova guia. Alterar um interruptor salva e recarrega a extensão automaticamente; recarregue páginas já abertas para atualizar as integrações. Os dados e as configurações são preservados para reativação. A atualização mantém todos os módulos ligados por padrão, até você escolher.

Desligar a VPN desconecta e libera proxy, WebRTC e bloqueios de tráfego controlados pela extensão. Sincronização desligada não inicia o motor nem os agendamentos. Uma sincronização em andamento precisa terminar ou ser cancelada antes de mudar módulos. A Nova guia desligada abre uma página simples, sem dashboard, widgets ou conexões externas; a substituição da guia pelo manifesto permanece. Arquivos e permissões fixas continuam no pacote. [Funcionamento e limites](docs/modulos.md).

Tema e idioma ficam no cabeçalho e atendem toda a extensão. Limpeza, Sincronização e VPN têm submenus fixos; o conteúdo interno continua rolável sem barras visíveis. Arraste a alça inferior para ajustar a altura do popup. A seção selecionada é preservada; a VPN também guarda sua página e rolagem.

Na **1.7.39**, as configurações são salvas automaticamente, sem botões Salvar: perfis e OAuth da sincronização, regras da VPN e chaves de imagens da Nova guia. Campos inválidos e falhas de gravação mostram um aviso; corrija ou use Tentar novamente. Selecionar uma pasta já aplica a seleção, e fechar o diálogo não desfaz uma alteração aplicada. Criar perfis, adicionar regras, importar e remover dados continuam sendo ações explícitas.

A [biblioteca de componentes](docs/ui-components.md) centraliza estrutura, botões, campos, grupos de ações, cartões, avisos e espaçamento. Popup, sincronização, VPN, editor da nova guia e aba de reserva consomem essa base por seus adaptadores. A sincronização usa Vue 3 e controles HTML nativos; a Nova guia usa React. Os motores existentes permanecem. Detalhes da migração e das dependências em [docs/sync-migration.md](docs/sync-migration.md).

### Sincronização de favoritos

Em **Sincronização → Novo perfil**, escolha o serviço e a pasta. A interface oferece somente **Google Drive e Git**, com favoritos ou abas conforme o perfil, agendamento, sincronização manual, backup de perfis e ações direcionais avançadas. Ações que substituem dados exigem atenção ao sentido escolhido.

Para Google Drive, configure ID e segredo do cliente OAuth próprios em **Conexões**, usando o endereço de redirecionamento exibido. Configure repositório, branch e credenciais do Git no próprio perfil.

Na **1.7.36**, os demais serviços foram desativados no cadastro, na importação e na execução manual/automática. Perfis antigos permanecem disponíveis para exportação ou remoção; suas credenciais e seus dados não são apagados. Um backup que contenha serviços desativados é recusado por inteiro antes de criar perfis.

**Motor próprio Google Drive (1.6.3):** os perfis de favoritos usam `sync/engine` no botão **Sincronizar** e no agendamento existente. O núcleo faz leitura, reconciliação de três versões, escrita condicional, criptografia compatível, backup e aplicação local com checkpoints. Conflitos incompatíveis e exclusões grandes são interrompidos; as ações avançadas permitem escolher o sentido. O painel de comparação foi removido. Perfis com a raiz geral preservam as pastas permanentes e sincronizam seu conteúdo.

Os perfis existentes são aproveitados, incluindo cache e mapeamentos quando consistentes. Git e perfis de abas continuam no legado; cadastro, OAuth interativo e a estrutura de agendamento ainda usam a camada de compatibilidade. Pastas sobrepostas entre perfis são recusadas por enquanto. Os backups ficam no armazenamento local; ainda não há tela de restauração.

Veja [a interface e a compatibilidade](docs/sync-interface.md) e [o escopo do novo motor](docs/sync-engine.md). Perfis exportados podem conter credenciais; guarde esses arquivos como configurações privadas. Backup de perfis não equivale a backup dos favoritos.

### VPN

Na **1.7.34**, o switch **Bloquear também sites que não usam VPN quando ela cair**, em Recursos, permite manter os sites fora da VPN acessíveis durante falhas. Começa ligado; desligado, respeita o modo de inclusão/exclusão e subdomínios. A alteração é salva e aplicada automaticamente. Sites que exigem VPN continuam bloqueados até a confirmação da conexão.

A **1.7.31** compartilha os fluxos completos de importação e edição de domínios, a lista de regras do autoplay e as confirmações dos módulos. Também cancela desafios do próprio proxy durante a restauração inicial quando o endpoint ainda não pode receber credenciais. A correção desse caso passou em navegador nativo com proxy fictício local; ainda falta confirmar o cenário no perfil pessoal.

Na **1.7.27**, importe domínios de uma pasta de favoritos em **VPN → Recursos**, com prévia, subpastas opcionais e duplicados ignorados. A coleta reaproveita o código da limpeza. A importação aplica automaticamente a lista ao modo selecionado (exclusões ou inclusões). Em exclusões, esses sites navegarão fora da VPN quando o tunelamento dividido estiver ativo.

Na **1.7.26**, a página de bloqueio oferece **Voltar à página** depois que a VPN é confirmada. O clique confere novamente a conexão e reabre o endereço na mesma aba; não há retorno automático. O atalho aparece para novas navegações GET interceptadas após atualizar. Páginas de bloqueio antigas, abertas manualmente ou originadas de POST não oferecem o botão; formulários e pagamentos não são reenviados.

A **1.7.25** extrai consulta/cache de conta, política Free/pago e resolução das configurações de recursos para o núcleo próprio. Preserva as chaves e preferências existentes, ordena remoção do cache no logout e descarta respostas de uma sessão anterior. Endpoints, formatos, traduções e adaptadores Proton continuam presentes. O worker compilado foi validado em perfil temporário com dados fictícios; falta repetir a conta real.

Abra **VPN** e entre na conta pela página oficial Proton. O proxy atende este navegador; a disponibilidade dos servidores e a autorização continuam sob controle do serviço e do plano da conta.

**Motor 1.7.17:** máquina de estados, restauração, novas tentativas e gerenciamento de credenciais temporárias, transporte HTTP e catálogo/seleção próprios; operações de proxy ordenadas e confirmadas no navegador, descarte de conexões tardias após desconectar, recuperação por alarmes e persistência/rotação de tokens próprias. WebRTC e a coordenação de login também usam o núcleo próprio. A página oficial e os contratos/adaptadores do serviço permanecem. [Arquitetura e limites](docs/vpn-engine.md).

Na **1.7.11**, a escolha manual é preservada ao recuperar a conexão; verificações de saúde não trocam automaticamente um servidor escolhido pelo ID. Se ele estiver indisponível, escolha outro manualmente. O modo mais rápido mantém o failover quando há indisponibilidade confirmada.

Na **1.7.12**, o worker coordena o login com estado aleatório de validade de 15 minutos e consumo único; logout e uma nova tentativa invalidam respostas antigas. As escritas de proteção WebRTC são ordenadas e confirmadas. Abas de login abertas antes desta atualização precisam ser reabertas pelo botão **Entrar**. A revisão minuciosa em navegador continua pendente.

Servidores ficam agrupados por país, inicialmente recolhidos, com bandeiras locais, filtros, pesquisa e carregamento em lotes. Os controles locais aparecem antes da busca de servidores terminar. Conta e plano também podem consultar a rede. Em **Recursos → Tunelamento dividido**, escolha excluir sites ou incluir somente os sites listados, com subdomínios opcionais.

Na **1.7.2**, abrir o painel consulta primeiro o estado real do worker e do proxy. Se a conexão já estiver confirmada, o cartão abre como conectado, sem inferir “conectando” de um servidor salvo; conta e servidores carregam separadamente. Não é guardada uma tela conectada em disco.

A **1.7.17** atualiza as dependências compatíveis da VPN e substitui o empacotador vulnerável. A árvore npm da VPN fica sem alertas críticos/altos; ainda há alertas baixos/moderados nas ferramentas de desenvolvimento. [Versões, licenças, auditoria e reprodução](docs/vpn-dependencias.md).

A **1.7.16** corrige o redirecionamento indevido para o aviso mesmo com a VPN conectada: a permissão de sessão e o bloqueio declaram explicitamente os tipos de recurso, incluindo navegação principal. Regras antigas sem essa cobertura não contam como liberação confirmada.

A **1.7.15** adiciona uma página local de proteção para novas navegações durante o bloqueio. Ela permite consultar o estado, tentar recuperar a conexão ou confirmar a liberação sem VPN. O aviso obrigatório e o painel também abrem essa página. A página não repete a navegação nem envia formulários automaticamente.

A **1.7.14** limita esperas de armazenamento e mensagens ao worker, mostra estado não confirmado e permite consultar novamente. Gravações nativas continuam ordenadas mesmo depois de expirar o prazo da interface; logout não é ultrapassado por uma gravação atrasada. Comandos de resultado desconhecido não são reenviados automaticamente. [Prazos e limites](docs/vpn-engine.md#prazos-de-io--1714).

A **1.7.13** adiciona bloqueio de emergência: durante falhas detectadas, a rede dos sites é pausada, inclusive os excluídos, e aparecem aviso obrigatório de privacidade, ícone vermelho e ação para liberar explicitamente sem VPN. A página de conta Proton e chamadas da extensão ficam como exceções de recuperação. A nova permissão `declarativeNetRequest` é necessária. WebTransport fica bloqueado enquanto a proteção está armada.

**A revisão encontrou e corrigiu riscos, mas não certificou ausência de vazamentos.** O ambiente impediu os testes nativos com Chromium; há limites na detecção assíncrona e no encerramento de sockets. Para exigir um kill switch de rede no sistema, use VPN/firewall do sistema operacional. Veja a [auditoria e validação pendente](docs/auditoria-vpn.md).

O ícone acompanha a aba:

- **Verde com visto:** conexão confirmada e endereço da aba roteado para a VPN.
- **Azul com traço:** conexão confirmada e endereço fora do túnel.
- **Vermelho:** VPN interrompida ou bloqueio de segurança acionado; abra o painel antes de continuar.
- **Ícone original:** sem conexão confirmada e sem bloqueio sinalizado.

O sinal fica no canto superior direito, preservando o badge de limpeza pausada. Na 1.7.1, ele é reaplicado após navegação/recarregamento e ativação da aba, mesmo quando a cor continua igual; perda de controle do proxy restaura o ícone normal. Ele representa o roteamento configurado, sem medir tráfego ou verificar externamente o IP. Páginas internas não usam o túnel. Veja [uso e integração](docs/proton-vpn.md) e [interface, indicador e limites](docs/vpn-interface.md).

### Nova guia

Na **1.7.48**, o botão Super Extensão da Nova guia volta a ter fundo translúcido e desfoque, com maior opacidade ao passar o mouse ou focar pelo teclado, mantendo a nova paleta e logo.

Na **1.7.45**, o editor completo (fundos, widgets, aparência, idioma/fuso e importação/exportação/reset) usa `newtab/editor`; registro, nomes, descrições, disponibilidade por plataforma e ordenação do catálogo usam `newtab/engine/catalog.ts`. A lista acompanha o idioma atual. Os componentes funcionais dos widgets/provedores ainda são adaptadores do Tabliss, assim como os controles visuais compartilhados, ícones e seletor de fuso. Os painéis de cada plugin recebem sessões próprias, com descarte de gravações tardias; fechar o editor invalida importações e confirmações de reset pendentes. IDs, formatos JSON e imagens existentes são preservados.

Na **1.7.44**, a composição do dashboard, agrupamento/ordenação visual e o ciclo de montagem/descarte dos widgets usam `newtab/dashboard` e o núcleo próprio. Sessões descartadas ignoram gravações tardias e liberam seus indicadores de carregamento; um provedor ausente não derruba os demais widgets. Editor, catálogo, componentes e provedores continuam adaptados do Tabliss. Layout, IDs e armazenamento existentes são preservados.

Na **1.7.37**, fusos inválidos no backup são recusados antes de alterar configurações/imagens; dados antigos corrompidos usam o horário local para manter o dashboard e o editor acessíveis. A varredura passou 506 testes e validações nativas com perfil temporário. As dependências selecionadas foram corrigidas sem troca de versão principal; permanecem alertas nas bibliotecas legadas e ferramentas. [Relatório de integridade e limites](docs/auditoria-integridade.md).

A **1.7.36** incorpora correções selecionadas do Tabliss: novo serviço HTTPS do widget de IP, com validação/erros e cache existente preservado; alinhamento dos links recolhidos; números do relógio com largura fixa; link do calendário para o perfil GitHub; e localização das fotos Unsplash com compatibilidade para o formato anterior. O widget de IP consulta `ipwho.is` somente quando adicionado ao dashboard, e sua informação pode permanecer em cache pelo intervalo configurado; ele não comprova o roteamento da VPN. [Avaliação das origens](docs/atualizacoes-origens.md).

A **1.7.18** extrai estado, configuração, persistência, ações de fundos/widgets e importação/exportação para `newtab/engine`. O dashboard, editor e componentes dos widgets continuam baseados no Tabliss 2.6.0 adaptado. Mantém PT-BR/inglês, os dados existentes e o fundo inicial local. [Escopo, compatibilidade e limites da extração](docs/newtab-engine.md). A engrenagem abre o editor; o botão **Super Extensão** abre os controles da extensão. A importação substitui a configuração do dashboard; imagens próprias precisam ser selecionadas novamente.

Preferências usam `tabliss/config` em `storage.sync`; imagens e cache usam IndexedDB e não sincronizam pelo JSON. Unsplash/GIPHY permitem configurar a chave nas opções do fundo, salva apenas neste dispositivo; sem chave, exibem a orientação correspondente. [Carregamento de imagens e configuração](docs/newtab-images.md). Provedores online dependem dos serviços e de suas cotas. O envio de erros do Tabliss ao Sentry foi desativado. Veja [as modificações](newtab/MODIFICATIONS.md).

### Limpeza, Autoplay e Abas

Por padrão, apenas o histórico é selecionado para limpeza. A limpeza é tentada ao fechar a última janela; se interrompida, há recuperação na próxima abertura. O resultado só é registrado após as APIs terminarem com sucesso. **Limpar agora** funciona mesmo com a automação pausada.

Na **1.7.41**, as abas **Cookies**, **Cache** e **Armazenamento local** oferecem **Excluir da limpeza** (preservar a lista) e **Incluir na limpeza** (limpar somente a lista). No modo de exclusão, **Limpar lista de exclusão** remove todos os sites dessa lista após confirmação, sem limpar dados dos sites naquele momento. Cada tipo mantém duas listas independentes, salvas automaticamente; as exceções antigas continuam no modo de preservação. Uma inclusão vazia não apaga dados daquele tipo. Em Favoritos, escolha o tipo e o modo de destino antes de importar, sem alterar os favoritos. Cookies abrangem o domínio registrável inteiro; cache e localStorage usam o endereço informado em HTTP/HTTPS, com entradas separadas para outros subdomínios e portas. Os históricos e formulários continuam globais. [Funcionamento e validação](docs/limpeza-por-site.md). **Última limpeza** e **Limpar agora** aparecem somente em **Geral**. Arquivos baixados, senhas salvas e histórico da Conta Google não são apagados.

Autoplay inicia com padrão **Bloquear**, com regras por domínio/subdomínio. Interação real libera mídia naquele quadro até a próxima navegação. Permitir na extensão continua sujeito às restrições nativas do navegador; páginas internas e protegidas não aceitam os scripts.

A proteção da última aba mantém uma reserva criada pela extensão e preserva abas fixadas pelo usuário. Para encerrar e iniciar a limpeza, feche a janela pelo **X** ou saia do navegador. Não há garantia de a limpeza terminar antes do encerramento do processo.

## Permissões e dados

| Permissão | Uso |
| --- | --- |
| `browsingData` | Limpeza selecionada |
| `storage`, `alarms`, `notifications`, `background` | Preferências, agendamentos, recuperação, avisos e execução em segundo plano |
| `tabs`, `tabGroups`, `bookmarks` | Abas, site atual, indicador VPN, sincronização e importação manual de domínios |
| `unlimitedStorage`, `identity` | Cache e autenticação OAuth |
| `proxy`, `privacy`, `idle` | VPN, proteção WebRTC e recuperação da conexão |
| `scripting`, `webRequest`, `webRequestAuthProvider` e acesso HTTP/HTTPS | Integração da VPN, autenticação do proxy e scripts de controle de mídia |

Limpeza, autoplay e proteção de abas são locais. Sincronização, VPN e widgets online usam os serviços configurados. Os módulos preservam os espaços de armazenamento `superSync:`, `superVpn:` e `tabliss/config`, separados das preferências locais de limpeza/abas/autoplay. O núcleo Google Drive mantém tokens em memória e não os inclui nos backups, checkpoints ou logs de erro.

## Desenvolvimento e testes

Node.js 20.9 ou superior. Para instalar as dependências da suíte:

```sh
npm ci
npm run setup:vpn
npm run setup:newtab
npm run setup:sync
npm test
npm run check:integrity
```

`setup:vpn` também fornece o PostCSS usado nos testes da base visual. Para editar e compilar a Sincronização, instale adicionalmente `npm run setup:sync`. Esse comando também remove cinco chaves/certificados de teste de `public-encrypt`, desnecessários para a extensão e sinalizados pelo Chromium ao carregar a pasta do projeto. Se as dependências já estiverem instaladas, execute `node scripts/clean-dependency-fixtures.cjs` para aplicar somente essa limpeza.

| Alteração | Comando |
| --- | --- |
| Ícones PNG a partir do SVG da marca | `npm run build:icons` |
| Templates estáticos e controles DOM do popup | `npm run build:ui` |
| Todas as interfaces, após instalar as três dependências de origem | `npm run build:interfaces` |
| Conferir artefatos estáticos | `npm run check:ui` |
| Interface da Sincronização | `npm run build:sync` |
| Worker com núcleo Google Drive próprio | `npm run build:sync-engine` |
| Somente interface da VPN | `npm run build:vpn-ui` |
| Motor Proton e interface VPN | `npm run build:vpn` |
| Estilos incorporados dos painéis | `npm run build:panels` |
| Catálogos globais | `npm run build:i18n` |
| Nova guia | `npm run setup:newtab` e `npm run build:newtab` |

`build:sync` recompila somente a interface; o worker próprio usa `build:sync-engine`. `build:vpn` preserva `vpn/source` e recompila o motor e a interface. Os dois módulos usam dependências da origem; consulte [a documentação da interface Sync](docs/sync-interface.md) e [da VPN](docs/vpn-interface.md) antes de alterar o processo.

A execução da **1.7.13 passou 357 testes**, incluindo contratos dos adaptadores e APIs simuladas. A interface foi conferida na rodada 1.6.8 no Helium com perfil temporário, sem contas pessoais; isso não comprova tráfego VPN nem sincronização com os serviços reais. O usuário confirmou a sincronização real com Google Drive na versão 1.6.2; os cenários avançados permanecem pendentes. [Cobertura e checklist manual](docs/validacao.md).

As fontes das páginas estáticas ficam em `ui/templates/`; `popup.html`, `spare-tab.html`, `newtab/index.html` e `ui.js` são gerados por `build:ui`. Consulte [os contratos e adaptadores](docs/ui-components.md) antes de alterar componentes. Incremente a versão conforme `AGENTS.md` ao entregar alterações instaláveis.

## Documentação

- [Guia rápido](LEIA-ME.md)
- [Próximos passos e critérios de conclusão](PROXIMOS-PASSOS.md)
- [Motor da VPN: contratos, primeira etapa e próximas substituições](docs/vpn-engine.md)
- [Novo motor de sincronização](docs/sync-engine.md)
- [Interface da Sincronização](docs/sync-interface.md)
- [Integração VPN](docs/proton-vpn.md) e [interface VPN](docs/vpn-interface.md)
- [Componentes e idioma compartilhados](docs/ui-components.md)
- [Validação e limitações](docs/validacao.md)

## Créditos

### Repositórios das extensões de origem

Origens registradas no projeto; a verificação histórica dos repositórios abaixo ocorreu em 9 de novembro de 2026. A referência Proton consta da documentação de integração:

| Extensão | Identificador na loja | Repositório público confirmado |
| --- | --- | --- |
| Auto Clear History on Exit (Kuuloa) | `hfdaikgklefacppkadgkncadaoehnlla` | Não foi encontrado um GitHub público confirmado. A análise e a adaptação usaram os arquivos da instalação local, versão 2.0.9. |
| AutoplayStopper (MV3) | `gcendpekmacfohmhhkbhejjfbepkkkib` | [kenijo/AutoplayStopperMV3](https://github.com/kenijo/AutoplayStopperMV3) |
| Don't Close Window With Last Tab | `dlnpfhfhmkiebpnlllpehlmklgdggbhn` | [moneytoo/DontCloseWindowWithLastTab](https://github.com/moneytoo/DontCloseWindowWithLastTab) |
| Tabliss | `hipekcciheckooncpjeljhnekcoolahp` | [joelshepherd/tabliss](https://github.com/joelshepherd/tabliss) — versão integrada: 2.6.0 |
| Floccus | `fnaicdffflnofjppbagibeoednhnbjhg` | [floccusaddon/floccus](https://github.com/floccusaddon/floccus) — versão integrada: 5.13.0 (MPL-2.0) |
| Proton VPN | — | [ProtonVPN/proton-vpn-browser-extension](https://github.com/ProtonVPN/proton-vpn-browser-extension) — fonte e licença GPL-3.0 preservadas |


A ausência de um repositório confirmado para a extensão de limpeza não significa que ele não exista; apenas não foi localizado na verificação acima.


O worker de limpeza e as traduções foram adaptados da [Auto Clear History on Exit 2.0.9](https://chromewebstore.google.com/detail/auto-clear-history-on-exi/hfdaikgklefacppkadgkncadaoehnlla), de Kuuloa.

As funções de autoplay e proteção da última aba foram reimplementadas após a análise de [AutoplayStopper (MV3)](https://chromewebstore.google.com/detail/autoplaystopper-mv3/gcendpekmacfohmhhkbhejjfbepkkkib) e [Don't Close Window With Last Tab](https://chromewebstore.google.com/detail/dont-close-window-with-last/dlnpfhfhmkiebpnlllpehlmklgdggbhn). Este projeto é independente e não é uma versão oficial dessas extensões.

A página Nova guia incorpora [Tabliss 2.6.0](https://github.com/joelshepherd/tabliss/tree/2.6.0), de Joël Shepherd e colaboradores, com licença GPL-3.0, avisos de dependências e código-fonte incluídos. As modificações da integração são identificadas em `newtab/MODIFICATIONS.md`; esta não é uma publicação oficial do Tabliss.
