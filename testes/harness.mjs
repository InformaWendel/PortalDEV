/**
 * Harness dos testes do portal. Node puro, sem dependência: um servidor estático
 * de arquivo, o Chrome headless dirigido pelo protocolo de DevTools, e a API de
 * conteúdo do GitHub simulada em memória por um script injetado antes da página.
 *
 * A simulação é injetada, e não embutida no código do portal, justamente para o
 * que roda no navegador ser o mesmo arquivo que vai para o GitHub Pages.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));

/** O Chrome de cada máquina; o primeiro que existir vence. */
const CANDIDATOS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

function acharNavegador() {
  const achado = CANDIDATOS.find((c) => existsSync(c));
  if (!achado) throw new Error('nenhum Chrome ou Edge encontrado em: ' + CANDIDATOS.join(' · '));
  return achado;
}

/* ---------------- config do portal, lido do proprio arquivo ---------------- */

/** config.js é um objeto atribuído a window: basta dar um window a ele. */
export function configDoPortal() {
  const janela = {};
  new Function('window', readFileSync(join(RAIZ, 'assets/js/config.js'), 'utf8'))(janela);
  return janela.PORTAL_CONFIG;
}

const CONFIG = configDoPortal();

/** O mesmo hash do auth.js: sha256 de usuario:senha:salt. */
export function hashSenha(usuario, senha) {
  return createHash('sha256').update(usuario + ':' + senha + ':' + CONFIG.salt).digest('hex');
}

/* ---------------- contagem ---------------- */

export function conferidor() {
  let passou = 0;
  const falhas = [];
  return {
    secao: (nome) => console.log('\n== ' + nome + ' =='),
    conferir(nome, condicao, detalhe) {
      if (condicao) { passou++; console.log('  ok     ' + nome); }
      else { falhas.push(nome); console.log('  FALHA  ' + nome + (detalhe ? '\n           ' + detalhe : '')); }
    },
    registrarFalha: (nome) => falhas.push(nome),
    resumo() {
      console.log('\n' + passou + ' passaram, ' + falhas.length + ' falharam');
      falhas.forEach((f) => console.log('  - ' + f));
      return falhas.length;
    },
  };
}

/* ---------------- servidor ---------------- */

const TIPOS = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.csv': 'text/csv', '.json': 'application/json',
};

export function servirPortal(porta) {
  const servidor = createServer((req, res) => {
    const pedido = decodeURIComponent(req.url.split('?')[0]);
    const caminho = pedido === '/' ? 'index.html' : pedido.replace(/^\/+/, '');
    try {
      const corpo = readFileSync(join(RAIZ, caminho));
      res.writeHead(200, { 'Content-Type': (TIPOS[extname(caminho)] || 'text/plain') + '; charset=utf-8' });
      res.end(corpo);
    } catch {
      res.writeHead(404).end('nao encontrado');
    }
  });
  return new Promise((r) => servidor.listen(porta, () => r(servidor)));
}

/* ---------------- simulacao da API do GitHub ---------------- */

/**
 * O script injetado. `arquivos` semeia o que a simulação já conhece; o que faltar
 * é buscado no servidor estático e passa a valer a partir dali — assim os CSV do
 * repositório entram no teste sem serem copiados para cá.
 *
 * Captura também o download (o navegador headless não grava em disco) e os
 * commits, para o teste conferir a mensagem.
 *
 * `ausentes` responde 404 pela API e pelo site publicado; `falhas` responde 500 no
 * PUT. Os dois viram `Set` em window.__ausentes e window.__falhas, mutáveis durante o
 * teste — é assim que se simula a rede caindo e voltando.
 *
 * `sobrescritas` troca o que o site publicado responde num caminho: texto vira 200
 * com aquele corpo, `{ status }` vira resposta vazia com aquele código. É como se
 * simula uma publicação nova com a página aberta. Mutável em window.__sobrescritas.
 */
