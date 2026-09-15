/**
 * O lado de quem registra: o que acontece com a fila do roadmap quando o catálogo não
 * carrega, quando a gravação da fila falha, e quando a linha ficou só em memória.
 *
 * Rodar:  node testes/captura-no-impedimento.mjs
 */
import { join } from 'node:path';
import { abrirNavegador, conferidor, hashSenha, RAIZ, servirPortal, simulacaoGithub } from './harness.mjs';

const PORTA = 8733;
const SENHA = 'portal-teste-123';
const DEV = 'dev.teste';
const ENDERECO = 'http://127.0.0.1:' + PORTA + '/';
const FILA = 'data/roadmap/fila.csv';
const MODULOS = 'data/roadmap/modulos.csv';
const CSV_DEV = 'data/impedimentos/' + DEV + '.csv';

const { secao, conferir, registrarFalha, resumo } = conferidor();

const USUARIOS =
  'usuario,nome,papel,senha_hash,ativo\n' +
  DEV + ',Dev de Teste,dev,' + hashSenha(DEV, SENHA) + ',sim\n';

const COLUNAS_ANTIGAS = 'id,usuario,inicio,motivo_inicio,fim,motivo_fim,duracao_min,status,criado_em,atualizado_em';
const COLUNAS_NOVAS = COLUNAS_ANTIGAS + ',modulo,entregavel';
const COLUNAS_FILA =
  'id,usuario,pessoa,modulo,modulo_nome,entregavel,motivo_inicio,motivo_fim,inicio,fim,duracao_min,situacao,criado_em,atualizado_em';
const COLUNAS_FILA_TRIADA = COLUNAS_FILA + ',titulo,triagem,triagem_por,triagem_em,motivo_recusa,roadmap_key,enviado_em';

/** O formato de antes da fila: 10 colunas, com vírgula e quebra de linha num motivo. */
const CSV_ANTIGO =
  COLUNAS_ANTIGAS + '\n' +
  'imp_velho,' + DEV + ',2026-09-10T09:00,"Reuniao, nao planejada",2026-09-10T09:45,"Resolvido\nem duas linhas",45,finalizado,2026-09-10T09:00:00.000Z,2026-09-10T09:45:00.000Z\n';

const servidor = await servirPortal(PORTA);
const nav = await abrirNavegador({ cdpPorta: 9335 });
const { js, esperar } = nav;

const commitsEm = (caminho) =>
  js('return window.__commits.filter(c => c.caminho === ' + JSON.stringify(caminho) + ').length;');

const lerCsv = (caminho) =>
  js('const texto = window.__arquivo(' + JSON.stringify(caminho) + ');' +
    'return texto === undefined ? null : Object.assign({ texto: texto }, window.CSV.parse(texto));');

const enviar = (idForm) =>
  js('document.getElementById(' + JSON.stringify(idForm) + ')' +
    ".dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));");

const selo = () => js("return document.getElementById('gravacao').className;");

async function capturar(nome) {
  await nav.capturar(join(RAIZ, 'testes', nome + '.png'));
  console.log('  gravado  testes/' + nome + '.png');
}

