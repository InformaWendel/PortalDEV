# CLAUDE.md — Portal DEV

Guia para o Claude Code trabalhar neste repositório. **Esta é a estrutura base de
toda ferramenta do portal** — reproduza-a, não a reinvente.

## O que é este repositório

Portal estático que reúne as ferramentas do time de desenvolvimento da Informa
Solutions sobre **um login, um cadastro de permissões e um token do GitHub**:

- **Portal QA** (`#/qa`) — testes de qualidade por projeto: planejado, em andamento,
  concluído e retrabalho.
- **Controle de Impedimentos** (`#/impedimentos`) — interrupções do dia a dia, com
  cronômetro, calendário e painel consolidado. Ao finalizar, o analista classifica o
  que fez num módulo do roadmap e escreve o entregável.
- **Administração** (`#/admin`) — usuários, papéis, matriz de permissões e a triagem
  da fila do roadmap.

Código e dados de todas as ferramentas moram em `InformaWendel/PortalDEV`, branch
`main`, publicado pelo GitHub Pages.

## Restrições inegociáveis

- **Sem backend.** Só HTML, CSS e JavaScript servidos como arquivo estático. Nada de
  build, bundler, framework ou dependência externa — nem CDN.
- **JavaScript sem transpilação**, em `assets/js/`, um arquivo por responsabilidade,
  no padrão IIFE que publica um objeto em `window`. Nada de ES modules.
- **Tema escuro único.** Cor primária `#f7941d` (laranja da casa). Tokens `--pd-*` no
  `:root` do `portal.css`. Prefixos de classe: `pd-` casca e compartilhado, `imp-`
  Impedimentos, `adm-` Administração.
- **Dois idiomas: pt-BR e en-US.** Detecção pelo navegador, alternância no cabeçalho.
  Nenhuma string fixa na renderização — tudo passa por `I18N.t()`. Cada ferramenta
  registra o próprio dicionário com prefixo (`qa.`, `imp.`, `adm.`); a casca usa
  chaves sem prefixo. Conteúdo de CSV bilíngue usa `_pt`/`_en` e `I18N.campo()`.
- **Código, comentários e nomes em pt-BR.** Comentário explica o porquê, não o quê.
- **O CSV do repositório é a única fonte de verdade.** O `localStorage` guarda apenas
  idioma, sessão e token — nunca registro.
- **A única integração externa é a API de conteúdo do GitHub**, e só para ler e
  gravar os CSV. **Um repositório só**: é o que permite um token fine-grained único.
- **O login identifica, não protege.** Permissão é organização de uso, decidida no
  cliente. Nunca tratar como controle de acesso nem guardar dado sensível.

## Estrutura de arquivos

```
PortalDEV/
├── index.html                    casca da aplicação (uma página, roteamento por hash)
├── .nojekyll · .gitattributes · .gitignore
├── data/
│   ├── usuarios.csv              cadastro único de pessoas
│   ├── papeis.csv                papel -> permissões
│   ├── projetos.csv              Portal QA: catálogo de projetos
│   ├── projetos/<id>.csv         Portal QA: casos de teste de um projeto
│   ├── impedimentos/<usuario>.csv  Impedimentos: registros de uma pessoa
│   └── roadmap/
│       ├── modulos.csv           catálogo dos módulos do roadmap (cópia versionada)
│       └── fila.csv              o que virou item de roadmap, e a triagem dele
├── testes/                       harness (Chrome headless + GitHub simulado) e suítes
└── assets/
    ├── css/portal.css
    └── js/
        ├── config.js             repositório, caminhos, salt, permissões, mapa do OPSView
        ├── i18n.js               motor de idioma + dicionário da casca
        ├── csv.js                leitura e escrita RFC 4180
        ├── ui.js                 escape, diálogo, aviso flutuante, download
        ├── graficos.js           barras e série em SVG, compartilhado pelas ferramentas
        ├── github.js             token por usuário, leitura, gravação, ler-alterar-gravar
        ├── auth.js               login, sessão, troca e gravação de senha
        ├── acesso.js             papéis e permissões (pode, podeFerramenta)
        ├── versao.js             percebe versão nova publicada e pede para recarregar
        ├── qa/                   i18n.js · store.js · telas.js
        ├── impedimentos/         i18n.js · datahora.js · store.js · roadmap.js ·
        │                         calendario.js · painel.js · telas.js
        ├── admin/                i18n.js · roadmap.js · telas.js
        └── app.js                casca: login, cabeçalho, menu, token, senha, rotas
```

