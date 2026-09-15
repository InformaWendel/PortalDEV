/**
 * Fila do roadmap: a captura em Impedimentos, a triagem em #/admin/roadmap e o
 * pacote do OPSView.
 *
 * Rodar:  node testes/fila-do-roadmap.mjs
 */
import { join } from 'node:path';
import { abrirNavegador, conferidor, hashSenha, RAIZ, servirPortal, simulacaoGithub } from './harness.mjs';

const PORTA = 8731;
const SENHA = 'portal-teste-123';
const GESTOR = 'gestor.teste';
const DEV = 'dev.teste';
const ENDERECO = 'http://127.0.0.1:' + PORTA + '/';

const { secao, conferir, registrarFalha, resumo } = conferidor();

const USUARIOS =
  'usuario,nome,papel,senha_hash,ativo\n' +
  GESTOR + ',Gestor de Teste,gestor,' + hashSenha(GESTOR, SENHA) + ',sim\n' +
  DEV + ',Dev de Teste,dev,' + hashSenha(DEV, SENHA) + ',sim\n';

const COLUNAS_FILA =
  'id,usuario,pessoa,modulo,modulo_nome,entregavel,motivo_inicio,motivo_fim,inicio,fim,duracao_min,situacao,criado_em,atualizado_em';

/** Uma linha por caso que interessa: normal, com vírgula e aspas, cancelada, longa. */
const FILA_NOVA = [
  COLUNAS_FILA,
  'imp_a1,' + DEV + ',Dev de Teste,opec,OPEC,"Passa a filtrar proposta por periodo, sem reabrir a tela",Ajuste pedido,Entregue,2026-09-01T09:00,2026-09-01T10:30,90,ativo,2026-09-01T09:00:00.000Z,2026-09-01T10:30:00.000Z',
  'imp_b2,' + DEV + ',Dev de Teste,news,Jornalismo,"Consegue publicar materia agendada e ver o ""status"" dela",Bug,Corrigido,2026-09-02T14:00,2026-09-02T14:40,40,ativo,2026-09-02T14:00:00.000Z,2026-09-02T14:40:00.000Z',
  'imp_c3,' + GESTOR + ',Gestor de Teste,glic,GLic,Renova contrato sem abrir chamado para o suporte,Pedido,Feito,2026-09-03T08:00,2026-09-03T11:00,180,ativo,2026-09-03T08:00:00.000Z,2026-09-03T11:00:00.000Z',
  'imp_d4,' + DEV + ',Dev de Teste,tools,InfoRadioTools,Roda a limpeza de log sem entrar na maquina,Rotina,Feito,2026-09-04T10:00,2026-09-04T10:20,20,cancelado,2026-09-04T10:00:00.000Z,2026-09-04T10:20:00.000Z',
  'imp_e5,' + DEV + ',Dev de Teste,podcast,Podcast,Publica o episodio com a arte certa na primeira tentativa e sem precisar pedir ajuda para o time de producao de conteudo,Erro,Resolvido,2026-09-05T09:00,2026-09-05T12:00,180,ativo,2026-09-05T09:00:00.000Z,2026-09-05T12:00:00.000Z',
].join('\n') + '\n';

const COLUNAS_TRIADA = COLUNAS_FILA + ',titulo,triagem,triagem_por,triagem_em,motivo_recusa,roadmap_key,enviado_em';

/** imp_x1 foi enviada e depois cancelada (órfã); imp_x2 foi editada após a triagem. */
const FILA_TRIADA = [
  COLUNAS_TRIADA,
  'imp_x1,' + DEV + ',Dev de Teste,opec,OPEC,Filtra proposta por periodo,Ajuste,Feito,2026-09-01T09:00,2026-09-01T10:30,90,cancelado,2026-09-01T09:00:00.000Z,2026-09-06T08:00:00.000Z,Filtro de proposta,aprovado,' + GESTOR + ',2026-09-02T10:00:00.000Z,,RMAP-I001,2026-09-03T10:00:00.000Z',
  'imp_x2,' + DEV + ',Dev de Teste,news,Jornalismo,Publica materia agendada,Bug,Corrigido,2026-09-02T14:00,2026-09-02T14:40,40,ativo,2026-09-02T14:00:00.000Z,2026-09-07T09:00:00.000Z,Materia agendada,aprovado,' + GESTOR + ',2026-09-03T10:00:00.000Z,,RMAP-I002,',
  'imp_x3,' + DEV + ',Dev de Teste,glic,GLic,Renova contrato sozinho,Pedido,Feito,2026-09-03T08:00,2026-09-03T11:00,180,ativo,2026-09-03T08:00:00.000Z,2026-09-03T11:00:00.000Z,,,,,,,',
].join('\n') + '\n';

