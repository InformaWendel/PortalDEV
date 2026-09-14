# CLAUDE.md — Portal DEV

Guia para o Claude Code trabalhar neste repositório. **Esta é a estrutura base de
toda ferramenta do portal** — reproduza-a, não a reinvente.

## O que é este repositório

Portal estático que reúne as ferramentas do time de desenvolvimento da Informa
Solutions sobre **um login, um cadastro de permissões e um token do GitHub**:

- **Portal QA** (`#/qa`) — testes de qualidade por projeto: planejado, em andamento,
  concluído e retrabalho.
- **Controle de Impedimentos** (`#/impedimentos`) — interrupções do dia a dia, com
  cronômetro, calendário e painel consolidado.
- **Administração** (`#/admin`) — usuários, papéis e matriz de permissões.

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
│   └── impedimentos/<usuario>.csv  Impedimentos: registros de uma pessoa
└── assets/
    ├── css/portal.css
    └── js/
        ├── config.js             repositório, caminhos, salt, catálogo de permissões
        ├── i18n.js               motor de idioma + dicionário da casca
        ├── csv.js                leitura e escrita RFC 4180
        ├── ui.js                 escape, diálogo, aviso flutuante, download
        ├── github.js             token por usuário, leitura, gravação, ler-alterar-gravar
        ├── auth.js               login, sessão, troca e gravação de senha
        ├── acesso.js             papéis e permissões (pode, podeFerramenta)
        ├── qa/                   i18n.js · store.js · telas.js
        ├── impedimentos/         i18n.js · datahora.js · graficos.js · store.js ·
        │                         calendario.js · painel.js · telas.js
        ├── admin/                i18n.js · telas.js
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

## Contrato de uma ferramenta

`app.js` não conhece tela de ferramenta. Cada uma publica em `window.<Ferramenta>.Telas`:

| Função | Papel |
|---|---|
| `iniciar()` | Liga os ouvintes, uma vez. Ouvinte delegado confere `App.ferramentaAtual()` e usa atributo próprio (`data-qa`, `data-imp`, `data-imp-painel`, `data-adm`); a casca usa `data-acao` |
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

`id,usuario,inicio,motivo_inicio,fim,motivo_fim,duracao_min,status,criado_em,atualizado_em`

- `inicio`/`fim` — `AAAA-MM-DDTHH:mm`, horário local, sem fuso (o formato do
  `datetime-local`).
- `duracao_min` e `status` (`aberto`/`finalizado`) são derivados de início e fim e
  recalculados a cada gravação.
- Um impedimento aberto por vez — conferido ao iniciar e ao editar; data futura
  bloqueada (tolerância de 1 minuto).
- Atravessar a meia-noite conta o esforço inteiro no dia de início — calendário e
  painel somam igual.

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

Não há framework de teste. O caminho usado é o portal servido por
`python -m http.server`, aberto num Chrome headless dirigido pelo protocolo de
DevTools a partir de Node (sem dependência), com a API de conteúdo do GitHub
**simulada em memória** por um script injetado antes da página. Percorrer:

- login com senha errada, senha compartilhada e senha pessoal; usuário inativo;
- dev sem token (modo leitura), com token (somente consulta), sem acesso a `#/admin`;
- token inválido, sem escrita e válido — e que não é pedido de novo no próximo login;
- impedimento: data futura, abrir, finalizar, CSV com escape RFC 4180;
- QA: registrar, contador de voltas, **conflito** com alteração alheia preservada,
  alteração feita com o commit em voo, catálogo que falhou relido ao entrar;
- **exportar sem editar devolve cada catálogo idêntico ao arquivo** — senão o
  primeiro commit gera um diff falso no catálogo inteiro;
- Administração: novo usuário, duplicado, desativar a si mesmo, matriz com
  dependência entre permissões, gravação de outro gestor preservada, trava do último
  administrador, papel em uso, rascunho descartado no logout;
- hash desconhecido (inclusive `#/constructor`) cai no início;
- inglês; 400px de largura sem rolagem horizontal.

Olhe as capturas de tela: o teste confere comportamento, não layout.

## Convenções de Git

- Trabalhar direto em `main`; sem feature branches.
- Conventional Commits em pt-BR, sem acentos na mensagem: `feat`, `fix`, `chore`,
  `docs`, `refactor`, `test`, `style`, `perf`.
- **Confirmação explícita do usuário antes de `git commit` e `git push`.** Uma
  autorização anterior não vale para a próxima vez.
