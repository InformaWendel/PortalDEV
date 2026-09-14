# Guia de implantação — Portal DEV

Duas partes: a primeira é para quem administra o repositório (Wendel e Murilo); a
segunda é o texto pronto para enviar à equipe.

---

## Parte 1 — Colocar no ar (feito uma vez, pelo gestor)

### 1.1 Publicar

1. Código e dados já estão em `InformaWendel/PortalDEV`, branch `main`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch →
   `main` / `(root)` → Save.** O endereço fica
   `https://informawendel.github.io/PortalDEV/` em um ou dois minutos.
3. Combine a data da virada com a equipe: o portal sai com o histórico registrado
   até 14/09/2026, e a partir da virada tudo se registra só nele.

### 1.2 Convidar a equipe como colaboradora

**Settings → Collaborators → Add people** para cada pessoa. Em repositório de conta
pessoal não há papel a escolher: todo colaborador recebe escrita, que é o que a API
exige para gravar — qualquer que seja o papel da pessoa no portal.

> **Convide pelo e-mail, não pelo login.** Os logins do portal têm ponto
> (`wendel.martins`), e o GitHub não aceita ponto em nome de usuário. Pelo e-mail a
> pessoa aceita o convite com a conta que já usa.

| Pessoa | Login no portal | Papel inicial | Senha no primeiro acesso | Convidar por este e-mail |
|---|---|---|---|---|
| Wendel Côrtes Martins | `wendel.martins` | Gestor | a do Portal QA | `wendel.martins@informa.solutions` |
| Murilo Pereira | `murilo` | Gestor | compartilhada | `murilo@informa.solutions` |
| Alisson Delatim | `alisson.delatim` | Analista de QA | a do Portal QA | `alisson.delatim@informa.solutions` |
| Mateus Batalha | `mateus.batalha` | Analista de QA | a do Portal QA | `mateus.batalha@informa.solutions` |
| Adriano Ribeiro | `adriano.ribeiro` | Desenvolvedor | compartilhada | `adriano.ribeiro@informa.solutions` |
| André Martins | `andre.martins` | Desenvolvedor | compartilhada | `andre.martins@informa.solutions` |
| Christopher Takahashi | `christopher.takahasi` | Desenvolvedor | compartilhada | `christopher.takahasi@informa.solutions` |
| Cícero da Silva | `cicero` | Desenvolvedor | compartilhada | `cicero@informa.solutions` |
| Cláudio Natan | `natan.oliveira` | Desenvolvedor | compartilhada | `natan.oliveira@informa.solutions` |
| Felipe Mateus | `felipe.sanches` | Desenvolvedor | compartilhada | `felipe.sanches@informa.solutions` |
| Francisco Meneghetti | `francisco` | Desenvolvedor | compartilhada | `francisco@informa.solutions` |
| Giovana de Souza | `giovana.souza` | Desenvolvedor | compartilhada | `giovana.souza@informa.solutions` |
| Gustavo Dias | `gustavo.dias` | Desenvolvedor | compartilhada | `gustavo.dias@informa.solutions` |
| Marcelo Foresto | `marcelo.foresto` | Desenvolvedor | compartilhada | `marcelo.foresto@informa.solutions` |
| Vandrei Ribeiro | `vandrei.ribeiro` | Desenvolvedor | compartilhada | `vandrei.ribeiro@informa.solutions` |

> Ajuste a lista se algum e-mail for diferente. O login do portal e a conta do GitHub são
> independentes: o portal usa o login para carimbar o registro; o GitHub usa a conta
> que aceitou o convite para autorizar a gravação.

O convite **precisa ser aceito** antes de o token da pessoa funcionar.

### 1.3 Trocar a senha compartilhada dos gestores primeiro

`murilo` entra como **Gestor com a senha compartilhada**, que a equipe inteira
conhece. Faça o primeiro acesso dele antes de divulgar o endereço e troque a senha
pelo menu da conta → **Trocar senha**. A Administração mostra quem ainda está com a
senha compartilhada ("Compartilhada · troca pendente").

### 1.4 Ajustar papéis e permissões

Em **Administração → Usuários** confira o papel de cada um; em **Permissões**, o que
cada papel pode fazer. Pessoa nova: **Novo usuário**, com uma senha inicial entregue
por canal separado.

---

## Parte 2 — Texto para enviar à equipe

