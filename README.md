# Portal DEV — Informa Solutions

Um portal só para as ferramentas do time de desenvolvimento, com **um login, um
cadastro de permissões e um token do GitHub** para tudo:

| Ferramenta | Para que serve |
|---|---|
| **Portal QA** | Acompanhamento dos testes de qualidade por projeto: o que está planejado, em andamento e liberado, e o retrabalho que vai e volta entre teste e desenvolvimento. |
| **Impedimentos** | Registro das interrupções do dia a dia, com cronômetro, calendário pessoal e painel consolidado da equipe. |
| **Administração** | Usuários, papéis e a matriz de permissões de acesso às ferramentas. |

Roda inteiramente no navegador — HTML, CSS e JavaScript, sem backend e sem
dependência externa — para ser publicado no GitHub Pages. Os dados ficam em CSV
dentro do próprio repositório. Tema escuro; português e inglês.

> A estrutura técnica completa — esquema dos CSV, rotas, contrato das ferramentas,
> como acrescentar permissão ou projeto de teste — está em [CLAUDE.md](CLAUDE.md).
> O passo a passo de implantação e o texto para a equipe estão em
> [GUIA-EQUIPE.md](GUIA-EQUIPE.md).

---

## ⚠️ Leia antes de publicar

1. **O login identifica, não protege.** Todo o código roda no navegador;
   `data/usuarios.csv` e `data/papeis.csv` são legíveis por quem abrir o site, e a
   sessão mora no navegador. As permissões organizam o que cada um vê e edita, mas
   podem ser contornadas por quem abrir o DevTools. **Quem de fato consegue gravar é
   o GitHub que decide:** só grava quem tem token com escrita no repositório.
2. **O repositório é a base de dados.** Se ele for público, os CSV também são. Não
   registre nome de cliente, dado pessoal ou informação contratual em motivos,
   observações ou referências.
3. **Não reutilize aqui senha de outro sistema.** A senha é guardada como hash
   SHA-256, o que evita texto puro no repositório, mas não torna o acesso seguro.

---

## Acesso

### Login único

Cada pessoa entra com o próprio usuário (`wendel.martins`, `cicero`…) e a própria
senha. O papel dela define o menu: quem não tem nenhuma permissão de uma ferramenta
não a vê.

Quem veio do antigo Controle de Impedimentos e ainda não tem senha pessoal
(`senha_hash` vazio no cadastro) entra com a **senha compartilhada de antes** e o
portal mostra um aviso até a pessoa trocá-la pelo menu da conta → **Trocar senha**.
Quem já usava o Portal QA continua com a senha que tinha.

### Papéis e permissões

As permissões são fixas no código (cada uma liga um recurso da tela); quem recebe
cada uma fica em `data/papeis.csv` e é editado na **Administração → Permissões**.

| Permissão | O que libera |
|---|---|
| `qa.consultar` | Painéis, catálogos, testes em aberto e retrabalho de todos os projetos |
| `qa.registrar` | Mudar a situação dos casos e preencher testado por, data, referência e observações (inclui `qa.consultar`) |
| `impedimentos.registrar` | Cronômetro e calendário dos próprios impedimentos |
| `impedimentos.painel` | Painel consolidado com os registros de toda a equipe e exportação |
| `admin.usuarios` | Cadastrar pessoas, trocar papéis, redefinir senhas e editar a matriz |

Papéis que já vêm configurados:

| Papel | Consultar QA | Registrar testes | Registrar impedimentos | Painel consolidado | Administrar |
|---|:-:|:-:|:-:|:-:|:-:|
| `gestor` — Gestor | ✓ | ✓ | ✓ | ✓ | ✓ |
| `qa` — Analista de QA | ✓ | ✓ | ✓ | | |
| `dev` — Desenvolvedor | ✓ | | ✓ | | |

**Desenvolvedores agora têm acesso ao Portal QA**, em modo consulta: veem o que foi
devolvido, o que está bloqueado, o critério de cada caso e o retrabalho, mas não
mudam o resultado do teste. Para dar registro a alguém, troque o papel da pessoa ou
marque `qa.registrar` no papel `dev`.

A Administração tem duas travas: ninguém desativa o próprio usuário, e nenhuma
alteração pode deixar o portal sem pelo menos uma pessoa ativa com
`admin.usuarios`. Usuário não é excluído, é **desativado** — o histórico de testes e
impedimentos continua no repositório.

### Token do GitHub — informado uma vez

Uma página estática não escreve em arquivo do servidor; cada registro vira um commit
pela API de conteúdo do GitHub. Para isso cada pessoa informa **uma única vez** um
token pessoal, que vale para **todas as ferramentas**.

`InformaWendel/PortalDEV` é repositório de **conta pessoal**, e o GitHub não deixa
colaborador usar token *fine-grained* nesse caso. Por isso:

