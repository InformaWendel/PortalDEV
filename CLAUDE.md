# CLAUDE.md — Portal DEV

Guia para o Claude Code trabalhar neste repositório. **Esta é a estrutura base de
toda ferramenta do portal** — reproduza-a, não a reinvente.

## O que é este repositório

Portal estático que reúne as ferramentas do time de desenvolvimento da Informa
Solutions sobre **um login, um cadastro de permissões e um token do GitHub**:

- **Portal QA** (`#/qa`) — testes de qualidade por projeto: planejado, em andamento,
  concluído e retrabalho. Cada projeto é um plano executável — seções com preparação,
  casos com passos e resultado esperado, e a conferência do QA em cada um.
- **Administração** (`#/admin`) — usuários, papéis e matriz de permissões.

> O Controle de Impedimentos e a fila do roadmap (integração com o OPSView) foram
> descontinuados e removidos em 15/10/2026; o histórico está no git.

Código e dados de todas as ferramentas moram em `InformaWendel/PortalDEV`, branch
`main`, publicado pelo GitHub Pages.

## Restrições inegociáveis

- **Sem backend.** Só HTML, CSS e JavaScript servidos como arquivo estático. Nada de
  build, bundler, framework ou dependência externa — nem CDN.
- **JavaScript sem transpilação**, em `assets/js/`, um arquivo por responsabilidade,
  no padrão IIFE que publica um objeto em `window`. Nada de ES modules.
- **Tema escuro único.** Cor primária `#f7941d` (laranja da casa). Tokens `--pd-*` no
  `:root` do `portal.css`. Prefixos de classe: `pd-` casca e compartilhado, `adm-`
  Administração.
- **Dois idiomas: pt-BR e en-US.** Detecção pelo navegador, alternância no cabeçalho.
  Nenhuma string fixa na renderização — tudo passa por `I18N.t()`. Cada ferramenta
  registra o próprio dicionário com prefixo (`qa.`, `adm.`); a casca usa
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
│   └── projetos/<id>.csv         Portal QA: casos de teste de um projeto
├── testes/                       harness (Chrome headless + GitHub simulado) e suítes
└── assets/
    ├── css/portal.css
    └── js/
        ├── config.js             repositório, caminhos, salt, permissões
        ├── i18n.js               motor de idioma + dicionário da casca
        ├── csv.js                leitura e escrita RFC 4180
        ├── ui.js                 escape, diálogo, aviso flutuante, download
        ├── github.js             token por usuário, leitura, gravação, ler-alterar-gravar
        ├── auth.js               login, sessão, troca e gravação de senha
        ├── acesso.js             papéis e permissões (pode, podeFerramenta)
        ├── versao.js             percebe versão nova publicada e pede para recarregar
        ├── qa/                   i18n.js · store.js · telas.js
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
| `#/qa/p/<id>` · `#/qa/p/<id>/casos` | Painel e plano executável do projeto | `qa.consultar` (registrar: `qa.registrar`) |
| `#/admin` · `#/admin/permissoes` | Usuários e matriz | `admin.usuarios` |

## Contrato de uma ferramenta

`app.js` não conhece tela de ferramenta. Cada uma publica em `window.<Ferramenta>.Telas`:

| Função | Papel |
|---|---|
| `iniciar()` | Liga os ouvintes, uma vez. Ouvinte delegado confere `App.ferramentaAtual()` e usa atributo próprio (`data-qa`, `data-adm`); a casca usa `data-acao` |
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
  após `atrasoGravacao` ms sem tecla, grava o CSV inteiro. Vale igual para a caixa, a
  situação e as anotações digitadas direto no plano, e para a gaveta. Fechar a gaveta,
  sair da ferramenta ou fazer logout força a gravação. Há um commit por projeto de cada
  vez: o que for registrado com o PUT em voo continua na fila e sai logo em seguida. O
  plano não é redesenhado a cada tecla — `atualizarCaso()` mexe só na faixa, na caixa,
  na situação e na assinatura, para quem digita não perder o campo.
- **Administração** — `Github.alterarArquivo(caminho, mutador)`: lê, aplica o mutador
  sobre a versão mais nova e grava. O mutador pode lançar erro (ex.: último
  administrador) para abortar. A matriz de permissões
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

