# Interface de sincronização — referência 1.6.8

## Componentização 1.6.8

As telas usam os componentes `Ui*` do catálogo comum para campos nativos, cartões, avisos, ações, formulários e navegação. Os controles validados e compostos passam pelos adaptadores `Sync*` em `sync/source/components/ui/engine.js`. Esses adaptadores estendem os controles Vuetify e preservam eventos, modelos, validações, slots, referências e relações entre componentes. A aparência da biblioteca fica em `ui/vue.css`; o layout das telas permanece em `sync/source/interface.css`.

O registro ocorre em `sync/source/index.js`. Para mudar um controle comum, altere o adaptador ou o catálogo, em vez de replicar a implementação em cada provedor. Os fluxos de perfis, rascunhos, backup, autorização e os motores não foram alterados por essa migração. [Catálogo, fontes e compilação](ui-components.md).

A aplicação fica em `sync/source`. Os perfis Google Drive de favoritos executam o núcleo próprio de `sync/engine` pelo worker; Git e perfis de abas continuam no Floccus adaptado de `vendor/floccus-source`. O bloco de comparação foi removido em 1.6.0. Cadastro, autenticação interativa e comandos da interface mantêm a camada de compatibilidade.

## Telas

- **Perfis:** estado vazio, busca por nome/serviço/pasta, status, última sincronização, opções e sincronização manual. Enviar/receber uma única vez ficam em ações avançadas, com confirmação do sentido da operação. Cancelamento, autorização, execução forçada e logs continuam disponíveis conforme o estado do perfil.
- **Novo perfil:** seleção de serviço em cartões e assistente para nome, conexão, pasta e comportamento. Oferece somente Google Drive e Git, mantendo a seleção de favoritos ou abas do motor atual.
- **Backup:** importação e exportação de perfis. O arquivo pode conter credenciais e não é uma cópia dos favoritos. Perfis existentes são selecionados ao abrir a tela.
- **Conexões:** configuração OAuth própria para Google Drive. As credenciais e o repositório Git ficam no perfil.

Tema e idioma acompanham as preferências compartilhadas. As telas internas não abrem outras abas. O login dos provedores continua usando o fluxo externo autorizado pelo respectivo serviço.

## Compatibilidade e origem

Na 1.7.36, `sync/providers.cjs` define Google Drive e Git como os únicos provedores disponíveis. O worker bloqueia sincronização, verificação e agendamento dos demais; ao carregar/desbloquear, desativa seus gatilhos preservando configuração, credenciais e armazenamento. Perfis antigos aparecem desativados, permitem backup e remoção confirmada, mas não edição, autorização ou sincronização. Backups com qualquer serviço removido são recusados por inteiro antes de criar perfis. O campo OAuth Dropbox antigo é preservado no armazenamento, sem exibi-lo. Adaptadores históricos e licenças permanecem na fonte para leitura dos dados antigos.

As chaves `superSync:`, os IDs de perfil, os formatos de importação/exportação, alarmes e mensagens `super-sync` foram mantidos. Atualizar a interface não exige migração nem recriação de perfis. A edição usa um rascunho; sair sem salvar não altera o perfil carregado. As telas de perfis e credenciais só montam após consultar o bloqueio do motor.

A interface usa Vue/Vuetify e inclui formulários e fluxos de autenticação adaptados do Floccus, sob MPL-2.0. Não é uma reimplementação integral de todos os componentes. Os créditos, licença e fonte original continuam disponíveis em `sync/LICENSE.txt`, `sync/MODIFICATIONS.md` e `vendor/floccus-source`.

`sync/source/store/actions.js` é a fronteira dos comandos com o motor existente. A compilação resolve `@sync-engine` para `vendor/floccus-source/src/lib`. Os componentes de pastas, tradução e autorização ainda usam auxiliares dessa API; a futura troca do motor precisará substituir esses contratos também.

## Compilar

Na raiz, com Node.js 20 ou superior:

```sh
npm ci
npm run setup:sync
npm run setup:vpn
npm run build:sync
npm test
```

`setup:vpn` instala as dependências já utilizadas pelo compilador compartilhado de estilos dos painéis. Não é necessário recompilar a VPN.

`build:sync` gera `sync/js/options.js`, `sync/js/options.css` e os recursos de fonte, copia `sync/source/interface.css` para `sync/theme.css` e recompila `popup-panels.css`. O worker é recompilado separadamente por `npm run build:sync-engine`, a partir de `sync/engine/background-entry.js`. Os arquivos compilados ficam no repositório; instalar a extensão descompactada não exige Node.js.

Para alterar as telas, edite `sync/source`, e não as telas antigas em `vendor/floccus-source/src/ui`. A configuração antiga `webpack.super.cjs` continua disponível para a origem histórica, mas não deve ser usada para substituir o bundle da interface própria.

## Validação

A suíte Node inclui testes DOM do bundle de produção com JSDOM e APIs Chromium simuladas: navegação, idioma, Google Drive/Git, configuração OAuth isolada, leitura de perfis existentes, rascunhos antes/depois de salvar, seleção na exportação, confirmação de sincronização direcional, criação Git e recusa de cadastro/importação de serviços removidos, e bloqueio das telas quando o motor está protegido.

Na rodada 1.6.8, o Helium com perfil temporário abriu os bundles e permitiu conferir a visão de perfis vazia, a seleção de serviço no assistente e os campos de Conexões, sem erros de página ou estouro horizontal nos estados medidos. Os testes DOM continuam cobrindo perfis existentes, rascunhos, backup e validações. Diálogos de pastas, autenticação e sincronização com contas reais continuam pendentes nessa rodada. [Evidências e limites](validacao.md).

## Núcleo próprio Google Drive (1.6.0)

O botão **Sincronizar**, as ações direcionais e o agendamento usam o núcleo próprio nos perfis atendidos, sem um painel de diagnóstico adicional. O worker é gerado por `npm run build:sync-engine`; a interface continua em `npm run build:sync`. Após alterar o núcleo, execute os dois comandos e os testes. Reconciliação, backup, recuperação, criptografia e limitações estão em [sync-engine.md](sync-engine.md).

Tema e foco usam a [base compartilhada](ui-components.md), revisada em 1.6.3. Confira o [registro de validação](validacao.md) para distinguir testes DOM, relatos do usuário e cenários ainda pendentes.

A 1.7.36 também desativa a contagem de visitas herdada dos serviços removidos, limpa seus estados transitórios pendentes e remove a permissão opcional `history`, não usada por Google Drive/Git. A limpeza do histórico continua pela API `browsingData`.
