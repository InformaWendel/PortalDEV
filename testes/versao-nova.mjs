/**
 * Aviso de versão nova: a página aberta percebe que o site publicado mudou, e só isso
 * acende o aviso — dado novo, erro de rede e 5xx não.
 *
 * Rodar:  node testes/versao-nova.mjs
 */
import { join } from 'node:path';
import { abrirNavegador, conferidor, hashSenha, RAIZ, servirPortal, simulacaoGithub } from './harness.mjs';

const PORTA = 8735;
const SENHA = 'portal-teste-123';
const GESTOR = 'gestor.teste';
const ENDERECO = 'http://127.0.0.1:' + PORTA + '/';
const BOTAO = '#banners [data-acao="recarregarPagina"]';

const { secao, conferir, registrarFalha, resumo } = conferidor();

const USUARIOS =
  'usuario,nome,papel,senha_hash,ativo\n' +
  GESTOR + ',Gestor de Teste,gestor,' + hashSenha(GESTOR, SENHA) + ',sim\n';

const servidor = await servirPortal(PORTA);
const nav = await abrirNavegador({ cdpPorta: 9337 });
const { js, esperar } = nav;

const temAviso = () => js('return !!document.querySelector(' + JSON.stringify(BOTAO) + ');');
const conferirVersao = () => js('return await window.Versao.conferir();');
const textoDosAvisos = () => js("return document.getElementById('banners').textContent;");

/** A assinatura da versão que está rodando sai logo depois de a página carregar. */
async function basePronta() {
  for (let i = 0; i < 40; i++) {
    if (await js('return !!window.Versao && window.Versao.pronta();')) return true;
    await esperar(200);
  }
  return false;
}

try {
  await nav.injetar(simulacaoGithub({ arquivos: { 'data/usuarios.csv': USUARIOS }, tokens: [GESTOR] }));
  await nav.entrarComo(ENDERECO, GESTOR, SENHA);

  secao('nada mudou, nada aparece');
  conferir('a versao que esta rodando foi assinada', await basePronta());
  conferir('conferir sem mudanca devolve falso', (await conferirVersao()) === false);
  conferir('sem aviso', !(await temAviso()));

  secao('commit so de dados nao acende');
  await js("window.__sobrescritas['data/roadmap/fila.csv'] = 'dado novo';");
  await js("window.__sobrescritas['data/usuarios.csv'] = 'dado novo';");
  conferir('fila e cadastro mudando nao sao versao nova', (await conferirVersao()) === false);
  conferir('continua sem aviso', !(await temAviso()));

  secao('erro de rede e 5xx nao acendem');
  await js("window.__sobrescritas['assets/js/app.js'] = { status: 503 };");
  conferir('503 num script nao afirma nada', (await conferirVersao()) === false);
  conferir('sem aviso falso', !(await temAviso()));
  await js("delete window.__sobrescritas['assets/js/app.js'];");

  secao('script publicado mudou');
  await js("window.__sobrescritas['assets/js/app.js'] = '/* versao nova */';");
  conferir('conferir percebe a versao nova', (await conferirVersao()) === true);
  conferir('o aviso com Recarregar apareceu', await temAviso());
  conferir('o estado fica marcado', await js('return window.Versao.desatualizada();'));
  conferir('o aviso vem antes dos outros',
    await js("const primeiro = document.querySelector('#banners .pd-aviso'); return !!primeiro && !!primeiro.querySelector('[data-acao=\"recarregarPagina\"]');"));
  await nav.capturar(join(RAIZ, 'testes', 'versao-nova.png'));
  console.log('  gravado  testes/versao-nova.png');

  await js("window.I18N.definir('en'); window.App.render();");
  await esperar(300);
  conferir('aviso em ingles', (await textoDosAvisos()).includes('A new version of the portal is out'));
  await js("window.I18N.definir('pt'); window.App.render();");
  await esperar(300);
  conferir('aviso em portugues', (await textoDosAvisos()).includes('Saiu uma versão nova do portal'));

  secao('recarregar resolve');
  // O clique recarrega a página: disparado depois, para a avaliação não morrer junto.
  await js('setTimeout(function () { document.querySelector(' + JSON.stringify(BOTAO) + ').click(); }, 50); return true;');
  await esperar(2000);
  conferir('a pagina recarregou com a sessao', await js('return !!window.Auth && !!window.Auth.sessao;'));
  conferir('a nova base foi assinada', await basePronta());
  conferir('depois de recarregar nao ha aviso',
    !(await temAviso()) && !(await js('return window.Versao.desatualizada();')));

  secao('arquivo que sumiu no deploy acende');
  await js("window.__ausentes.add('assets/js/graficos.js');");
  conferir('script que deixou de existir e versao nova', (await conferirVersao()) === true);

  secao('textos nos dois idiomas');
  const faltando = await js(`
    const chaves = ['banner.versaoTitulo', 'banner.versaoAjuda', 'acao.recarregar'];
    window.I18N.definir('pt');
    const emPt = chaves.map(function (k) { return window.I18N.t(k); });
    window.I18N.definir('en');
    const faltam = [];
    chaves.forEach(function (k, i) {
      if (emPt[i] === k) faltam.push('pt:' + k);
      if (window.I18N.t(k) === emPt[i]) faltam.push('en:' + k);
    });
    window.I18N.definir('pt');
    return faltam;
  `);
  conferir('nenhuma chave sem traducao', faltando.length === 0, faltando.join(', '));

  secao('console limpo');
  conferir('nenhuma excecao no navegador', nav.excecoes.length === 0, nav.excecoes.join('\n           '));
} catch (e) {
  registrarFalha('erro fatal: ' + e.message);
  console.log('\n  ERRO FATAL  ' + e.message + '\n' + (e.stack || ''));
} finally {
  nav.fechar();
  servidor.close();
}

process.exit(resumo() ? 1 : 0);
