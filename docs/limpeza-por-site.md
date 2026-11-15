# Limpeza por site — 1.7.41

Em Cookies, Cache e Arm. Local, **Modo da lista** oferece:

| Modo | Resultado quando o tipo está ligado em Geral |
| --- | --- |
| Excluir da limpeza — preservar a lista | Preserva os sites listados e limpa os demais. Sem sites, mantém a limpeza geral daquele tipo. |
| Incluir na limpeza — limpar somente a lista | Limpa apenas os sites listados e preserva os demais. Sem sites, não executa remoção daquele tipo. |

Cada tipo tem duas listas independentes. Trocar o modo não move, copia nem apaga entradas; a escolha é salva automaticamente, sem botão Salvar e sem ativar o tipo em Geral. As listas antigas permanecem como exclusões, com o mesmo comportamento de preservação da versão anterior. Em Favoritos, o seletor de modo reflete a configuração do tipo escolhido; importações e duplicados são calculados apenas para essa lista. A cópia não altera os favoritos.

## Escopo dos dados

Cookies são tratados pelo domínio registrável inteiro. Assim, incluir `accounts.exemplo.com` para limpar pode apagar cookies de `exemplo.com` e de seus outros subdomínios. A preservação segue o mesmo escopo e não garante todos os logins. Cache e localStorage usam origens HTTP/HTTPS, mantendo portas não padrão; outros subdomínios e portas precisam de entradas próprias. Um caminho na URL não restringe a limpeza a uma página.

Histórico de navegação, histórico de downloads e formulários continuam sendo limpos globalmente quando selecionados. Os arquivos baixados e senhas salvas não são apagados. O filtro por site só se aplica a cookies, cache e armazenamento local, conforme [o contrato oficial de `browsingData`](https://developer.chrome.com/docs/extensions/reference/api/browsingData#type-RemovalOptions).

## Persistência e execução

| Tipo | Modo | Lista preservada | Lista a limpar |
| --- | --- | --- | --- |
| Cookies | `cookieCleanupMode` | `excludedSites` | `includedSites` |
| Cache | `cacheCleanupMode` | `excludedCacheSites` | `includedCacheSites` |
| localStorage | `localStorageCleanupMode` | `excludedLocalStorageSites` | `includedLocalStorageSites` |

O modo ausente continua sendo `exclude`. `rules.js` concentra o contrato, a normalização e o plano de remoção. Modos inválidos ou listas corrompidas interrompem antes de qualquer exclusão. O plano usa `excludeOrigins` ou `origins`, nunca ambos, e mantém operações globais separadas das filtradas. Uma inclusão vazia não é enviada como filtro vazio nem convertida em limpeza geral.

Limpar agora usa o snapshot confirmado com seus modos e listas. Clientes antigos que não enviam os novos campos mantêm a política armazenada, para não ampliar uma inclusão existente. Automação e retomada usam o mesmo plano. Tipos sem alvos não aparecem como limpos no relatório; quando não há nenhuma operação, não são incrementados o contador nem a data de sucesso.

A interface serializa alterações, preserva a lista correta em adições/remoções e ignora leituras atrasadas. Importação em andamento que perde seu destino por troca de modo não escreve nem na lista anterior nem na nova; pode ser iniciada novamente no destino escolhido. Falhas ao salvar o modo mostram erro e restauram a seleção efetivamente armazenada. Se a leitura do novo destino falhar, o editor permanece bloqueado e oferece Tentar novamente, impedindo editar a lista anterior sob o modo novo.

## Validação em 15/11/2026

**556 testes passaram**, sem falhas ou testes ignorados. A suíte cobre combinações de modos nos três tipos, listas antigas, inclusão vazia, dados inválidos, relatório de tipos efetivamente removidos, snapshots manuais, tradução, persistência automática, isolamento de listas, importação/duplicados e respostas atrasadas. `check:ui`, `check:integrity` e `git diff --check` passaram.

O runner `scripts/check-cleanup-filters-native.cjs` validou as APIs reais no Edge 157.0.4341.60 em perfil descartável, com dois sites locais: inclusão apagou cookies, cache HTTP e localStorage somente do site listado; exclusão preservou esse site e limpou o outro. O cache foi conferido por contagem de requisições ao servidor local, e os dados das duas origens foram consultados depois da conclusão. Inclusão vazia preservou ambos os sites, as listas de exclusão e os registros de sucesso anteriores. As capturas em `work/ui-review` foram inspecionadas. Não foram usados dados pessoais, contas reais ou perfil habitual do navegador.
