/**
 * Leitura e gravação dos CSV direto no repositório, pela API do GitHub.
 *
 * O portal é uma página estática: ela não consegue escrever num arquivo do
 * servidor. Cada gravação vira um commit no repositório, que continua sendo a
 * única fonte de verdade de todas as ferramentas.
 *
 * O token é pessoal, informado uma única vez e guardado neste navegador sob o
 * usuário do portal. Todas as ferramentas usam o mesmo. Sem token o portal abre
 * em modo leitura, lendo o que está publicado no site.
 */
(function () {
  'use strict';

  const API = 'https://api.github.com';
  const MAX_TENTATIVAS = 3;

  const estado = {
    token: null,
    usuario: null,
    /** caminho do arquivo -> sha da última versão lida; é o controle de conflito */
    shas: {},
    /** 'recusado' quando o GitHub não aceitou o token numa leitura */
    alerta: null,
  };

  function cfg() {
    return window.PORTAL_CONFIG.github;
  }

  function repositorio() {
    return cfg().owner + '/' + cfg().repo;
  }

  /* ---------------- token ---------------- */

  function chave(usuario) {
    return window.PORTAL_CONFIG.storageKeys.token + usuario;
  }

  /** Carrega o token de quem entrou. Trocar de usuário no mesmo navegador troca o token. */
  function carregarToken(usuario) {
    estado.usuario = usuario || null;
    estado.token = null;
    estado.shas = {};
    estado.alerta = null;
    if (!usuario) return null;
    try {
      estado.token = window.localStorage.getItem(chave(usuario)) || null;
    } catch (e) {
      estado.token = null;
    }
    return estado.token;
  }

  function definirToken(token) {
    estado.token = String(token || '').trim() || null;
    estado.alerta = null;
    if (!estado.usuario) return;
    try {
      if (estado.token) window.localStorage.setItem(chave(estado.usuario), estado.token);
      else window.localStorage.removeItem(chave(estado.usuario));
    } catch (e) {
      /* modo privado: o token vale só nesta aba */
    }
  }

  function temToken() {
    return !!estado.token;
  }

  /* ---------------- codificação ---------------- */

  /** Texto UTF-8 -> base64, em blocos, para não estourar a pilha nos catálogos grandes. */
  function paraBase64(texto) {
    const bytes = new TextEncoder().encode(texto);
    const BLOCO = 0x8000;
    let bruto = '';
    for (let i = 0; i < bytes.length; i += BLOCO) {
      bruto += String.fromCharCode.apply(null, bytes.subarray(i, i + BLOCO));
    }
    return btoa(bruto);
  }

  /** base64 -> texto, tratando o conteúdo como UTF-8 (os CSV têm acento). */
  function deBase64(b64) {
    const limpo = String(b64 || '').replace(/\s/g, '');
    if (!limpo) return '';
    const bruto = atob(limpo);
    const bytes = new Uint8Array(bruto.length);
    for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  /* ---------------- HTTP ---------------- */

  function urlRepositorio() {
    return API + '/repos/' + cfg().owner + '/' + cfg().repo;
  }

  function urlConteudo(caminho) {
    return urlRepositorio() + '/contents/' + caminho.split('/').map(encodeURIComponent).join('/');
  }

  function cabecalhos(token) {
    const h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  function erroDaResposta(r) {
    return r
      .json()
      .catch(function () {
        return {};
      })
      .then(function (json) {
        const e = new Error(json.message || 'HTTP ' + r.status);
        e.status = r.status;
        if (r.status === 401 || r.status === 403) e.credencial = true;
        throw e;
      });
  }

  function erroDeCredencial(mensagem) {
    const e = new Error(mensagem);
    e.credencial = true;
    return e;
  }

  /** Lê o arquivo como está publicado no site. Sem sha: serve para consultar, não para gravar. */
  function lerPublicado(caminho) {
    return fetch(caminho, { cache: 'no-store' }).then(function (r) {
      if (r.status === 404) return { texto: '', sha: null, existe: false };
      if (!r.ok) {
        const e = new Error('HTTP ' + r.status);
        e.status = r.status;
        throw e;
      }
      return r.text().then(function (texto) {
        return { texto: texto, sha: null, existe: true };
      });
    });
  }

  /**
   * Lê um arquivo do repositório. Arquivo inexistente não é erro: volta com
   * existe = false, o que permite criar o CSV no primeiro registro.
   *
   * Com token vai pela API — a versão do branch, sem o atraso de publicação do
   * Pages, e com o sha necessário para gravar. Se o GitHub recusar o token, a
   * leitura cai no site publicado para o portal não parar, e fica o alerta.
   */
  function lerArquivo(caminho) {
    if (!estado.token) return lerPublicado(caminho);

    return fetch(urlConteudo(caminho) + '?ref=' + encodeURIComponent(cfg().branch), {
      headers: cabecalhos(estado.token),
      cache: 'no-store',
    }).then(function (r) {
      if (r.ok) {
        return r.json().then(function (json) {
          estado.shas[caminho] = json.sha;
          // Acima de 1 MB a API devolve o conteúdo vazio; aí o texto vem pelo blob.
          if (!json.content && json.size > 0) {
            return fetch(urlRepositorio() + '/git/blobs/' + json.sha, {
              headers: cabecalhos(estado.token),
              cache: 'no-store',
            })
              .then(function (b) {
                return b.ok ? b.json() : erroDaResposta(b);
              })
              .then(function (blob) {
                return { texto: deBase64(blob.content), sha: json.sha, existe: true };
              });
          }
          return { texto: deBase64(json.content), sha: json.sha, existe: true };
        });
      }

      if (r.status === 401 || r.status === 403 || r.status === 404) {
        delete estado.shas[caminho];
        // 404 pela API também é o que recebe um token sem acesso ao repositório:
        // o site publicado desempata entre "não existe" e "token recusado".
        return lerPublicado(caminho).then(function (publicado) {
          if (r.status === 401 || publicado.existe) {
            estado.alerta = 'recusado';
            publicado.recusado = true;
          }
          return publicado;
        });
      }

      return erroDaResposta(r);
    });
  }

  /**
   * Grava o arquivo com o sha da última leitura. Devolve o sha novo.
   * Em conflito (alguém gravou entre a leitura e a escrita) rejeita com
   * `conflito = true`, para quem chamou reler e reaplicar a alteração.
   */
  function gravarArquivo(caminho, texto, mensagem) {
    if (!estado.token) return Promise.reject(erroDeCredencial('sem token do GitHub'));

    const corpo = {
      message: mensagem,
      content: paraBase64(texto),
      branch: cfg().branch,
    };
    if (estado.shas[caminho]) corpo.sha = estado.shas[caminho];

    return fetch(urlConteudo(caminho), {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos(estado.token)),
      body: JSON.stringify(corpo),
    }).then(function (r) {
      if (r.status === 409 || r.status === 422) {
        const conflito = new Error('conflito de versão');
        conflito.conflito = true;
        conflito.status = r.status;
        return Promise.reject(conflito);
      }
      if (!r.ok) return erroDaResposta(r);
      return r.json().then(function (json) {
        estado.shas[caminho] = json.content.sha;
        estado.alerta = null;
        return json.content.sha;
      });
    });
  }

  /**
   * Ciclo ler -> alterar -> gravar. `mutador(texto, existe)` devolve o texto
   * novo, ou null para desistir. Em conflito relê e refaz sobre a versão nova —
   * nunca sobrescreve o que outra pessoa acabou de gravar.
   */
  function alterarArquivo(caminho, mutador, mensagem) {
    if (!estado.token) return Promise.reject(erroDeCredencial('sem token do GitHub'));
    let tentativa = 0;

    function ciclo() {
      return lerArquivo(caminho).then(function (atual) {
        if (atual.recusado) throw erroDeCredencial('o GitHub recusou o token');

        const novo = mutador(atual.texto, atual.existe);
        if (novo === null || novo === undefined) return { texto: atual.texto, abortado: true };
        if (novo === atual.texto) return { texto: novo, abortado: false };

        return gravarArquivo(caminho, novo, mensagem).then(
          function () {
            return { texto: novo, abortado: false };
          },
          function (erro) {
            if (erro.conflito && tentativa < MAX_TENTATIVAS) {
              tentativa += 1;
              return ciclo();
            }
            throw erro;
          }
        );
      });
    }

    return ciclo();
  }

  /** Confere se o token enxerga o repositório e pode gravar nele, antes de aceitá-lo. */
  function validarToken(token) {
    const h = cabecalhos(String(token || '').trim());
    return fetch(urlRepositorio(), { headers: h, cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return { ok: false, status: r.status };
        return r.json().then(function (json) {
          const p = json.permissions || {};
          if (!(p.push || p.maintain || p.admin)) return { ok: true, escrita: false };
          // O papel da conta no repositório não garante que o TOKEN tenha a
          // permissão Contents: um fine-grained sem ela passa na checagem acima e
          // só falharia na primeira gravação. Ler o cadastro antecipa o erro.
          return fetch(urlConteudo(window.PORTAL_CONFIG.dados.usuarios) + '?ref=' + encodeURIComponent(cfg().branch), {
            headers: h,
            cache: 'no-store',
          }).then(function (c) {
            return { ok: true, escrita: true, conteudo: c.ok };
          });
        });
      })
      .catch(function () {
        return { ok: false, status: 0 };
      });
  }

  window.Github = {
    estado: estado,
    repositorio: repositorio,
    carregarToken: carregarToken,
    definirToken: definirToken,
    temToken: temToken,
    lerArquivo: lerArquivo,
    lerPublicado: lerPublicado,
    gravarArquivo: gravarArquivo,
    alterarArquivo: alterarArquivo,
    validarToken: validarToken,
  };
})();
