# Núcleo próprio da Nova guia — etapa 2, versão 1.7.44

A primeira extração do Tabliss está integrada ao fluxo normal da Nova guia. Não é apenas uma cópia em outro diretório: o armazenamento, as ações e a validação usam implementações próprias em `newtab/engine`, sem importar Tabliss, React ou serviços online. As fachadas nos caminhos antigos mantêm os componentes atuais funcionando com o novo núcleo.

## Responsabilidades

Na rodada Windows da **1.7.19**, o bundle real passou pelo editor, widgets, imagem local, duas abas, importação/exportação e reinício no Edge 157.0.4341.46, com dados fictícios e perfil temporário. Reprodução em `scripts/check-newtab-native.cjs`; resultados e limites em [validacao.md](validacao.md#execução-no-windows-1719). A conferência dos dados existentes no perfil pessoal continua pendente. O checklist histórico abaixo registra a situação anterior à execução.

| Parte | Implementação ativa |
| --- | --- |
| Estado reativo, defaults e transações em memória | `newtab/engine/database.ts` e `events.ts` |
| Modelo, posições e configuração inicial | `newtab/engine/model.ts` |
| Fundos, widgets, ordenação, aparência e foco | `newtab/engine/settings.ts` |
| Validação, exportação v3 e conversão v2 | `newtab/engine/formats.ts` |
| Fila de gravação, erros e mudanças externas | `newtab/engine/persistence.ts` |
| Adaptadores de storage da extensão e IndexedDB | `newtab/engine/browser-storage.ts` |
| Coordenação da migração legada e dados associados | `newtab/engine/migration.ts`; acesso à antiga base fica na fachada de plataforma |
| Ligação React e ciclo de vida do documento | Adaptadores existentes em `vendor/tabliss-source/src/lib/db` e `src/db` |
| Composição, tema, posições, ordem e foco do dashboard | `newtab/dashboard/Dashboard.tsx` e `newtab/engine/dashboard.ts` |
| Montagem/descarte de instâncias, guardas de escrita e carregamentos | `newtab/engine/plugin-session.ts`, ligado pelo dashboard próprio |
| Editor, catálogo/componentes dos widgets, provedores e controles do overlay | Ainda na camada Tabliss adaptada, injetados pelo adaptador `src/views/dashboard/Dashboard.tsx` |

O build continua partindo da aplicação React adaptada, mas agora inclui o núcleo próprio. Isso **não conclui a retirada de todo o Tabliss**. A composição e o ciclo de montagem/descarte agora são próprios. As próximas extrações tratam editor, catálogo e provedores, preservando IDs/formatos e a biblioteca visual compartilhada. React é uma dependência de interface, não algo que precise ser removido para a extração funcional.

## Dashboard e sessões — 1.7.44

A projeção agrupa os widgets por posição, preserva a ordem e mantém o mesmo snapshot em alterações apenas de dados/cache. O dashboard próprio observa os bancos existentes e monta fundo, slots, widgets e overlay. O adaptador injeta o catálogo e a apresentação de erros/controles; o núcleo não importa arquivos do fornecedor. O build resolve React pela árvore já instalada do Tabliss, sem segunda cópia.

Cada instância recebe setters e loader de uma sessão própria. Remover/trocar o widget ou fundo invalida gravações; desmontar ao entrar em foco ou fechar o documento descarta a sessão e libera seus carregamentos pendentes sem contagem negativa. Respostas antigas não voltam a gravar após reutilizar o ID de uma sessão descartada. O limite de erro também inclui a resolução do catálogo, isolando provedores ausentes. Configuração/aparência não desmontam componentes cuja identidade e posição permaneçam iguais. Mudar de posição pode remontar o componente, como antes.

Isso não transfere as rotinas internas de cada widget/provedor: timers, requisições, URLs de objetos e efeitos continuam sob seus componentes React e seus cleanups existentes. A sessão bloqueia gravações tardias, mas não cancela genericamente todo transporte de rede. Editor e seu `useApi` ainda usam a compatibilidade existente.

## Compatibilidade e correções

- As chaves `tabliss/config/*`, a base `tabliss/cache`, o object store `changes`, IDs e valores binários existentes são mantidos. Não há renomeação/cópia obrigatória da configuração nem solicitação de recriar o dashboard.
- Importação/exportação continua usando JSON v3, com conversão de arquivos v2 já suportados. Não inclui imagens locais: elas permanecem no cache do dispositivo, como antes. Conversores históricos v1 permanecem no fornecedor, sem novo suporte ativo declarado nesta etapa.
- Antes de alterar o estado, a importação valida e copia o conteúdo. Arquivos desconhecidos, de versão futura, com estrutura inválida ou chaves perigosas não limpam as configurações/imagens existentes e não modificam o objeto recebido. Dados de plugins ficam em `data/<id>`; não é validação de todos os formatos internos de cada widget.
- As alterações de uma transação em memória ficam visíveis antes das notificações, evitando que um observador leia apenas metade de uma reordenação ou troca de configuração. Reset restaura os mesmos defaults locais.
- A persistência agrupa a última alteração por chave e serializa gravações nativas. Captura os valores antes de aguardar operações anteriores; uma falha antiga não repõe um valor que já tenha uma escrita nova enfileirada. Erros continuam visíveis no fluxo existente e alterações pendentes podem ser reenviadas por `flush` ou por uma próxima edição.
- O adaptador de extensão limita o escopo ao prefixo completo com `/`, acompanha mudanças de outras abas e evita eco de escrita. Mudanças de outros módulos ou de nomes parecidos não são importadas/removidas. Idioma continua compartilhado pela chave já usada por `SuperPreferences`.
- IndexedDB confirma a gravação pela conclusão da transação, não pelo sucesso de uma requisição isolada. Reabrir a mesma base preserva Blobs de imagens.
- O registro legado `persist:data` só é removido depois de confirmar a nova configuração e o cache migrado. Falhas preservam a origem; a base antiga de cache não é apagada automaticamente. Configuração atual existente prevalece. Uma preferência global de idioma, sozinha, não impede a migração do layout. Inicializadores concorrentes compartilham a execução; um layout criado enquanto o cache antigo era lido não é substituído.
- A inicialização aguarda a migração e encaminha falhas ao aviso existente. Cache indisponível continua sendo uma degradação quando não há imagens legadas que dependam dele; não é tratado como sucesso na migração dessas imagens.

A fila é local a cada documento. Não implementa transação atômica entre `storage.set` e `remove`, merge de conflitos entre dispositivos, diário de retomada após encerrar o processo nem garantia de conclusão de escrita durante o fechamento do navegador. O flush de saída é uma tentativa, não confirmação durável de tudo. Essas limitações não devem ser confundidas com o núcleo de sincronização de favoritos ou com a proteção da VPN.

## Checklist do perfil pessoal — pendente

A solicitação histórica de 12/11 previa testes em casa. Em 17/11, o usuário autorizou a etapa 2, implementada na 1.7.44. Os cenários nativos da 1.7.19 permanecem como evidência histórica; os dados existentes no perfil pessoal ainda precisam ser conferidos.

Roteiro manual para a 1.7.44:

- [ ] Confirmar a versão instalada e registrar navegador/versão e commit dos arquivos carregados.
- [ ] Abrir a Nova guia com a configuração existente e conferir fundos, widgets, textos/notas, posições e aparência.
- [ ] Abrir o editor, adicionar/reordenar/remover um widget de teste e mudar sua posição/aparência; fechar e reabrir a Nova guia para conferir persistência.
- [ ] Conferir imagens locais já salvas; testar uma imagem de exemplo e reabrir a página, sem apagar o cache existente.
- [ ] Abrir duas abas da Nova guia e conferir propagação de alterações de configuração e idioma, sem escritas em ciclo ou perda de uma edição nova.
- [ ] Exportar uma cópia da configuração antes dos testes de importação. Em um perfil de teste, importar JSON válido e depois um arquivo inválido/de versão futura; o inválido deve produzir erro sem alterar a configuração nem as imagens do perfil.
- [ ] Reiniciar o navegador e conferir configurações, notas e imagens novamente. A exportação JSON não inclui as imagens locais.
- [ ] Registrar o resultado de cada cenário e eventuais mensagens de erro, sem compartilhar configurações privadas ou chaves de serviços.

Os 418 testes abaixo são evidência histórica da etapa 1. A evidência da etapa 2 fica em [validacao.md](validacao.md); a conferência do perfil pessoal segue pendente.

## Evidência e reprodução

A suíte completa passou **418 testes**, incluindo 21 novos contratos de banco/ações, importação v2/v3 sem perda por arquivo inválido, filas/falhas/respostas antigas, isolamento e mudanças entre abas, IndexedDB com imagens binárias, migração confirmada e inicialização do bundle de produção em DOM simulado. A implementação IndexedDB é exercitada com `fake-indexeddb` já disponível no ambiente de testes do Floccus; não foi adicionada dependência de execução à Nova guia.

Compilação da Nova guia, TypeScript do núcleo isolado, TypeScript da aplicação adaptada, UI e whitespace passaram. A inicialização do bundle de produção foi exercitada com armazenamento legado e troca de idioma; não equivale a teste no Helium/perfil pessoal. Ainda faltam conferir editor, importação/exportação, várias abas, imagens locais e fechamento/reinício no navegador real.

Na raiz completa do projeto:

```sh
npm ci
npm run setup:newtab
npm run setup:sync
npm run build:newtab
npm test
node_modules/.bin/tsc -p newtab/tsconfig.engine.json
vendor/tabliss-source/node_modules/.bin/tsc --noEmit -p vendor/tabliss-source/tsconfig.json
npm run check:ui
```

As fontes/interfaces de compatibilidade mantêm a atribuição Tabliss e GPL-3.0. `newtab/LICENSE.txt` e `newtab/main.js.LICENSE.txt` continuam acompanhando os arquivos distribuídos. A extração não remove obrigações de licença nem constitui uma distribuição oficial do Tabliss.
