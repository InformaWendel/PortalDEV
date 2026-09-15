/**
 * Administração — a fila do roadmap.
 *
 * Cada impedimento finalizado com módulo e entregável vira uma linha em
 * data/roadmap/fila.csv, gravada pela ferramenta de Impedimentos. Aqui o gestor
 * confere linha a linha, aprova ou recusa, e gera o pacote que vai para o roadmap
 * do OPSView.
 *
 * O portal escreve fatos e para no pacote. O POST não sai do navegador — ver o
 * bloco `opsview` do config.js, que também guarda o mapeamento de campos.
 *
 * A triagem mora em colunas que a ferramenta de Impedimentos não conhece
 * (`titulo`, `triagem`, `roadmap_key`…). É de propósito: `Impedimentos.Roadmap`
 * preserva coluna desconhecida e só reescreve o que ela mesma trouxe, então os
 * dois lados gravam no mesmo arquivo sem se atropelar.
 *
 * Rota: #/admin/roadmap
 */
(function () {
  'use strict';

  const esc = window.UI.esc;
  const el = window.UI.el;

  /** Colunas que a triagem acrescenta à fila, na ordem em que entram no arquivo. */
  const COLUNAS_TRIAGEM = [
    'titulo',
    'triagem',
    'triagem_por',
    'triagem_em',
    'motivo_recusa',
    'roadmap_key',
    'enviado_em',
  ];

  const TRIAGEM = { PENDENTE: 'pendente', APROVADO: 'aprovado', RECUSADO: 'recusado' };

  /** Situações derivadas, na ordem em que aparecem no filtro. */
  const SITUACOES = ['pendente', 'aprovado', 'enviado', 'recusado', 'cancelado'];

  const estado = {
    carregado: false,
    erro: null,
    /** Colunas como vieram do arquivo — nada é reordenado na leitura. */
    colunas: [],
    linhas: [],
    modulos: [],
    filtro: 'pendente',
  };

  function t(chave, valores) {
    return window.I18N.t('adm.roadmap.' + chave, valores);
  }

  function cfg() {
    return window.PORTAL_CONFIG;
  }

  function quem() {
    return window.Auth.sessao ? window.Auth.sessao.usuario : '';
  }

  function agora() {
    return new Date().toISOString();
  }

  /* ---------------- leitura ---------------- */

  /**
   * Fila e catálogo juntos. Nenhum dos dois rejeita: sem catálogo a tela ainda
   * mostra a fila (o nome do módulo já vem gravado na linha), e sem fila a tela
   * mostra vazio em vez de erro — fila inexistente é o estado normal no começo.
   */
  function carregar() {
    return Promise.all([
      window.Github.lerArquivo(cfg().dados.roadmapFila).then(
        function (r) {
          aplicarTexto(r.existe ? r.texto : '');
          estado.erro = null;
        },
        function (erro) {
          estado.erro = erro;
        }
      ),
      window.Github.lerArquivo(cfg().dados.roadmapModulos).then(
        function (r) {
          if (!r.existe) return;
          estado.modulos = window.CSV.parse(r.texto).linhas.filter(function (m) {
            return m.modulo;
          });
        },
        function () {
          // Catálogo é enfeite aqui: quem tria lê o nome do módulo que já está na linha.
        }
      ),
    ]).then(function () {
      estado.carregado = true;
    });
  }

  function recarregar() {
    return carregar();
  }

  function aplicarTexto(texto) {
    const dados = texto && texto.trim() ? window.CSV.parse(texto) : { colunas: [], linhas: [] };
    estado.colunas = dados.colunas;
    estado.linhas = dados.linhas.filter(function (l) {
      return l.id;
    });
  }

  function moduloPorChave(chave) {
    return (
      estado.modulos.filter(function (m) {
        return m.modulo === chave;
      })[0] || null
    );
  }

  /** Frente do módulo; sem catálogo cai em Tarefas Internas, que é o destino neutro. */
  function frenteDe(linha) {
    const modulo = moduloPorChave(linha.modulo);
    const frentes = cfg().opsview.frentes;
    return frentes[modulo ? modulo.frente : ''] || frentes.T;
  }

  /**
   * A situação que a tela mostra. `cancelado` vem da própria fila — impedimento
   * excluído ou reaberto — e vence a triagem: não há o que aprovar de um registro
   * que deixou de existir.
   */
  function situacaoDe(linha) {
    if (linha.situacao === 'cancelado') return 'cancelado';
    if (linha.enviado_em) return 'enviado';
    const triagem = linha.triagem || TRIAGEM.PENDENTE;
    return SITUACOES.indexOf(triagem) === -1 ? TRIAGEM.PENDENTE : triagem;
  }

  /**
   * A pessoa editou o impedimento depois da triagem. Importa: o entregável que o
   * gestor aprovou pode não ser mais o que está na linha.
   */
  function alteradoDepois(linha) {
    return !!(linha.triagem_em && linha.atualizado_em && linha.atualizado_em > linha.triagem_em);
  }

  /** Linha já enviada que depois foi cancelada: o item ficou órfão no OPSView. */
  function orfa(linha) {
    return linha.situacao === 'cancelado' && !!linha.enviado_em;
  }

  function porSituacao(situacao) {
    return estado.linhas.filter(function (l) {
      return situacaoDe(l) === situacao;
    });
  }

  function filtradas() {
    if (estado.filtro === 'todos') return estado.linhas.slice();
    return porSituacao(estado.filtro);
  }

  /** Prontas para o pacote: aprovadas, ainda não enviadas e não canceladas. */
  function paraEnviar() {
    return estado.linhas.filter(function (l) {
      return situacaoDe(l) === 'aprovado';
    });
  }

  /* ---------------- gravação ---------------- */

  /**
   * Relê a fila, aplica a alteração sobre a versão mais nova e grava. O mutador
   * recebe as linhas e a lista de colunas já com as da triagem — acrescentar
   * coluna no fim mantém o que a ferramenta de Impedimentos escreve intocado.
   */
  function gravarFila(aplicar, mensagem) {
    window.App.sinalizarGravacao('gravando');
    return window.Github
      .alterarArquivo(
        cfg().dados.roadmapFila,
        function (texto, existe) {
          const dados = existe && texto.trim() ? window.CSV.parse(texto) : { colunas: [], linhas: [] };
          const colunas = dados.colunas.slice();
          COLUNAS_TRIAGEM.forEach(function (c) {
            if (colunas.indexOf(c) === -1) colunas.push(c);
          });
          const linhas = dados.linhas.filter(function (l) {
            return l.id;
          });
          aplicar(linhas, colunas);
          return window.CSV.serialize(linhas, colunas);
        },
        mensagem
      )
      .then(
        function (resultado) {
          aplicarTexto(resultado.texto);
          window.App.sinalizarGravacao('salvo');
          return resultado;
        },
        function (erro) {
          window.App.sinalizarGravacao('erro', erro);
          throw erro;
        }
      );
  }

  function linhaPorId(linhas, id) {
    return (
      linhas.filter(function (l) {
        return l.id === id;
      })[0] || null
    );
  }

  /**
   * Contador próprio da chave, calculado sobre a versão relida do arquivo: dois
   * gestores triando ao mesmo tempo não cunham o mesmo número. Chave já atribuída
   * nunca muda — é o que faz o reenvio atualizar em vez de duplicar.
   */
  function proximaChave(linhas) {
    const opsview = cfg().opsview;
    const padrao = new RegExp('^' + opsview.prefixoChave + '(\\d+)$');
    let maior = 0;
    linhas.forEach(function (l) {
      const achado = padrao.exec(String(l.roadmap_key || ''));
      if (achado) maior = Math.max(maior, Number(achado[1]));
    });
    let numero = String(maior + 1);
    while (numero.length < opsview.digitosChave) numero = '0' + numero;
    return opsview.prefixoChave + numero;
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

  /* ---------------- triagem ---------------- */

  function aprovar(id, titulo) {
    return gravarFila(function (linhas) {
      const linha = linhaPorId(linhas, id);
      if (!linha) throw erroComChave('erroSumiu');
      if (linha.situacao === 'cancelado') throw erroComChave('erroCancelado');
      linha.titulo = titulo;
      linha.triagem = TRIAGEM.APROVADO;
      linha.triagem_por = quem();
      linha.triagem_em = agora();
      linha.motivo_recusa = '';
      // Reaprovar não recunha a chave: a que já foi ao OPSView é a identidade do item.
      if (!linha.roadmap_key) linha.roadmap_key = proximaChave(linhas);
    }, 'chore(roadmap): fila ' + id + ' aprovada por ' + quem());
  }

  function recusar(id, motivo) {
    return gravarFila(function (linhas) {
      const linha = linhaPorId(linhas, id);
      if (!linha) throw erroComChave('erroSumiu');
      linha.triagem = TRIAGEM.RECUSADO;
      linha.triagem_por = quem();
      linha.triagem_em = agora();
      linha.motivo_recusa = motivo;
    }, 'chore(roadmap): fila ' + id + ' recusada por ' + quem());
  }

  /**
   * Volta para pendente. A chave fica: se o item já foi ao OPSView, ela é a única
   * forma de atualizá-lo depois — e lá não há rota de remoção.
   */
  function reabrir(id) {
    return gravarFila(function (linhas) {
      const linha = linhaPorId(linhas, id);
      if (!linha) throw erroComChave('erroSumiu');
      linha.triagem = TRIAGEM.PENDENTE;
      linha.triagem_por = quem();
      linha.triagem_em = agora();
      linha.motivo_recusa = '';
    }, 'chore(roadmap): fila ' + id + ' reaberta por ' + quem());
  }

  /* ---------------- pacote do OPSView ---------------- */

  function mes(iso) {
    return String(iso || '').slice(0, 7);
  }

  /**
   * A linha aprovada no formato do import-json. O que fica de fora é decisão, não
   * esquecimento: `fim_baseline` nunca sai daqui (régua de atraso não se cunha
   * automaticamente), e `peso`, `progresso` de item em curso e `bloqueada` são da
   * tela do OPSView — campo ausente preserva o que estiver lá.
   */
  function itemDoRegistro(linha) {
    const opsview = cfg().opsview;
    const frente = frenteDe(linha);
    const modulo = moduloPorChave(linha.modulo);
    const item = {
      roadmap_key: linha.roadmap_key,
      ambiente: frente.ambiente,
      produto: linha.modulo_nome || (modulo ? modulo.nome : ''),
      titulo: opsview.prefixoTitulo + linha.titulo,
      fase: opsview.fase,
      area: frente.area,
      deploy_model: frente.deploy_model,
      inicio: mes(linha.inicio),
      fim: mes(linha.fim || linha.inicio),
      progresso: 100,
    };
    if (linha.pessoa) item.responsavel = linha.pessoa;
    return item;
  }

  /** O que impede uma linha aprovada de virar item. Melhor barrar aqui do que lá. */
  function problemaDoItem(item) {
    if (!item.roadmap_key) return t('erroSemChave');
    if (!item.produto) return t('erroSemProduto');
    if (!item.titulo.replace(cfg().opsview.prefixoTitulo, '').trim()) return t('erroSemTitulo');
    if (!/^\d{4}-\d{2}$/.test(item.inicio) || !/^\d{4}-\d{2}$/.test(item.fim)) return t('erroSemData');
    return null;
  }

  function gerarPacote() {
    const linhas = paraEnviar();
    if (!linhas.length) return window.UI.toast(t('semAprovadas'), 'erro');

    const itens = [];
    const problemas = [];
    linhas.forEach(function (linha) {
      const item = itemDoRegistro(linha);
      const problema = problemaDoItem(item);
      if (problema) problemas.push(linha.id + ': ' + problema);
      else itens.push(item);
    });

    if (problemas.length) window.UI.toast(t('pacoteComProblema', { n: problemas.length }), 'erro');
    if (!itens.length) return;

    const hoje = new Date().toISOString().slice(0, 10);
    window.UI.baixarArquivo(
      'opsview-impedimentos-' + hoje + '.json',
      JSON.stringify({ items: itens }, null, 2) + '\n',
      { tipo: 'application/json;charset=utf-8' }
    );
    window.UI.toast(t('pacoteGerado', { n: itens.length }), 'ok');
    abrirComoEnviar(itens.length);
  }

  /**
   * O curl que leva o pacote. Fica na tela, e não num botão que envia, porque o
   * envio é decisão de pessoa — e porque a API responde 3xx para a tela de login
   * quando a credencial falha, o que um cliente que segue redirecionamento lê como
   * sucesso. Sem `--no-location` um token vencido diria 200 sem importar nada.
   */
  function abrirComoEnviar(quantos) {
    const opsview = cfg().opsview;
    const comando =
      '$env:OPSVIEW_ROADMAP_API_TOKEN = "<cole o token aqui>"\n' +
      'curl.exe -sS --no-location -X POST ' + opsview.endpoint + ' `\n' +
      '  -H "Authorization: Bearer $env:OPSVIEW_ROADMAP_API_TOKEN" `\n' +
      '  -H "Content-Type: application/json; charset=utf-8" `\n' +
      '  --data-binary "@opsview-impedimentos-' + new Date().toISOString().slice(0, 10) + '.json"';

    window.UI.abrirModal(
      '<div class="pd-form-pilha">' +
        '<h2 class="pd-modal-titulo">' + esc(t('enviar.titulo', { n: quantos })) + '</h2>' +
        '<p class="pd-modal-texto">' + esc(t('enviar.ajuda')) + '</p>' +
        '<pre class="adm-rm-comando">' + esc(comando) + '</pre>' +
        '<p class="pd-ajuda">' + esc(t('enviar.conferir')) + '</p>' +
        '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
        '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(window.I18N.t('acao.fechar')) + '</button>' +
        '<button type="button" class="pd-btn pd-btn-primario" data-adm="rmMarcarEnviados">' +
        esc(t('enviar.marcar')) + '</button></div>' +
      '</div>',
      { largo: true }
    );
  }

  /**
   * Carimba o envio. É passo separado do "gerar" de propósito: só quem viu o
   * relatório da API sabe se as linhas entraram mesmo.
   */
  function marcarEnviados() {
    const ids = paraEnviar().map(function (l) {
      return l.id;
    });
    if (!ids.length) return window.UI.toast(t('semAprovadas'), 'erro');
    const carimbo = agora();

    gravarFila(function (linhas) {
      ids.forEach(function (id) {
        const linha = linhaPorId(linhas, id);
        // Linha que mudou de estado entre gerar e marcar fica de fora, sem barulho.
        if (linha && linha.triagem === TRIAGEM.APROVADO && !linha.enviado_em && linha.situacao !== 'cancelado') {
          linha.enviado_em = carimbo;
        }
      });
    }, 'chore(roadmap): ' + ids.length + ' itens marcados como enviados por ' + quem())
      .then(function () {
        window.UI.fecharModal();
        window.UI.toast(t('marcados', { n: ids.length }), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        window.UI.toast(mensagemDeErro(erro), 'erro');
      });
  }

  /* ---------------- formulários ---------------- */

  function tituloSugerido(linha) {
    if (linha.titulo) return linha.titulo;
    const limite = cfg().opsview.maxTitulo - cfg().opsview.prefixoTitulo.length;
    const texto = String(linha.entregavel || '').replace(/\s+/g, ' ').trim();
    if (texto.length <= limite) return texto;
    // Corta na última palavra inteira que couber: título truncado no meio da palavra
    // vira ruído na tela do OPSView, que não tem campo de descrição para completar.
    const corte = texto.slice(0, limite);
    const espaco = corte.lastIndexOf(' ');
    return (espaco > limite * 0.6 ? corte.slice(0, espaco) : corte).trim();
  }

  function abrirAprovar(id) {
    const linha = linhaPorId(estado.linhas, id);
    if (!linha) return;
    const frente = frenteDe(linha);
    const opsview = cfg().opsview;
    const limite = opsview.maxTitulo - opsview.prefixoTitulo.length;

    window.UI.abrirModal(
      '<form id="admFormRoadmap" class="pd-form-pilha" data-id="' + esc(id) + '" novalidate>' +
        '<h2 class="pd-modal-titulo">' + esc(t('aprovar.titulo')) + '</h2>' +
        '<div class="adm-rm-origem">' +
          '<div class="adm-rm-origem-rotulo">' + esc(t('col.entregavel')) + '</div>' +
          '<p class="adm-rm-origem-texto">' + esc(linha.entregavel || '—') + '</p>' +
          '<div class="adm-rm-origem-meta">' +
            esc(linha.pessoa || linha.usuario) + ' · ' + esc(linha.modulo_nome || linha.modulo) +
            ' · ' + esc(formatarDuracao(linha.duracao_min)) +
          '</div>' +
        '</div>' +
        '<div class="pd-campo-grupo"><label class="pd-rotulo" for="admRmTitulo">' + esc(t('aprovar.campoTitulo')) + '</label>' +
        '<input id="admRmTitulo" class="pd-campo" type="text" maxlength="' + limite + '" value="' +
        esc(tituloSugerido(linha)) + '">' +
        '<p class="pd-ajuda">' + esc(t('aprovar.ajudaTitulo', { n: limite })) + '</p></div>' +
        '<div class="adm-rm-previa">' +
          '<div class="adm-rm-previa-titulo">' + esc(t('aprovar.previa')) + '</div>' +
          '<dl class="adm-rm-previa-lista">' +
            previaCampo(t('campo.chave'), linha.roadmap_key || t('aprovar.chaveNova')) +
            previaCampo(t('campo.produto'), linha.modulo_nome || linha.modulo) +
            previaCampo(t('campo.ambiente'), frente.ambiente + ' · ' + frente.area) +
            previaCampo(t('campo.fase'), opsview.fase) +
            previaCampo(t('campo.periodo'), mes(linha.inicio) + ' → ' + mes(linha.fim || linha.inicio)) +
          '</dl>' +
        '</div>' +
        '<div id="admRmErro" class="pd-alerta-erro" role="alert" hidden></div>' +
        '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
        '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(window.I18N.t('acao.cancelar')) + '</button>' +
        '<button type="submit" id="admRmSalvar" class="pd-btn pd-btn-primario">' + esc(t('aprovar.confirmar')) + '</button>' +
        '</div>' +
      '</form>'
    );
  }

  function previaCampo(rotulo, valor) {
    return '<dt>' + esc(rotulo) + '</dt><dd class="pd-mono">' + esc(valor || '—') + '</dd>';
  }

  function abrirRecusar(id) {
    const linha = linhaPorId(estado.linhas, id);
    if (!linha) return;
    window.UI.abrirModal(
      '<form id="admFormRoadmapRecusa" class="pd-form-pilha" data-id="' + esc(id) + '" novalidate>' +
        '<h2 class="pd-modal-titulo">' + esc(t('recusar.titulo')) + '</h2>' +
        '<p class="pd-modal-texto">' + esc(t('recusar.ajuda')) + '</p>' +
        '<div class="adm-rm-origem"><p class="adm-rm-origem-texto">' + esc(linha.entregavel || '—') + '</p></div>' +
        '<div class="pd-campo-grupo"><label class="pd-rotulo" for="admRmMotivo">' + esc(t('recusar.campo')) + '</label>' +
        '<textarea id="admRmMotivo" class="pd-campo" rows="3">' + esc(linha.motivo_recusa || '') + '</textarea></div>' +
        '<div id="admRmErroRecusa" class="pd-alerta-erro" role="alert" hidden></div>' +
        '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
        '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(window.I18N.t('acao.cancelar')) + '</button>' +
        '<button type="submit" id="admRmSalvarRecusa" class="pd-btn pd-btn-primario">' + esc(t('recusar.confirmar')) + '</button>' +
        '</div>' +
      '</form>'
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

  function salvarAprovacao(form) {
    const id = form.getAttribute('data-id');
    const titulo = el('admRmTitulo').value.trim();
    if (!titulo) return mostrarErro('admRmErro', t('aprovar.erroTitulo'));

    mostrarErro('admRmErro', '');
    travar('admRmSalvar', true);
    aprovar(id, titulo)
      .then(function () {
        window.UI.fecharModal();
        window.UI.toast(t('aprovada'), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        mostrarErro('admRmErro', mensagemDeErro(erro));
      })
      .then(function () {
        travar('admRmSalvar', false);
      });
  }

  function salvarRecusa(form) {
    const id = form.getAttribute('data-id');
    const motivo = el('admRmMotivo').value.trim();
    if (!motivo) return mostrarErro('admRmErroRecusa', t('recusar.erroMotivo'));

    mostrarErro('admRmErroRecusa', '');
    travar('admRmSalvarRecusa', true);
    recusar(id, motivo)
      .then(function () {
        window.UI.fecharModal();
        window.UI.toast(t('recusada'), 'ok');
        window.App.render();
      })
      .catch(function (erro) {
        mostrarErro('admRmErroRecusa', mensagemDeErro(erro));
      })
      .then(function () {
        travar('admRmSalvarRecusa', false);
      });
  }

  /* ---------------- tela ---------------- */

  function formatarDuracao(minutos) {
    const total = Math.max(0, Math.round(Number(minutos) || 0));
    const horas = Math.floor(total / 60);
    const resto = total % 60;
    if (!horas) return t('duracaoMin', { m: resto });
    return resto ? t('duracaoHoraMin', { h: horas, m: resto }) : t('duracaoHora', { h: horas });
  }

  function minutosDe(linhas) {
    return linhas.reduce(function (soma, l) {
      return soma + (Number(l.duracao_min) || 0);
    }, 0);
  }

  function kpi(classe, valor, rotulo) {
    return (
      '<div class="pd-kpi ' + classe + '">' +
      '<div class="pd-kpi-rotulo">' + esc(rotulo) + '</div>' +
      '<div class="pd-kpi-valor">' + esc(valor) + '</div></div>'
    );
  }

  function render() {
    const caixa = el('vista');
    if (!estado.carregado) {
      caixa.innerHTML = '<div class="pd-carregando">' + esc(window.I18N.t('carregando')) + '</div>';
      return;
    }

    const travado = !window.Github.temToken();
    const aprovadas = paraEnviar();
    const orfas = estado.linhas.filter(orfa);

    caixa.innerHTML =
      '<section class="pd-secao">' +
      '<div class="pd-secao-linha"><h2 class="pd-secao-titulo">' + esc(t('titulo')) + '</h2>' +
      '<span class="pd-pilula">' + esc(t('contagem', { n: estado.linhas.length })) + '</span>' +
      '<div class="pd-secao-acoes">' +
      '<button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-adm="rmGerar"' +
      (aprovadas.length ? '' : ' disabled') + '>' + esc(t('gerar', { n: aprovadas.length })) + '</button>' +
      '</div></div>' +
      '<p class="pd-secao-ajuda">' + esc(t('ajuda')) + '</p>' +
      (estado.erro ? avisoErro() : '') +
      (travado ? notaSemToken() : '') +
      (orfas.length ? avisoOrfas(orfas.length) : '') +
      painelNumeros() +
      filtros() +
      tabela(travado) +
      '</section>';

    desenharGraficos();
  }

  function avisoErro() {
    return (
      '<div class="pd-aviso pd-aviso-erro"><div class="pd-aviso-texto">' +
      '<div class="pd-aviso-titulo">' + esc(t('erroLeituraTitulo')) + '</div>' +
      '<div class="pd-aviso-detalhe">' + esc(t('erroLeituraAjuda')) + '</div></div></div>'
    );
  }

  /**
   * Item já enviado cuja linha foi cancelada depois. No OPSView não há rota de
   * remoção: o conserto é na tela de lá, à mão, e por isso isto é um aviso e não
   * um número escondido no painel.
   */
  function avisoOrfas(n) {
    return (
      '<div class="pd-aviso pd-aviso-alerta"><div class="pd-aviso-texto">' +
      '<div class="pd-aviso-titulo">' + esc(t('orfasTitulo', { n: n })) + '</div>' +
      '<div class="pd-aviso-detalhe">' + esc(t('orfasAjuda')) + '</div></div></div>'
    );
  }

  function notaSemToken() {
    return (
      '<div class="pd-nota"><span>' + esc(t('semToken')) + '</span>' +
      '<button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-acao="token">' +
      esc(window.I18N.t('token.configurar')) + '</button></div>'
    );
  }

  function painelNumeros() {
    const pendentes = porSituacao('pendente');
    const aprovadas = porSituacao('aprovado');
    const enviadas = porSituacao('enviado');
    const recusadas = porSituacao('recusado');

    return (
      // Compacto: são cinco números de acompanhamento, não os cartões de destaque do QA.
      '<div class="pd-kpis pd-kpis-compactos">' +
      kpi('pd-kpi-atencao', pendentes.length, t('kpi.pendentes')) +
      kpi('pd-kpi-and', aprovadas.length, t('kpi.aprovadas')) +
      kpi('pd-kpi-conc', enviadas.length, t('kpi.enviadas')) +
      kpi('', recusadas.length, t('kpi.recusadas')) +
      kpi('pd-kpi-info', formatarDuracao(minutosDe(pendentes.concat(aprovadas, enviadas))), t('kpi.esforco')) +
      '</div>' +
      '<div class="adm-rm-graficos">' +
      '<div class="pd-bloco"><div class="pd-bloco-titulo">' + esc(t('graficoModulo')) + '</div>' +
      '<div class="pd-graf" id="admRmGrafModulo"></div></div>' +
      '<div class="pd-bloco"><div class="pd-bloco-titulo">' + esc(t('graficoPessoa')) + '</div>' +
      '<div class="pd-graf" id="admRmGrafPessoa"></div></div>' +
      '</div>'
    );
  }

  /** Acompanhamento sobre o que conta como trabalho: recusado e cancelado ficam fora. */
  function desenharGraficos() {
    if (!el('admRmGrafModulo')) return;
    const consideradas = estado.linhas.filter(function (l) {
      const s = situacaoDe(l);
      return s === 'pendente' || s === 'aprovado' || s === 'enviado';
    });

    window.Graficos.barrasHorizontais(el('admRmGrafModulo'), agrupar(consideradas, function (l) {
      return { chave: l.modulo || '—', rotulo: l.modulo_nome || l.modulo || '—' };
    }), { formatarValor: formatarDuracao, mensagemVazia: t('semDados'), maxItens: 12 });

    window.Graficos.barrasHorizontais(el('admRmGrafPessoa'), agrupar(consideradas, function (l) {
      return { chave: l.usuario || '—', rotulo: l.pessoa || l.usuario || '—' };
    }), { formatarValor: formatarDuracao, mensagemVazia: t('semDados'), maxItens: 12 });
  }

  function agrupar(linhas, chaveDe) {
    const mapa = new Map();
    linhas.forEach(function (l) {
      const par = chaveDe(l);
      const atual = mapa.get(par.chave) || { chave: par.chave, rotulo: par.rotulo, valor: 0 };
      atual.valor += Number(l.duracao_min) || 0;
      mapa.set(par.chave, atual);
    });
    return Array.from(mapa.values());
  }

  function filtros() {
    const botoes = ['todos'].concat(SITUACOES).map(function (chave) {
      const n = chave === 'todos' ? estado.linhas.length : porSituacao(chave).length;
      return (
        '<button type="button" class="pd-chip' + (estado.filtro === chave ? ' pd-chip-ok' : '') + '"' +
        ' data-adm="rmFiltro" data-filtro="' + esc(chave) + '">' +
        esc(t('situacao.' + chave)) + ' <span class="pd-contagem">' + esc(n) + '</span></button>'
      );
    });
    return '<div class="pd-filtros">' + botoes.join('') + '</div>';
  }

  const CLASSE_SITUACAO = {
    pendente: 'pd-tag-aberto',
    aprovado: 'pd-tag-em_teste',
    enviado: 'pd-tag-liberada',
    recusado: 'pd-tag-devolvida',
    cancelado: 'pd-tag-nao_aplicavel',
  };

  function tabela(travado) {
    const linhas = filtradas().sort(function (a, b) {
      return String(b.inicio || '').localeCompare(String(a.inicio || ''));
    });

    if (!linhas.length) return '<div class="pd-vazio">' + esc(t('vazio')) + '</div>';

    const corpo = linhas
      .map(function (l) {
        const situacao = situacaoDe(l);
        const podeTriar = !travado && situacao !== 'cancelado';
        const desabilitado = podeTriar ? '' : ' disabled';
        return (
          '<tr>' +
          '<td><span class="adm-nome">' + esc(l.pessoa || l.usuario) + '</span>' +
          '<div class="adm-texto-suave pd-esconde-p">' + esc(l.inicio ? l.inicio.slice(0, 10) : '—') + '</div></td>' +
          '<td>' + esc(l.modulo_nome || l.modulo || '—') + '</td>' +
          '<td class="adm-rm-cel-texto">' +
          '<div>' + esc(l.entregavel || '—') + '</div>' +
          (l.titulo ? '<div class="adm-rm-titulo pd-mono">' + esc(cfg().opsview.prefixoTitulo + l.titulo) + '</div>' : '') +
          (l.motivo_recusa ? '<div class="adm-rm-recusa">' + esc(l.motivo_recusa) + '</div>' : '') +
          (alteradoDepois(l) ? '<span class="pd-tag pd-tag-nao_implementada">' + esc(t('alterado')) + '</span>' : '') +
          '</td>' +
          '<td class="pd-cel-nowrap">' + esc(formatarDuracao(l.duracao_min)) + '</td>' +
          '<td><span class="pd-tag ' + CLASSE_SITUACAO[situacao] + '">' + esc(t('situacao.' + situacao)) + '</span>' +
          (l.roadmap_key ? '<div class="pd-mono adm-texto-suave">' + esc(l.roadmap_key) + '</div>' : '') + '</td>' +
          '<td><div class="adm-acoes">' + acoesDaLinha(l, situacao, desabilitado) + '</div></td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<div class="pd-tabela-caixa pd-tabela-caixa-livre"><table class="pd-tabela"><thead><tr>' +
      '<th>' + esc(t('col.pessoa')) + '</th>' +
      '<th>' + esc(t('col.modulo')) + '</th>' +
      '<th>' + esc(t('col.entregavel')) + '</th>' +
      '<th>' + esc(t('col.esforco')) + '</th>' +
      '<th>' + esc(t('col.situacao')) + '</th>' +
      '<th class="adm-col-acoes">' + esc(t('col.acoes')) + '</th>' +
      '</tr></thead><tbody>' + corpo + '</tbody></table></div>'
    );
  }

  function acoesDaLinha(linha, situacao, desabilitado) {
    const id = esc(linha.id);
    if (situacao === 'pendente') {
      return (
        '<button type="button" class="pd-btn pd-btn-p" data-adm="rmAprovar" data-id="' + id + '"' + desabilitado + '>' +
        esc(t('acao.aprovar')) + '</button>' +
        '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-adm="rmRecusar" data-id="' + id + '"' + desabilitado + '>' +
        esc(t('acao.recusar')) + '</button>'
      );
    }
    if (situacao === 'cancelado') return '<span class="adm-texto-suave">—</span>';
    return (
      '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-adm="rmReabrir" data-id="' + id + '"' + desabilitado + '>' +
      esc(t('acao.reabrir')) + '</button>'
    );
  }

  /* ---------------- eventos ---------------- */

  /** Chamada pelo ouvinte delegado de admin/telas.js, que já confere a ferramenta. */
  function acao(nome, alvo) {
    if (nome === 'rmFiltro') {
      estado.filtro = alvo.getAttribute('data-filtro');
      return render();
    }
    if (nome === 'rmAprovar') return abrirAprovar(alvo.getAttribute('data-id'));
    if (nome === 'rmRecusar') return abrirRecusar(alvo.getAttribute('data-id'));
    if (nome === 'rmGerar') return gerarPacote();
    if (nome === 'rmMarcarEnviados') return marcarEnviados();
    if (nome === 'rmReabrir') {
      return reabrir(alvo.getAttribute('data-id'))
        .then(function () {
          window.UI.toast(t('reaberta'), 'ok');
          window.App.render();
        })
        .catch(function (erro) {
          window.UI.toast(mensagemDeErro(erro), 'erro');
        });
    }
  }

  /** Devolve true quando o formulário era daqui — telas.js não precisa saber os ids. */
  function enviarFormulario(form) {
    if (form.id === 'admFormRoadmap') {
      salvarAprovacao(form);
      return true;
    }
    if (form.id === 'admFormRoadmapRecusa') {
      salvarRecusa(form);
      return true;
    }
    return false;
  }

  window.Admin = window.Admin || {};
  window.Admin.Roadmap = {
    estado: estado,
    carregar: carregar,
    recarregar: recarregar,
    render: render,
    acao: acao,
    enviarFormulario: enviarFormulario,
    itemDoRegistro: itemDoRegistro,
  };
})();
