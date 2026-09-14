/**
 * Permissões do portal.
 *
 * O catálogo de permissões está em config.js — é código: cada chave liga um
 * recurso da tela. Quem recebe cada permissão fica em data/papeis.csv, e cada
 * pessoa tem um papel em data/usuarios.csv. A Administração edita os dois.
 *
 * Como o login, isto organiza o uso — não protege. O que impede alguém de
 * gravar sem poder é o GitHub: só grava quem tem token com escrita no
 * repositório.
 */
(function () {
  'use strict';

  const estado = {
    papeis: [],
    colunas: [],
    carregado: false,
  };

  function catalogo() {
    return window.PORTAL_CONFIG.permissoes;
  }

  function definicao(chave) {
    return (
      catalogo().filter(function (p) {
        return p.chave === chave;
      })[0] || null
    );
  }

  /** "a;b;c" -> ['a', 'b', 'c'] */
  function lerLista(texto) {
    return String(texto || '')
      .split(';')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  /**
   * Completa a lista com o que cada permissão requer, descarta chave que não
   * existe mais e devolve na ordem do catálogo — o CSV não muda à toa.
   */
  function expandir(lista) {
    const incluidas = [];
    function incluir(chave) {
      const def = definicao(chave);
      if (!def || incluidas.indexOf(chave) !== -1) return;
      incluidas.push(chave);
      if (def.requer) incluir(def.requer);
    }
    (lista || []).forEach(incluir);
    return catalogo()
      .map(function (p) {
        return p.chave;
      })
      .filter(function (chave) {
        return incluidas.indexOf(chave) !== -1;
      });
  }

  function aplicarTexto(texto) {
    const dados = window.CSV.parse(texto);
    estado.colunas = dados.colunas;
    estado.papeis = dados.linhas.filter(function (p) {
      return p.papel;
    });
    estado.carregado = true;
  }

  function carregarPapeis() {
    return window.Github.lerArquivo(window.PORTAL_CONFIG.dados.papeis)
      .then(function (r) {
        if (!r.existe) throw new Error('cadastro de papéis ausente');
        aplicarTexto(r.texto);
        return estado.papeis;
      })
      .catch(function () {
        return estado.papeis;
      });
  }

  function papel(chave) {
    return (
      estado.papeis.filter(function (p) {
        return p.papel === chave;
      })[0] || null
    );
  }

  function permissoesDoPapel(chave) {
    const p = papel(chave);
    return p ? expandir(lerLista(p.permissoes)) : [];
  }

  /** A pessoa logada tem a permissão? */
  function pode(permissao) {
    const sessao = window.Auth.sessao;
    if (!sessao) return false;
    return permissoesDoPapel(sessao.papel).indexOf(permissao) !== -1;
  }

  /** Alguma permissão da ferramenta basta para ela aparecer no menu. */
  function podeFerramenta(ferramenta) {
    return catalogo().some(function (p) {
      return p.ferramenta === ferramenta && pode(p.chave);
    });
  }

  function nomePapel(chave) {
    const p = papel(chave);
    return (p && window.I18N.campo(p, 'nome')) || chave || '—';
  }

  window.Acesso = {
    estado: estado,
    catalogo: catalogo,
    definicao: definicao,
    lerLista: lerLista,
    expandir: expandir,
    aplicarTexto: aplicarTexto,
    carregarPapeis: carregarPapeis,
    papel: papel,
    permissoesDoPapel: permissoesDoPapel,
    pode: pode,
    podeFerramenta: podeFerramenta,
    nomePapel: nomePapel,
  };
})();