export function simulacaoGithub({ arquivos = {}, tokens = [], ausentes = [], falhas = [], sobrescritas = {} } = {}) {
  const repo = CONFIG.github.owner + '/' + CONFIG.github.repo;
  return `
(function () {
  const ARQUIVOS = ${JSON.stringify(arquivos)};
  const SHAS = {};
  const sha = (c) => { SHAS[c] = (SHAS[c] || 0) + 1; return c + '@' + SHAS[c]; };
  Object.keys(ARQUIVOS).forEach(sha);

  const para = (t) => btoa(String.fromCharCode.apply(null, new TextEncoder().encode(t)));
  const de = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
  const json = (corpo, status, cabecalhos) => new Response(JSON.stringify(corpo), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cabecalhos || {}),
  });

  window.__commits = [];
  window.__baixados = [];
  window.__ausentes = new Set(${JSON.stringify(ausentes)});
  window.__falhas = new Set(${JSON.stringify(falhas)});
  window.__sobrescritas = ${JSON.stringify(sobrescritas)};
  window.__arquivo = (c) => ARQUIVOS[c];
  window.__semear = (c, texto) => { ARQUIVOS[c] = texto; sha(c); };

  const real = window.fetch.bind(window);
  const API = 'https://api.github.com';
  const BASE = API + '/repos/${repo}';

  window.fetch = function (entrada, opcoes) {
    const url = String(entrada);
    const metodo = ((opcoes && opcoes.method) || 'GET').toUpperCase();
    const local = url.replace(location.origin + '/', '').split('?')[0];
    if (window.__ausentes.has(local)) return Promise.resolve(new Response('nao encontrado', { status: 404 }));
    if (Object.prototype.hasOwnProperty.call(window.__sobrescritas, local)) {
      const s = window.__sobrescritas[local];
      return Promise.resolve(typeof s === 'string' ? new Response(s, { status: 200 }) : new Response('', { status: s.status }));
    }

    if (url === BASE) {
      return Promise.resolve(json({ full_name: '${repo}', owner: { login: '${CONFIG.github.owner}' } },
        200, { 'X-OAuth-Scopes': 'public_repo' }));
    }
    if (url === API + '/user') return Promise.resolve(json({ login: '${CONFIG.github.owner}' }));

    if (url.indexOf(BASE + '/contents/') === 0) {
      const caminho = decodeURIComponent(url.split('/contents/')[1].split('?')[0]);

      if (metodo === 'GET') {
        if (window.__ausentes.has(caminho)) return Promise.resolve(json({ message: 'Not Found' }, 404));
        if (ARQUIVOS[caminho] !== undefined) {
          return Promise.resolve(json({
            sha: caminho + '@' + SHAS[caminho],
            size: ARQUIVOS[caminho].length,
            content: para(ARQUIVOS[caminho]),
          }));
        }
        return real('/' + caminho, { cache: 'no-store' }).then((r) => {
          if (!r.ok) return json({ message: 'Not Found' }, 404);
          return r.text().then((texto) => {
            ARQUIVOS[caminho] = texto;
            return json({ sha: sha(caminho), size: texto.length, content: para(texto) });
          });
        });
      }

      if (metodo === 'PUT') {
        if (window.__falhas.has(caminho)) return Promise.resolve(json({ message: 'falha simulada' }, 500));
        const corpo = JSON.parse(opcoes.body);
        const atual = SHAS[caminho] ? caminho + '@' + SHAS[caminho] : null;
        // Sha velho e conflito de versao, como no GitHub: quem chamou rele e refaz.
        if (atual && corpo.sha !== atual) return Promise.resolve(json({ message: 'conflito' }, 409));
        ARQUIVOS[caminho] = de(corpo.content);
        window.__commits.push({ caminho: caminho, mensagem: corpo.message });
        return Promise.resolve(json({ content: { sha: sha(caminho) } }));
      }
    }

    return real(entrada, opcoes);
  };

  const criarReal = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (blob) {
    blob.text().then((t) => window.__baixados.push({ tipo: blob.type, texto: t }));
    return criarReal(blob);
  };
  HTMLAnchorElement.prototype.click = function () { window.__ultimoDownload = this.download; };

  try {
    ${tokens.map((u) => `localStorage.setItem(${JSON.stringify(CONFIG.storageKeys.token + u)}, 'ghp_teste');`).join('\n    ')}
  } catch (e) {}
})();
`;
}