| Quem | Token |
|---|---|
| Colaboradores (a equipe) | **Clássico:** Settings → Developer settings → Personal access tokens → *Tokens (classic)* → *Generate new token (classic)*, escopo **`public_repo`** (ou `repo`, se o repositório ficar privado) |
| Dono do repositório | Clássico como acima, ou *fine-grained* com *Only select repositories* → `InformaWendel/PortalDEV` e *Contents: Read and write* |

O escopo `public_repo` vale para todos os repositórios públicos em que a pessoa pode
gravar, não só este: escolha uma validade curta e renove quando vencer.

Cole o token no portal — ele é pedido logo depois do primeiro login e fica no chip
**GitHub** do cabeçalho. Ele fica só no navegador, guardado sob o usuário do portal:
numa máquina compartilhada, cada pessoa grava com o próprio token. Antes de aceitar,
o portal confere se ele enxerga o repositório, se a conta tem escrita e se o token
consegue ler o conteúdo.

**Sem token o portal abre em modo leitura** — dá para consultar tudo, e os campos de
registro ficam travados. Se o token expirar, o portal avisa, continua lendo pelo
site publicado e não grava nada até um token válido ser informado.

> Por que um repositório só: cada repositório a mais seria mais um convite e mais uma
> permissão de token para cada pessoa configurar. Código e dados de todas as
> ferramentas moram em `InformaWendel/PortalDEV`.

---

## Onde os dados ficam

Os CSV do repositório são a **única fonte de verdade**. O `localStorage` guarda
apenas idioma, sessão e token — nunca registro.

```
data/
├── usuarios.csv                 cadastro único: usuario,nome,papel,senha_hash,ativo
├── papeis.csv                   papel,nome_pt,nome_en,permissoes
├── projetos.csv                 Portal QA — catálogo de projetos (formato inalterado)
├── projetos/<id>.csv            Portal QA — casos de teste (formato inalterado)
└── impedimentos/<usuario>.csv   Impedimentos — um arquivo por pessoa (formato inalterado)
```

Os CSV de projetos, catálogos e impedimentos mantêm as colunas originais do Portal
QA e do Controle de Impedimentos — o esquema completo está no [CLAUDE.md](CLAUDE.md).

Duas pessoas gravando o mesmo arquivo não se atropelam: em conflito o portal relê o
arquivo, reaplica só a alteração daquele navegador e grava de novo. O selo no
cabeçalho (`Salvando…` · `Salvo no repositório` · `Falha ao salvar` ·
`Somente leitura` · `Somente consulta`) mostra se o registro chegou.

As mensagens de commit identificam a ferramenta e quem registrou —
`chore(qa): QA-ED-01 devolvida por …`, `impedimento: inicio (cicero)` — e as da
Administração começam com `chore(acesso):`.

---

## Dados iniciais

O portal sai com o histórico registrado até 14/09/2026:

| Arquivo | Conteúdo |
|---|---|
| `data/projetos.csv` e `data/projetos/*.csv` | 4 projetos e 416 casos de teste, com os testes já registrados — no Editor de Mídias, 20 liberadas, 2 devolvidas e 1 não implementada |
| `data/impedimentos/*.csv` | um arquivo por pessoa, com os impedimentos já registrados |
| `data/usuarios.csv` | as 15 pessoas da equipe; quem vinha só do Controle de Impedimentos está com `senha_hash` vazio |
| `data/papeis.csv` | papéis `gestor`, `qa` e `dev` |

Combine com a equipe a data da virada: a partir dela, teste e impedimento se
registram só aqui.

---

## Publicar no GitHub Pages

O código está em `InformaWendel/PortalDEV`, branch `main`. Se o repositório mudar de
nome ou de dono, ajuste `github` em [assets/js/config.js](assets/js/config.js).

1. **Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`.**
2. **Settings → Collaborators → Add people** para cada pessoa que vai gravar, com
   convite pelo e-mail — ver [GUIA-EQUIPE.md](GUIA-EQUIPE.md). Em repositório de
   conta pessoal todo colaborador já recebe escrita.

O portal fica em `https://informawendel.github.io/PortalDEV/`. O `.nojekyll` já
está incluído. Repositório privado exige plano com Pages privado.

Cada registro é um commit na `main` e cada commit dispara um rebuild do Pages. O
registro não depende disso — a leitura com token vem direto da API —, mas quem
estiver **sem token** vê o que foi publicado, com um ou dois minutos de atraso.

## Rodar localmente

Abrir o `index.html` direto do disco não funciona: o navegador bloqueia a leitura
dos CSV por `file://` e o Web Crypto (usado no login) exige contexto seguro.

```
python -m http.server 8080
```

E abra `http://localhost:8080`. Com token configurado, as gravações vão para o
repositório real de `config.js`.

---

Informa Solutions
