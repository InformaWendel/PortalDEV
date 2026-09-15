# Testes do Portal DEV

Não há framework, e não há dependência a instalar. O portal é servido de um
`node:http` de dez linhas, aberto num Chrome headless dirigido pelo protocolo de
DevTools, com a **API de conteúdo do GitHub simulada em memória** por um script
injetado antes da página.

```
node testes/fila-do-roadmap.mjs
node testes/captura-no-impedimento.mjs
node testes/versao-nova.mjs
```

Cada um sai `0` quando tudo passa e `1` quando algo falha, com a lista no fim.

## O que roda de verdade

O que o navegador carrega são os **mesmos arquivos que vão para o GitHub Pages** —
nenhuma variante de teste, nenhum `if (teste)`. Só a rede é falsa: `window.fetch` é
trocado antes de o portal carregar, e responde por `api.github.com` a partir de um
sistema de arquivos em memória. O que a simulação não conhece ela busca no servidor
estático e passa a valer dali em diante, então os CSV do repositório entram no teste
sem serem copiados para cá.

O `PUT` confere o `sha` e devolve **409** quando ele está velho, como o GitHub — é o
que exercita o ciclo ler-alterar-gravar de `Github.alterarArquivo`.

## Os arquivos

| Arquivo | O que é |
|---|---|
| `harness.mjs` | Servidor, navegador por CDP, simulação do GitHub e o contador de asserções. Lê `salt`, caminhos e nomes de chave do próprio `config.js`, para o teste não guardar uma segunda cópia da verdade |
| `fila-do-roadmap.mjs` | Triagem em `#/admin/roadmap`, pacote do OPSView, trava de permissão, item órfão, inglês e 400px |
| `captura-no-impedimento.mjs` | O lado de quem registra: finalizar sem catálogo, CSV antigo ganhando as colunas, fila que falha sem pintar o selo, reconciliação ao entrar |
| `versao-nova.mjs` | Aviso de versão nova com a página aberta: script mudado e arquivo sumido acendem; dado, erro de rede e 5xx não |

As capturas saem em `testes/*.png` e não são versionadas. **Olhe-as:** o teste confere
comportamento, não layout.

## Ao escrever um caso novo

- Semeie o estado pelo `simulacaoGithub({ arquivos })`, não clicando a tela inteira
  até chegar lá — teste que depende de vinte cliques anteriores quebra por qualquer
  motivo, menos o que ele deveria pegar.
- Confira o **arquivo gravado** (`window.__arquivo(caminho)`) e a **mensagem do
  commit** (`window.__commits`), não só o que aparece na tela.
- Rede ruim se simula com `ausentes` (404 pela API e pelo site publicado) e `falhas`
  (500 no `PUT`). Os dois são `Set` em `window.__ausentes` e `window.__falhas`: tire o
  caminho do conjunto e a rede "volta" no meio do teste.
- Publicação nova se simula com `sobrescritas`: texto no caminho vira o arquivo
  publicado, `{ status: 503 }` vira resposta de erro. Mutável em
  `window.__sobrescritas`.
- Conferência de tradução compara inglês com português, e não com a chave: `I18N.t`
  cai no português quando falta o inglês, então chave faltando só em inglês devolve
  texto, não a chave.
- `nav.excecoes` acumula toda exceção do navegador. Uma asserção no fim de cada suíte
  exigindo que esteja vazia pega o erro que não derrubou nada visível.