## Versão nova com a página aberta

O portal fica aberto o dia todo e o roteamento é por hash: sem recarregar, quem abriu
de manhã segue com o código da manhã. `versao.js` assina o conteúdo dos arquivos que a
página carregou — index, scripts e CSS — e confere a cada 5 minutos e ao voltar à aba.
Se o site publicado mudou, a casca mostra o aviso com **Recarregar**, antes de qualquer
outro. Não há número de versão para subir, e commit só de dados não acende o aviso.
Arquivo que a página carregou e sumiu do site conta como versão nova; erro de rede e
5xx não contam. Publicação que muda o que se grava ainda merece aviso à equipe.

## Esquema dos CSV

### `data/usuarios.csv`

`usuario,nome,papel,senha_hash,ativo`

- `usuario` — minúsculas, `[a-z0-9._-]`; é o carimbo dos registros e
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

`id,modulo,rota,stub,uc,rf,prioridade,tipo,titulo_pt,titulo_en,passos_pt,passos_en,criterio_pt,criterio_en,status,verificado,execucao,falha,testado_por,data_teste,devolucoes,ultima_devolucao,referencia,observacoes`

É o formato do **plano executável**, padrão de todo projeto desde 18/09/2026: cada
módulo é uma seção com texto de preparação, cada caso tem cenário, passos e resultado
esperado, e o QA registra a conferência, o que testou e a possível falha. Veio do app
que o QA do Audience fez à parte para trabalhar assim.

| Coluna | Origem | Descrição |
|---|---|---|
| `id` | catálogo | `QA-<MOD>-<NN>`. Exceção: `QA-NNN` no Audience, os ids do plano do QA |
| `modulo` | catálogo | Chave do módulo — a seção do plano; nome e preparação bilíngues moram em `qa/i18n.js` |
| `rota` · `stub` | catálogo | Onde a funcionalidade é exercida · componente de referência |
| `uc` / `rf` | catálogo | Referências do SRS |
| `prioridade` | catálogo | `alta` · `media` · `baixa`; a tela mostra P0 · P1 · P2 |
| `tipo` | catálogo | `funcional` · `interface` · `permissao` · `integracao` · `dados` |
| `titulo_pt` / `titulo_en` | catálogo | Cenário: o que testar |
| `passos_pt` / `passos_en` | catálogo | Roteiro de execução. Vazio mostra "Passos a detalhar" |
| `criterio_pt` / `criterio_en` | catálogo | Resultado esperado |
| `status` | **QA** | Ver situações abaixo |
| `verificado` | **QA** | `sim`/`nao` — a conferência do QA; ver regras abaixo |
| `execucao` · `falha` | **QA** | O que foi testado (ambiente, massa, evidência) · possível falha. Texto livre |
| `testado_por` · `data_teste` | **QA** | Preenchidos sozinhos pela sessão (`AAAA-MM-DD`, dia local) |
| `devolucoes` · `ultima_devolucao` | **QA** | Contador de voltas; sobe sozinho a cada `devolvida` |
| `referencia` · `observacoes` | **QA** | Texto livre |

O portal grava sempre nesta ordem. Catálogo em formato anterior é lido normalmente e
ganha as colunas na próxima gravação — sem `verificado`, conta como verificado o caso
com desfecho e `testado_por` preenchido. Coluna que o portal não conhece não se perde:
vai para o fim do arquivo.

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
- **Verificados** — `verificado = sim` sobre o total; ao lado, os casos com `falha`
  preenchida. `nao_aplicavel` sai das duas contas.

**Verificado e situação andam juntos** (`acoplarVerificacao` no `qa/store.js`), para o
painel não chamar de "não testado" o que o QA já executou:

- marcar a caixa, ou escrever em `execucao` ou `falha`, num caso `nao_testado` o põe
  `em_teste` — e assina, como toda troca de situação;
- dar um desfecho (`liberada`, `devolvida`, `bloqueada`, `nao_implementada`) marca
  verificado; voltar a `nao_testado` desmarca;
- desmarcar não mexe na situação: é o QA avisando que vai conferir de novo.

A faixa na borda do caso segue o app do QA: âmbar com falha registrada, verde verificado
sem falha.

### Dimensionar o catálogo de um projeto novo

