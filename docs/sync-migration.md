# Integridade da interface — 1.7.38

Migração concluída em 15/11/2026 sobre a 1.7.37 (`301d601`).

## O que mudou

A sincronização usa Vue 3.5.45 e Vue Router 4.6.5. Campos, seletores, switches, rádios, botões e formulários usam HTML nativo com a biblioteca comum. Vue 2, Vuetify 2, Vuex 3, Vuelidate e seus loaders foram removidos das dependências do motor. O estado usa `reactive` com a fachada de comandos existente. Rotas continuam por hash.

Google Drive e Git continuam sendo as únicas opções. IDs, `superSync:`, credenciais, cache, alarmes, mensagens e formatos de backup foram preservados. A edição mantém um rascunho até Salvar; cancelar a edição da criptografia também limpa o segredo temporário. A autorização Google apresenta falhas no formulário, permite nova tentativa e só aplica as credenciais ao salvar o perfil. OAuth continua usando a implementação de autorização existente.

Na Nova guia, foram removidos `@sentry/browser`, seu inicializador e a captura de exceções. O limite de erros local dos widgets e a tela `Crashed` permanecem. Configurações, widgets e backups não mudaram de formato.

## Fontes, compilação e licenças

- `sync/source`: aplicação e telas atuais.
- `ui/vue*.js` e `ui/vue.css`: componentes Vue 3/HTML nativo compartilhados.
- `sync/package.json` e lockfile: dependências da interface e de sua compilação; a versão interna 1.0.0 identifica esse pacote independente. A versão instalada 1.7.38 está no manifest e nos três campos de versão do projeto raiz.
- `scripts/sync-webpack.cjs`: compila interface e worker, resolve `@sync-engine` para o legado e rejeita Vue 2/Vuetify/Vuex/compat no grafo gerado.
- `vendor/floccus-source`: núcleo de compatibilidade, conectores e fonte histórica. Suas antigas telas e configurações webpack não integram o pipeline atual.
- `sync/THIRD-PARTY-NOTICES.txt`: licenças completas das dependências de produção da interface e da fonte MDI distribuída, regeneradas por `build:sync`. A licença ausente no pacote npm de `@vue/devtools-api` foi obtida da tag exata da origem; proveniência em `scripts/licenses/README.md`.

Execute `npm ci`, `npm run setup:sync` e `npm run setup:vpn`, depois `npm run build:sync` e `npm run build:sync-engine`. Para a Nova guia, use `setup:newtab` e `build:newtab`. Os artefatos compilados são versionados; a instalação não depende de Node.js. As fontes e licenças MPL originais permanecem disponíveis.

## Auditoria de dependências

Fotografia de `npm audit` em 15/11/2026; contagens de pacotes sinalizados, não de falhas comprovadamente exploráveis no bundle:

| Árvore | Produção | Incluindo ferramentas de desenvolvimento |
| --- | --- | --- |
| Nova interface `sync` | 0 | 0 |
| Nova guia `vendor/tabliss-source` | 0 | 58: 17 baixos, 15 moderados, 26 altos |
| Compatibilidade `vendor/floccus-source` | 6 moderados | 36: 11 baixos, 17 moderados, 8 altos |

Os seis alertas de produção classificados pelo npm na compatibilidade são `@capacitor/cli`, `glob`, `minimatch`, `rimraf`, `uuid` e `xcode`, associados à cadeia de ferramentas nativas herdadas. Não são dependências Vue/Sentry. O novo compilador seleciona o código do motor necessário ao Chromium; a classificação npm não é uma análise de alcance do bundle. Os alertas de ferramentas ainda exigem uma etapa própria de manutenção e não foram ocultados com overrides ou `audit fix --force`.

As árvores raiz e VPN não receberam dependências novas nesta etapa; seus resultados anteriores estão em [auditoria-integridade.md](auditoria-integridade.md). Zero alertas numa árvore não equivale a certificação de segurança de toda a extensão.

## Evidências e limites

**514 testes passaram**, sem falhas ou testes ignorados. Foram recompilados interface, worker e Nova guia. `check:ui` e `check:integrity` passaram; a integridade estática conferiu 61 arquivos referenciados e as versões do projeto.

Testes DOM executam o bundle de produção: perfis existentes, senha Git, booleanos e intervalos, rascunho/Salvar, criptografia/cancelamento, arquivo Blob de exportação e importação pela seleção de arquivo, navegação por hash e serviços recusados. A autorização Google usa respostas sintéticas de permissão negada e de sucesso com PKCE/state, troca de token e identidade; preserva a criptografia e não persiste o access token.

No Edge 157.0.4341.60, com perfil temporário e dados fictícios, passaram a extensão completa/worker, painéis, dois provedores, ausência de proxy sem login, Nova guia/editor e recuperação de fusos corrompidos. O runner da interface validou árvore hierárquica, seleção exata, cancelamento/Escape/foco, assistente e temas claro/escuro. As capturas em `work/ui-review` foram inspecionadas. O runner da Nova guia confirmou notas, imagem local, widgets, idioma em duas abas, importação/exportação e persistência após reiniciar. Nenhum erro de página foi observado.

Esta rodada não autentica contas reais Google/Git/Proton, não executa sincronização remota com dados pessoais e não substitui a validação com dois navegadores reais. Os testes nativos usam Playwright/Edge com perfis isolados. Artefatos temporários e relatórios brutos ficam em `work`, fora do Git.
