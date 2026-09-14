/**
 * Administração — cadastro de usuários e matriz de permissões.
 *
 * Tudo aqui grava em data/usuarios.csv e data/papeis.csv, relendo o arquivo a
 * cada alteração para não atropelar o que outro gestor acabou de salvar.
 *
 * Rotas (hash):
 *   #/admin              usuários
 *   #/admin/permissoes   matriz de permissões por papel
 */
(function () {
  'use strict';

  const esc = window.UI.esc;
  const el = window.UI.el;

  const PERMISSAO_ADMIN = 'admin.usuarios';
  const PADRAO_USUARIO = /^[a-z0-9][a-z0-9._-]*$/;
  const PADRAO_PAPEL = /^[a-z0-9][a-z0-9_-]*$/;

  function t(chave, valores) {
    return window.I18N.t('adm.' + chave, valores);
  }

  function cfg() {
    return window.PORTAL_CONFIG;
  }

  const ICONE =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="5.4" r="2.5"/><path d="M1.6 13.6c.6-2.5 2.3-3.8 4.4-3.8s3.8 1.3 4.4 3.8M10.6 3.1a2.4 2.4 0 0 1 0 4.6M12.3 10.2c1.1.6 1.8 1.7 2.1 3.4"/></svg>';

  const vista = {
    rota: 'usuarios',
    /** papel -> { base, lista }: as permissões de quando a edição começou e as marcadas agora */
    rascunho: null,
    /** quem abriu o rascunho — outra sessão no mesmo navegador não o herda */
    rascunhoDe: '',
  };

  function ativo() {
    return !!window.App && window.App.ferramentaAtual() === 'admin';
  }

  function podeGravar() {
    return window.Github.temToken();
  }

  function quem() {
    return window.Auth.sessao ? window.Auth.sessao.usuario : '';
  }

  function erroComChave(chave, valores) {
    const e = new Error(chave);
    e.chave = chave;
    e.valores = valores;
    return e;
  }

  function mensagemDeErro(erro) {
    return erro && erro.chave ? t(erro.chave, erro.valores) : t('falha', { erro: (erro && erro.message) || '' });
  }

  /* ---------------- interface com o portal ---------------- */

  function permitido() {
    return window.Acesso.pode(PERMISSAO_ADMIN);
  }

  function entrar(segmentos) {
    vista.rota = segmentos[1] === 'permissoes' ? 'permissoes' : 'usuarios';
    return null;
  }

  function abas() {
    return [
      { chave: 'usuarios', rotulo: t('nav.usuarios'), hash: '#/admin' },
      { chave: 'permissoes', rotulo: t('nav.permissoes'), hash: '#/admin/permissoes' },
    ];
  }

  function abaAtual() {
    return vista.rota;
  }

  function subtitulo() {
    return window.I18N.t('ferramenta.admin');
  }

  /** Rascunho da matriz sobrevive à troca de tela, mas não ao logout nem a outra sessão. */
  function rascunhoAtual() {
    if (vista.rascunho && vista.rascunhoDe !== quem()) descartarRascunho();
    return vista.rascunho;
  }

  function descartarRascunho() {
    vista.rascunho = null;
    vista.rascunhoDe = '';
  }

  function temPendencias() {
    return !!rascunhoAtual();
  }

  /** A casca chama no logout, antes de encerrar a sessão. */
  function descarregar() {
    descartarRascunho();
  }

  function atalhos() {
    return abas().map(function (aba) {
      return { rotulo: aba.rotulo, hash: aba.hash };
    });
  }

  function render() {
    if (vista.rota === 'permissoes') renderPermissoes();
    else renderUsuarios();
  }

  /* ---------------- gravação ---------------- */

  /** Nenhuma alteração pode deixar o portal sem alguém ativo que administre usuários. */
  function restaAdministrador(usuarios, papeis) {
    return usuarios.some(function (u) {
      if (u.ativo !== 'sim') return false;
      const papel = papeis.filter(function (p) { return p.papel === u.papel; })[0];
      return !!papel && window.Acesso.expandir(window.Acesso.lerLista(papel.permissoes)).indexOf(PERMISSAO_ADMIN) !== -1;
    });
  }

  /** Relê o CSV, aplica a alteração sobre a versão mais nova e grava. */
  function gravarCsv(caminho, alterar, mensagem) {
    window.App.sinalizarGravacao('gravando');
    return window.Github
      .alterarArquivo(
        caminho,
        function (texto) {
          const dados = window.CSV.parse(texto);
          alterar(dados);
          return window.CSV.serialize(dados.linhas, dados.colunas);
        },
        mensagem
      )
      .then(
        function (resultado) {
          window.App.sinalizarGravacao('salvo');
          return resultado;
        },
        function (erro) {
          window.App.sinalizarGravacao(erro.chave ? 'ocioso' : 'erro', erro);
          throw erro;
        }
      );
  }

  function notaSemToken() {
    return (
      '<div class="pd-nota"><span>' + esc(t('semToken')) + '</span>' +
      '<button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-acao="token">' +
      esc(window.I18N.t('token.configurar')) + '</button></div>'
    );
  }

  function mostrarErro(id, mensagem) {
    const caixa = el(id);
    if (!caixa) return;
    caixa.textContent = mensagem || '';
    caixa.hidden = !mensagem;
  }

  function travar(id, travado) {
    const botao = el(id);
    if (botao) botao.disabled = travado;
  }

  function grupo(id, rotulo, controle, ajuda) {
    return (
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="' + id + '">' + esc(rotulo) + '</label>' +
      controle + (ajuda ? '<p class="pd-ajuda">' + esc(ajuda) + '</p>' : '') + '</div>'
    );
  }

  function acoesFormulario(idSalvar) {
    return (
      '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
      '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(window.I18N.t('acao.cancelar')) + '</button>' +
      '<button type="submit" id="' + idSalvar + '" class="pd-btn pd-btn-primario">' + esc(window.I18N.t('acao.salvar')) + '</button>' +
      '</div>'
    );
  }

  /* ---------------- usuários ---------------- */

  function renderUsuarios() {
    const sessao = window.Auth.sessao;
    const travado = !podeGravar();
    const usuarios = window.Auth.estado.usuarios.slice().sort(function (a, b) {
      if (a.ativo !== b.ativo) return a.ativo === 'sim' ? -1 : 1;
      return a.nome.localeCompare(b.nome, window.I18N.locale);
    });
    const ativos = usuarios.filter(function (u) { return u.ativo === 'sim'; }).length;
    const desabilitado = travado ? ' disabled' : '';

    const linhas = usuarios
      .map(function (u) {
        const papelExiste = !!window.Acesso.papel(u.papel);
        return (
          '<tr' + (u.ativo !== 'sim' ? ' class="adm-inativo"' : '') + '>' +
          '<td><span class="adm-nome">' + esc(u.nome) + '</span>' +
          (u.usuario === sessao.usuario ? ' <span class="pd-pilula">' + esc(t('usuarios.voce')) + '</span>' : '') + '</td>' +
          '<td class="pd-mono">' + esc(u.usuario) + '</td>' +
          '<td>' +
          (papelExiste
            ? esc(window.Acesso.nomePapel(u.papel))
            : '<span class="pd-tag pd-tag-devolvida">' + esc((u.papel || '—') + ' · ' + t('usuarios.papelDesconhecido')) + '</span>') +
          '</td>' +
          '<td class="pd-esconde-p">' +
          (u.senha_hash
            ? '<span class="adm-texto-suave">' + esc(t('usuarios.senhaPessoal')) + '</span>'
            : '<span class="pd-tag pd-tag-nao_implementada">' + esc(t('usuarios.senhaCompartilhada')) + '</span>') +
          '</td>' +
          '<td>' +
          (u.ativo === 'sim'
            ? '<span class="pd-tag pd-tag-liberada">' + esc(t('usuarios.ativo')) + '</span>'
            : '<span class="pd-tag pd-tag-nao_aplicavel">' + esc(t('usuarios.inativo')) + '</span>') +
          '</td>' +
          '<td><div class="adm-acoes">' +
          '<button type="button" class="pd-btn pd-btn-p" data-adm="editar" data-usuario="' + esc(u.usuario) + '"' + desabilitado + '>' + esc(t('usuarios.editar')) + '</button>' +
          '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-adm="senha" data-usuario="' + esc(u.usuario) + '"' + desabilitado + '>' + esc(t('usuarios.redefinir')) + '</button>' +
          '</div></td></tr>'
        );
      })
      .join('');

    el('vista').innerHTML =
      '<section class="pd-secao">' +
      '<div class="pd-secao-linha"><h2 class="pd-secao-titulo">' + esc(t('usuarios.titulo')) + '</h2>' +
      '<span class="pd-pilula">' + esc(t('usuarios.contagem', { ativos: ativos, total: usuarios.length })) + '</span>' +
      '<div class="pd-secao-acoes"><button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-adm="novo"' + desabilitado + '>+ ' +
      esc(t('usuarios.novo')) + '</button></div></div>' +
      '<p class="pd-secao-ajuda">' + esc(t('usuarios.ajuda')) + '</p>' +
      (travado ? notaSemToken() : '') +
      '<div class="pd-tabela-caixa pd-tabela-caixa-livre"><table class="pd-tabela"><thead><tr>' +
      '<th>' + esc(t('usuarios.nome')) + '</th>' +
      '<th>' + esc(t('usuarios.usuario')) + '</th>' +
      '<th>' + esc(t('usuarios.papel')) + '</th>' +
      '<th class="pd-esconde-p">' + esc(t('usuarios.senha')) + '</th>' +
      '<th>' + esc(t('usuarios.situacao')) + '</th>' +
      '<th class="adm-col-acoes">' + esc(t('usuarios.acoes')) + '</th>' +
      '</tr></thead><tbody>' + linhas + '</tbody></table></div>' +
      '</section>';
  }

  function opcoesPapel(selecionado, incluirVazio) {
    const papeis = window.Acesso.estado.papeis;
    let html = incluirVazio ? '<option value=""></option>' : '';
    // Papel que sumiu do cadastro continua visível, para não ser trocado sem querer ao salvar.
    if (selecionado && !window.Acesso.papel(selecionado)) {
      html += '<option value="' + esc(selecionado) + '" selected>' + esc(selecionado + ' · ' + t('usuarios.papelDesconhecido')) + '</option>';
    }
    return (
      html +
      papeis
        .map(function (p) {
          return (
            '<option value="' + esc(p.papel) + '"' + (p.papel === selecionado ? ' selected' : '') + '>' +
            esc(window.Acesso.nomePapel(p.papel)) + '</option>'
          );
        })
        .join('')
    );
  }

  function abrirFormularioUsuario(login) {
    const registro = login ? window.Auth.buscar(login) : null;
    const novo = !registro;

    window.UI.abrirModal(
      '<form id="admFormUsuario" class="pd-form-pilha" data-usuario="' + esc(novo ? '' : registro.usuario) + '" novalidate>' +
      '<h2 class="pd-modal-titulo">' + esc(novo ? t('form.tituloNovo') : t('form.tituloEditar', { nome: registro.nome })) + '</h2>' +
      (novo
        ? grupo('admUsuario', t('form.usuario'),
            '<input id="admUsuario" class="pd-campo" type="text" autocomplete="off" autocapitalize="none" spellcheck="false">',
            t('form.usuarioAjuda'))
        : grupo('admUsuarioFixo', t('form.usuario'),
            '<input id="admUsuarioFixo" class="pd-campo pd-mono" type="text" value="' + esc(registro.usuario) + '" disabled>')) +
      grupo('admNome', t('form.nome'),
        '<input id="admNome" class="pd-campo" type="text" autocomplete="off" value="' + esc(novo ? '' : registro.nome) + '">') +
      grupo('admPapel', t('form.papel'),
        '<select id="admPapel" class="pd-campo">' + opcoesPapel(novo ? '' : registro.papel, novo) + '</select>') +
      (novo
        ? grupo('admSenha', t('form.senha'),
            '<input id="admSenha" class="pd-campo" type="password" autocomplete="new-password">',
            t('form.senhaAjuda', { n: cfg().senhaMinima }))
        : '<label class="pd-marcador"><input id="admAtivo" type="checkbox"' + (registro.ativo === 'sim' ? ' checked' : '') + '> ' +
          esc(t('form.ativo')) + '</label>') +
      '<div id="admErro" class="pd-alerta-erro" role="alert" hidden></div>' +
      acoesFormulario('admSalvarUsuario') +
      '</form>'
    );
  }

  function salvarUsuario(form) {
    const login = form.getAttribute('data-usuario');
    const novo = !login;
    const dados = {
      usuario: novo ? el('admUsuario').value.trim().toLowerCase() : login,
      nome: el('admNome').value.trim(),
      papel: el('admPapel').value,
      ativo: novo || el('admAtivo').checked ? 'sim' : 'nao',
    };

    if (novo && !PADRAO_USUARIO.test(dados.usuario)) return mostrarErro('admErro', t('form.erroUsuario'));
    if (novo && window.Auth.buscar(dados.usuario)) return mostrarErro('admErro', t('form.erroDuplicado'));
    if (!dados.nome) return mostrarErro('admErro', t('form.erroNome'));
    if (!dados.papel) return mostrarErro('admErro', t('form.erroPapel'));
    if (!novo && login === quem() && dados.ativo !== 'sim') return mostrarErro('admErro', t('form.erroVoce'));

    const senha = novo ? el('admSenha').value : '';
    mostrarErro('admErro', '');
    travar('admSalvarUsuario', true);

    (novo ? window.Auth.validarSenhaNova(senha) : Promise.resolve(null))
      .then(function (problema) {
        if (problema) throw erroComChaveGlobal(problema);
        return novo ? window.Auth.hashSenha(dados.usuario, senha) : null;
      })
      .then(function (hash) {
        const mensagem = novo
          ? 'chore(acesso): novo usuario ' + dados.usuario + ' por ' + quem()
          : 'chore(acesso): usuario ' + dados.usuario + ' atualizado por ' + quem();

        // As travas conferem os papéis como estão agora no repositório, não na abertura da página.
        return window.Acesso.carregarPapeis().then(function () {
          if (!window.Acesso.papel(dados.papel)) throw erroComChave('form.erroPapel');
          return gravarCsv(cfg().dados.usuarios, function (csv) {
            if (novo) {
              if (csv.linhas.some(function (u) { return u.usuario === dados.usuario; })) throw erroComChave('form.erroDuplicado');
              csv.linhas.push({ usuario: dados.usuario, nome: dados.nome, papel: dados.papel, senha_hash: hash, ativo: 'sim' });
            } else {
              const linha = csv.linhas.filter(function (u) { return u.usuario === login; })[0];
              if (!linha) throw erroComChave('form.erroSumiu');
              linha.nome = dados.nome;
              linha.papel = dados.papel;
              linha.ativo = dados.ativo;
            }
            if (!restaAdministrador(csv.linhas, window.Acesso.estado.papeis)) throw erroComChave('form.erroUltimoAdmin');
          }, mensagem);
        });
      })
      .then(function (resultado) {
        window.Auth.aplicarTexto(resultado.texto);
        window.UI.fecharModal();
        window.UI.toast(t('salvo'), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        mostrarErro('admErro', erro.global ? window.I18N.t(erro.chave, { n: cfg().senhaMinima }) : mensagemDeErro(erro));
      })
      .then(function () {
        travar('admSalvarUsuario', false);
      });
  }

  /** Erro cuja chave está no dicionário da casca (regras de senha). */
  function erroComChaveGlobal(chave) {
    const e = erroComChave(chave);
    e.global = true;
    return e;
  }

  function abrirRedefinirSenha(login) {
    const registro = window.Auth.buscar(login);
    if (!registro) return;
    window.UI.abrirModal(
      '<form id="admFormSenha" class="pd-form-pilha" data-usuario="' + esc(registro.usuario) + '" novalidate>' +
      '<h2 class="pd-modal-titulo">' + esc(t('senha.titulo', { nome: registro.nome })) + '</h2>' +
      '<p class="pd-ajuda">' + esc(t('senha.ajuda')) + '</p>' +
      grupo('admNovaSenha', t('senha.campo'),
        '<input id="admNovaSenha" class="pd-campo" type="password" autocomplete="new-password">',
        window.I18N.t('senha.regra', { n: cfg().senhaMinima })) +
      '<div id="admErroSenha" class="pd-alerta-erro" role="alert" hidden></div>' +
      acoesFormulario('admSalvarSenha') +
      '</form>'
    );
  }

  function salvarSenha(form) {
    const login = form.getAttribute('data-usuario');
    const registro = window.Auth.buscar(login);
    const senha = el('admNovaSenha').value;
    mostrarErro('admErroSenha', '');
    travar('admSalvarSenha', true);

    window.Auth.validarSenhaNova(senha)
      .then(function (problema) {
        if (problema) throw erroComChaveGlobal(problema);
        window.App.sinalizarGravacao('gravando');
        return window.Auth.gravarSenha(login, senha, 'chore(acesso): senha de ' + login + ' redefinida por ' + quem()).then(
          function () {
            window.App.sinalizarGravacao('salvo');
          },
          function (erro) {
            window.App.sinalizarGravacao('erro', erro);
            throw erro;
          }
        );
      })
      .then(function () {
        window.UI.fecharModal();
        window.UI.toast(t('senha.salva', { nome: registro ? registro.nome : login }), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        mostrarErro('admErroSenha', erro.global ? window.I18N.t(erro.chave, { n: cfg().senhaMinima }) : mensagemDeErro(erro));
      })
      .then(function () {
        travar('admSalvarSenha', false);
      });
  }

  /* ---------------- permissões ---------------- */

  function permissoesEfetivas(papel) {
    const rascunho = rascunhoAtual();
    return rascunho && rascunho[papel] ? rascunho[papel].lista : window.Acesso.permissoesDoPapel(papel);
  }

  /**
   * Aplica sobre a versão relida do papel só o que este rascunho mudou: o que
   * outro gestor gravou no mesmo papel enquanto a matriz estava aberta fica.
   */
  function aplicarDelta(atual, base, lista) {
    const adicionadas = lista.filter(function (c) { return base.indexOf(c) === -1; });
    const removidas = base.filter(function (c) { return lista.indexOf(c) === -1; });
    const resultado = atual.concat(adicionadas).filter(function (c) {
      const def = window.Acesso.definicao(c);
      return removidas.indexOf(c) === -1 && !(def && def.requer && removidas.indexOf(def.requer) !== -1);
    });
    return window.Acesso.expandir(resultado);
  }

  function usuariosAtivosDoPapel(papel) {
    return window.Auth.estado.usuarios.filter(function (u) {
      return u.papel === papel && u.ativo === 'sim';
    }).length;
  }

  function renderPermissoes() {
    const papeis = window.Acesso.estado.papeis;
    const travado = !podeGravar();
    const desabilitado = travado ? ' disabled' : '';

    const cabecalho =
      '<tr><th class="adm-permissao">' + esc(t('permissoes.permissao')) + '</th>' +
      papeis
        .map(function (p) {
          return (
            '<th class="adm-col-papel">' +
            '<div class="adm-papel-nome">' + esc(window.Acesso.nomePapel(p.papel)) + '</div>' +
            '<div class="adm-papel-meta"><span class="pd-mono">' + esc(p.papel) + '</span> · ' +
            esc(t('permissoes.usuarios', { n: usuariosAtivosDoPapel(p.papel) })) + '</div>' +
            '<div class="adm-papel-acoes">' +
            '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-adm="editarPapel" data-papel="' + esc(p.papel) + '"' + desabilitado + '>' +
            esc(t('permissoes.editarPapel')) + '</button>' +
            '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-perigo pd-btn-p" data-adm="excluirPapel" data-papel="' + esc(p.papel) + '"' + desabilitado + '>' +
            esc(t('permissoes.excluirPapel')) + '</button>' +
            '</div></th>'
          );
        })
        .join('') +
      '</tr>';

    const corpo = cfg()
      .ferramentas.map(function (ferramenta) {
        const doGrupo = window.Acesso.catalogo().filter(function (p) {
          return p.ferramenta === ferramenta;
        });
        if (!doGrupo.length) return '';
        return (
          '<tr class="adm-grupo"><th colspan="' + (papeis.length + 1) + '">' + esc(window.I18N.t('ferramenta.' + ferramenta)) + '</th></tr>' +
          doGrupo
            .map(function (perm) {
              const nomePerm = window.I18N.t('perm.' + perm.chave);
              return (
                '<tr><th scope="row" class="adm-permissao">' +
                '<div class="adm-permissao-nome">' + esc(nomePerm) + '</div>' +
                '<div class="adm-permissao-desc">' + esc(window.I18N.t('perm.' + perm.chave + 'Desc')) +
                (perm.requer ? ' · ' + esc(t('permissoes.requer', { permissao: window.I18N.t('perm.' + perm.requer) })) : '') +
                '</div>' +
                '<div class="pd-mono adm-permissao-chave">' + esc(perm.chave) + '</div></th>' +
                papeis
                  .map(function (p) {
                    const marcado = permissoesEfetivas(p.papel).indexOf(perm.chave) !== -1;
                    return (
                      '<td class="pd-cel-centro"><input type="checkbox" class="adm-marca"' +
                      ' data-adm-papel="' + esc(p.papel) + '" data-adm-permissao="' + esc(perm.chave) + '"' +
                      ' aria-label="' + esc(t('permissoes.marca', { papel: window.Acesso.nomePapel(p.papel), permissao: nomePerm })) + '"' +
                      (marcado ? ' checked' : '') + desabilitado + '></td>'
                    );
                  })
                  .join('') +
                '</tr>'
              );
            })
            .join('')
        );
      })
      .join('');

    el('vista').innerHTML =
      '<section class="pd-secao">' +
      '<div class="pd-secao-linha"><h2 class="pd-secao-titulo">' + esc(t('permissoes.titulo')) + '</h2>' +
      '<div class="pd-secao-acoes"><button type="button" class="pd-btn pd-btn-p" data-adm="novoPapel"' + desabilitado + '>+ ' +
      esc(t('permissoes.novoPapel')) + '</button></div></div>' +
      '<p class="pd-secao-ajuda">' + esc(t('permissoes.ajuda')) + '</p>' +
      (travado ? notaSemToken() : '') +
      '<div class="pd-tabela-caixa pd-tabela-caixa-livre"><table class="pd-tabela adm-matriz"><thead>' + cabecalho +
      '</thead><tbody>' + corpo + '</tbody></table></div>' +
      '<div class="adm-rodape" id="admRodape"></div>' +
      '</section>';

    renderRodapeMatriz();
  }

  function renderRodapeMatriz() {
    const rodape = el('admRodape');
    if (!rodape) return;
    const pendente = !!rascunhoAtual();
    rodape.className = 'adm-rodape' + (pendente ? ' adm-rodape-pendente' : '');
    rodape.innerHTML =
      (pendente ? '<span role="status">' + esc(t('permissoes.pendente')) + '</span>' : '') +
      '<span class="pd-espaco"></span>' +
      '<button type="button" class="pd-btn" data-adm="descartar"' + (pendente ? '' : ' disabled') + '>' + esc(t('permissoes.descartar')) + '</button>' +
      '<button type="button" class="pd-btn pd-btn-primario" data-adm="salvarPermissoes"' + (pendente && podeGravar() ? '' : ' disabled') + '>' +
      esc(t('permissoes.salvar')) + '</button>';
  }

  /**
   * Marcar uma permissão traz junto o que ela requer; desmarcar tira também o
   * que dependia dela. As caixas do papel são ressincronizadas no lugar, sem
   * redesenhar a tabela.
   */
  function alternarPermissao(papel, chave, marcado) {
    let lista = permissoesEfetivas(papel).slice();
    if (marcado) {
      lista = window.Acesso.expandir(lista.concat([chave]));
    } else {
      lista = lista.filter(function (c) {
        const def = window.Acesso.definicao(c);
        return c !== chave && !(def && def.requer === chave);
      });
    }

    const rascunho = rascunhoAtual() || {};
    const base = rascunho[papel] ? rascunho[papel].base : window.Acesso.permissoesDoPapel(papel);
    rascunho[papel] = { base: base, lista: lista };
    vista.rascunho = rascunho;
    vista.rascunhoDe = quem();

    const mudou = Object.keys(rascunho).some(function (p) {
      return rascunho[p].lista.join(';') !== rascunho[p].base.join(';');
    });
    if (!mudou) descartarRascunho();

    Array.prototype.forEach.call(document.querySelectorAll('.adm-marca'), function (caixa) {
      if (caixa.getAttribute('data-adm-papel') !== papel) return;
      caixa.checked = lista.indexOf(caixa.getAttribute('data-adm-permissao')) !== -1;
    });
    renderRodapeMatriz();
  }

  function salvarPermissoes() {
    const rascunho = rascunhoAtual();
    if (!rascunho) return;
    const botao = document.querySelector('[data-adm="salvarPermissoes"]');
    if (botao) botao.disabled = true;
    const autor = quem();

    // A trava do último administrador confere o cadastro de pessoas como está agora.
    window.Auth.carregarUsuarios()
      .then(function () {
        return gravarCsv(
          cfg().dados.papeis,
          function (csv) {
            Object.keys(rascunho).forEach(function (papel) {
              const linha = csv.linhas.filter(function (p) { return p.papel === papel; })[0];
              if (!linha) return;
              const atual = window.Acesso.expandir(window.Acesso.lerLista(linha.permissoes));
              linha.permissoes = aplicarDelta(atual, rascunho[papel].base, rascunho[papel].lista).join(';');
            });
            if (!restaAdministrador(window.Auth.estado.usuarios, csv.linhas)) throw erroComChave('form.erroUltimoAdmin');
          },
          'chore(acesso): permissoes atualizadas por ' + autor
        );
      })
      .then(function (resultado) {
        window.Acesso.aplicarTexto(resultado.texto);
        descartarRascunho();
        window.UI.toast(t('permissoes.salvas'), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        window.UI.toast(mensagemDeErro(erro), 'erro');
        renderRodapeMatriz();
      });
  }

  function abrirFormularioPapel(chave) {
    const registro = chave ? window.Acesso.papel(chave) : null;
    const novo = !registro;
    const copiar = novo
      ? '<select id="admPapelCopiar" class="pd-campo"><option value="">' + esc(t('papel.nenhum')) + '</option>' +
        window.Acesso.estado.papeis
          .map(function (p) {
            return '<option value="' + esc(p.papel) + '">' + esc(window.Acesso.nomePapel(p.papel)) + '</option>';
          })
          .join('') +
        '</select>'
      : '';

    window.UI.abrirModal(
      '<form id="admFormPapel" class="pd-form-pilha" data-papel="' + esc(novo ? '' : registro.papel) + '" novalidate>' +
      '<h2 class="pd-modal-titulo">' + esc(novo ? t('papel.tituloNovo') : t('papel.tituloEditar', { papel: window.Acesso.nomePapel(registro.papel) })) + '</h2>' +
      grupo('admPapelChave', t('papel.chave'),
        '<input id="admPapelChave" class="pd-campo pd-mono" type="text" autocomplete="off" autocapitalize="none" spellcheck="false"' +
        (novo ? '' : ' value="' + esc(registro.papel) + '" disabled') + '>',
        novo ? t('papel.chaveAjuda') : '') +
      grupo('admPapelNomePt', t('papel.nomePt'),
        '<input id="admPapelNomePt" class="pd-campo" type="text" autocomplete="off" value="' + esc(novo ? '' : registro.nome_pt) + '">') +
      grupo('admPapelNomeEn', t('papel.nomeEn'),
        '<input id="admPapelNomeEn" class="pd-campo" type="text" autocomplete="off" value="' + esc(novo ? '' : registro.nome_en) + '">') +
      (novo ? grupo('admPapelCopiar', t('papel.copiar'), copiar) : '') +
      '<div id="admErroPapel" class="pd-alerta-erro" role="alert" hidden></div>' +
      acoesFormulario('admSalvarPapel') +
      '</form>'
    );
  }

  function salvarPapel(form) {
    const original = form.getAttribute('data-papel');
    const novo = !original;
    const dados = {
      papel: novo ? el('admPapelChave').value.trim().toLowerCase() : original,
      nome_pt: el('admPapelNomePt').value.trim(),
      nome_en: el('admPapelNomeEn').value.trim(),
    };

    if (novo && !PADRAO_PAPEL.test(dados.papel)) return mostrarErro('admErroPapel', t('papel.erroChave'));
    if (novo && window.Acesso.papel(dados.papel)) return mostrarErro('admErroPapel', t('papel.erroDuplicado'));
    if (!dados.nome_pt) return mostrarErro('admErroPapel', t('papel.erroNome'));

    const origem = novo ? el('admPapelCopiar').value : '';
    const permissoes = origem ? window.Acesso.permissoesDoPapel(origem).join(';') : '';
    mostrarErro('admErroPapel', '');
    travar('admSalvarPapel', true);

    gravarCsv(
      cfg().dados.papeis,
      function (csv) {
        if (novo) {
          if (csv.linhas.some(function (p) { return p.papel === dados.papel; })) throw erroComChave('papel.erroDuplicado');
          csv.linhas.push({ papel: dados.papel, nome_pt: dados.nome_pt, nome_en: dados.nome_en, permissoes: permissoes });
        } else {
          const linha = csv.linhas.filter(function (p) { return p.papel === original; })[0];
          if (!linha) throw erroComChave('form.erroSumiu');
          linha.nome_pt = dados.nome_pt;
          linha.nome_en = dados.nome_en;
        }
      },
      novo
        ? 'chore(acesso): papel ' + dados.papel + ' criado por ' + quem()
        : 'chore(acesso): papel ' + dados.papel + ' atualizado por ' + quem()
    )
      .then(function (resultado) {
        window.Acesso.aplicarTexto(resultado.texto);
        window.UI.fecharModal();
        window.UI.toast(t('papel.salvo'), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        mostrarErro('admErroPapel', mensagemDeErro(erro));
      })
      .then(function () {
        travar('admSalvarPapel', false);
      });
  }

  /** Conta também os inativos: reativar alguém não pode cair num papel que não existe. */
  function usuariosDoPapel(chave) {
    return window.Auth.estado.usuarios.filter(function (u) { return u.papel === chave; }).length;
  }

  function excluirPapel(chave) {
    const emUso = usuariosDoPapel(chave);
    if (emUso) {
      window.UI.toast(t('permissoes.emUso', { n: emUso }), 'erro');
      return;
    }
    if (!window.confirm(t('permissoes.excluirConfirma', { papel: window.Acesso.nomePapel(chave) }))) return;

    // Confere de novo com o cadastro atual: alguém pode ter recebido o papel depois da abertura da página.
    window.Auth.carregarUsuarios()
      .then(function () {
        const agora = usuariosDoPapel(chave);
        if (agora) throw erroComChave('permissoes.emUso', { n: agora });
        return gravarCsv(
          cfg().dados.papeis,
          function (csv) {
            csv.linhas = csv.linhas.filter(function (p) { return p.papel !== chave; });
          },
          'chore(acesso): papel ' + chave + ' excluido por ' + quem()
        );
      })
      .then(function (resultado) {
        window.Acesso.aplicarTexto(resultado.texto);
        const rascunho = rascunhoAtual();
        if (rascunho) {
          delete rascunho[chave];
          if (!Object.keys(rascunho).length) descartarRascunho();
        }
        window.UI.toast(t('papel.excluido'), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        window.UI.toast(mensagemDeErro(erro), 'erro');
      });
  }

  /* ---------------- eventos ---------------- */

  function iniciar() {
    document.addEventListener('click', function (evento) {
      if (!ativo()) return;
      const acao = evento.target.closest('[data-adm]');
      if (!acao || acao.disabled) return;
      const nome = acao.getAttribute('data-adm');

      if (nome === 'novo') return abrirFormularioUsuario();
      if (nome === 'editar') return abrirFormularioUsuario(acao.getAttribute('data-usuario'));
      if (nome === 'senha') return abrirRedefinirSenha(acao.getAttribute('data-usuario'));
      if (nome === 'novoPapel') return abrirFormularioPapel();
      if (nome === 'editarPapel') return abrirFormularioPapel(acao.getAttribute('data-papel'));
      if (nome === 'excluirPapel') return excluirPapel(acao.getAttribute('data-papel'));
      if (nome === 'salvarPermissoes') return salvarPermissoes();
      if (nome === 'descartar') {
        descartarRascunho();
        renderPermissoes();
      }
    });

    document.addEventListener('change', function (evento) {
      if (!ativo()) return;
      const caixa = evento.target.closest('[data-adm-permissao]');
      if (caixa) alternarPermissao(caixa.getAttribute('data-adm-papel'), caixa.getAttribute('data-adm-permissao'), caixa.checked);
    });

    document.addEventListener('submit', function (evento) {
      if (!ativo()) return;
      const id = evento.target.id;
      if (id !== 'admFormUsuario' && id !== 'admFormSenha' && id !== 'admFormPapel') return;
      evento.preventDefault();
      if (id === 'admFormUsuario') salvarUsuario(evento.target);
      else if (id === 'admFormSenha') salvarSenha(evento.target);
      else salvarPapel(evento.target);
    });
  }

  window.Admin = window.Admin || {};
  window.Admin.Telas = {
    iniciar: iniciar,
    permitido: permitido,
    entrar: entrar,
    abas: abas,
    abaAtual: abaAtual,
    subtitulo: subtitulo,
    render: render,
    temPendencias: temPendencias,
    descarregar: descarregar,
    icone: ICONE,
    atalhos: atalhos,
  };
})();