const servidor = await servirPortal(PORTA);
const nav = await abrirNavegador({ cdpPorta: 9333 });
const { js, esperar } = nav;

try {
  /* ---------------- triagem ---------------- */

  await nav.injetar(simulacaoGithub({
    arquivos: { 'data/usuarios.csv': USUARIOS, 'data/roadmap/fila.csv': FILA_NOVA },
    tokens: [GESTOR, DEV],
  }));

  secao('login e a aba nova');
  await nav.entrarComo(ENDERECO, GESTOR, SENHA);
  conferir('gestor entra no portal', (await js('return window.Auth.sessao && window.Auth.sessao.usuario;')) === GESTOR);
  conferir('token reconhecido', await js('return window.Github.temToken();'));
  conferir('Administracao tem 3 abas', (await js('return window.Admin.Telas.abas().length;')) === 3);
  conferir('a terceira leva a #/admin/roadmap', (await js('return window.Admin.Telas.abas()[2].hash;')) === '#/admin/roadmap');

  await js("window.location.hash = '#/admin/roadmap';");
  await esperar(1400);
  conferir('a tela desenha', await js('return !!document.querySelector(\'[data-adm="rmGerar"]\');'));
  conferir('as 5 linhas da fila foram lidas', (await js('return window.Admin.Roadmap.estado.linhas.length;')) === 5);
  conferir('o catalogo de modulos foi lido', (await js('return window.Admin.Roadmap.estado.modulos.length;')) === 28);

  secao('painel de acompanhamento');
  const kpis = await js("return [...document.querySelectorAll('.pd-kpi-valor')].map(e => e.textContent);");
  conferir('4 a triar — a cancelada fica de fora', kpis[0] === '4', 'veio ' + JSON.stringify(kpis));
  conferir('esforco soma so o que conta', kpis[4] === '8 h 10 min', 'veio ' + JSON.stringify(kpis));
  conferir('grafico por modulo desenhou', (await js("return document.querySelectorAll('#admRmGrafModulo svg').length;")) === 1);
  conferir('grafico por pessoa desenhou', (await js("return document.querySelectorAll('#admRmGrafPessoa svg').length;")) === 1);

  secao('aprovar');
  await js('document.querySelector(\'[data-adm="rmAprovar"][data-id="imp_a1"]\').click();');
  await esperar(400);
  const sugerido = await js("return document.getElementById('admRmTitulo').value;");
  conferir('titulo sugerido a partir do entregavel', sugerido.length > 0 && sugerido.length <= 40, 'veio: ' + sugerido);
  const previa = await js("return document.querySelector('.adm-rm-previa-lista').textContent;");
  conferir('a previa mostra o produto do OPSView', previa.includes('OPEC'));
  conferir('a previa mostra ambiente e area', previa.includes('radio_saas'));

  await js(`
    document.getElementById('admRmTitulo').value = 'Filtro de proposta por periodo no OPEC';
    document.getElementById('admFormRoadmap').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  `);
  await esperar(1200);
  const a1 = await js("return window.Admin.Roadmap.estado.linhas.find(l => l.id === 'imp_a1');");
  conferir('linha ficou aprovada', a1.triagem === 'aprovado');
  conferir('chave cunhada sem colidir com as 61 do OPSView', a1.roadmap_key === 'RMAP-I001', 'veio ' + a1.roadmap_key);
  conferir('quem triou ficou registrado', a1.triagem_por === GESTOR);
  conferir('o entregavel original nao foi tocado',
    a1.entregavel === 'Passa a filtrar proposta por periodo, sem reabrir a tela');

  secao('a fila preserva o que e de Impedimentos');
  const filaTexto = await js("return window.__arquivo('data/roadmap/fila.csv');");
  const cabecalho = filaTexto.split('\n')[0].split(',');
  conferir('as 14 colunas originais continuam nas mesmas posicoes',
    cabecalho.slice(0, 14).join(',') === COLUNAS_FILA, 'veio ' + cabecalho.slice(0, 14).join(','));
  conferir('as 7 colunas da triagem entraram depois',
    cabecalho.slice(14).join(',') === 'titulo,triagem,triagem_por,triagem_em,motivo_recusa,roadmap_key,enviado_em',
    'veio ' + cabecalho.slice(14).join(','));
  conferir('escape RFC 4180 preservado nas aspas internas', filaTexto.includes('""status""'));
  conferir('o commit descreve a acao',
    (await js('return window.__commits[window.__commits.length - 1].mensagem;')).includes('aprovada por'));

  secao('segunda aprovacao e uma recusa');
  await js("window.location.hash = '#/admin/roadmap';");
  await esperar(300);
  await js('document.querySelector(\'[data-adm="rmAprovar"][data-id="imp_b2"]\').click();');
  await esperar(400);
  await js(`
    document.getElementById('admRmTitulo').value = 'Publicacao agendada de materia no Jornalismo';
    document.getElementById('admFormRoadmap').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  `);
  await esperar(1200);
  conferir('a segunda chave e a seguinte',
    (await js("return window.Admin.Roadmap.estado.linhas.find(l => l.id === 'imp_b2').roadmap_key;")) === 'RMAP-I002');

  await js('document.querySelector(\'[data-adm="rmRecusar"][data-id="imp_e5"]\').click();');
  await esperar(400);
  await js("document.getElementById('admFormRoadmapRecusa').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));");
  await esperar(500);
  conferir('recusa sem motivo e barrada', await js("return !document.getElementById('admRmErroRecusa').hidden;"));
  await js(`
    document.getElementById('admRmMotivo').value = 'Manutencao de rotina, nao e entrega de roadmap.';
    document.getElementById('admFormRoadmapRecusa').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  `);
  await esperar(1200);
  const e5 = await js("return window.Admin.Roadmap.estado.linhas.find(l => l.id === 'imp_e5');");
  conferir('linha recusada nao ganha chave', e5.triagem === 'recusado' && !e5.roadmap_key);

  secao('linha cancelada');
  await js("window.location.hash = '#/admin/roadmap'; document.querySelector('[data-adm=\"rmFiltro\"][data-filtro=\"cancelado\"]').click();");
  await esperar(400);
  conferir('cancelada nao oferece aprovar',
    !(await js('return !!document.querySelector(\'[data-adm="rmAprovar"][data-id="imp_d4"]\');')));

  secao('pacote do OPSView');
  await js('document.querySelector(\'[data-adm="rmFiltro"][data-filtro="todos"]\').click();');
  await esperar(300);
  await js('document.querySelector(\'[data-adm="rmGerar"]\').click();');
  await esperar(700);
  const baixado = await js('return window.__baixados[window.__baixados.length - 1];');
  conferir('o pacote saiu como JSON', baixado && baixado.tipo.includes('application/json'));
  const pacote = JSON.parse(baixado.texto);
  conferir('envelope e "items", em ingles', Array.isArray(pacote.items));
  conferir('so as 2 aprovadas entraram', pacote.items.length === 2, 'veio ' + pacote.items.length);

  const item = pacote.items.find((i) => i.roadmap_key === 'RMAP-I001');
  conferir('produto casa com o nome ja usado no OPSView', item.produto === 'OPEC');
  conferir('ambiente e area pela frente do modulo', item.ambiente === 'SaaS' && item.area === 'radio_saas');
  conferir('titulo com prefixo de tarefa, sem cunhar MVP',
    item.titulo === 'TarefaInterna - Filtro de proposta por periodo no OPEC');
  conferir('fase entregue e progresso 100', item.fase === 'entregue' && item.progresso === 100);
  conferir('datas em AAAA-MM', item.inicio === '2026-09' && item.fim === '2026-09');
  conferir('responsavel veio da pessoa', item.responsavel === 'Dev de Teste');
  conferir('fim_baseline nunca sai daqui', !('fim_baseline' in item));
  conferir('peso, bloqueada e force ficam com a tela do OPSView',
    !('peso' in item) && !('bloqueada' in item) && !('force' in item));
  conferir('toda chave segue o padrao proprio', pacote.items.every((i) => /^RMAP-I\d{3}$/.test(i.roadmap_key)));

  secao('marcar como enviados');
  conferir('o modal ensina o curl sem seguir redirecionamento',
    await js("return document.querySelector('.adm-rm-comando').textContent.includes('--no-location');"));
  await js('document.querySelector(\'[data-adm="rmMarcarEnviados"]\').click();');
  await esperar(1400);
  conferir('as 2 aprovadas ficaram marcadas',
    (await js('return window.Admin.Roadmap.estado.linhas.filter(l => l.enviado_em).length;')) === 2);
  conferir('nao ha mais nada esperando envio',
    await js('return document.querySelector(\'[data-adm="rmGerar"]\').disabled;'));

  secao('idioma e largura');
  await js("window.I18N.definir('en'); window.App.render();");
  await esperar(500);
  const textoEn = await js("return document.getElementById('vista').textContent;");
  conferir('tela em ingles', textoEn.includes('Roadmap queue') && textoEn.includes('To review'));
  conferir('nenhuma string fixa em pt vazou', !textoEn.includes('A triar') && !textoEn.includes('Aprovar'));

  await js("window.I18N.definir('pt');");
  await nav.largura(400);
  const rolagem = await js('return { doc: document.documentElement.scrollWidth, janela: window.innerWidth };');
  conferir('sem rolagem horizontal em 400px', rolagem.doc <= rolagem.janela + 1, JSON.stringify(rolagem));
  await nav.largura(1280);

  /* ---------------- acesso, orfa e capturas ---------------- */

  await nav.injetar(simulacaoGithub({
    arquivos: { 'data/usuarios.csv': USUARIOS, 'data/roadmap/fila.csv': FILA_TRIADA },
    tokens: [GESTOR, DEV],
  }));

  secao('a tela e so de quem administra');
  await nav.entrarComo(ENDERECO, DEV, SENHA);
  conferir('dev entrou', (await js('return window.Auth.sessao.usuario;')) === DEV);
  conferir('dev nao tem admin.usuarios', !(await js("return window.Acesso.pode('admin.usuarios');")));
  conferir('Administracao fechada para o dev', !(await js('return window.Admin.Telas.permitido();')));
  await js("window.location.hash = '#/admin/roadmap';");
  await esperar(900);
  conferir('dev em #/admin/roadmap ve "sem acesso", nao a fila',
    await js('return !document.querySelector(\'[data-adm="rmGerar"]\') && !!document.querySelector(\'.pd-sem-acesso\');'));
  conferir('nenhuma linha da fila foi carregada para o dev',
    (await js('return window.Admin.Roadmap.estado.linhas.length;')) === 0);
  conferir('o menu nao oferece Administracao ao dev',
    !(await js("return [...document.querySelectorAll('.pd-ferramentas-nav a')].some(a => (a.getAttribute('href') || '').indexOf('#/admin') === 0);")));

  secao('item orfao e linha editada depois da triagem');
  await nav.entrarComo(ENDERECO, GESTOR, SENHA);
  await js("window.location.hash = '#/admin/roadmap';");
  await esperar(1500);
  conferir('aviso de item enviado e depois cancelado', await js("return !!document.querySelector('.pd-aviso-alerta');"));
  const aviso = await js("return document.querySelector('.pd-aviso-alerta').textContent;");
  conferir('o aviso diz que o conserto e na tela do OPSView', aviso.includes('OPSView'), aviso.slice(0, 140));
  await js('document.querySelector(\'[data-adm="rmFiltro"][data-filtro="todos"]\').click();');
  await esperar(400);
  conferir('selo "Editado apos a triagem" na linha alterada',
    await js("return document.getElementById('vista').textContent.includes('Editado após a triagem');"));
  conferir('a orfa nao entra no proximo pacote',
    (await js('return document.querySelector(\'[data-adm="rmGerar"]\').textContent;')).includes('(1)'));

  secao('capturas');
  for (const [nome, px] of [['fila-do-roadmap-1280', 1280], ['fila-do-roadmap-400', 400]]) {
    await nav.largura(px);
    await nav.capturar(join(RAIZ, 'testes', nome + '.png'));
    console.log('  gravado  testes/' + nome + '.png');
  }

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