try {
  /* ---------------- catalogo fora do ar ---------------- */

  await nav.injetar(simulacaoGithub({
    arquivos: { 'data/usuarios.csv': USUARIOS, [CSV_DEV]: CSV_ANTIGO, [FILA]: COLUNAS_FILA + '\n' },
    tokens: [DEV],
    ausentes: [MODULOS],
  }));

  secao('iniciar nao depende do catalogo');
  await nav.entrarComo(ENDERECO, DEV, SENHA);
  await js("window.location.hash = '#/impedimentos';");
  conferir('o calendario abre sem o catalogo', await nav.ate('[data-imp="iniciar"]'));
  conferir('o catalogo esta mesmo fora do ar', !(await js('return window.Impedimentos.Roadmap.catalogoPronto();')));

  await js('document.querySelector(\'[data-imp="iniciar"]\').click();');
  await esperar(300);
  await js("document.getElementById('impMotivoInicio').value = 'Chamado urgente do suporte';");
  await enviar('impForm');
  conferir('iniciar gravou', await nav.ate('[data-imp="finalizar"]'));

  secao('o CSV antigo ganha as duas colunas na primeira gravacao');
  const migrado = await lerCsv(CSV_DEV);
  conferir('cabecalho passou a 12 colunas', migrado.colunas.join(',') === COLUNAS_NOVAS, 'veio ' + migrado.colunas.join(','));
  const velho = migrado.linhas.find((l) => l.id === 'imp_velho');
  conferir('o registro antigo continua la', !!velho);
  conferir('virgula e quebra de linha dos motivos sobreviveram',
    !!velho && velho.motivo_inicio === 'Reuniao, nao planejada' && velho.motivo_fim === 'Resolvido\nem duas linhas');
  conferir('as colunas novas vieram vazias no registro antigo', !!velho && velho.modulo === '' && velho.entregavel === '');

  secao('finalizar sem o catalogo e barrado');
  await js('document.querySelector(\'[data-imp="finalizar"]\').click();');
  await esperar(300);
  conferir('o formulario oferece tentar de novo',
    await js('return !!document.querySelector(\'#impRoadmap [data-imp="recarregarCatalogo"]\');'));
  const fimDigitado = await js("return document.getElementById('impFim').value;");
  await js("document.getElementById('impMotivoFim').value = 'Resolvido com o cliente';");
  const gravacoesAntes = await commitsEm(CSV_DEV);
  await enviar('impForm');
  await esperar(600);
  conferir('salvar mostra o erro do catalogo',
    await js("const e = document.getElementById('impErro'); return !!e && !e.hidden && e.textContent.length > 0;"));
  conferir('nada foi gravado', (await commitsEm(CSV_DEV)) === gravacoesAntes);
  await capturar('captura-sem-catalogo');

  secao('tentar de novo, com o catalogo de volta');
  await js('window.__ausentes.delete(' + JSON.stringify(MODULOS) + ');');
  await js('document.querySelector(\'[data-imp="recarregarCatalogo"]\').click();');
  conferir('o seletor de modulo apareceu', await nav.ate('#impModulo'));
  conferir('o termino digitado ficou', (await js("return document.getElementById('impFim').value;")) === fimDigitado);
  conferir('o motivo digitado ficou',
    (await js("return document.getElementById('impMotivoFim').value;")) === 'Resolvido com o cliente');

  await js(`
    document.getElementById('impModulo').value = 'opec';
    document.getElementById('impEntregavel').value = 'Consegue emitir o comprovante sem pedir ao suporte';
  `);
  await enviar('impForm');
  await esperar(2200);
  const finalizado = (await lerCsv(CSV_DEV)).linhas.find((l) => l.status === 'finalizado' && l.modulo === 'opec');
  conferir('impedimento finalizado com modulo e entregavel', !!finalizado);
  const linhaOpec = finalizado && (await lerCsv(FILA)).linhas.find((l) => l.id === finalizado.id);
  conferir('a linha chegou a fila', !!linhaOpec && linhaOpec.situacao === 'ativo' && linhaOpec.modulo_nome === 'OPEC');
  conferir('o selo diz salvo', (await selo()).includes('pd-gravacao-salvo'));

  secao('catalogo lido mas sem modulo ativo tambem barra');
  conferir('catalogoPronto e falso com tudo inativo', await js(`
    const R = window.Impedimentos.Roadmap;
    const guardado = R.estado.modulos;
    R.estado.modulos = guardado.map(m => Object.assign({}, m, { ativo: 'nao' }));
    const pronto = R.catalogoPronto();
    R.estado.modulos = guardado;
    return pronto === false && R.catalogoPronto() === true;
  `));

  /* ---------------- fila que falha ---------------- */

  secao('a fila falha: o selo nao mente e o aviso oferece tentar de novo');
  await js('window.__falhas.add(' + JSON.stringify(FILA) + ');');
  const filaAntes = await commitsEm(FILA);
  await js('document.querySelector(\'[data-imp="passado"]\').click();');
  await esperar(300);
  await js(`
    const D = window.Impedimentos.DataHora;
    document.getElementById('impInicio').value = D.paraInput(new Date(Date.now() - 3 * 3600e3));
    document.getElementById('impFim').value = D.paraInput(new Date(Date.now() - 2 * 3600e3));
    document.getElementById('impMotivoInicio').value = 'Deploy travado';
    document.getElementById('impMotivoFim').value = 'Liberado pela infra';
    document.getElementById('impModulo').value = 'news';
    document.getElementById('impEntregavel').value = 'Publica a materia agendada no horario certo';
  `);
  await enviar('impForm');
  await esperar(2200);
  const retro = (await lerCsv(CSV_DEV)).linhas.find((l) => l.modulo === 'news');
  conferir('o impedimento foi salvo mesmo assim', !!retro);
  conferir('o selo diz salvo, nao falha', (await selo()).includes('pd-gravacao-salvo'), await selo());
  conferir('a fila nao foi gravada', (await commitsEm(FILA)) === filaAntes);
  conferir('o aviso com tentar de novo apareceu',
    await js('return !!document.querySelector(\'#banners [data-imp-roadmap="reenviar"]\');'));
  conferir('a linha segue pendente em memoria', await js('return window.Impedimentos.Roadmap.temPendencias();'));
  await capturar('captura-fila-falhou');

  await js('window.__falhas.delete(' + JSON.stringify(FILA) + ');');
  await js('document.querySelector(\'#banners [data-imp-roadmap="reenviar"]\').click();');
  await esperar(1500);
  conferir('o aviso sumiu', !(await js('return !!document.querySelector(\'#banners [data-imp-roadmap="reenviar"]\');')));
  conferir('a linha chegou a fila no tentar de novo',
    !!retro && !!(await lerCsv(FILA)).linhas.find((l) => l.id === retro.id));
  conferir('nada pendente', !(await js('return window.Impedimentos.Roadmap.temPendencias();')));

  /* ---------------- reconciliacao ---------------- */

  const agoraIso = new Date().toISOString();
  const CSV_RECONCILIAR = [
    COLUNAS_NOVAS,
    'imp_r1,' + DEV + ',2026-09-08T09:00,Pedido,2026-09-08T10:00,Feito,60,finalizado,2026-09-08T09:00:00.000Z,2026-09-08T10:00:00.000Z,glic,Renova a licenca sem abrir chamado',
    'imp_r2,' + DEV + ',2026-09-09T09:00,Bug,2026-09-09T09:30,Corrigido,30,finalizado,2026-09-09T09:00:00.000Z,2026-09-09T11:00:00.000Z,news,Texto novo do entregavel depois da edicao',
    'imp_r3,' + DEV + ',2026-09-10T09:00,Ajuste,2026-09-10T10:00,Feito,60,finalizado,2026-09-10T09:00:00.000Z,2026-09-10T10:00:00.000Z,podcast,Publica o episodio com a arte certa',
  ].join('\n') + '\n';

  // r1 ficou so em memoria; r2 foi editado depois de triado; r3 esta em dia; a orfa e
  // antiga; a recente pode ser de um registro que a leitura nao pegou; a alheia e de
  // outra pessoa.
  const FILA_RECONCILIAR = [
    COLUNAS_FILA_TRIADA,
    'imp_r2,' + DEV + ',Dev de Teste,news,Jornalismo,Texto antigo do entregavel,Bug,Corrigido,2026-09-09T09:00,2026-09-09T09:30,30,ativo,2026-09-09T09:00:00.000Z,2026-09-09T09:30:00.000Z,Materia agendada,aprovado,gestor.teste,2026-09-09T12:00:00.000Z,,RMAP-I001,',
    'imp_r3,' + DEV + ',Dev de Teste,podcast,Podcast,Publica o episodio com a arte certa,Ajuste,Feito,2026-09-10T09:00,2026-09-10T10:00,60,ativo,2026-09-10T09:00:00.000Z,2026-09-10T10:00:00.000Z,,,,,,,',
    'imp_orfa,' + DEV + ',Dev de Teste,opec,OPEC,Registro excluido cujo cancelamento nao saiu,X,Y,2026-09-01T09:00,2026-09-01T10:00,60,ativo,2026-09-01T09:00:00.000Z,2026-09-01T10:00:00.000Z,,,,,,,',
    'imp_recente,' + DEV + ',Dev de Teste,opec,OPEC,Finalizado agora noutra aba,X,Y,2026-09-15T09:00,2026-09-15T10:00,60,ativo,' + agoraIso + ',' + agoraIso + ',,,,,,,',
    'imp_alheio,alisson.delatim,Alisson,opec,OPEC,Linha de outra pessoa,X,Y,2026-09-01T09:00,2026-09-01T10:00,60,ativo,2026-09-01T09:00:00.000Z,2026-09-01T10:00:00.000Z,,,,,,,',
  ].join('\n') + '\n';

  await nav.injetar(simulacaoGithub({
    arquivos: { 'data/usuarios.csv': USUARIOS, [CSV_DEV]: CSV_RECONCILIAR, [FILA]: FILA_RECONCILIAR },
    tokens: [DEV],
  }));

  secao('reconciliacao ao entrar no calendario');
  await nav.entrarComo(ENDERECO, DEV, SENHA);
  await js("window.location.hash = '#/impedimentos';");
  await nav.ate('[data-imp="iniciar"]');
  await esperar(2500);

  const commitsFila = await js('return window.__commits.filter(c => c.caminho === ' + JSON.stringify(FILA) + ');');
  conferir('um commit so para tudo o que a reconciliacao achou', commitsFila.length === 1, JSON.stringify(commitsFila));
  conferir('o commit conta os 3 itens',
    !!commitsFila[0] && commitsFila[0].mensagem === 'roadmap: fila 3 itens (' + DEV + ')',
    commitsFila[0] && commitsFila[0].mensagem);

  const fila = await lerCsv(FILA);
  const linha = (id) => fila.linhas.find((l) => l.id === id) || {};
  conferir('linha que ficou so em memoria voltou', linha('imp_r1').situacao === 'ativo' && linha('imp_r1').modulo_nome === 'GLic');
  conferir('entregavel editado foi atualizado', linha('imp_r2').entregavel === 'Texto novo do entregavel depois da edicao');
  conferir('a triagem da linha atualizada ficou intacta',
    linha('imp_r2').triagem === 'aprovado' && linha('imp_r2').roadmap_key === 'RMAP-I001');
  conferir('linha em dia nao foi tocada', linha('imp_r3').atualizado_em === '2026-09-10T10:00:00.000Z');
  conferir('orfa antiga foi cancelada', linha('imp_orfa').situacao === 'cancelado');
  conferir('linha recente sem registro lido nao foi cancelada', linha('imp_recente').situacao === 'ativo');
  conferir('linha de outra pessoa nao foi tocada', linha('imp_alheio').situacao === 'ativo');

  secao('reconciliar de novo nao grava nada');
  const segunda = await js(`
    const r = await window.Impedimentos.Store.carregarUsuario(${JSON.stringify(DEV)});
    return window.Impedimentos.Roadmap.reconciliar(${JSON.stringify(DEV)}, r.registros, 'Dev de Teste', new Date().toISOString());
  `);
  conferir('nada a reenviar', segunda === 0, 'veio ' + segunda);

  secao('registro que nao foi lido nao cancela nada');
  await js('window.__ausentes.add(' + JSON.stringify(CSV_DEV) + ');');
  const antesDaGuarda = await commitsEm(FILA);
  await js('await window.Impedimentos.Calendario.recarregar();');
  await esperar(1500);
  conferir('sem o CSV da pessoa, a fila fica como estava', (await commitsEm(FILA)) === antesDaGuarda);

  /* ---------------- textos ---------------- */

  secao('textos novos nos dois idiomas');
  conferir('o motor devolve a propria chave quando falta traducao',
    (await js("return window.I18N.t('imp.chave.que.nao.existe');")) === 'imp.chave.que.nao.existe');
  const faltando = await js(`
    const chaves = ['roadmap.semCatalogo', 'roadmap.aindaSemCatalogo', 'roadmap.tentarDeNovo', 'roadmap.tentando',
      'roadmap.pendente', 'roadmap.bannerTitulo', 'roadmap.bannerAjuda', 'roadmap.reenviar', 'roadmap.reenviado',
      'erro.semCatalogo'];
    const faltam = [];
    ['pt', 'en'].forEach(function (idioma) {
      window.I18N.definir(idioma);
      chaves.forEach(function (k) { if (window.I18N.t('imp.' + k) === 'imp.' + k) faltam.push(idioma + ':' + k); });
    });
    window.I18N.definir('pt');
    return faltam;
  `);
  conferir('nenhuma chave nova sem traducao', faltando.length === 0, faltando.join(', '));

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
