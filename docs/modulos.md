# Módulos opcionais — 1.7.40

Implementado em 15/11/2026. A área **Módulos** fica sempre acessível no popup, mesmo quando todos os recursos estão desligados. Cada interruptor salva automaticamente e recarrega a extensão para encerrar os motores, listeners e temporizadores da instância anterior. A interface informa esse recarregamento antes da alteração. Não há botão Salvar nem remoção dos dados pessoais.

## Efeito de cada interruptor

| Módulo | Desligado |
| --- | --- |
| Limpeza | Não responde a solicitações de limpeza manual nem executa limpeza automática, inicialização de sessão ou retomada pelo alarme de pausa. Preferências e listas ficam preservadas. |
| Autoplay | Remove o registro dos scripts em sites novos e restaura os métodos de mídia/shadow DOM e observers instalados nas páginas alcançáveis já abertas. As regras de domínio permanecem armazenadas. |
| Abas | Não inicializa a proteção/organização. Abas de reserva ainda reconhecidas como próprias são removidas; se uma for a única aba da janela, é apenas desafixada, evitando fechar a janela. Abas navegadas ou modificadas pelo usuário não são removidas. |
| Sincronização | Não inicializa o bundle do worker, não agenda operações e recusa comandos. Perfis, credenciais, cache e backups permanecem. |
| VPN | Desconecta a sessão de rede, libera proxy e política WebRTC próprios e remove somente as regras DNR e alarmes da VPN. Não inicializa o motor nem injeta os scripts de autorização em novas páginas. Conta e configurações são preservadas. |
| Nova guia | Não carrega `main.js`, polyfills do dashboard, React, widgets ou provedores de imagens. Exibe uma página simples com acesso às configurações. Layout, notas, imagens e chaves permanecem armazenados. |

Todos começam ligados quando a preferência ainda não existe. As chaves locais `superModules:<id>` contêm somente booleanos e são independentes; valores inválidos não habilitam um módulo. Essas chaves não fazem parte dos backups de perfis/favoritos ou da configuração exportada da Nova guia.

## Aplicação e recuperação

`modules.js` contém o contrato das preferências. `module-host.js` é o despachante comum do worker. Os bundles de sincronização/VPN são registrados como funções e só são executados depois da leitura da preferência. Os componentes da interface também verificam a configuração antes de carregar os painéis; abrir a página de sincronização ou as páginas legadas VPN diretamente respeita o bloqueio.

O host registra de forma síncrona os pontos de entrada que precisam acordar o service worker, incluindo mensagens, alterações de favoritos, alarmes e autenticação do proxy. Depois de ler a configuração, encaminha o evento somente ao módulo habilitado. Isso evita perder o primeiro evento enquanto o armazenamento responde. Com os módulos desligados, o despachante e as preferências comuns permanecem; os motores não são inicializados. Não se tenta importar módulos novos de forma dinâmica em um service worker instalado. [Modelo de importação do Chromium](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/service_worker/es_modules.md).

Uma alteração prepara os módulos, aguarda limpezas pendentes e recusa o recarregamento durante sincronização ativa, para não interromper o Git ou perder uma operação. Desligar VPN só é confirmado depois de liberar os controles próprios e conferir o resultado. Uma falha não marca o módulo como desligado; alarmes e registros de scripts anteriores são restaurados quando a gravação falha. Se a tentativa já desconectou a VPN, ela pode permanecer desconectada mesmo com o interruptor ainda ligado: o erro é mostrado, e não se reconecta silenciosamente para desfazer a escolha.

Scripts de conteúdo passam a ser registrados por `chrome.scripting` conforme Autoplay/VPN estejam ligados. O registro persiste entre sessões e é conferido sem reinstalação desnecessária a cada despertar. No Chromium 119 ou superior, Autoplay também usa `matchOriginAsFallback` para frames de origem herdada. Em versões anteriores, o registro mantém o suporte a frames HTTP/HTTPS; recarregar abas abertas é recomendado após qualquer mudança de módulo. [Contrato da API de scripts registrados](https://developer.chrome.com/docs/extensions/reference/api/scripting#type-RegisteredContentScript).

## Limites do pacote

Desativar não apaga arquivos da pasta instalada, não reduz as permissões obrigatórias declaradas no manifesto e não desinstala parte de uma extensão. Uma distribuição fisicamente menor, com menos permissões, exige gerar outro pacote/manifesto.

O navegador define a substituição da Nova guia no manifesto, por `chrome_url_overrides`. O interruptor desliga o dashboard e suas atividades, mas mantém uma página local simples; não promete restaurar a página nativa do navegador. [Documentação oficial sobre a substituição de páginas](https://developer.chrome.com/docs/extensions/develop/ui/override-chrome-pages).

## Validação

**543 testes automatizados passaram**, incluindo bloqueio de motores, estados padrão, recusa de valores/remetentes inválidos, falha de armazenamento, liberação de VPN, preservação de dados, recuperação de agendamentos e eventos de favoritos/autenticação recebidos no início do worker. O TypeScript completo da origem VPN, `check:ui` e `check:integrity` passaram.

No Edge 157.0.4341.60, em perfil temporário e sem contas reais, `scripts/check-modules-native.cjs` desligou os seis recursos pela interface, conferiu que apenas Módulos permanecia visível, restaurou o método de mídia em uma página fictícia e verificou ausência de scripts/alarme dos motores. Também confirmou liberação de proxy/WebRTC/DNR próprios, ausência do bundle do dashboard e reativação de sincronização/VPN preservando perfil e credenciais OAuth fictícias. Os runners da extensão completa e da Nova guia passaram, inclusive notas/widgets/imagem local/importação/exportação e reinício. Capturas ficam em `work/ui-review`, fora do Git. Esta rodada não usa nem certifica contas pessoais ou sincronização remota real.
