# Identidade visual — 1.7.48

A identidade aprovada usa o símbolo S integrado ao escudo, sem título no ícone, e base quase preta com leve fundo violeta.

| Token | Escuro | Claro |
| --- | --- | --- |
| Fundo | #121015 | #F6F4F7 |
| Superfície | #1B181F | #FFFFFF |
| Superfície elevada | #25212B | #EEEBF0 |
| Texto | #EEEAF2 | #121015 |
| Texto secundário | #B5AEBF | #62596D |
| Borda | #3B3443 | #DCD6E1 |
| Destaque | #E8E5EC | #3E324C |
| Fundo de seleção | #302936 | #E9E2EF |

Sucesso, aviso e erro mantêm cores semânticas. O indicador por aba preserva verde, azul e vermelho e os símbolos correspondentes; a nova marca não indica, por si, que a VPN está conectada. Preferências de tema/idioma e configurações de widgets não são migradas nem apagadas.

## Fonte e reprodução

`icons/super-icon.svg` é a fonte canônica. `viewBox="340 198 573 706"` coincide com os limites do caminho: sem margem artificial, imagem incorporada ou texto desenhado. O SVG tem fundo transparente e preenchimento #E8E5EC; nos cabeçalhos do tema claro, a classe `brand-mark` aplica a versão escura por filtro.

`npm run build:icons` usa Sharp (dependência de desenvolvimento) para regenerar os PNGs 16/32/48/128 do host e os tamanhos compatíveis nas árvores VPN instalada/fonte. Na 1.7.47, esses PNGs mantêm transparência real, sem o quadrado #121015 que havia sido introduzido na 1.7.46. O desenho ocupa toda a altura, sem deformação; o espaço lateral decorre da proporção natural do escudo em um arquivo quadrado. Não há margem adicional de prancheta. As cópias SVG `vpn-logo.svg` da integração também seguem a fonte canônica.

Após alterar a marca/paleta:

```sh
npm ci
npm run build:icons
npm run build:ui
npm run build:newtab
npm run build:vpn
npm run check:ui
npm run check:integrity
```

Node >=20.9 para as ferramentas da raiz; o build completo VPN mantém o requisito de Node documentado para suas dependências. Os artefatos compilados continuam versionados; instalar a extensão não exige ferramentas de build.

## Superfícies atendidas

Popup e favicons, cabeçalho/editor/controle da Nova guia, aba de reserva, página de proteção VPN, notificações e variantes do ícone na barra do navegador. Os painéis de sincronização e VPN herdam a paleta de `ui-theme.css`; os ícones antigos da integração VPN foram regenerados também nas fontes para evitar retorno da marca anterior durante rebuild. Marcas dos serviços externos usadas para identificar o login/serviço continuam pertencendo aos respectivos serviços.

O fundo padrão da Nova guia sem cores salvas passa a #121015. Configurações explícitas de fotos, cores e widgets existentes são preservadas.

## Validação

Ícones inspecionados em 16/32/48/128 px; SVG validado e renderizado. As combinações de texto, texto secundário e destaque sobre fundo/superfícies apresentam contraste mínimo calculado de 7,34:1 no escuro e 5,61:1 no claro. Isso verifica as combinações de tokens, não uma auditoria de todos os estados/overlays.

Builds da Nova guia e VPN e suíte existente executados; resultados em [validacao.md](validacao.md). Conferência nativa desta versão no perfil pessoal permanece pendente: o Chromium local não iniciou na etapa anterior devido à restrição de sockets do ambiente. A inspeção de ativos rasterizados não substitui a conferência de todas as telas no navegador.

## Correção 1.7.47

Removido o preenchimento do canvas e a chamada `flatten` do gerador. Os 30 PNGs do host e das duas árvores VPN foram regenerados com fundo transparente. A cor #121015 permanece na interface. Conferidos tamanhos, igualdade das cópias, pixels transparentes e semitransparentes nas bordas em todas as variantes; nenhum fundo ou contorno novo foi acrescentado ao símbolo. As sobreposições coloridas do indicador VPN continuam sendo desenhadas sobre o PNG de base.

## Transparência do controle da Nova guia — 1.7.48

Restaurado o fundo translúcido do botão Super Extensão: 61% da cor base do tema em repouso, 85% ao passar o mouse ou focar pelo teclado, mantendo `backdrop-filter: blur(12px)`. A transparência pertence ao fundo, preservando texto/logo totalmente legíveis. Nenhuma imagem ou configuração do dashboard foi substituída.