A ordem dos `<script>` no `index.html` é a ordem de dependência: núcleo, depois cada
ferramenta (textos → dados → telas), e `app.js` por último.

## Rotas

| Hash | Tela | Permissão |
|---|---|---|
| `#/` | Início: ferramentas do papel e o que ele permite | sessão |
| `#/qa` · `#/qa/guia` | Visão geral e guia do QA | `qa.consultar` |
| `#/qa/p/<id>` · `#/qa/p/<id>/casos` | Painel e catálogo do projeto | `qa.consultar` (registrar: `qa.registrar`) |
| `#/impedimentos` | Meu calendário | `impedimentos.registrar` |
| `#/impedimentos/painel` | Painel consolidado | `impedimentos.painel` |
| `#/admin` · `#/admin/permissoes` | Usuários e matriz | `admin.usuarios` |
| `#/admin/roadmap` | Triagem da fila do roadmap e pacote do OPSView | `admin.usuarios` |

## Contrato de uma ferramenta

`app.js` não conhece tela de ferramenta. Cada uma publica em `window.<Ferramenta>.Telas`:

| Função | Papel |
|---|---|
| `iniciar()` | Liga os ouvintes, uma vez. Ouvinte delegado confere `App.ferramentaAtual()` e usa atributo próprio (`data-qa`, `data-imp`, `data-imp-painel`, `data-imp-roadmap`, `data-adm`); a casca usa `data-acao` |
| `permitido()` | Alguma permissão da ferramenta; sem ela a casca mostra "sem acesso" |
| `entrar(segmentos)` | Rota nova; devolve uma Promise se precisar carregar dados (a casca redesenha ao resolver) |
| `render(segmentos)` | Desenha em `#vista` |
| `abas()` · `abaAtual()` · `subtitulo()` | Sub-menu e subtítulo do cabeçalho |
| `acoes()` · `banner()` | Opcionais: botões à direita das abas; aviso próprio no topo |
| `somenteLeitura()` | Opcional: selo "Somente consulta" quando o papel não grava ali |
| `sair()` · `recarregar()` · `descarregar()` | Opcionais: limpeza a cada saída da ferramenta; releitura após trocar token; no logout, gravar pendências e descartar rascunhos |
| `temPendencias()` · `aoEscape()` | Opcionais: aviso ao fechar a página; tecla Esc |
| `icone` · `nivel()` · `atalhos()` | Opcionais: selo, nível de acesso e botões do cartão na página inicial. Sem atalhos, o cartão leva a `#/<id>` |

Para acrescentar uma ferramenta: criar a pasta, incluir os `<script>` dela no
`index.html` antes de `app.js`, publicar esse objeto, registrá-la no mapa `modulo()`
de `app.js`, em `ferramentas` e `permissoes` do `config.js`, e dar os rótulos
`ferramenta.<id>`, `ferramenta.<id>Desc`, `perm.<chave>` e `perm.<chave>Desc` no
`i18n.js`.

## Como a gravação funciona

Cada alteração vira commit pela API de conteúdo (`PUT /repos/{owner}/{repo}/contents/{path}`
com o `sha` da versão lida). Há dois caminhos, e os dois resolvem conflito relendo e
reaplicando só o que este navegador alterou (até 3 tentativas):

- **Portal QA** — `QA.Store.registrar()` aplica em memória e põe o caso numa fila;
  após `atrasoGravacao` ms sem tecla, grava o CSV inteiro. Fechar a gaveta, sair da
  ferramenta ou fazer logout força a gravação. Há um commit por projeto de cada vez:
  o que for registrado com o PUT em voo continua na fila e sai logo em seguida.
- **Impedimentos e Administração** — `Github.alterarArquivo(caminho, mutador)`: lê,
  aplica o mutador sobre a versão mais nova e grava. O mutador pode lançar erro (ex.:
  impedimento já aberto, último administrador) para abortar. A matriz de permissões
  guarda o que mudou em cada papel e reaplica só isso sobre a versão relida; as travas
  que dependem do outro cadastro (último administrador, papel em uso) o relêem antes
  de gravar.
