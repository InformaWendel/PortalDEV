/**
 * Portal DEV — a casca: login, cabeçalho, menu das ferramentas, token do
 * GitHub, troca de senha e roteamento por hash. Cada ferramenta cuida das
 * próprias telas e publica a mesma interface (permitido, entrar, render, abas…).
 *
 * Rotas (hash):
 *   #/                        início — as ferramentas do papel de quem entrou
 *   #/qa/...                  Portal QA
 *   #/impedimentos[/painel]   Controle de Impedimentos
 *   #/admin[/permissoes]      Administração: usuários e permissões
 */
(function () {
  'use strict';

  const esc = window.UI.esc;
  const el = window.UI.el;

  function t(chave, valores) {
    return window.I18N.t(chave, valores);
  }

  function cfg() {
    return window.PORTAL_CONFIG;
  }

  const Auth = window.Auth;
  const Acesso = window.Acesso;
  const Github = window.Github;

  /** Ícone do cartão para a ferramenta que não publica um. */
  const ICONE_PADRAO =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/></svg>';

  const vista = {
    segmentos: [],
    ferramenta: 'inicio',
    registroPronto: false,
    erroLogin: '',
    gravacao: 'ocioso',
    erroGravacao: null,
  };

  /* ---------------- ferramentas ---------------- */

  function modulo(nome) {
    const mapa = {
      qa: window.QA && window.QA.Telas,
      impedimentos: window.Impedimentos && window.Impedimentos.Telas,
      admin: window.Admin && window.Admin.Telas,
    };
    // hasOwnProperty: um hash como #/constructor não pode virar ferramenta.
    return Object.prototype.hasOwnProperty.call(mapa, nome) ? mapa[nome] || null : null;
  }

  function moduloAtual() {
    return modulo(vista.ferramenta);
  }

  function ferramentaAtual() {
    return vista.ferramenta;
  }

  function todosModulos() {
    return cfg().ferramentas.map(modulo).filter(Boolean);
  }

  function ferramentasDaSessao() {
    return cfg().ferramentas.filter(function (f) {
      return modulo(f) && modulo(f).permitido();
    });
  }

  /* ---------------- roteamento ---------------- */

  function lerHash() {
    vista.segmentos = String(window.location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    vista.ferramenta = modulo(vista.segmentos[0]) ? vista.segmentos[0] : 'inicio';
  }

  function irPara(hash) {
    if (window.location.hash === hash) aoTrocarRota();
    else window.location.hash = hash;
  }

  function aoTrocarRota() {
    const anterior = vista.ferramenta;
    lerHash();
    if (anterior !== vista.ferramenta) {
      const saindo = modulo(anterior);
      if (saindo && saindo.sair) saindo.sair();
      window.UI.fecharModal();
      if (vista.gravacao !== 'gravando') {
        vista.gravacao = 'ocioso';
        vista.erroGravacao = null;
      }
    }
    entrarNaRota();
  }

  /** Avisa a ferramenta da rota nova, que pode devolver uma carga de dados. */
  function entrarNaRota() {
    if (Auth.autenticado() && vista.registroPronto) {
      const mod = moduloAtual();
      if (mod && mod.permitido()) {
        const carga = mod.entrar(vista.segmentos);
        if (carga && carga.then) carga.then(render);
      }
    }
    render();
  }

  /* ---------------- render ---------------- */

  function render() {
    if (!Auth.autenticado()) return renderLogin();
    if (!vista.registroPronto) return renderCarregando();

    renderTopo();
    renderBanners();

    const mod = moduloAtual();
    if (!mod) renderInicio();
    else if (!mod.permitido()) renderSemAcesso();
    else mod.render(vista.segmentos);
  }

  function renderCarregando() {
    el('topo').hidden = true;
    el('rodape').hidden = true;
    el('banners').innerHTML = '';
    el('vista').innerHTML = '<div class="pd-carregando">' + esc(t('carregando')) + '</div>';
  }

  function renderLogin() {
    el('topo').hidden = true;
    el('rodape').hidden = true;
    el('banners').innerHTML = '';
    el('vista').innerHTML =
      '<div class="pd-login"><div class="pd-login-caixa">' +
      '<div class="pd-marca-selo pd-login-selo" aria-hidden="true">DEV</div>' +
      '<h1 class="pd-login-titulo">' + esc(t('app.nome')) + '</h1>' +
      '<p class="pd-login-sub">' + esc(t('login.subtitulo')) + '</p>' +
      '<form id="formLogin">' +
      '<label for="loginUsuario">' + esc(t('login.usuario')) + '</label>' +
      '<input id="loginUsuario" class="pd-campo" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>' +
      '<label for="loginSenha">' + esc(t('login.senha')) + '</label>' +
      '<input id="loginSenha" class="pd-campo" type="password" autocomplete="current-password" required>' +
      (vista.erroLogin ? '<div class="pd-alerta-erro pd-login-erro" role="alert">' + esc(vista.erroLogin) + '</div>' : '') +
      '<button type="submit" id="btnEntrar" class="pd-btn pd-btn-primario pd-login-btn">' + esc(t('acao.entrar')) + '</button>' +
      '</form>' +
      '<div class="pd-login-ferramentas">' +
      cfg().ferramentas
        .filter(function (f) { return f !== 'admin'; })
        .map(function (f) { return '<span class="pd-pilula">' + esc(t('ferramenta.' + f)) + '</span>'; })
        .join('') +
      '</div>' +
      seletorIdioma('pd-login-idioma') +
      '</div></div>';
    el('loginUsuario').focus();
  }

  function botoesIdioma() {
    return (
      '<button type="button" data-idioma="pt" aria-pressed="' + (window.I18N.atual === 'pt') + '">PT</button>' +
      '<button type="button" data-idioma="en" aria-pressed="' + (window.I18N.atual === 'en') + '">EN</button>'
    );
  }

  function seletorIdioma(classe) {
    return '<div class="pd-idioma ' + (classe || '') + '" role="group" aria-label="Idioma / Language">' + botoesIdioma() + '</div>';
  }

  function renderTopo() {
    el('topo').hidden = false;
    el('rodape').hidden = false;

    const mod = moduloAtual();
    const liberado = !!(mod && mod.permitido());

    el('marcaNome').textContent = t('app.nome');
    el('marcaSub').textContent = liberado ? mod.subtitulo() : t('app.descricao');

    const itens = [{ chave: 'inicio', rotulo: t('nav.inicio'), hash: '#/' }].concat(
      ferramentasDaSessao().map(function (f) {
        return { chave: f, rotulo: t('ferramenta.' + f), hash: '#/' + f };
      })
    );
    el('ferramentas').setAttribute('aria-label', t('nav.ferramentas'));
    el('ferramentas').innerHTML = itens
      .map(function (item) {
        return (
          '<a href="' + item.hash + '"' + (item.chave === vista.ferramenta ? ' aria-current="page"' : '') + '>' +
          esc(item.rotulo) + '</a>'
        );
      })
      .join('');

    const abas = liberado ? mod.abas(vista.segmentos) : [];
    el('subnav').hidden = !abas.length;
    el('nav').setAttribute('aria-label', t('nav.secoes'));
    el('nav').innerHTML = abas
      .map(function (aba) {
        return (
          '<a href="' + aba.hash + '"' +
          (aba.chave === mod.abaAtual() ? ' aria-current="page"' : '') +
          (aba.voltar ? ' class="pd-nav-voltar"' : '') + '>' + esc(aba.rotulo) + '</a>'
        );
      })
      .join('');
    el('navAcoes').innerHTML = liberado && mod.acoes ? mod.acoes() : '';

    el('idiomaTopo').innerHTML = botoesIdioma();
    renderToken();
    renderUsuario();
    renderSelo();

    el('rodape').innerHTML = '<b>' + esc(t('rodape.empresa')) + '</b> · ' + esc(t('app.nome'));
  }

  function renderToken() {
    const botao = el('btnToken');
    let classe = 'pd-chip-pendente';
    let rotulo = t('token.pendente');
    if (Github.estado.alerta === 'recusado') {
      classe = 'pd-chip-erro';
      rotulo = t('token.recusado');
    } else if (Github.temToken()) {
      classe = 'pd-chip-ok';
      rotulo = t('token.conectado');
    }
    botao.className = 'pd-chip ' + classe;
    botao.title = t('token.titulo');
    botao.innerHTML = '<i class="pd-chip-ponto" aria-hidden="true"></i><span>' + esc(rotulo) + '</span>';
  }

  function renderUsuario() {
    const sessao = Auth.sessao;
    el('usuario').innerHTML =
      '<details class="pd-menu">' +
      '<summary aria-label="' + esc(t('menu.conta')) + '">' +
      '<span class="pd-avatar" aria-hidden="true">' + esc(Auth.iniciais(sessao.nome)) + '</span>' +
      '<span class="pd-usuario-nome">' + esc(sessao.nome) + '</span></summary>' +
      '<div class="pd-menu-lista">' +
      '<div class="pd-menu-cabecalho"><div class="pd-menu-nome">' + esc(sessao.nome) + '</div>' +
      '<div class="pd-menu-meta"><span class="pd-mono">' + esc(sessao.usuario) + '</span> · ' + esc(Acesso.nomePapel(sessao.papel)) + '</div></div>' +
      '<button type="button" data-acao="senha">' + esc(t('menu.trocarSenha')) + '</button>' +
      '<button type="button" data-acao="token">' + esc(t('menu.token')) + '</button>' +
      '<button type="button" data-acao="sair">' + esc(t('menu.sair')) + '</button>' +
      '</div></details>';
  }

  /** Selo de gravação: a garantia visível de que o registro chegou ao repositório. */
  function renderSelo() {
    const caixa = el('gravacao');
    if (!caixa || el('topo').hidden) return;

    const mod = moduloAtual();
    let situacao = vista.gravacao;
    if (!Github.temToken()) situacao = 'leitura';
    else if (situacao === 'ocioso' && mod && mod.permitido() && mod.somenteLeitura && mod.somenteLeitura()) situacao = 'consulta';

    if (situacao === 'ocioso') {
      caixa.hidden = true;
      return;
    }
    caixa.hidden = false;
    caixa.className = 'pd-gravacao pd-gravacao-' + situacao;
    caixa.textContent = t('gravacao.' + situacao);
    if (situacao === 'erro' && vista.erroGravacao) caixa.setAttribute('title', String(vista.erroGravacao.message || ''));
    else caixa.removeAttribute('title');
  }

  function sinalizarGravacao(situacao, erro) {
    vista.gravacao = situacao;
    vista.erroGravacao = erro || null;
    if (Auth.autenticado() && vista.registroPronto) renderSelo();
  }

  function aviso(classe, titulo, detalhe, botao) {
    return (
      '<div class="pd-aviso ' + classe + '"><div class="pd-aviso-texto">' +
      '<div class="pd-aviso-titulo">' + esc(titulo) + '</div>' +
      '<div class="pd-aviso-detalhe">' + esc(detalhe) + '</div></div>' + (botao || '') + '</div>'
    );
  }

  function renderBanners() {
    const caixa = el('banners');
    if (!Auth.autenticado() || !vista.registroPronto) {
      caixa.innerHTML = '';
      return;
    }

    const partes = [];
    const mod = moduloAtual();
    if (mod && mod.permitido() && mod.banner) partes.push(mod.banner());

    const botaoToken = function (primario) {
      return (
        '<button type="button" class="pd-btn ' + (primario ? 'pd-btn-primario ' : '') + 'pd-btn-p" data-acao="token">' +
        esc(t('token.configurar')) + '</button>'
      );
    };

    if (Github.estado.alerta === 'recusado') {
      partes.push(aviso('pd-aviso-erro', t('banner.recusadoTitulo'), t('banner.recusadoAjuda', { repo: Github.repositorio() }), botaoToken(false)));
    } else if (!Github.temToken()) {
      partes.push(aviso('', t('banner.leituraTitulo'), t('banner.leituraAjuda'), botaoToken(true)));
    }

    if (Auth.sessao.senhaPendente) {
      partes.push(
        aviso('pd-aviso-alerta', t('banner.senhaTitulo'), t('banner.senhaAjuda'),
          '<button type="button" class="pd-btn pd-btn-p" data-acao="senha">' + esc(t('menu.trocarSenha')) + '</button>')
      );
    }

    caixa.innerHTML = partes.join('');
  }

  /* ---------------- início ---------------- */

  function renderInicio() {
    const sessao = Auth.sessao;
    const ferramentas = ferramentasDaSessao();
    const primeiroNome = String(sessao.nome || '').split(/\s+/)[0];

    const acesso = cfg()
      .ferramentas.map(function (f) {
        const itens = Acesso.catalogo()
          .filter(function (p) { return p.ferramenta === f; })
          .map(function (p) {
            const pode = Acesso.pode(p.chave);
            return (
              '<li class="' + (pode ? 'pd-acesso-sim' : 'pd-acesso-nao') + '">' +
              '<span class="pd-acesso-icone" aria-hidden="true">' + (pode ? '&#10003;' : '&#8212;') + '</span>' +
              '<span>' + esc(t('perm.' + p.chave)) +
              '<span class="pd-sr"> — ' + esc(pode ? t('inicio.permitido') : t('inicio.naoPermitido')) + '</span></span></li>'
            );
          })
          .join('');
        return '<div><div class="pd-acesso-ferramenta">' + esc(t('ferramenta.' + f)) + '</div><ul>' + itens + '</ul></div>';
      })
      .join('');

    el('vista').innerHTML =
      '<section class="pd-boas-vindas">' +
      '<h1>' + esc(t('inicio.ola', { nome: primeiroNome })) + '</h1>' +
      '<p>' + esc(t('inicio.papel', { papel: Acesso.nomePapel(sessao.papel) })) + '</p>' +
      '</section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('inicio.ferramentas')) + '</h2>' +
      (ferramentas.length
        ? '<div class="pd-ferramentas-grade">' + ferramentas.map(cartaoFerramenta).join('') + '</div>'
        : '<div class="pd-cartao pd-vazio">' + esc(t('inicio.semFerramentas')) + '</div>') +
      '</section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('inicio.acesso')) + '</h2>' +
      '<p class="pd-secao-ajuda">' + esc(t('inicio.acessoAjuda')) + '</p>' +
      '<div class="pd-cartao pd-acesso">' + acesso + '</div></section>';
  }

  /** Montado só pelo contrato da ferramenta (icone, nivel, atalhos): a casca não conhece nenhuma. */
  function cartaoFerramenta(ferramenta) {
    const mod = modulo(ferramenta);
    const nivel = mod.nivel ? mod.nivel() : '';
    let atalhos = mod.atalhos ? mod.atalhos() : [];
    if (!atalhos.length) atalhos = [{ rotulo: t('inicio.abrir'), hash: '#/' + ferramenta }];

    return (
      '<article class="pd-ferramenta">' +
      '<div class="pd-ferramenta-topo"><div class="pd-marca-selo" aria-hidden="true">' + (mod.icone || ICONE_PADRAO) + '</div>' +
      '<div><h3 class="pd-ferramenta-nome"><a href="' + atalhos[0].hash + '">' + esc(t('ferramenta.' + ferramenta)) + '</a></h3>' +
      (nivel ? '<span class="pd-pilula">' + esc(nivel) + '</span>' : '') + '</div></div>' +
      '<p class="pd-ferramenta-desc">' + esc(t('ferramenta.' + ferramenta + 'Desc')) + '</p>' +
      '<div class="pd-ferramenta-atalhos">' +
      atalhos
        .map(function (a, i) {
          return '<a class="pd-btn pd-btn-p' + (i === 0 ? ' pd-btn-primario' : '') + '" href="' + a.hash + '">' + esc(a.rotulo) + '</a>';
        })
        .join('') +
      '</div></article>'
    );
  }

  function renderSemAcesso() {
    el('vista').innerHTML =
      '<div class="pd-cartao pd-vazio pd-sem-acesso">' +
      '<h2>' + esc(t('semAcesso.titulo')) + '</h2>' +
      '<p>' + esc(t('semAcesso.texto', { papel: Acesso.nomePapel(Auth.sessao.papel) })) + '</p>' +
      '<a class="pd-btn" href="#/">' + esc(t('nav.inicio')) + '</a></div>';
  }

  /* ---------------- login e sessão ---------------- */

  function carregarRegistro() {
    return Promise.all([Auth.carregarUsuarios(), Acesso.carregarPapeis()]).then(function () {
      vista.registroPronto = true;
    });
  }

  function entrar(evento) {
    evento.preventDefault();
    const usuario = el('loginUsuario').value;
    const senha = el('loginSenha').value;
    const login = String(usuario).trim().toLowerCase();
    el('btnEntrar').disabled = true;

    function recusar(mensagem) {
      Github.carregarToken(null);
      vista.erroLogin = mensagem;
      renderLogin();
      el('loginUsuario').value = usuario;
      el('loginSenha').focus();
    }

    // O cadastro é relido a cada tentativa: usuário criado, senha redefinida ou
    // reativação feitos depois de a página abrir passam a valer. Se este navegador
    // já guarda o token de quem está entrando, a releitura vem pela API, sem
    // esperar o site publicar.
    Github.carregarToken(login);
    const pronto = carregarRegistro();

    pronto
      .then(function () {
        return Auth.entrar(usuario, senha);
      })
      .then(
        function (sessao) {
          if (!sessao) return recusar(Auth.estado.carregado ? t('login.erro') : t('login.semUsuarios'));
          vista.erroLogin = '';
          // Selo de uma sessão anterior não passa para quem acabou de entrar.
          vista.gravacao = 'ocioso';
          vista.erroGravacao = null;
          if (sessao.usuario !== login) Github.carregarToken(sessao.usuario);
          entrarNaRota();
          if (!Github.temToken()) abrirModalToken();
        },
        function (erro) {
          recusar(erro.message === 'contexto-inseguro' ? t('login.inseguro') : t('login.erro'));
        }
      );
  }

  function sair() {
    // Nada de registro esperando o temporizador: o token vai embora junto com a sessão.
    Promise.all(
      todosModulos().map(function (m) {
        return m.descarregar ? m.descarregar() : null;
      })
    ).then(function () {
      todosModulos().forEach(function (m) {
        if (m.sair) m.sair();
      });
      Auth.sair();
      vista.gravacao = 'ocioso';
      vista.erroGravacao = null;
      window.UI.fecharModal();
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/');
      lerHash();
      render();
    });
  }

  /* ---------------- token ---------------- */

  function abrirModalToken() {
    const repo = Github.repositorio();
    window.UI.abrirModal(
      '<form id="formToken" class="pd-form-pilha" novalidate>' +
      '<h2 class="pd-modal-titulo">' + esc(t('token.titulo')) + '</h2>' +
      '<p class="pd-modal-texto">' + esc(t('token.explica', { repo: repo })) + '</p>' +
      '<ol class="pd-modal-passos">' +
      '<li>' + esc(t('token.passo1')) + '</li>' +
      '<li>' + esc(t('token.passo2', { repo: repo })) + '</li>' +
      '<li>' + esc(t('token.passo3', { repo: repo })) + '</li>' +
      '</ol>' +
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="campoToken">' + esc(t('token.campo')) + '</label>' +
      '<input id="campoToken" class="pd-campo pd-mono" type="password" autocomplete="off" spellcheck="false" placeholder="' +
      esc(t('token.placeholder')) + '"></div>' +
      '<div id="tokenErro" class="pd-alerta-erro" role="alert" hidden></div>' +
      '<div class="pd-modal-acoes">' +
      (Github.temToken()
        ? '<button type="button" class="pd-btn pd-btn-perigo pd-btn-p" data-acao="removerToken">' + esc(t('token.remover')) + '</button>'
        : '') +
      '<span class="pd-espaco"></span>' +
      '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(t('acao.cancelar')) + '</button>' +
      '<button type="submit" id="btnSalvarToken" class="pd-btn pd-btn-primario">' + esc(t('token.salvar')) + '</button>' +
      '</div></form>'
    );
  }

  function mostrarErro(id, mensagem) {
    const caixa = el(id);
    if (!caixa) return;
    caixa.textContent = mensagem || '';
    caixa.hidden = !mensagem;
  }

  function salvarToken() {
    const valor = el('campoToken').value.trim();
    const botao = el('btnSalvarToken');
    if (!valor) return mostrarErro('tokenErro', t('token.invalido'));

    mostrarErro('tokenErro', '');
    botao.disabled = true;
    botao.textContent = t('token.verificando');

    Github.validarToken(valor)
      .then(function (r) {
        if (!r.ok) return mostrarErro('tokenErro', t('token.invalido'));
        if (!r.escrita) return mostrarErro('tokenErro', t('token.semEscrita'));
        if (r.fineGrained) return mostrarErro('tokenErro', t('token.fineGrained'));
        if (!r.conteudo) return mostrarErro('tokenErro', t('token.semConteudo'));

        Github.definirToken(valor);
        window.UI.fecharModal();
        window.UI.toast(t('token.salvo'), 'ok');
        return recarregarTudo();
      })
      .then(function () {
        const ainda = el('btnSalvarToken');
        if (ainda) {
          ainda.disabled = false;
          ainda.textContent = t('token.salvar');
        }
      });
  }

  function removerToken() {
    Github.definirToken('');
    window.UI.fecharModal();
    window.UI.toast(t('token.removido'));
    recarregarTudo();
  }

  /** Token trocado: tudo volta a ser lido — pela API com token, pelo site sem ele. */
  function recarregarTudo() {
    return carregarRegistro().then(function () {
      if (!Auth.autenticado()) return render();
      render();
      return Promise.all(
        todosModulos().map(function (m) {
          return m.permitido() && m.recarregar ? m.recarregar() : null;
        })
      ).then(render);
    });
  }

  /* ---------------- senha ---------------- */

  function abrirModalSenha() {
    const semToken = !Github.temToken();
    window.UI.abrirModal(
      '<form id="formSenha" class="pd-form-pilha" novalidate>' +
      '<h2 class="pd-modal-titulo">' + esc(t('senha.titulo')) + '</h2>' +
      (semToken
        ? '<div class="pd-nota"><span>' + esc(t('senha.semToken')) + '</span>' +
          '<button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-acao="token">' + esc(t('token.configurar')) + '</button></div>'
        : '') +
      campoSenha('senhaAtual', t('senha.atual'), 'current-password') +
      campoSenha('senhaNova', t('senha.nova'), 'new-password') +
      campoSenha('senhaConfirmar', t('senha.confirmar'), 'new-password') +
      '<p class="pd-ajuda">' + esc(t('senha.regra', { n: cfg().senhaMinima })) + '</p>' +
      '<div id="senhaErro" class="pd-alerta-erro" role="alert" hidden></div>' +
      '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
      '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(t('acao.cancelar')) + '</button>' +
      '<button type="submit" id="btnSalvarSenha" class="pd-btn pd-btn-primario"' + (semToken ? ' disabled' : '') + '>' +
      esc(t('acao.salvar')) + '</button>' +
      '</div></form>'
    );
  }

  function campoSenha(id, rotulo, autocomplete) {
    return (
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="' + id + '">' + esc(rotulo) + '</label>' +
      '<input id="' + id + '" class="pd-campo" type="password" autocomplete="' + autocomplete + '"></div>'
    );
  }

  function salvarSenha() {
    const atual = el('senhaAtual').value;
    const nova = el('senhaNova').value;
    const confirmacao = el('senhaConfirmar').value;
    mostrarErro('senhaErro', '');
    el('btnSalvarSenha').disabled = true;

    Auth.validarSenhaNova(nova, confirmacao)
      .then(function (problema) {
        if (problema) {
          mostrarErro('senhaErro', t(problema, { n: cfg().senhaMinima }));
          return;
        }
        sinalizarGravacao('gravando');
        return Auth.trocarSenha(atual, nova).then(function () {
          sinalizarGravacao('salvo');
          window.UI.fecharModal();
          window.UI.toast(t('senha.salva'), 'ok');
          render();
        });
      })
      .catch(function (erro) {
        if (erro.chave) {
          sinalizarGravacao('ocioso');
          mostrarErro('senhaErro', t(erro.chave));
        } else {
          sinalizarGravacao('erro', erro);
          mostrarErro('senhaErro', t('senha.falha', { erro: erro.message || '' }));
        }
      })
      .then(function () {
        const botao = el('btnSalvarSenha');
        if (botao) botao.disabled = !Github.temToken();
      });
  }

  /* ---------------- eventos ---------------- */

  function aoClicar(evento) {
    // O menu da conta fecha ao clicar fora dele ou numa das opções.
    Array.prototype.forEach.call(document.querySelectorAll('.pd-menu[open]'), function (menu) {
      if (!menu.contains(evento.target) || evento.target.closest('[data-acao]')) menu.open = false;
    });

    const idioma = evento.target.closest('[data-idioma]');
    if (idioma) {
      window.I18N.definir(idioma.getAttribute('data-idioma'));
      return render();
    }

    const acao = evento.target.closest('[data-acao]');
    if (!acao) return;
    const nome = acao.getAttribute('data-acao');
    if (nome === 'sair') return sair();
    if (nome === 'token') return abrirModalToken();
    if (nome === 'senha') return abrirModalSenha();
    if (nome === 'removerToken') return removerToken();
    if (nome === 'fecharModal') return window.UI.fecharModal();
  }

  function aoEnviar(evento) {
    const id = evento.target.id;
    if (id === 'formLogin') return entrar(evento);
    if (id === 'formToken') {
      evento.preventDefault();
      return salvarToken();
    }
    if (id === 'formSenha') {
      evento.preventDefault();
      return salvarSenha();
    }
  }

  function ligarEventos() {
    window.addEventListener('hashchange', aoTrocarRota);

    window.addEventListener('beforeunload', function (evento) {
      const pendente = todosModulos().some(function (m) {
        return m.temPendencias && m.temPendencias();
      });
      if (!pendente) return;
      evento.preventDefault();
      evento.returnValue = '';
    });

    el('btnToken').addEventListener('click', abrirModalToken);

    el('modal').addEventListener('mousedown', function (evento) {
      if (evento.target === el('modal')) window.UI.fecharModal();
    });

    document.addEventListener('keydown', function (evento) {
      if (evento.key !== 'Escape') return;
      if (window.UI.modalAberto()) return window.UI.fecharModal();
      const menu = document.querySelector('.pd-menu[open]');
      if (menu) {
        menu.open = false;
        return;
      }
      const mod = moduloAtual();
      if (mod && mod.aoEscape) mod.aoEscape();
    });

    document.addEventListener('click', aoClicar);
    document.addEventListener('submit', aoEnviar);
  }

  /* ---------------- início ---------------- */

  function iniciar() {
    window.I18N.definir(window.I18N.detectar());
    Auth.carregarSessao();
    if (Auth.sessao) Github.carregarToken(Auth.sessao.usuario);

    todosModulos().forEach(function (m) {
      if (m.iniciar) m.iniciar();
    });
    ligarEventos();
    lerHash();
    render();

    carregarRegistro().then(entrarNaRota);
  }

  window.App = {
    render: render,
    renderBanners: renderBanners,
    irPara: irPara,
    ferramentaAtual: ferramentaAtual,
    sinalizarGravacao: sinalizarGravacao,
    abrirModalToken: abrirModalToken,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
