# Avaliação das extensões de origem — 15/11/2026

Esta rodada compara as origens públicas com as bases registradas, sem substituir os motores próprios.

| Origem | Resultado e decisão |
| --- | --- |
| Floccus | Última release consultada: 5.13.0, já integrada. O desenvolvimento contém ordenação Linkwarden 2.17+ e correções relacionadas. Não incorporar, pois a Super Extensão passa a oferecer apenas Google Drive e Git. |
| Proton VPN | HEAD público `71d7d86f164a2ee8e50ce5a389c9e5cbe0fd6883`, igual à base incluída. Nenhuma atualização pendente nessa referência. |
| Tabliss | A base 2.6.0 tem diferenças em relação ao HEAD `765a3f0b10968ee6e3a9ddf5c5360960fb4bf0ee` (16/01/2024). Trazer as correções pontuais abaixo. |
| AutoplayStopper MV3 | Loja: 2025.11.24. O autor anunciou a interrupção do desenvolvimento em setembro de 2026, citando limitações MV3. Nosso módulo é próprio. |
| Auto Clear History on Exit | Loja: 2.0.9, atualizada em 23/10/2026; mesma base utilizada. |
| Don't Close Window With Last Tab | Loja: 0.11, atualizada em 05/06/2022; sem código público posterior na referência consultada. |

## Tabliss: incorporado na 1.7.36

- IP: trocar GoGeoIP por `ipwho.is` via HTTPS. Manter nosso intervalo/cache e timestamp; validar resultados, tratar falhas sem substituir o cache e descartar respostas de componentes desmontados. A consulta sai para um terceiro quando o widget está no dashboard; a localização é aproximada e o dado em cache não prova o túnel VPN atual.
- Links: centralizar o botão recolhido mesmo com várias colunas configuradas.
- Relógio: usar números de largura fixa, reduzindo deslocamentos a cada segundo.
- GitHub: abrir o perfil configurado, codificando o nome como segmento da URL, e ocultar todos os elementos auxiliares depois do gráfico.
- Unsplash: preferir `location.name`, preservando o fallback `title` da integração anterior.

Não trazer o widget de piadas, novos buscadores/idiomas nem atualizações gerais de dependências nesta rodada. Eles ampliam o escopo e não resolvem os problemas selecionados. Preservamos chaves próprias de imagens, idiomas, armazenamento e núcleo da Nova guia.

## Fontes consultadas

- [Floccus: comparação com a base integrada](https://github.com/floccusaddon/floccus/compare/05decdc731415cab2614bf8cf240833b815e7e30...2bc27a8c72c1ab0dc38f6ca3f975378b36f84840) e [release 5.13.0](https://github.com/floccusaddon/floccus/releases/tag/v5.13.0).
- [Proton: commit da base e HEAD consultado](https://github.com/ProtonVPN/proton-vpn-browser-extension/commit/71d7d86f164a2ee8e50ce5a389c9e5cbe0fd6883).
- [Tabliss: comparação completa](https://github.com/joelshepherd/tabliss/compare/a273d6329cec1f0813e04fde907111e648821946...765a3f0b10968ee6e3a9ddf5c5360960fb4bf0ee), [API de IP](https://ipwhois.io/documentation) e [API Unsplash](https://unsplash.com/documentation).
- [AutoplayStopper: aviso do autor](https://github.com/kenijo/AutoplayStopperMV3/blob/e74028d4a6682aed96cb02d190d4db5f6b81d237/README.md).
- [Limpeza: loja](https://chromewebstore.google.com/detail/auto-clear-history-on-exi/hfdaikgklefacppkadgkncadaoehnlla) e [última aba: loja](https://chromewebstore.google.com/detail/dont-close-window-with-la/dlnpfhfhmkiebpnlllpehlmklgdggbhn).

A consulta pública não constitui auditoria de segurança nem validação autenticada com os serviços.