- **Fila do roadmap** — os dois juntos. `Impedimentos.Roadmap.enfileirar()` põe a linha
  numa fila em memória e chama `alterarArquivo`; o impedimento em si já está gravado,
  então falhar aqui não desfaz nada. A fila **não mexe no selo** — ele já disse "Salvo"
  sobre o impedimento — e a falha aparece no `banner()` de Impedimentos, com botão de
  tentar de novo. Ao entrar no calendário, `reconciliar()` compara os registros da
  pessoa com a fila e reenvia, num commit só, o que ficou só em memória (F5 no meio do
  commit) ou o cancelamento que não saiu. Não cancela a linha de registro finalizado sem
  módulo: isso só nasce de gravação pela versão antiga, que descarta as colunas novas ao
  reescrever o arquivo, e a linha da fila é a única cópia do que foi informado. A triagem
  da Administração grava direto por `alterarArquivo`.

O selo no cabeçalho (`Salvando…` · `Salvo no repositório` · `Falha ao salvar` ·
`Somente leitura` · `Somente consulta`) é a garantia visível — mantenha-o. Toda
gravação chama `App.sinalizarGravacao()`.

**Token.** Um por pessoa, guardado em `portaldev:token:v1:<usuario>` e usado por todas
as ferramentas. É pedido logo após o login quando falta. Como o repositório é de conta
pessoal, colaborador usa token clássico com `public_repo`; *fine-grained* só serve ao
dono. `Github.validarToken` confere o escopo pelo cabeçalho `X-OAuth-Scopes` e recusa
*fine-grained* de quem não é o dono; um 404 numa gravação com token é tratado como
problema de credencial, com o botão de configurar o token. Sem token a leitura vem do
site publicado (`fetch` relativo); com token vem da API. Se a API recusar o token, a
leitura cai no site publicado e `Github.estado.alerta = 'recusado'` aciona o aviso.
No login o cadastro é sempre relido — pela API quando o navegador já tem o token de
quem está entrando, senão pelo site publicado.

## Versão nova com a página aberta

O portal fica aberto o dia todo e o roteamento é por hash: sem recarregar, quem abriu
de manhã segue com o código da manhã. `versao.js` assina o conteúdo dos arquivos que a
página carregou — index, scripts e CSS — e confere a cada 5 minutos e ao voltar à aba.
Se o site publicado mudou, a casca mostra o aviso com **Recarregar**, antes de qualquer
outro. Não há número de versão para subir, e commit só de dados não acende o aviso.
Arquivo que a página carregou e sumiu do site conta como versão nova; erro de rede e
5xx não contam.

> Em 15/09/2026, antes disso existir, um impedimento finalizado uma hora depois da
> publicação da fila do roadmap saiu sem módulo, pela versão antiga, e foi corrigido à
> mão. Publicação que muda o que se grava ainda merece aviso à equipe.

## A fila do roadmap e o OPSView

Impedimento finalizado com módulo e entregável entra em `data/roadmap/fila.csv`. Em
`#/admin/roadmap` o gestor tria linha a linha, aprova com um nome curto, e gera o
pacote no formato do `POST /roadmap/api/import-json`. O mapeamento de campos está em
`opsview`, no `config.js` — é acordo com quem é dono daquele ambiente, não dedução.

**O portal para no pacote.** O POST não sai do navegador: o endereço do OPSView não
responde à verificação prévia (OPTIONS devolve 405, sem `Access-Control-Allow-Origin`),
e um token de serviço não tem o que fazer numa página estática. O `curl` é digitado por
quem decide enviar, e a tela mostra o comando pronto.

Três coisas que o payload nunca leva, e o motivo:

- **`fim_baseline`** — é a régua do atraso, se grava uma vez e não se muda. Não se
  cunha automaticamente a partir de data que ninguém prometeu.
- **`peso`, `progresso` de item em curso, `bloqueada`** — são da tela do OPSView.
  Campo ausente preserva o que estiver lá; mandá-lo apagaria trabalho de outra pessoa.
- **numeração de MVP** — `MVP <I..IV>` é recurso finito do roadmap, e a maioria dos
  módulos já tem o III ocupado. O que sai daqui é sempre `TarefaInterna - <nome>`.

E uma que não tem conserto pela API: **no OPSView não há rota de remoção.** Item
enviado cuja linha depois é cancelada fica órfão lá, e a tela acende um aviso dizendo
que o conserto é na tela do OPSView, à mão.