> Copie daqui para baixo e envie no canal da equipe. A senha compartilhada, para quem
> precisar, vai em mensagem separada.

---

**Assunto: Portal DEV — Portal QA e Impedimentos num lugar só**

Pessoal, o Portal QA e o Controle de Impedimentos agora estão juntos no **Portal
DEV**: https://informawendel.github.io/PortalDEV/

Um login só, e o token do GitHub é informado **uma única vez** para as duas
ferramentas. Os endereços antigos deixam de ser usados.

**Configuração inicial — uns 3 minutos, só na primeira vez.**

**Passo 1 — Aceitar o convite do GitHub**

Você recebeu (ou vai receber) um convite por e-mail para o repositório
`InformaWendel/PortalDEV`. Aceite antes de continuar.

**Passo 2 — Entrar**

Abra o link e entre com o seu usuário de sempre (`nome.sobrenome`).

- Já usava o **Portal QA**? Use a mesma senha de lá.
- Usava só o **Controle de Impedimentos**? Use a senha compartilhada de antes. O
  portal vai pedir que você defina uma senha só sua — faça isso logo, pelo menu com
  o seu nome → **Trocar senha** (mínimo de 8 caracteres, e não reaproveite senha de
  outro sistema).

**Passo 3 — Gerar o token do GitHub (uma vez só)**

Logo depois de entrar o portal pede o token. Ele autoriza o portal a gravar os seus
registros no repositório e fica salvo **só no seu navegador**.

1. No GitHub, clique na sua foto → **Settings**
2. No fim do menu da esquerda → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token** →
   **Generate new token (classic)**
4. Preencha:
   - **Note:** `portal-dev`
   - **Expiration:** o prazo que preferir. Quando vencer, o portal avisa "O GitHub
     recusou o seu token" e é só gerar outro.
   - **Select scopes:** marque só **`public_repo`**
5. **Generate token**, copie o código (começa com `ghp_`) — ele só aparece uma vez.
6. Cole no portal e clique em **Salvar token**.

> Tem que ser o token **clássico**. O *fine-grained* não funciona para colaborador de
> repositório de conta pessoal, que é o caso do `InformaWendel/PortalDEV`.

Se o chip do cabeçalho mostrar **GitHub conectado**, está pronto.

**O que muda para cada um**

- **Desenvolvedores** passam a ver o **Portal QA**: o catálogo de cada projeto, o
  que foi **devolvido** para ajuste com as observações do QA, o que está bloqueado e
  o retrabalho. É consulta — quem muda o resultado do teste é o QA.
- **QA** continua registrando os testes como antes, agora no mesmo portal.
- **Impedimentos** funcionam como antes: **Iniciar impedimento**, **Finalizar**,
  **Registrar impedimento passado** e o calendário para ver, editar ou excluir.

O repositório guarda tudo em CSV: não escreva nos motivos ou observações nome de
cliente, dado pessoal ou informação contratual.

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Token inválido ou sem acesso a este repositório" | Token digitado errado, expirado ou revogado | Gere um token **clássico** com `public_repo` e cole de novo |
| "…a sua conta não tem permissão de escrita nele" | Convite de colaborador ainda não aceito | Aceite o convite no e-mail e salve o token de novo |
| "O token não serve para gravar: falta o escopo public_repo" | Token clássico gerado sem o escopo | Gere de novo marcando **`public_repo`** |
| "Token fine-grained não serve para colaborador…" | Foi gerado um token *fine-grained* | Gere um token **clássico** com `public_repo` |
| "O GitHub recusou o seu token" (funcionava e parou) | Token expirou | Gere outro e salve pelo chip **GitHub** do cabeçalho |
| "Usuário ou senha não conferem" logo depois de o gestor cadastrar ou redefinir | O site publicado leva um ou dois minutos para refletir o cadastro | Espere um pouco e tente de novo |
| Uma ferramenta não aparece no menu | O seu papel não inclui essa ferramenta | Peça a um gestor |
| Campos do teste travados no Portal QA | Papel de consulta, ou falta de token | A gaveta do caso diz qual dos dois |
| Registros de alguém não aparecem no painel consolidado | Quem está vendo está sem token e o site ainda não publicou | Configure o token ou use **Atualizar dados** em instantes |
| Página em branco ou login não aceita | Aberto pelo arquivo local | Use o endereço publicado (`https://…`) |
