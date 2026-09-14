/**
 * Idiomas do portal — português e inglês.
 *
 * O idioma inicial vem do navegador; a escolha manual fica guardada localmente.
 * Aqui mora o dicionário da casca do portal (login, menu, token, senha). Cada
 * ferramenta registra o próprio dicionário com um prefixo (qa., imp., adm.),
 * para que chaves iguais em ferramentas diferentes não se atropelem.
 */
(function () {
  'use strict';

  const DICIONARIO = {
    pt: {
      'app.nome': 'Portal DEV',
      'app.descricao': 'Ferramentas do time de desenvolvimento',

      'nav.inicio': 'Início',
      'nav.secoes': 'Seções',
      'nav.ferramentas': 'Ferramentas',

      'ferramenta.qa': 'Portal QA',
      'ferramenta.qaDesc':
        'Acompanhamento dos testes de qualidade: o que está planejado, em andamento e liberado, e o retrabalho que vai e volta entre teste e desenvolvimento.',
      'ferramenta.impedimentos': 'Impedimentos',
      'ferramenta.impedimentosDesc':
        'Registro e análise das interrupções do dia a dia: cronômetro do impedimento em andamento, calendário e painel consolidado da equipe.',
      'ferramenta.admin': 'Administração',
      'ferramenta.adminDesc': 'Cadastro de usuários, papéis e permissões de acesso às ferramentas do portal.',

      'acao.entrar': 'Entrar',
      'acao.sair': 'Sair',
      'acao.cancelar': 'Cancelar',
      'acao.salvar': 'Salvar',
      'acao.fechar': 'Fechar',

      'carregando': 'Carregando…',

      'login.subtitulo': 'Um acesso para todas as ferramentas do time.',
      'login.usuario': 'Usuário',
      'login.senha': 'Senha',
      'login.erro': 'Usuário ou senha não conferem.',
      'login.semUsuarios': 'Não foi possível carregar o cadastro de usuários.',
      'login.inseguro': 'A verificação de senha exige HTTPS. Abra o portal pelo endereço publicado.',

      'inicio.ola': 'Olá, {nome}',
      'inicio.papel': 'Papel: {papel}',
      'inicio.ferramentas': 'Suas ferramentas',
      'inicio.semFerramentas': 'O seu papel ainda não libera nenhuma ferramenta. Fale com um gestor do portal.',
      'inicio.acesso': 'O que o seu papel permite',
      'inicio.acessoAjuda': 'Definido pela Administração do portal, em Permissões.',
      'inicio.nivelConsulta': 'Consulta',
      'inicio.nivelRegistro': 'Registro',
      'inicio.permitido': 'permitido',
      'inicio.naoPermitido': 'não permitido',
      'inicio.abrir': 'Abrir',

      'semAcesso.titulo': 'Sem acesso a esta ferramenta',
      'semAcesso.texto': 'O seu papel ({papel}) não inclui esta ferramenta. Se precisar dela, peça a um gestor do portal.',

      'perm.qa.consultar': 'Consultar o Portal QA',
      'perm.qa.consultarDesc': 'Painéis, catálogos de casos, testes em aberto e retrabalho de todos os projetos.',
      'perm.qa.registrar': 'Registrar testes',
      'perm.qa.registrarDesc': 'Mudar a situação dos casos e preencher testado por, data, referência e observações.',
      'perm.impedimentos.registrar': 'Registrar impedimentos',
      'perm.impedimentos.registrarDesc': 'Cronômetro e calendário dos próprios impedimentos.',
      'perm.impedimentos.painel': 'Painel consolidado de impedimentos',
      'perm.impedimentos.painelDesc': 'Indicadores, gráficos e exportação com os registros de toda a equipe.',
      'perm.admin.usuarios': 'Administrar usuários e permissões',
      'perm.admin.usuariosDesc': 'Cadastrar pessoas, trocar papéis, redefinir senhas e editar a matriz de permissões.',

      'gravacao.gravando': 'Salvando…',
      'gravacao.salvo': 'Salvo no repositório',
      'gravacao.erro': 'Falha ao salvar',
      'gravacao.leitura': 'Somente leitura',
      'gravacao.consulta': 'Somente consulta',

      'banner.leituraTitulo': 'Portal em modo leitura',
      'banner.leituraAjuda':
        'Para gravar em qualquer ferramenta, informe o seu token do GitHub. É uma vez só: o mesmo token vale para o portal inteiro.',
      'banner.recusadoTitulo': 'O GitHub recusou o seu token',
      'banner.recusadoAjuda':
        'Ele pode ter expirado ou não ter acesso ao repositório {repo}. A leitura continua pelo site publicado, mas nada será gravado até um token válido ser informado.',
      'banner.senhaTitulo': 'Defina a sua senha pessoal',
      'banner.senhaAjuda':
        'Você entrou com a senha compartilhada do antigo Controle de Impedimentos. Troque-a por uma senha só sua — é ela que carimba os seus registros.',

      'token.titulo': 'Token do GitHub',
      'token.configurar': 'Configurar token',
      'token.conectado': 'GitHub conectado',
      'token.pendente': 'Sem token',
      'token.recusado': 'Token recusado',
      'token.explica':
        'O Portal DEV grava tudo — testes de QA, impedimentos e cadastro de usuários — no repositório {repo}. Informe o seu token uma única vez: ele vale para todas as ferramentas e fica guardado só neste navegador, ligado ao seu usuário. Antes, aceite o convite de colaborador do repositório.',
      'token.passo1': 'No GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic).',
      'token.passo2': 'Marque o escopo public_repo (ou repo, se {repo} for privado) e escolha a validade.',
      'token.passo3':
        'Tem que ser o token clássico: o fine-grained não alcança repositório da conta pessoal de outra pessoa. Só o dono de {repo} pode usar um fine-grained, com Contents: Read and write.',
      'token.placeholder': 'ghp_… ou github_pat_…',
      'token.campo': 'Token de acesso pessoal',
      'token.salvar': 'Salvar token',
      'token.remover': 'Remover token',
      'token.verificando': 'Verificando o token…',
      'token.invalido': 'Token inválido ou sem acesso a este repositório.',
      'token.semEscrita': 'O token enxerga o repositório, mas a sua conta não tem permissão de escrita nele. Aceite o convite de colaborador e tente de novo.',
      'token.semConteudo': 'O token não serve para gravar: falta o escopo public_repo (ou repo, se o repositório for privado).',
      'token.fineGrained': 'Token fine-grained não serve para colaborador de repositório de conta pessoal. Gere um token clássico com o escopo public_repo.',
      'token.salvo': 'Token salvo — vale para todas as ferramentas.',
      'token.removido': 'Token removido deste navegador.',

      'senha.titulo': 'Trocar senha',
      'senha.atual': 'Senha atual',
      'senha.nova': 'Nova senha',
      'senha.confirmar': 'Repita a nova senha',
      'senha.regra': 'Pelo menos {n} caracteres. Não reaproveite senha de outro sistema: o cadastro do portal é público.',
      'senha.erroAtual': 'A senha atual não confere.',
      'senha.erroCurta': 'A senha precisa de pelo menos {n} caracteres.',
      'senha.erroConfirmacao': 'As duas senhas não são iguais.',
      'senha.erroCompartilhada': 'A senha não pode ser a senha compartilhada antiga.',
      'senha.semToken': 'A senha é gravada no repositório: configure o token do GitHub antes de trocá-la.',
      'senha.salva': 'Senha trocada.',
      'senha.falha': 'Não foi possível gravar a senha: {erro}',

      'menu.conta': 'Conta',
      'menu.trocarSenha': 'Trocar senha',
      'menu.token': 'Token do GitHub',
      'menu.sair': 'Sair',

      'erro.gravar': 'Falha ao gravar no repositório.',

      'rodape.empresa': 'Informa Solutions',
    },

    en: {
      'app.nome': 'DEV Portal',
      'app.descricao': 'Development team tools',

      'nav.inicio': 'Home',
      'nav.secoes': 'Sections',
      'nav.ferramentas': 'Tools',

      'ferramenta.qa': 'QA Portal',
      'ferramenta.qaDesc':
        'Quality testing tracker: what is planned, in progress and released, and the rework that bounces between testing and development.',
      'ferramenta.impedimentos': 'Impediments',
      'ferramenta.impedimentosDesc':
        'Recording and analysis of day-to-day interruptions: a stopwatch for the impediment in progress, a calendar and the consolidated team panel.',
      'ferramenta.admin': 'Administration',
      'ferramenta.adminDesc': 'User registry, roles and access permissions for the portal tools.',

      'acao.entrar': 'Sign in',
      'acao.sair': 'Sign out',
      'acao.cancelar': 'Cancel',
      'acao.salvar': 'Save',
      'acao.fechar': 'Close',

      'carregando': 'Loading…',

      'login.subtitulo': 'One sign-in for every team tool.',
      'login.usuario': 'User',
      'login.senha': 'Password',
      'login.erro': 'User or password does not match.',
      'login.semUsuarios': 'The user registry could not be loaded.',
      'login.inseguro': 'Password verification requires HTTPS. Open the portal at its published address.',

      'inicio.ola': 'Hello, {nome}',
      'inicio.papel': 'Role: {papel}',
      'inicio.ferramentas': 'Your tools',
      'inicio.semFerramentas': 'Your role does not unlock any tool yet. Talk to a portal manager.',
      'inicio.acesso': 'What your role allows',
      'inicio.acessoAjuda': 'Set by the portal Administration, under Permissions.',
      'inicio.nivelConsulta': 'View',
      'inicio.nivelRegistro': 'Record',
      'inicio.permitido': 'allowed',
      'inicio.naoPermitido': 'not allowed',
      'inicio.abrir': 'Open',

      'semAcesso.titulo': 'No access to this tool',
      'semAcesso.texto': 'Your role ({papel}) does not include this tool. If you need it, ask a portal manager.',

      'perm.qa.consultar': 'View the QA Portal',
      'perm.qa.consultarDesc': 'Dashboards, case catalogs, open tests and rework across every project.',
      'perm.qa.registrar': 'Record tests',
      'perm.qa.registrarDesc': 'Change case status and fill in tested by, date, reference and notes.',
      'perm.impedimentos.registrar': 'Record impediments',
      'perm.impedimentos.registrarDesc': 'Stopwatch and calendar of your own impediments.',
      'perm.impedimentos.painel': 'Consolidated impediment panel',
      'perm.impedimentos.painelDesc': 'Indicators, charts and export with the whole team’s records.',
      'perm.admin.usuarios': 'Manage users and permissions',
      'perm.admin.usuariosDesc': 'Register people, change roles, reset passwords and edit the permission matrix.',

      'gravacao.gravando': 'Saving…',
      'gravacao.salvo': 'Saved to the repository',
      'gravacao.erro': 'Save failed',
      'gravacao.leitura': 'Read only',
      'gravacao.consulta': 'View only',

      'banner.leituraTitulo': 'Portal in read-only mode',
      'banner.leituraAjuda':
        'To write in any tool, provide your GitHub token. It is a one-time step: the same token works for the whole portal.',
      'banner.recusadoTitulo': 'GitHub rejected your token',
      'banner.recusadoAjuda':
        'It may have expired or lack access to the {repo} repository. Reading goes on through the published site, but nothing will be saved until a valid token is provided.',
      'banner.senhaTitulo': 'Set your personal password',
      'banner.senhaAjuda':
        'You signed in with the shared password of the former Impediment Tracker. Replace it with a password of your own — it is what stamps your records.',

      'token.titulo': 'GitHub token',
      'token.configurar': 'Set up token',
      'token.conectado': 'GitHub connected',
      'token.pendente': 'No token',
      'token.recusado': 'Token rejected',
      'token.explica':
        'The DEV Portal writes everything — QA tests, impediments and the user registry — to the {repo} repository. Provide your token once: it works for every tool and is kept in this browser only, tied to your user. Accept the repository collaborator invitation first.',
      'token.passo1': 'On GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic).',
      'token.passo2': 'Tick the public_repo scope (or repo, if {repo} is private) and pick an expiration.',
      'token.passo3':
        'It must be the classic token: fine-grained tokens cannot reach a repository in another person\'s personal account. Only the owner of {repo} may use a fine-grained token, with Contents: Read and write.',
      'token.placeholder': 'ghp_… or github_pat_…',
      'token.campo': 'Personal access token',
      'token.salvar': 'Save token',
      'token.remover': 'Remove token',
      'token.verificando': 'Checking the token…',
      'token.invalido': 'Invalid token, or no access to this repository.',
      'token.semEscrita': 'The token can see the repository, but your account has no write permission on it. Accept the collaborator invitation and try again.',
      'token.semConteudo': 'The token cannot write: the public_repo scope (or repo, if the repository is private) is missing.',
      'token.fineGrained': 'A fine-grained token does not work for a collaborator on a personal-account repository. Generate a classic token with the public_repo scope.',
      'token.salvo': 'Token saved — it works for every tool.',
      'token.removido': 'Token removed from this browser.',

      'senha.titulo': 'Change password',
      'senha.atual': 'Current password',
      'senha.nova': 'New password',
      'senha.confirmar': 'Repeat the new password',
      'senha.regra': 'At least {n} characters. Do not reuse a password from another system: the portal registry is public.',
      'senha.erroAtual': 'The current password does not match.',
      'senha.erroCurta': 'The password needs at least {n} characters.',
      'senha.erroConfirmacao': 'The two passwords are not the same.',
      'senha.erroCompartilhada': 'The password cannot be the former shared password.',
      'senha.semToken': 'The password is written to the repository: set up the GitHub token before changing it.',
      'senha.salva': 'Password changed.',
      'senha.falha': 'The password could not be saved: {erro}',

      'menu.conta': 'Account',
      'menu.trocarSenha': 'Change password',
      'menu.token': 'GitHub token',
      'menu.sair': 'Sign out',

      'erro.gravar': 'Failed to write to the repository.',

      'rodape.empresa': 'Informa Solutions',
    },
  };

  let idioma = 'pt';

  /** Acrescenta o dicionário de uma ferramenta, com as chaves prefixadas. */
  function registrar(textos, prefixo) {
    ['pt', 'en'].forEach(function (lingua) {
      const origem = textos[lingua] || {};
      Object.keys(origem).forEach(function (chave) {
        DICIONARIO[lingua][(prefixo || '') + chave] = origem[chave];
      });
    });
  }

  function safeGet(chave) {
    try {
      return window.localStorage.getItem(chave);
    } catch (e) {
      return null;
    }
  }

  /** pt para qualquer variante de português; inglês para o resto. */
  function detectar() {
    const guardado = safeGet(window.PORTAL_CONFIG.storageKeys.lang);
    if (guardado === 'pt' || guardado === 'en') return guardado;
    const doNavegador = (navigator.languages && navigator.languages[0]) || navigator.language || 'pt';
    return String(doNavegador).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
  }

  function definir(novo) {
    idioma = novo === 'en' ? 'en' : 'pt';
    try {
      window.localStorage.setItem(window.PORTAL_CONFIG.storageKeys.lang, idioma);
    } catch (e) {
      /* modo privado: segue só na memória */
    }
    document.documentElement.setAttribute('lang', idioma === 'pt' ? 'pt-BR' : 'en');
  }

  /** Traduz uma chave, com substituição opcional de {marcadores}. */
  function t(chave, valores) {
    const tabela = DICIONARIO[idioma] || DICIONARIO.pt;
    let texto = tabela[chave];
    if (texto === undefined) texto = DICIONARIO.pt[chave] !== undefined ? DICIONARIO.pt[chave] : chave;
    if (valores) {
      Object.keys(valores).forEach(function (marcador) {
        texto = texto.split('{' + marcador + '}').join(valores[marcador]);
      });
    }
    return texto;
  }

  /** Campo bilíngue de um CSV (titulo_pt / titulo_en) no idioma corrente. */
  function campo(registro, base) {
    if (!registro) return '';
    return (idioma === 'en' ? registro[base + '_en'] : registro[base + '_pt']) || registro[base + '_pt'] || '';
  }

  window.I18N = {
    t: t,
    registrar: registrar,
    definir: definir,
    detectar: detectar,
    campo: campo,
    get atual() {
      return idioma;
    },
    /** Locale para o Intl: datas, números e nomes de mês. */
    get locale() {
      return idioma === 'en' ? 'en' : 'pt-BR';
    },
  };
})();