## Esquema dos CSV

### `data/usuarios.csv`

`usuario,nome,papel,senha_hash,ativo`

- `usuario` — minúsculas, `[a-z0-9._-]`; nomeia `data/impedimentos/<usuario>.csv` e
  não muda depois.
- `papel` — chave de `data/papeis.csv`.
- `senha_hash` — SHA-256 hex de `usuario + ':' + senha + ':' + salt` (salt em
  `config.js`, herdado do Portal QA). **Vazio** = a pessoa ainda entra com a senha
  compartilhada do antigo Controle de Impedimentos (`senhaCompartilhadaHash`, SHA-256
  simples) e o portal pede a troca.
- `ativo` — `sim`/`nao`. Usuário não é excluído, é desativado.

### `data/papeis.csv`

`papel,nome_pt,nome_en,permissoes`

`permissoes` é a lista de chaves separada por `;`, na ordem do catálogo de
`config.js`. `Acesso.expandir()` completa o que cada permissão `requer` e descarta
chave desconhecida.

### `data/projetos.csv` — Portal QA

`id,nome,produto,descricao_pt,descricao_en,arquivo,ativo`

`arquivo` aponta o catálogo (`data/projetos/<id>.csv`). `ativo` = `sim`/`nao`.

### `data/projetos/<id>.csv` — catálogo de casos

`id,modulo,rota,stub,uc,rf,prioridade,tipo,titulo_pt,titulo_en,criterio_pt,criterio_en,status,testado_por,data_teste,devolucoes,ultima_devolucao,referencia,observacoes`

| Coluna | Origem | Descrição |
|---|---|---|
| `id` | catálogo | `QA-<MOD>-<NN>` |
| `modulo` | catálogo | Chave do módulo; o rótulo bilíngue mora em `qa/i18n.js` |
| `rota` · `stub` | catálogo | Onde a funcionalidade é exercida · componente de referência |
| `uc` / `rf` | catálogo | Referências do SRS |
| `prioridade` | catálogo | `alta` · `media` · `baixa` |
| `tipo` | catálogo | `funcional` · `interface` · `permissao` · `integracao` · `dados` |
| `titulo_pt` / `titulo_en` · `criterio_pt` / `criterio_en` | catálogo | O que testar · como validar |
| `status` | **QA** | Ver situações abaixo |
| `testado_por` · `data_teste` | **QA** | Preenchidos sozinhos pela sessão (`AAAA-MM-DD`, dia local) |
| `devolucoes` · `ultima_devolucao` | **QA** | Contador de voltas; sobe sozinho a cada `devolvida` |
| `referencia` · `observacoes` | **QA** | Texto livre |

### `data/impedimentos/<usuario>.csv`

`id,usuario,inicio,motivo_inicio,fim,motivo_fim,duracao_min,status,criado_em,atualizado_em,modulo,entregavel`

- `inicio`/`fim` — `AAAA-MM-DDTHH:mm`, horário local, sem fuso (o formato do
  `datetime-local`).
- `duracao_min` e `status` (`aberto`/`finalizado`) são derivados de início e fim e
  recalculados a cada gravação.
- Um impedimento aberto por vez — conferido ao iniciar e ao editar; data futura
  bloqueada (tolerância de 1 minuto).
- Atravessar a meia-noite conta o esforço inteiro no dia de início — calendário e
  painel somam igual.
- `modulo`/`entregavel` — informados ao finalizar, e é o que alimenta a fila do
  roadmap. Ficam também aqui, e não só na fila, para o que a pessoa digitou nunca
  depender da segunda gravação. **Finalizar exige o catálogo de módulos**: se ele não
  carregar, o formulário mostra o erro e *Tentar de novo*, sem perder o término digitado.
  Iniciar não depende dele.
- Arquivo ainda com as 10 colunas de antes é lido normalmente — coluna ausente vem vazia
  — e ganha as duas na próxima gravação da própria pessoa. Não há migração em lote: ela
  disputaria o arquivo com quem está usando o portal.

### `data/roadmap/modulos.csv`

`modulo,nome,frente,ativo`

Cópia versionada dos módulos do roadmap — o portal não lê arquivo de fora do
repositório em tempo de execução. `frente` é `S` (SaaS), `P` (Premise) ou `T`
(Tarefas Internas), e é o que decide `ambiente` e `area` no OPSView.