/* ---------------- navegador ---------------- */

export async function abrirNavegador({ cdpPorta = 9333, largura = 1280, altura = 900 } = {}) {
  const navegador = spawn(acharNavegador(), [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + cdpPorta,
    '--user-data-dir=' + join(process.env.TEMP || '/tmp', 'perfil-teste-portaldev-' + cdpPorta),
    '--window-size=' + largura + ',' + altura, 'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try {
      const lista = await (await fetch('http://127.0.0.1:' + cdpPorta + '/json/list')).json();
      const pagina = lista.find((a) => a.type === 'page');
      if (pagina) ws = new WebSocket(pagina.webSocketDebuggerUrl);
    } catch {}
    if (!ws) await new Promise((r) => setTimeout(r, 250));
  }
  if (!ws) { navegador.kill(); throw new Error('o navegador nao respondeu na porta ' + cdpPorta); }
  await new Promise((r) => (ws.onopen = r));

  let seq = 0;
  const pendentes = new Map();
  const excecoes = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      excecoes.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      return;
    }
    if (m.id && pendentes.has(m.id)) {
      const { resolve, reject } = pendentes.get(m.id);
      pendentes.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  };

  const cdp = (method, params) => new Promise((resolve, reject) => {
    const id = ++seq;
    pendentes.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });

  await cdp('Page.enable');
  await cdp('Runtime.enable');

  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  const js = async (expressao) => {
    const r = await cdp('Runtime.evaluate', {
      expression: '(async () => { ' + expressao + ' })()',
      awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'erro no navegador');
    return r.result.value;
  };

  let idInjecao = null;

  return {
    cdp, js, esperar, excecoes,

    /** Troca o script injetado — é como cada suíte semeia a própria fila. */
    async injetar(fonte) {
      if (idInjecao) await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: idInjecao });
      idInjecao = (await cdp('Page.addScriptToEvaluateOnNewDocument', { source: fonte })).identifier;
    },

    async abrir(url) {
      await cdp('Page.navigate', { url });
      await esperar(900);
    },

    /** Espera o seletor aparecer; devolve false se estourar o limite. */
    async ate(seletor, limite = 8000) {
      const fim = Date.now() + limite;
      while (Date.now() < fim) {
        if (await js('return !!document.querySelector(' + JSON.stringify(seletor) + ');')) return true;
        await esperar(150);
      }
      return false;
    },

    /**
     * Entra como a pessoa. O perfil do Chrome sobrevive entre execuções: sem
     * limpar a sessão, o portal já abriria logado e o formulário não existiria.
     */
    async entrarComo(url, usuario, senha) {
      await this.abrir(url);
      if (await js('return !!window.Auth.sessao;')) {
        await js('localStorage.removeItem(' + JSON.stringify(CONFIG.storageKeys.sessao) + ');');
        await cdp('Page.reload', { ignoreCache: true });
        await esperar(1100);
      }
      if (!(await this.ate('#formLogin'))) throw new Error('a tela de login nao apareceu');
      await js(`
        document.getElementById('loginUsuario').value = ${JSON.stringify(usuario)};
        document.getElementById('loginSenha').value = ${JSON.stringify(senha)};
        document.getElementById('formLogin').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      `);
      await esperar(1400);
    },

    async largura(px) {
      await cdp('Emulation.setDeviceMetricsOverride', {
        width: px, height: 1000, deviceScaleFactor: 1, mobile: px < 700,
      });
      await js('window.App.render();');
      await esperar(700);
    },

    async capturar(destino) {
      const tiro = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      writeFileSync(destino, Buffer.from(tiro.data, 'base64'));
    },

    fechar() { ws.close(); navegador.kill(); },
  };
}
