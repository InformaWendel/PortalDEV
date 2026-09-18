/**
 * Portal QA no formato do plano executável: seções com preparação, passos, resultado
 * esperado e a conferência do QA (verificado, o que foi testado, possível falha).
 *
 * Rodar:  node testes/qa-plano.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { abrirNavegador, conferidor, hashSenha, RAIZ, servirPortal, simulacaoGithub } from './harness.mjs';

const PORTA = 8739;
const SENHA = 'portal-teste-123';
const QA = 'qa.teste';
const CONSULTA = 'consulta.teste';
const ENDERECO = 'http://127.0.0.1:' + PORTA + '/';
const AUDIENCE = 'data/projetos/audience.csv';
const LEGADO = 'data/projetos/legado.csv';
const PROJETOS = ['news', 'editor', 'voicetracker', 'audience'];

const { secao, conferir, registrarFalha, resumo } = conferidor();

const USUARIOS =
  'usuario,nome,papel,senha_hash,ativo\n' +
  QA + ',QA de Teste,qa,' + hashSenha(QA, SENHA) + ',sim\n' +
  CONSULTA + ',Consulta de Teste,consulta,' + hashSenha(CONSULTA, SENHA) + ',sim\n';

/** Os papéis do repositório e um que só consulta o QA. */
const PAPEIS = readFileSync(join(RAIZ, 'data/papeis.csv'), 'utf8') + 'consulta,Consulta,Viewer,qa.consultar\n';

/** Um projeto a mais, com catálogo ainda nas 19 colunas de antes da conferência. */
const PROJETOS_CSV =
  readFileSync(join(RAIZ, 'data/projetos.csv'), 'utf8') +
  'legado,Legado,Teste,Catalogo antigo,Old catalog,' + LEGADO + ',sim\n';