> **`nome` é o nome do produto no OPSView, byte a byte** — acento e o `×` (U+00D7) de
> `PROG × PLAYOUT` inclusive. Divergir aqui cria um produto novo lá, em silêncio.
>
> **Exceção:** `inforadio-cobol` ("InfoRádio Cobol", Tarefas Internas) foi criado aqui em
> 15/09/2026 e ainda não existe nem no roadmap nem no OPSView — o primeiro envio dele
> cria o produto lá. Alinhar com o dono do OPSView antes, e levar o módulo ao roadmap.

### `data/roadmap/fila.csv`

`id,usuario,pessoa,modulo,modulo_nome,entregavel,motivo_inicio,motivo_fim,inicio,fim,duracao_min,situacao,criado_em,atualizado_em` — escritas por Impedimentos;
`titulo,triagem,triagem_por,triagem_em,motivo_recusa,roadmap_key,enviado_em` — escritas pela Administração.

Um arquivo, dois donos. Cada lado só escreve os campos que são dele e preserva o
resto: `Impedimentos.Roadmap.aplicarSobre` copia apenas o que a linha traz, e
`Admin.Roadmap` acrescenta coluna no fim sem tocar nas catorze primeiras.

- `id` é o do impedimento — é o que amarra as duas pontas.
- `situacao` (`ativo`/`cancelado`) vem de Impedimentos: impedimento excluído ou
  reaberto marca a linha em vez de apagá-la, para o roadmap não perder o rastro.
- `triagem` é `pendente`/`aprovado`/`recusado`. Linha cancelada não se aprova.
- `roadmap_key` é cunhada na aprovação e **nunca muda** — é ela que faz o reenvio ao
  OPSView atualizar em vez de duplicar. O contador vive na própria fila, calculado
  sobre a versão relida, então dois gestores triando ao mesmo tempo não colidem.

## Portal QA — situações e métricas

| Valor | Significado | Fase |
|---|---|---|
| `nao_testado` | Ainda não foi executado | Planejado |
| `em_teste` | Execução em andamento | Em andamento |
| `liberada` | Passou no critério, liberada para uso | Concluído |
| `devolvida` | Voltou ao desenvolvimento para ajuste; conta uma volta | Em andamento |
| `bloqueada` | Não deu para testar (dependência, ambiente, dado, acesso) | Em andamento |
| `nao_implementada` | Existe no protótipo, ainda não existe no ambiente | Em andamento |
| `nao_aplicavel` | Saiu do escopo ou foi absorvida por outro caso | fora das métricas |

`nao_implementada` expõe a distância entre o que foi prototipado/validado com o
cliente e o que já está de pé no ambiente. **Não remover essa situação.**

- **Cobertura** — casos com desfecho (`liberada`, `devolvida`, `bloqueada`,
  `nao_implementada`) sobre o total; `nao_aplicavel` sai do denominador.
- **Liberado** — `liberada` sobre o total.
- **Retrabalho** — casos com `devolucoes >= 1` sobre os casos com desfecho; ao lado, o
  total de devoluções e os reincidentes (`devolucoes >= 2`).

### Dimensionar o catálogo de um projeto novo

O catálogo cobre **o produto inteiro conforme prototipado e validado com o cliente**,
não apenas o que já foi codificado:

1. Varrer o repositório de stubs/protótipo: rotas, componentes de tela, diálogos e
   serviços.
2. Cada tela e cada ação discreta vira um caso; `stub` aponta o componente que define
   o comportamento esperado.
3. Agrupar em módulos que reflitam o domínio, não a estrutura de pastas.
4. Escrever título e critério nos dois idiomas.
5. O que ainda não existe no ambiente entra como `nao_implementada` conforme o QA
   passar.

### Acrescentar um projeto

1. Criar `data/projetos/<id>.csv` com as colunas acima.
2. Acrescentar a linha em `data/projetos.csv`.
3. Incluir os rótulos pt/en dos módulos novos em `MODULOS` no `qa/i18n.js`.

> **Chave de módulo é global — prefixe por projeto** (`news-cadastros`, `ed-pontos`,
> `vt-hotkeys`, `aud-sorteios`).

### Projetos existentes