O catálogo cobre **o produto inteiro conforme prototipado e validado com o cliente**,
não apenas o que já foi codificado:

1. Varrer o repositório de stubs/protótipo: rotas, componentes de tela, diálogos e
   serviços.
2. Cada tela e cada ação discreta vira um caso; `stub` aponta o componente que define
   o comportamento esperado.
3. Agrupar em módulos que reflitam o domínio, não a estrutura de pastas. O módulo é a
   seção do plano, na ordem em que aparece no CSV: ordene as linhas na ordem em que o
   plano deve ser executado.
4. Escrever cenário, passos e resultado esperado nos dois idiomas, e a preparação de
   cada seção (onde entrar, que perfil, que massa).
5. O que ainda não existe no ambiente entra como `nao_implementada` conforme o QA
   passar.

### Acrescentar um projeto

1. Criar `data/projetos/<id>.csv` com as colunas acima.
2. Acrescentar a linha em `data/projetos.csv`.
3. Incluir em `MODULOS` no `qa/i18n.js` o nome pt/en de cada módulo novo e, em
   `preparo`, o texto de preparação da seção nos dois idiomas.

> **Chave de módulo é global — prefixe por projeto** (`news-cadastros`, `ed-pontos`,
> `vt-hotkeys`, `aud-sorteios`).

### Projetos existentes

| id | Produto | Casos | Catálogo dimensionado por |
|---|---|--:|---|
| `news` | InfoRadio News (Jornalismo) | 180 | Protótipo validado do módulo Jornalismo — 43 rotas, ~155 componentes |
| `editor` | Editor de Mídias | 45 | Integração do novo editor de áudio e vídeo entregue em 2026 na Central de Negócios |
| `voicetracker` | VoiceTracker MVP II | 60 | Backlog de produto do MVP 2 e do MVP 3 — 21 cards, um caso por critério "Pronto quando" |
| `audience` | InfoRadio Audience (Gestão de Ouvintes) | 138 | Plano executável do QA (83 casos, `QA-001` a `QA-083`, em 11 seções) mais 55 casos do catálogo por épico que o plano não cobre |
| `regressao` | Release 27.2.0 (InfoAudio) | 60 | Plano padrão de regressão dos recursos críticos do InfoAudio, rodado a cada release mensal (não cobre feature nova): 12 seções, 29 casos `Smoke` (mínimo para liberar; a coluna `rota` guarda `Smoke` ou `Completo`), P0 = bloqueia a liberação. Origem: documentos de recurso do InfoAudio e ocorrências recentes (`rf` guarda o CAS). Ids `QA-REG-NN` |

> **Audience: a implementação viva está no front React.** O módulo Angular é a
> geração anterior; olhar só o Angular leva a concluir, errado, que o recurso não
> foi implementado.

> **Audience: de onde veio o catálogo.** Em 18/09/2026 o plano que Alisson Delatim
> (QA) mantinha num app à parte foi trazido para o portal, com as anotações dele
> assinadas e datadas de 17/09 (o `db.json` não guardava data por caso). Verificado sem
> falha virou `liberada`; verificado com falha, ou só anotado, virou `em_teste`. Dos 131
> casos do catálogo por épico, 76 eram duplicados de um caso do plano e saíram: o id de
> cada um está em `referencia` do caso que o absorveu ("Catálogo anterior: …"), e o que
> tinham registrado foi junto — as observações da varredura de 09/09 em `observacoes`,
> e a assinatura e a devolução do `QA-AUD-21` no `QA-039`. A situação
> `nao_implementada` dos absorvidos **não** foi levada: o plano do QA é mais novo que a
> varredura, e o desfecho é dele. Os 55 que ficaram entraram na seção do plano do assunto
> deles, sem passos.

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
- QA: registrar, contador de voltas, **conflito** com alteração alheia preservada,
  alteração feita com o commit em voo, catálogo que falhou relido ao entrar;
- plano executável: seções na ordem do CSV com preparação, passos e resultado; marcar
  verificado ou anotar num não testado o põe em teste e assina; desfecho marca e "não
  testado" desmarca; anotação com vírgula, aspas e quebra de linha grava intacta;
  anotar na gaveta não tira o cursor; catálogo de 19 colunas ganha as novas na primeira
  gravação; quem só consulta vê texto, sem campo;
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