const OBS_LEGADO = 'Obs com vírgula, "aspas"\ne quebra';
const CATALOGO_LEGADO =
  'id,modulo,rota,stub,uc,rf,prioridade,tipo,titulo_pt,titulo_en,criterio_pt,criterio_en,status,testado_por,data_teste,devolucoes,ultima_devolucao,referencia,observacoes\n' +
  'QA-LEG-01,leg-geral,/x,,,,alta,funcional,Caso antigo,Old case,Critério antigo,Old criterion,liberada,Fulano,2026-09-01,0,,,"' +
  OBS_LEGADO.replace(/"/g, '""') + '"\n' +
  'QA-LEG-02,leg-geral,,,,,media,funcional,Outro caso,Other case,Outro critério,Other criterion,nao_testado,,,0,,,\n';

const servidor = await servirPortal(PORTA);
const nav = await abrirNavegador({ cdpPorta: 9339 });
const { js, esperar } = nav;

/* ---------------- ajudantes ---------------- */

const q = JSON.stringify;

/** Linha do arquivo como está na simulação do GitHub — o que foi de fato gravado. */
const linhaGravada = (caminho, id) =>
  js('const t = window.__arquivo(' + q(caminho) + '); if (!t) return null;' +
    'return window.CSV.parse(t).linhas.filter(function (l) { return l.id === ' + q(id) + '; })[0] || null;');

const commits = (caminho) => js('return window.__commits.filter(c => c.caminho === ' + q(caminho) + ');');

/** Espera o commit número `n` daquele arquivo sair; devolve a lista. */
async function esperarCommit(caminho, n, limite = 7000) {
  const fim = Date.now() + limite;
  while (Date.now() < fim) {
    const lista = await commits(caminho);
    if (lista.length >= n && !(await js('return window.QA.Store.temPendencias();'))) return lista;
    await esperar(200);
  }
  return commits(caminho);
}

const digitar = (seletor, texto) => js(
  'const e = document.querySelector(' + q(seletor) + '); if (!e) return false; e.focus();' +
  'e.value = ' + q(texto) + "; e.dispatchEvent(new Event('input', { bubbles: true })); return true;");

const marcar = (seletor, valor) => js(
  'const e = document.querySelector(' + q(seletor) + '); if (!e) return false;' +
  'e.checked = ' + q(valor) + "; e.dispatchEvent(new Event('change', { bubbles: true })); return true;");

const escolher = (seletor, valor) => js(
  'const e = document.querySelector(' + q(seletor) + '); if (!e) return false;' +
  'e.value = ' + q(valor) + "; e.dispatchEvent(new Event('change', { bubbles: true })); return true;");

const situacaoDe = (id) => 'tbody[data-caso="' + id + '"] select[data-qa-campo="status"]';
const caixaDe = (id) => '#qa-verificado-' + id;

async function irPara(hash, seletor) {
  await js('window.location.hash = ' + q(hash) + ';');
  await esperar(500);
  for (let i = 0; i < 40; i++) {
    if (await js('return !!window.QA.Store.estado.carregado;')) break;
    await esperar(200);
  }
  return seletor ? nav.ate(seletor) : true;
}

const hoje = () => js("const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');");

try {
  await nav.injetar(simulacaoGithub({
    arquivos: {
      'data/usuarios.csv': USUARIOS,
      'data/papeis.csv': PAPEIS,
      'data/projetos.csv': PROJETOS_CSV,
      [LEGADO]: CATALOGO_LEGADO,
    },
    tokens: [QA, CONSULTA],
  }));
  await nav.entrarComo(ENDERECO, QA, SENHA);

  /* ---------------- estrutura ---------------- */

  secao('todos os catalogos na estrutura nova');
  await irPara('#/qa', '.pd-projeto');
  for (const p of PROJETOS) {
    conferir(p + ': colunas na ordem padrao', await js(
      "const c = window.QA.Store.estado.catalogos['" + p + "'].colunas;" +
      'return c.join() === window.QA.Store.colunas.join();'));
    // Senão o primeiro registro gera um diff falso no catálogo inteiro.
    conferir(p + ': exportar sem editar devolve o arquivo identico', await js(
      "return window.QA.Store.exportarCsv('" + p + "') === window.__arquivo('data/projetos/" + p + ".csv');"));
    conferir(p + ': todo caso tem cenario e resultado nos dois idiomas', await js(
      "return window.QA.Store.casos('" + p + "').every(function (c) {" +
      '  return c.titulo_pt && c.titulo_en && c.criterio_pt && c.criterio_en; });'));
    conferir(p + ': todo modulo tem nome', await js(
      "return window.QA.Store.casos('" + p + "').every(function (c) { return !!window.QA.Textos.modulos[c.modulo]; });"));
  }
  conferir('passos do plano do QA nos dois idiomas', await js(
    "const doPlano = window.QA.Store.casos('audience').filter(function (c) { return /^QA-\\d{3}$/.test(c.id); });" +
    'return doPlano.length === 83 && doPlano.every(function (c) { return c.passos_pt && c.passos_en; });'));
  conferir('secoes do Audience com preparacao nos dois idiomas', await js(
    "const mods = window.QA.Store.casos('audience').map(function (c) { return c.modulo; });" +
    'return mods.every(function (m) { const p = window.QA.Textos.modulos[m].preparo; return p && p.pt && p.en; });'));

  /* ---------------- o plano na tela ---------------- */

  secao('plano executavel do Audience');
  conferir('a tela de casos desenha as secoes', await irPara('#/qa/p/audience/casos', '.pd-exec-secao'));
  const estrutura = await js(`
    const casos = window.QA.Store.casos('audience');
    const modulos = casos.map(function (c) { return c.modulo; }).filter(function (m, i, a) { return a.indexOf(m) === i; });
    return {
      secoes: document.querySelectorAll('.pd-exec-secao').length, esperadas: modulos.length,
      casos: document.querySelectorAll('#vista tbody[data-caso]').length, esperados: casos.length,
      primeira: document.querySelector('.pd-exec-secao-titulo span').textContent,
      preparo: document.querySelector('.pd-exec-preparo').textContent,
      sumario: document.querySelectorAll('.pd-exec-sumario [data-qa="irSecao"]').length,
      passos: document.querySelector('tbody[data-caso="QA-001"] .pd-exec-texto').textContent,
    };`);
  conferir('uma secao por modulo', estrutura.secoes === estrutura.esperadas && estrutura.secoes === 11, JSON.stringify(estrutura));
  conferir('todos os casos na tela', estrutura.casos === estrutura.esperados);
  conferir('a ordem e a do plano', estrutura.primeira === '1. Acesso, configuração e cadastros básicos', estrutura.primeira);
  conferir('a secao traz a preparacao', estrutura.preparo.includes('Usar o frontend Angular'));
  conferir('o sumario lista as secoes', estrutura.sumario === estrutura.secoes);
  conferir('o caso traz os passos', estrutura.passos.includes('trocar A → B → A'));

  conferir('progresso bate com o catalogo', await js(`
    const m = window.QA.Store.metricas(window.QA.Store.casos('audience'));
    return document.getElementById('qaProgresso').textContent === m.verificados + ' de ' + m.consideraveis + ' casos verificados' &&
      document.getElementById('qaFalhas').textContent === m.comFalha + ' com falha registrada' && m.verificados > 0 && m.comFalha > 0;`));
  conferir('faixa ambar em caso com falha registrada', await js(
    "return document.querySelector('tbody[data-caso=\"QA-021\"]').classList.contains('pd-exec-falha');"));
  conferir('faixa verde em verificado sem falha', await js(
    "return document.querySelector('tbody[data-caso=\"QA-007\"]').classList.contains('pd-exec-ok');"));
  conferir('anotacao aparece exatamente como gravada', await js(`
    return ['QA-014', 'QA-021', 'QA-038'].every(function (id) {
      const c = window.QA.Store.caso('audience', id);
      return document.getElementById('qa-execucao-' + id).value === c.execucao &&
        document.getElementById('qa-falha-' + id).value === c.falha;
    });`));
  conferir('caso do catalogo anterior sem passos mostra o aviso', await js(
    "return document.querySelector('tbody[data-caso=\"QA-AUD-01\"] .pd-exec-texto').textContent === 'Passos a detalhar';"));

  await js("document.querySelector('[data-qa=\"irSecao\"][data-modulo=\"aud-privacidade\"]').click();");
  await esperar(900);
  conferir('o sumario leva a secao sem mexer na rota', await js(
    "return window.scrollY > 0 && window.location.hash === '#/qa/p/audience/casos';"));
  await js('window.scrollTo(0, 0);');

  await escolher('#fVerificacao', 'com_falha');
  await esperar(200);
  conferir('filtro de verificacao: so os com falha', await js(`
    const ids = [...document.querySelectorAll('#vista tbody[data-caso]')].map(function (e) { return e.getAttribute('data-caso'); });
    return ids.length > 0 && ids.every(function (id) { return window.QA.Store.temFalha(window.QA.Store.caso('audience', id)); });`));
  await escolher('#fVerificacao', '');
  await digitar('#fBusca', 'Instagram');
  await esperar(200);
  conferir('a busca olha passos e anotacoes', await js(
    "return !!document.querySelector('tbody[data-caso=\"QA-026\"]') && !!document.querySelector('tbody[data-caso=\"QA-021\"]');"));
  await js("document.querySelector('[data-qa=\"limparFiltros\"]').click();");
  await esperar(300);

  /* ---------------- conferência pelo plano ---------------- */

  secao('conferencia pelo plano grava no repositorio');
  const original = await js('return window.__arquivo(' + q(AUDIENCE) + ');');
  const antes = (await commits(AUDIENCE)).length;

  await marcar(caixaDe('QA-001'), true);
  conferir('marcar um nao testado o poe em teste', await js('return document.querySelector(' + q(situacaoDe('QA-001')) + ').value;') === 'em_teste');
  conferir('e assina com quem esta logado', (await js(
    "return document.querySelector('tbody[data-caso=\"QA-001\"] .pd-exec-assinatura').textContent;")).includes('QA de Teste'));
  conferir('o contador da secao sobe', await js(`
    const m = window.QA.Store.metricas(window.QA.Store.casos('audience').filter(function (c) { return c.modulo === 'aud-acesso'; }));
    return document.querySelector('.pd-exec-secao [data-cont="aud-acesso"]').textContent === m.verificados + '/' + m.consideraveis;`));
  let lista = await esperarCommit(AUDIENCE, antes + 1);
  conferir('virou commit', lista.length === antes + 1 && lista[lista.length - 1].mensagem.includes('QA-001'),
    JSON.stringify(lista.slice(antes)));
  let linha = await linhaGravada(AUDIENCE, 'QA-001');
  const dia = await hoje();
  conferir('o arquivo tem verificado, situacao, autor e data',
    linha && linha.verificado === 'sim' && linha.status === 'em_teste' && linha.testado_por === 'QA de Teste' && linha.data_teste === dia,
    JSON.stringify(linha));

  const TEXTO = 'Homolog, massa "A";\nevidência: print 1, print 2';
  await digitar('#qa-execucao-QA-001', TEXTO);
  await digitar('#qa-falha-QA-001', 'Erro 500 às 10:32');
  conferir('falha acende a faixa ambar na hora', await js(
    "return document.querySelector('tbody[data-caso=\"QA-001\"]').classList.contains('pd-exec-falha');"));
  lista = await esperarCommit(AUDIENCE, antes + 2);
  linha = await linhaGravada(AUDIENCE, 'QA-001');
  conferir('o que foi testado grava com virgula, aspas e quebra de linha', linha && linha.execucao === TEXTO, JSON.stringify(linha && linha.execucao));
  conferir('o CSV escapa em RFC 4180', (await js('return window.__arquivo(' + q(AUDIENCE) + ');')).includes('"Homolog, massa ""A"";\nevidência: print 1, print 2"'));
  conferir('a falha grava', linha && linha.falha === 'Erro 500 às 10:32');

  await escolher(situacaoDe('QA-001'), 'liberada');
  conferir('liberar mantem verificado', await js('return document.querySelector(' + q(caixaDe('QA-001')) + ').checked;'));
  await escolher(situacaoDe('QA-001'), 'nao_testado');
  conferir('voltar a nao testado desmarca', !(await js('return document.querySelector(' + q(caixaDe('QA-001')) + ').checked;')));
  await escolher(situacaoDe('QA-001'), 'devolvida');
  conferir('devolver marca verificado', await js('return document.querySelector(' + q(caixaDe('QA-001')) + ').checked;'));
  conferir('e conta a volta', (await js(
    "return document.querySelector('tbody[data-caso=\"QA-001\"] .pd-exec-assinatura').textContent;")).includes('↻ 1'));

  await digitar('#qa-execucao-QA-002', 'Perfil leitura, sem escrita');
  conferir('anotar num nao testado tambem o poe em teste', await js('return document.querySelector(' + q(situacaoDe('QA-002')) + ').value;') === 'em_teste');
  conferir('sem marcar verificado', !(await js('return document.querySelector(' + q(caixaDe('QA-002')) + ').checked;')));

  lista = await esperarCommit(AUDIENCE, antes + 3);
  linha = await linhaGravada(AUDIENCE, 'QA-001');
  conferir('devolvida grava verificado e a volta', linha && linha.status === 'devolvida' && linha.verificado === 'sim' && linha.devolucoes === '1',
    JSON.stringify(linha));
  conferir('os outros casos saem identicos', await js(`
    const antes = window.CSV.parse(${q(original)}).linhas;
    const depois = window.CSV.parse(window.__arquivo(${q(AUDIENCE)})).linhas;
    return antes.length === depois.length && antes.every(function (l, i) {
      if (l.id === 'QA-001' || l.id === 'QA-002') return true;
      return Object.keys(l).every(function (k) { return depois[i][k] === l[k]; });
    });`));

  secao('conflito com o colega preserva o que ele gravou');
  const antesConflito = (await commits(AUDIENCE)).length;
  await js(`
    const r = window.CSV.parse(window.__arquivo(${q(AUDIENCE)}));
    r.linhas.forEach(function (l) { if (l.id === 'QA-005') l.execucao = 'Gravado pelo colega'; });
    window.__semear(${q(AUDIENCE)}, window.CSV.serialize(r.linhas, r.colunas));`);
  await digitar('#qa-execucao-QA-003', 'Meu teste de isolamento');
  await esperarCommit(AUDIENCE, antesConflito + 1);
  const colega = await linhaGravada(AUDIENCE, 'QA-005');
  const meu = await linhaGravada(AUDIENCE, 'QA-003');
  conferir('a gravacao do colega ficou', colega && colega.execucao === 'Gravado pelo colega');
  conferir('a minha tambem', meu && meu.execucao === 'Meu teste de isolamento' && meu.status === 'em_teste');

  /* ---------------- gaveta ---------------- */

  secao('gaveta de detalhes');
  await js("document.querySelector('.pd-exec-rodape [data-qa=\"detalhe\"][data-id=\"QA-004\"]').click();");
  await esperar(300);
  const gaveta = await js(`return {
    aberta: document.getElementById('gaveta').classList.contains('pd-aberto'),
    texto: document.getElementById('gavetaCorpo').textContent,
    caixa: !!document.getElementById('eVerificado'),
  };`);
  conferir('abre pelo botao Detalhes', gaveta.aberta);
  conferir('mostra preparacao, passos e resultado esperado',
    gaveta.texto.includes('Preparar perfis com e sem cada privilégio') && gaveta.texto.includes('Alterar campos obrigatórios de ouvinte') &&
    gaveta.texto.includes('Valores válidos persistem'));
  conferir('mostra o rastro do catalogo anterior', (await js("return document.getElementById('eReferencia').value;")).includes('QA-AUD-123'));
  await digitar('#eFalha', 'Falha pela gaveta');
  conferir('anotar na gaveta nao tira o cursor', (await js('return document.activeElement && document.activeElement.id;')) === 'eFalha');
  conferir('a gaveta acompanha a situacao', (await js("return document.getElementById('eStatus').value;")) === 'em_teste');
  conferir('o plano atras recebe a anotacao', (await js("return document.getElementById('qa-falha-QA-004').value;")) === 'Falha pela gaveta');
  await marcar('#eVerificado', true);
  conferir('verificado pela gaveta aparece no plano', await js('return document.querySelector(' + q(caixaDe('QA-004')) + ').checked;'));
  await js("document.getElementById('btnFecharGaveta').click();");
  // Bem antes do atraso de gravação: se chegou, foi o fechar que mandou.
  await esperar(600);
  linha = await linhaGravada(AUDIENCE, 'QA-004');
  conferir('fechar a gaveta grava na hora', linha && linha.falha === 'Falha pela gaveta' && linha.verificado === 'sim', JSON.stringify(linha));

  /* ---------------- catálogo antigo ---------------- */

  secao('catalogo de antes ganha as colunas na primeira gravacao');
  await irPara('#/qa/p/legado/casos', 'tbody[data-caso="QA-LEG-01"]');
  conferir('caso sem passos avisa', (await js(
    "return document.querySelector('tbody[data-caso=\"QA-LEG-01\"] .pd-exec-texto').textContent;")) === 'Passos a detalhar');
  conferir('liberado e assinado conta como verificado', await js('return document.querySelector(' + q(caixaDe('QA-LEG-01')) + ').checked;'));
  conferir('nao testado nao', !(await js('return document.querySelector(' + q(caixaDe('QA-LEG-02')) + ').checked;')));
  await marcar(caixaDe('QA-LEG-02'), true);
  await esperarCommit(LEGADO, 1);
  const legado = await js('return window.CSV.parse(window.__arquivo(' + q(LEGADO) + '));');
  conferir('o arquivo ganhou as colunas novas', legado.colunas.join() === (await js('return window.QA.Store.colunas.join();')), legado.colunas.join());
  const leg1 = legado.linhas.find((l) => l.id === 'QA-LEG-01');
  const leg2 = legado.linhas.find((l) => l.id === 'QA-LEG-02');
  conferir('observacao com virgula, aspas e quebra intacta', leg1 && leg1.observacoes === OBS_LEGADO, JSON.stringify(leg1 && leg1.observacoes));
  conferir('o liberado de antes grava verificado', leg1 && leg1.verificado === 'sim' && leg1.status === 'liberada' && leg1.testado_por === 'Fulano');
  conferir('o marcado agora grava em teste', leg2 && leg2.verificado === 'sim' && leg2.status === 'em_teste');

  /* ---------------- painel ---------------- */

  secao('painel e visao geral');
  await irPara('#/qa/p/audience', '.pd-kpi');
  conferir('o painel abre com os verificados', (await js("return document.querySelector('.pd-kpi-rotulo').textContent;")) === 'Verificados pelo QA');
  await irPara('#/qa', '.pd-projeto');
  conferir('visao geral lista os projetos', (await js('return document.querySelectorAll(".pd-projeto").length;')) === PROJETOS.length + 1);

  /* ---------------- quem só consulta ---------------- */

  secao('quem so consulta ve o plano sem editar');
  await nav.entrarComo(ENDERECO, CONSULTA, SENHA);
  await irPara('#/qa/p/audience/casos', '.pd-exec-secao');
  const consulta = await js(`return {
    campos: document.querySelectorAll('#vista textarea, #vista input[type="checkbox"], #vista select[data-qa-campo]').length,
    lidos: document.querySelectorAll('#vista .pd-exec-lido').length,
    aviso: (document.querySelector('#vista .pd-nota') || {}).textContent || '',
    falha: document.querySelector('tbody[data-caso="QA-021"] .pd-exec-lido-falha') ? document.querySelector('tbody[data-caso="QA-021"] .pd-exec-lido-falha').textContent : '',
  };`);
  conferir('nenhum campo editavel', consulta.campos === 0, String(consulta.campos));
  conferir('as anotacoes aparecem como texto', consulta.lidos > 0);
  conferir('o aviso diz por que', consulta.aviso.includes('consultar'));
  conferir('a falha registrada aparece destacada', consulta.falha.includes('Instagram'));

  /* ---------------- inglês e tela estreita ---------------- */

  secao('ingles');
  await js("window.I18N.definir('en'); window.App.render();");
  await esperar(400);
  const ingles = await js(`return {
    cabecalho: [...document.querySelectorAll('.pd-exec-tabela thead th')].slice(0, 5).map(function (e) { return e.textContent; }),
    secao: document.querySelector('.pd-exec-secao-titulo span').textContent,
    passos: document.querySelector('tbody[data-caso="QA-001"] .pd-exec-texto').textContent,
    semPassos: document.querySelector('tbody[data-caso="QA-AUD-01"] .pd-exec-texto').textContent,
    progresso: document.getElementById('qaProgresso').textContent,
  };`);
  conferir('cabecalho em ingles', ingles.cabecalho.join('|') === 'ID|Prio.|Scenario|Steps|Expected result', ingles.cabecalho.join('|'));
  conferir('a prioridade abreviada diz o nome inteiro', (await js(
    "return document.querySelector('.pd-exec-tabela thead abbr').title;")) === 'Priority');
  conferir('secao em ingles', ingles.secao === '1. Access, configuration and basic records', ingles.secao);
  conferir('passos em ingles', ingles.passos.startsWith('Sign in with an authorized operator'));
  conferir('aviso de passos em ingles', ingles.semPassos === 'Steps to be written');
  conferir('progresso em ingles', / of \d+ cases verified$/.test(ingles.progresso), ingles.progresso);
  const faltando = await js(`
    const lista = ['exec.progresso', 'exec.falhas', 'exec.sumario', 'exec.contagemSecao', 'exec.conferencia', 'exec.verificado',
      'exec.naoVerificado', 'exec.execucao', 'exec.execucaoAjuda', 'exec.falha', 'exec.falhaAjuda', 'exec.semPassos',
      'exec.semAnotacao', 'exec.detalhes', 'tabela.cenario', 'tabela.passos', 'tabela.resultado', 'filtro.verificacao',
      'filtro.verificados', 'filtro.naoVerificados', 'filtro.comFalha', 'detalhe.preparo', 'detalhe.passos', 'detalhe.verificacao',
      'kpi.verificados', 'kpi.verificadosAjuda', 'guia.camposH', 'guia.camposCenario', 'guia.camposPassos', 'guia.camposResultado',
      'guia.camposVerificado', 'guia.camposExecucao', 'guia.camposFalha', 'guia.metricasVerificados'].map(function (k) { return 'qa.' + k; });
    window.I18N.definir('pt');
    const emPt = lista.map(function (k) { return window.I18N.t(k); });
    window.I18N.definir('en');
    const faltam = [];
    lista.forEach(function (k, i) {
      if (emPt[i] === k) faltam.push('pt:' + k);
      if (window.I18N.t(k) === emPt[i]) faltam.push('en:' + k);
    });
    return faltam;`);
  conferir('nenhuma chave nova sem traducao', faltando.length === 0, faltando.join(', '));
  await js("window.I18N.definir('pt'); window.App.render();");
  await esperar(400);

  secao('telas');
  // Uma seção só: a página com o plano inteiro passa da altura que a captura aguenta.
  await nav.entrarComo(ENDERECO, QA, SENHA);
  await irPara('#/qa/p/audience/casos', '.pd-exec-secao');
  await escolher('#fModulo', 'aud-ouvintes');
  await esperar(300);
  await nav.largura(1280);
  await nav.capturar(join(RAIZ, 'testes', 'qa-plano-1280.png'));
  console.log('  gravado  testes/qa-plano-1280.png');
  await nav.largura(400);
  const estreita = await js(`return {
    rolagem: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cartao: getComputedStyle(document.querySelector('tbody[data-caso]')).display,
  };`);
  conferir('400px sem rolagem horizontal', estreita.rolagem <= 0, 'sobra ' + estreita.rolagem + 'px');
  conferir('em tela estreita cada caso vira cartao', estreita.cartao === 'block');
  await nav.capturar(join(RAIZ, 'testes', 'qa-plano-400.png'));
  console.log('  gravado  testes/qa-plano-400.png');

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