| id | Produto | Casos | Catálogo dimensionado por |
|---|---|--:|---|
| `news` | InfoRadio News (Jornalismo) | 180 | Protótipo validado do módulo Jornalismo — 43 rotas, ~155 componentes |
| `editor` | Editor de Mídias | 45 | Integração do novo editor de áudio e vídeo entregue em 2026 na Central de Negócios |
| `voicetracker` | VoiceTracker MVP II | 60 | Backlog de produto do MVP 2 e do MVP 3 — 21 cards, um caso por critério "Pronto quando" |
| `audience` | InfoRadio Audience (Gestão de Ouvintes) | 131 | 17 épicos do plano Audience, conferidos contra a implementação do serviço e do front React |

> **Audience: a implementação viva está no front React.** O módulo Angular é a
> geração anterior; olhar só o Angular leva a concluir, errado, que o recurso não
> foi implementado.

## Permissões — acrescentar uma

1. Acrescentar `{ chave, ferramenta, requer? }` em `permissoes` do `config.js`.
2. Dar `perm.<chave>` e `perm.<chave>Desc` nos dois idiomas do `i18n.js`.
3. Usar `Acesso.pode('<chave>')` na tela. A matriz da Administração passa a mostrá-la
   sem outra alteração; marque-a nos papéis que devem recebê-la.

## Testar antes de entregar

Não há framework de teste. O harness está em `testes/` — servidor de arquivo,
Chrome headless pelo protocolo de DevTools e a API de conteúdo do GitHub **simulada
em memória** por um script injetado antes da página, tudo em Node puro, sem
dependência. Cada suíte roda com `node testes/<suíte>.mjs`; a lista delas e como
escrever caso novo estão em `testes/LEIAME.md`. Percorrer:

- login com senha errada, senha compartilhada e senha pessoal; usuário inativo;
- dev sem token (modo leitura), com token (somente consulta), sem acesso a `#/admin`;
- token inválido, sem escrita e válido — e que não é pedido de novo no próximo login;
- impedimento: data futura, abrir, finalizar, CSV com escape RFC 4180;
- finalizar sem o catálogo no ar é barrado com *Tentar de novo*, e iniciar não; CSV de
  10 colunas ganha as duas na primeira gravação, com vírgula e quebra de linha intactas;
- fila que falha não pinta o selo de falha, acende o aviso e sai no tentar de novo;
  linha perdida em memória volta pela reconciliação, em commit único, e registro que não
  foi lido não cancela nada, nem registro reescrito pela versão antiga sem módulo;
- fila do roadmap: a triagem grava **sem tocar nas catorze colunas de Impedimentos**,
  e uma gravação de Impedimentos não apaga `triagem` nem `roadmap_key`;
- chave do roadmap cunhada uma vez só, sem colidir com as 61 `RMAP-` já no OPSView, e
  imutável quando a linha é reaberta;
- linha cancelada não se aprova; linha já enviada e depois cancelada acende o aviso de
  item órfão; linha editada depois da triagem aparece marcada;
- pacote do OPSView: envelope `items`, `fim_baseline` e `peso` **nunca** no payload,
  título sem cunhar numeração de MVP, datas em `AAAA-MM`;
- `#/admin/roadmap` com papel sem `admin.usuarios` cai em "sem acesso" e não lê a fila;
- QA: registrar, contador de voltas, **conflito** com alteração alheia preservada,
  alteração feita com o commit em voo, catálogo que falhou relido ao entrar;
- **exportar sem editar devolve cada catálogo idêntico ao arquivo** — senão o
  primeiro commit gera um diff falso no catálogo inteiro;
- Administração: novo usuário, duplicado, desativar a si mesmo, matriz com
  dependência entre permissões, gravação de outro gestor preservada, trava do último
  administrador, papel em uso, rascunho descartado no logout;
- hash desconhecido (inclusive `#/constructor`) cai no início;
- versão nova publicada com a página aberta acende o aviso de recarregar; arquivo que
  sumiu no deploy também; commit só de dados, erro de rede e 5xx não;
- inglês; 400px de largura sem rolagem horizontal.

Olhe as capturas de tela: o teste confere comportamento, não layout.

## Convenções de Git

- Trabalhar direto em `main`; sem feature branches.
- Conventional Commits em pt-BR, sem acentos na mensagem: `feat`, `fix`, `chore`,
  `docs`, `refactor`, `test`, `style`, `perf`.
- **Confirmação explícita do usuário antes de `git commit` e `git push`.** Uma
  autorização anterior não vale para a próxima vez.
