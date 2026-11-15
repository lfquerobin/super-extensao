# Varredura de integridade — 1.7.37

Realizada em 15/11/2026, a partir da 1.7.36 (`56af268`). O repositório estava limpo. Esta revisão cobre os módulos próprios e suas integrações por inspeção, testes, reconstrução dos artefatos e execução em perfil temporário; não é uma auditoria linha a linha de todas as dependências.

## Achados e correções

1. **Fuso inválido podia quebrar a Nova guia.** `decode` aceitava qualquer string global de fuso; os fusos dos relógios também não eram validados. `utcToZonedTime` produzia uma data inválida, e o formato do relógio gerava `RangeError: Invalid time value`. O núcleo agora recusa fusos inválidos globais e por relógio antes de substituir layout/cache. O adaptador de horário mantém uma data válida usando o horário local quando dados antigos estão corrompidos. Fusos IANA, UTC, automático e offsets fixos válidos continuam aceitos. Testes verificam recusa sem perda e abertura do dashboard/editor com armazenamento corrompido.
2. **Dois runners VPN estavam desatualizados.** `check-vpn-native.cjs` e `check-vpn-return-native.cjs` não empacotavam imports recentes do guard; o worker de teste falhava antes de expor `safety`. Foram incluídos o módulo real `guard-routing` e o adaptador de política de teste. A suíte local foi ampliada para a opção de tráfego direto na falha, em inclusão/exclusão, host exato e subdomínios. O motor instalado VPN não precisou ser alterado.
3. **Dependências com correções compatíveis disponíveis.** O parser XML da raiz e do legado passou de 5.11.2 para 5.12.1. No Tabliss foram atualizados pacotes selecionados dentro das faixas declaradas: nanoid, @babel/runtime, @babel/traverse, webpack, form-data, loader-utils, proxy-addr e websocket-driver, com suas transitivas. Isso eliminou os alertas críticos encontrados nessa árvore e os alertas de nanoid/@babel/runtime classificados como produção. Não se usou `audit fix --force` nem migração de versão principal.

## Evidência funcional e de integridade

- **506 testes Node aprovados**, sem falhas ou testes ignorados. Incluem limpeza, autoplay, abas, sincronização/reconciliação/recuperação, VPN, armazenamento, importações e interface.
- Reconstrução de todas as interfaces e dos workers, e verificações TypeScript da Nova guia/núcleo e da VPN/interface. Os builds anteriores às correções reproduziram os artefatos versionados; as alterações instaláveis finais foram recompiladas.
- `npm run check:integrity`: versões iguais, 61 arquivos referenciados presentes, scripts alcançados com sintaxe válida, recursos de HTML/CSS/importScripts e traduções do manifest. A checagem detecta versões divergentes, arquivo ausente, script inválido e referência fora da pasta em fixtures. Ela cobre referências estáticas e entradas conhecidas dos painéis; não prova o comportamento de todo caminho dinâmico ou a integridade criptográfica de cada arquivo instalado no computador.
- Edge **157.0.4341.60**, perfis temporários: extensão completa/worker, painéis, dois serviços de sincronização, VPN sem tomar proxy ao iniciar sem conta, Nova guia/editor e recuperação de fusos corrompidos sem erros de página.
- Interface: hierarquia/seleção de pastas, Escape, foco, assistente e temas. Nova guia: notas, imagens locais, importação/exportação, widgets, idioma entre abas e persistência após reiniciar.
- VPN local: proxy HTTP e DNR reais, bloqueio antes de conectar, queda do proxy sem requisições diretas aos destinos protegidos, restart, liberação explícita, retorno GET e POST não repetido. A opção de permitir tráfego fora da VPN na falha só liberou os destinos esperados nos casos medidos. Testes de conta são sintéticos; o desafio 407 da restauração não enviou credenciais.

## Auditoria npm: snapshot desta rodada

Contagens de entradas do relatório, incluindo propagação para consumidores. Não equivalem a falhas independentes ou a caminhos comprovadamente exploráveis. Os relatórios completos temporários ficaram em `work/integrity-audit-*.json`.

| Árvore completa | Antes: total/crítico/alto | Depois: total/crítico/alto |
| --- | --- | --- |
| Raiz | 1 / 0 / 0 | 0 / 0 / 0 |
| VPN | 31 / 0 / 0 | 31 / 0 / 0 |
| Sincronização | 44 / 0 / 10 | 43 / 0 / 10 |
| Nova guia | 70 / 6 / 29 | 59 / 0 / 26 |

Na classificação `--omit=dev`, a raiz e a VPN ficam sem alertas; a Nova guia tem 1 moderado (`@sentry/browser` legado, cujo envio permanece desativado e sem DSN); a sincronização tem 9 entradas (1 alta, 6 moderadas e 2 baixas). A classificação npm não identifica o que de fato entrou nos bundles: Capacitor CLI, xcode e parte da cadeia de glob/rimraf, por exemplo, constam como produção no pacote de origem, mas são ferramentas.

**Pendência prioritária:** Vuetify 2, Vue 2 e Vuex 3 da interface de sincronização estão em uma cadeia legada. O alerta alto do Vuetify envolve merge de presets; o alerta do date picker envolve HTML de um formatador. Os presets locais são estáticos e não há `VDatePicker` nas telas próprias inspecionadas; não foi demonstrada exploração nesta aplicação. Isso não elimina os avisos. O fornecedor não corrige a linha 2, e a solução suportada requer migração da interface; trocar a versão isoladamente quebraria os adaptadores Vue/Vuetify existentes. [Advisory de presets](https://github.com/advisories/GHSA-3jp5-5f8r-q2wg), [advisory do date picker](https://github.com/advisories/GHSA-9w3x-85mw-4fwm).

Permanecem também alertas altos/moderados/baixos em ferramentas antigas do Tabliss e Floccus (incluindo parsers de CSS, globbing, servidor de desenvolvimento e serialização). Atualizações adicionais devem ser validadas por cadeia; o banco de advisories muda e os números acima são um snapshot. O Sentry da Nova guia continua listado mesmo desativado; sua remoção/substituição é uma etapa separada.

## Limites e reprodução

Não foram acessados perfil pessoal, senhas ou contas reais Google/Git/Proton. Não houve medição real de IP/DNS/IPv6/WebRTC de uma conexão Proton, nem garantia de limpeza antes do encerramento do navegador. A aprovação destes testes não certifica ausência de vulnerabilidades ou vazamentos.

```powershell
npm test
npm run check:integrity
npm run check:ui
npm run build:interfaces
npm run build:sync-engine
npm run build:vpn
```

Runners nativos precisam de Playwright disponível em `NODE_PATH` e `CHROMIUM_PATH` apontando para Chromium/Edge com suporte à extensão descompactada. `check-extension-native.cjs` usa os arquivos instaláveis completos; os demais runners isolam cenários específicos. Todos usam dados fictícios/perfis temporários. Esta máquina exigiu execução fora do sandbox para iniciar o navegador.
