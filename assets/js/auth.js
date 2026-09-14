/**
 * Login único do portal.
 *
 * Isto NÃO é controle de acesso. O portal é uma página estática: o arquivo
 * data/usuarios.csv é legível por qualquer pessoa que abra o site e a sessão
 * mora no navegador. O login existe para carimbar quem registrou — o teste, o
 * impedimento, a alteração de cadastro — e para mostrar a cada um as
 * ferramentas do seu papel. Quem de fato consegue gravar é o GitHub que decide,
 * pelo token.
 */
(function () {
  'use strict';

  const estado = {
    usuarios: [],
    colunas: [],
    sessao: null,
    carregado: false,
  };

  function cfg() {
    return window.PORTAL_CONFIG;
  }

  /* ---------------- sessão ---------------- */

  function guardarSessao() {
    try {
      if (estado.sessao) window.localStorage.setItem(cfg().storageKeys.sessao, JSON.stringify(estado.sessao));
      else window.localStorage.removeItem(cfg().storageKeys.sessao);
    } catch (e) {
      /* modo privado: a sessão vale só enquanto a aba estiver aberta */
    }
  }

  function carregarSessao() {
    try {
      const cru = window.localStorage.getItem(cfg().storageKeys.sessao);
      estado.sessao = cru ? JSON.parse(cru) : null;
    } catch (e) {
      estado.sessao = null;
    }
    return estado.sessao;
  }

  /* ---------------- cadastro ---------------- */

  function aplicarTexto(texto) {
    const dados = window.CSV.parse(texto);
    estado.colunas = dados.colunas;
    estado.usuarios = dados.linhas.filter(function (u) {
      return u.usuario;
    });
    estado.carregado = true;
    revalidarSessao();
  }

  function carregarUsuarios() {
    return window.Github.lerArquivo(cfg().dados.usuarios)
      .then(function (r) {
        if (!r.existe) throw new Error('cadastro de usuários ausente');
        aplicarTexto(r.texto);
        return estado.usuarios;
      })
      .catch(function () {
        // Numa releitura que falhou, o cadastro já carregado continua valendo.
        return estado.usuarios;
      });
  }

  function buscar(usuario) {
    const login = String(usuario || '').trim().toLowerCase();
    return (
      estado.usuarios.filter(function (u) {
        return u.usuario.toLowerCase() === login;
      })[0] || null
    );
  }

  /** O papel pode ter mudado desde o último acesso: a sessão segue o cadastro, não o contrário. */
  function revalidarSessao() {
    if (!estado.sessao || !estado.carregado) return;
    const registro = buscar(estado.sessao.usuario);
    if (!registro || registro.ativo !== 'sim') {
      sair();
      return;
    }
    estado.sessao = sessaoDe(registro);
    guardarSessao();
  }

  function sessaoDe(registro) {
    return {
      usuario: registro.usuario,
      nome: registro.nome,
      papel: registro.papel,
      senhaPendente: !registro.senha_hash,
    };
  }

  /* ---------------- senha ---------------- */

  /** SHA-256 em hexadecimal. O Web Crypto só existe em contexto seguro (https ou localhost). */
  function sha256(texto) {
    if (!window.crypto || !window.crypto.subtle) return Promise.reject(new Error('contexto-inseguro'));
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)).then(function (buffer) {
      return Array.prototype.map
        .call(new Uint8Array(buffer), function (b) {
          return ('00' + b.toString(16)).slice(-2);
        })
        .join('');
    });
  }

  /** SHA-256 de usuario:senha:salt — o formato do Portal QA. */
  function hashSenha(usuario, senha) {
    return sha256(usuario + ':' + senha + ':' + cfg().salt);
  }

  /**
   * Confere a senha de um registro. Quem ainda não tem senha pessoal entra com a
   * senha compartilhada do antigo Controle de Impedimentos — o mesmo acesso de
   * antes da unificação, até definir a própria.
   */
  function conferir(registro, login, senha) {
    return Promise.all([hashSenha(login, senha), sha256(senha)]).then(function (hashes) {
      if (!registro) return false;
      if (registro.senha_hash) return hashes[0] === registro.senha_hash;
      return hashes[1] === cfg().senhaCompartilhadaHash;
    });
  }

  /** Resolve com a sessão, ou com null quando as credenciais não conferem. */
  function entrar(usuario, senha) {
    const login = String(usuario || '').trim().toLowerCase();
    const encontrado = buscar(login);
    const registro = encontrado && encontrado.ativo === 'sim' ? encontrado : null;

    // Mesmo sem o usuário, calcula o hash: não vale entregar pelo tempo de
    // resposta quem existe e quem não existe.
    return conferir(registro, login, String(senha || '')).then(function (ok) {
      if (!ok) return null;
      estado.sessao = sessaoDe(registro);
      guardarSessao();
      return estado.sessao;
    });
  }

  function sair() {
    estado.sessao = null;
    guardarSessao();
    window.Github.carregarToken(null);
  }

  function autenticado() {
    return !!estado.sessao;
  }

  /** Regras da senha nova. Resolve com a chave de i18n do problema, ou null. */
  function validarSenhaNova(nova, confirmacao) {
    if (String(nova || '').length < cfg().senhaMinima) return Promise.resolve('senha.erroCurta');
    if (confirmacao !== undefined && nova !== confirmacao) return Promise.resolve('senha.erroConfirmacao');
    return sha256(nova).then(function (hash) {
      return hash === cfg().senhaCompartilhadaHash ? 'senha.erroCompartilhada' : null;
    });
  }

  /** Grava o hash novo na linha do usuário, relendo o cadastro para não perder alteração alheia. */
  function gravarSenha(usuario, senha, mensagem) {
    return hashSenha(usuario, senha)
      .then(function (hash) {
        return window.Github.alterarArquivo(
          cfg().dados.usuarios,
          function (texto) {
            const dados = window.CSV.parse(texto);
            const linha = dados.linhas.filter(function (u) {
              return u.usuario === usuario;
            })[0];
            if (!linha) throw new Error('usuário não encontrado no cadastro');
            linha.senha_hash = hash;
            return window.CSV.serialize(dados.linhas, dados.colunas);
          },
          mensagem
        );
      })
      .then(function (r) {
        aplicarTexto(r.texto);
      });
  }

  function trocarSenha(atual, nova) {
    const usuario = estado.sessao.usuario;
    return conferir(buscar(usuario), usuario, String(atual || '')).then(function (ok) {
      if (!ok) {
        const e = new Error('senha atual não confere');
        e.chave = 'senha.erroAtual';
        throw e;
      }
      return gravarSenha(usuario, nova, 'chore(acesso): troca de senha (' + usuario + ')');
    });
  }

  /** Iniciais para o avatar do cabeçalho. */
  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/);
    if (!partes[0]) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  /** Nome de exibição de um login, para listas e gráficos. */
  function nomeDe(usuario) {
    const registro = buscar(usuario);
    return registro ? registro.nome : usuario;
  }

  window.Auth = {
    estado: estado,
    carregarSessao: carregarSessao,
    carregarUsuarios: carregarUsuarios,
    aplicarTexto: aplicarTexto,
    buscar: buscar,
    entrar: entrar,
    sair: sair,
    autenticado: autenticado,
    hashSenha: hashSenha,
    validarSenhaNova: validarSenhaNova,
    gravarSenha: gravarSenha,
    trocarSenha: trocarSenha,
    iniciais: iniciais,
    nomeDe: nomeDe,
    get sessao() {
      return estado.sessao;
    },
  };
})();
