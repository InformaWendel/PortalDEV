/**
 * Controle de Impedimentos — tela de quem registra: o impedimento em andamento,
 * com cronômetro, e o calendário mensal dos próprios registros.
 */
(function () {
  'use strict';

  const I = window.Impedimentos;
  const DataHora = I.DataHora;
  const Store = I.Store;
  const Roadmap = I.Roadmap;
  const esc = window.UI.esc;
  const el = window.UI.el;

  function t(chave, valores) {
    return window.I18N.t('imp.' + chave, valores);
  }

  const estado = {
    usuario: null,
    registros: [],
    ano: 0,
    mes: 0,
    diaSelecionado: null,
    modo: 'iniciar',
    editandoId: null,
    carregado: false,
    erro: '',
    cronometro: null,
  };

  function ativo() {
    return window.App.ferramentaAtual() === 'impedimentos' && I.Telas.abaAtual() === 'calendario';
  }

  function irParaHoje() {
    const hoje = new Date();
    estado.ano = hoje.getFullYear();
    estado.mes = hoje.getMonth();
  }

  /* ---------------- carga ---------------- */

  function entrar() {
    const usuario = window.Auth.sessao.usuario;
    if (estado.usuario !== usuario) {
      estado.usuario = usuario;
      estado.registros = [];
      estado.carregado = false;
      estado.diaSelecionado = null;
      irParaHoje();
    }
    return estado.carregado ? null : recarregar();
  }

  function recarregar() {
    const usuario = estado.usuario;
    // Marcado antes da leitura: a reconciliação não cancela linha mais nova que isso.
    const lidoEm = new Date().toISOString();
    let lidos = false;
    return Promise.all([
      Store.carregarUsuario(usuario).then(
        function (r) {
          if (usuario !== estado.usuario) return;
          estado.registros = r.registros;
          estado.erro = '';
          // Arquivo que não veio não é lista vazia: reconciliar contra ele cancelaria
          // tudo o que a pessoa tem na fila.
          lidos = r.existe;
        },
        function (erro) {
          estado.erro = t('erro.carregar') + ' ' + (erro.message || '');
        }
      ),
      // O catálogo alimenta o seletor de módulo. Iniciar segue sem ele; finalizar pede o
      // catálogo, e o formulário oferece tentar de novo.
      Roadmap.carregarModulos(true),
    ]).then(function () {
      estado.carregado = true;
      // Em segundo plano: a tela não espera a fila.
      if (lidos && usuario === estado.usuario) {
        Roadmap.reconciliar(usuario, estado.registros, window.Auth.nomeDe(usuario), lidoEm).catch(function () {
          // Fila ilegível agora: a próxima entrada tenta de novo.
        });
      }
    });
  }

  function sair() {
    window.clearInterval(estado.cronometro);
    estado.cronometro = null;
  }

  function carregado() {
    return estado.carregado;
  }

  /* ---------------- render ---------------- */

  function render() {
    if (!estado.carregado) {
      el('vista').innerHTML = '<div class="pd-cartao pd-vazio">' + esc(t('carregando')) + '</div>';
      return;
    }
    const aberto = Store.emAberto(estado.registros);
    el('vista').innerHTML =
      '<div class="imp-pilha">' +
      (estado.erro ? '<div class="pd-aviso pd-aviso-erro"><div class="pd-aviso-texto">' + esc(estado.erro) + '</div></div>' : '') +
      cartaoAtual(aberto) +
      cartaoCalendario() +
      '</div>';
    ligarCronometro(aberto);
  }

  /** Sem token não há gravação: os botões ficam travados em vez de perder o que foi digitado. */
  function atributoTravado() {
    return window.Github.temToken() ? '' : ' disabled';
  }

  function notaSemToken() {
    if (window.Github.temToken()) return '';
    return (
      '<div class="pd-nota"><span>' + esc(t('semToken')) + '</span>' +
      '<button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-acao="token">' +
      esc(window.I18N.t('token.configurar')) + '</button></div>'
    );
  }

  function cartaoAtual(aberto) {
    const travado = atributoTravado();
    if (!aberto) {
      return (
        '<section class="pd-cartao imp-atual">' +
        notaSemToken() +
        '<p class="imp-atual-vazio">' + esc(t('nenhum')) + '</p>' +
        '<div class="pd-botoes">' +
        '<button type="button" class="pd-btn pd-btn-primario" data-imp="iniciar"' + travado + '>' + esc(t('iniciar')) + '</button>' +
        '<button type="button" class="pd-btn" data-imp="passado"' + travado + '>' + esc(t('passado')) + '</button>' +
        '</div></section>'
      );
    }
    return (
      '<section class="pd-cartao imp-atual imp-atual-aberto">' +
      notaSemToken() +
      '<div class="imp-atual-info"><span class="imp-pulso" aria-hidden="true"></span><div>' +
      '<h2 class="imp-atual-titulo">' + esc(t('atual')) + '</h2>' +
      '<p class="imp-atual-motivo">' + esc(aberto.motivo_inicio || '—') + '</p>' +
      '<p class="imp-atual-inicio">' + esc(t('inicio')) + ': ' +
      esc(DataHora.formatarDataLonga(DataHora.chaveDia(aberto.inicio)) + ' · ' + DataHora.formatarHora(aberto.inicio)) + '</p>' +
      '</div></div>' +
      '<div class="imp-atual-cronometro">' +
      '<span class="imp-cronometro" id="impCronometro" role="timer">00:00:00</span>' +
      '<button type="button" class="pd-btn pd-btn-alerta" data-imp="finalizar" data-id="' + esc(aberto.id) + '"' + travado + '>' + esc(t('finalizar')) + '</button>' +
      '</div></section>'
    );
  }

  function cartaoCalendario() {
    return (
      '<section class="pd-cartao">' +
      '<div class="imp-cal-barra">' +
      '<button type="button" class="pd-btn pd-btn-icone" data-imp="mesAnterior" aria-label="' + esc(t('cal.anterior')) + '">&#8249;</button>' +
      '<h2 class="imp-cal-titulo">' + esc(DataHora.formatarMesAno(estado.ano, estado.mes)) + '</h2>' +
      '<button type="button" class="pd-btn pd-btn-icone" data-imp="mesProximo" aria-label="' + esc(t('cal.proximo')) + '">&#8250;</button>' +
      '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-imp="hoje">' + esc(t('cal.hoje')) + '</button>' +
      '</div>' +
      grade() +
      '<div class="imp-cal-legenda">' +
      '<span><i class="imp-amostra imp-amostra-registros"></i>' + esc(t('cal.legendaRegistros')) + '</span>' +
      '<span><i class="imp-amostra imp-amostra-aberto"></i>' + esc(t('status.aberto')) + '</span>' +
      '<span><i class="imp-amostra imp-amostra-hoje"></i>' + esc(t('cal.hoje')) + '</span>' +
      '</div></section>'
    );
  }

  function grade() {
    const porDia = Store.porDia(estado.registros);
    const hoje = DataHora.paraData(new Date());
    const primeiroDiaSemana = new Date(estado.ano, estado.mes, 1).getDay();
    const diasNoMes = new Date(estado.ano, estado.mes + 1, 0).getDate();

    let html = DataHora.rotulosSemana()
      .map(function (rotulo) {
        return '<div class="imp-cal-semana">' + esc(rotulo) + '</div>';
      })
      .join('');

    for (let i = 0; i < primeiroDiaSemana; i++) {
      html += '<div class="imp-dia imp-dia-vazio" aria-hidden="true"></div>';
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const chave = DataHora.paraData(new Date(estado.ano, estado.mes, dia));
      const entrada = porDia.get(chave);
      const classes = ['imp-dia'];
      if (chave === hoje) classes.push('imp-dia-hoje');
      if (chave === estado.diaSelecionado) classes.push('imp-dia-selecionado');
      if (entrada) classes.push('imp-dia-com-registro');
      if (entrada && entrada.abertos) classes.push('imp-dia-aberto');
      if (chave > hoje) classes.push('imp-dia-futuro');

      html +=
        '<button type="button" class="' + classes.join(' ') + '" data-imp-dia="' + chave + '"' +
        ' aria-label="' + esc(DataHora.formatarDataLonga(chave)) + '">' +
        '<span class="imp-dia-numero">' + dia + '</span>' +
        (entrada
          ? '<span class="imp-dia-qtd">' + entrada.quantidade + '</span>' +
            '<span class="imp-dia-tempo">' +
            esc(entrada.abertos && !entrada.minutos ? '•' : DataHora.formatarDuracao(entrada.minutos)) +
            '</span>'
          : '') +
        '</button>';
    }

    return '<div class="imp-cal-grade">' + html + '</div>';
  }

  function ligarCronometro(aberto) {
    window.clearInterval(estado.cronometro);
    estado.cronometro = null;
    if (!aberto) return;

    const inicio = DataHora.lerInput(aberto.inicio);
    function tique() {
      const alvo = el('impCronometro');
      if (!alvo) {
        window.clearInterval(estado.cronometro);
        return;
      }
      const segundos = inicio ? (Date.now() - inicio.getTime()) / 1000 : 0;
      alvo.textContent = DataHora.formatarCronometro(segundos);
    }
    tique();
    estado.cronometro = window.setInterval(tique, 1000);
  }

  /* ---------------- dia ---------------- */

  function abrirDia(chave) {
    estado.diaSelecionado = chave;
    render();

    const itens = Store.registrosDoDia(estado.registros, chave);
    const travado = atributoTravado();
    const lista = itens.length
      ? itens
          .map(function (r) {
            const aberto = r.status === Store.STATUS.ABERTO;
            return (
              '<div class="imp-item' + (aberto ? ' imp-item-aberto' : '') + '">' +
              '<div class="imp-item-principal">' +
              '<span class="imp-item-horario">' + esc(DataHora.formatarHora(r.inicio)) + ' → ' +
              (aberto ? '···' : esc(DataHora.formatarHora(r.fim))) +
              ' · <span class="imp-item-duracao">' +
              esc(aberto ? t('status.aberto') : DataHora.formatarDuracao(r.duracao_min)) + '</span></span>' +
              '<span class="imp-item-motivo"><b>' + esc(t('motivoInicio')) + ':</b> ' + esc(r.motivo_inicio || '—') + '</span>' +
              (r.motivo_fim ? '<span class="imp-item-motivo"><b>' + esc(t('motivoFim')) + ':</b> ' + esc(r.motivo_fim) + '</span>' : '') +
              (aberto
                ? ''
                : Roadmap.geraItem(r)
                ? '<span class="imp-item-motivo"><b>' + esc(t('roadmap.secao')) + ':</b> ' +
                  esc(nomeDoModulo(r.modulo)) + ' — ' + esc(r.entregavel) + '</span>'
                : '<span class="pd-tag pd-tag-nao_implementada">' + esc(t('roadmap.incompleto')) + '</span>') +
              '</div>' +
              '<div class="imp-item-acoes">' +
              '<button type="button" class="pd-btn pd-btn-p" data-imp="editar" data-id="' + esc(r.id) + '"' + travado + '>' + esc(t('editar')) + '</button>' +
              '<button type="button" class="pd-btn pd-btn-perigo pd-btn-p" data-imp="excluir" data-id="' + esc(r.id) + '" data-dia="' + chave + '"' + travado + '>' + esc(t('excluir')) + '</button>' +
              '</div></div>'
            );
          })
          .join('')
      : '<p class="imp-item-vazio">' + esc(t('cal.diaVazio')) + '</p>';

    window.UI.abrirModal(
      '<h2 class="pd-modal-titulo">' + esc(t('cal.diaTitulo') + ' ' + DataHora.formatarDataLonga(chave)) + '</h2>' +
      '<div class="imp-lista-dia">' + lista + '</div>' +
      '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
      '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(window.I18N.t('acao.fechar')) + '</button></div>',
      { largo: true }
    );
  }

  /* ---------------- formulário ---------------- */

  function abrirFormulario(modo, id) {
    estado.modo = modo;
    estado.editandoId = id || null;

    const agora = DataHora.agoraInput();
    const registro = id
      ? estado.registros.filter(function (r) { return r.id === id; })[0]
      : null;

    let inicio = agora;
    let motivoInicio = '';
    let fim = modo === 'passado' ? agora : '';
    let motivoFim = '';
    let modulo = '';
    let entregavel = '';
    if (registro) {
      inicio = registro.inicio;
      motivoInicio = registro.motivo_inicio;
      fim = registro.fim || (modo === 'finalizar' ? agora : '');
      motivoFim = registro.motivo_fim || '';
      modulo = registro.modulo || '';
      entregavel = registro.entregavel || '';
    }

    const comFim = modo !== 'iniciar';
    const fimObrigatorio = modo === 'finalizar' || modo === 'passado';

    // O max só é dica para o seletor nativo; a validação de futuro roda no envio.
    window.UI.abrirModal(
      '<form id="impForm" class="imp-form">' +
      '<h2 class="pd-modal-titulo">' + esc(t(modo)) + '</h2>' +
      campoDataHora('impInicio', t('inicio'), inicio, agora, true) +
      campoMotivo('impMotivoInicio', t('motivoInicio'), motivoInicio, t('motivoInicioPlaceholder'), true) +
      (comFim
        ? campoDataHora('impFim', t('termino'), fim, agora, fimObrigatorio) +
          campoMotivo('impMotivoFim', t('motivoFim'), motivoFim, t('motivoFimPlaceholder'), fimObrigatorio) +
          '<p class="imp-duracao">' + esc(t('esforco')) + ': <strong id="impDuracao">—</strong></p>' +
          blocoRoadmap(modulo, entregavel)
        : '') +
      '<div id="impErro" class="pd-alerta-erro" role="alert" hidden></div>' +
      '<div class="pd-modal-acoes"><span class="pd-espaco"></span>' +
      '<button type="button" class="pd-btn" data-acao="fecharModal">' + esc(window.I18N.t('acao.cancelar')) + '</button>' +
      '<button type="submit" id="impSalvar" class="pd-btn pd-btn-primario">' + esc(window.I18N.t('acao.salvar')) + '</button>' +
      '</div></form>'
    );
    atualizarDuracao();
  }

  /**
   * O que vira item do roadmap. Sem o catálogo não há o que escolher, e finalizar sem
   * módulo deixaria o impedimento fora da fila: o bloco dá lugar ao erro, com um botão
   * de tentar de novo. O término já digitado fica no campo — nada se perde na espera.
   *
   * Tudo dentro de #impRoadmap, para o tentar de novo trocar só este pedaço. Módulo e
   * entregável de um registro em edição viajam nos atributos, para voltarem ao seletor.
   */
  function blocoRoadmap(modulo, entregavel) {
    if (!Roadmap.catalogoPronto()) {
      return (
        '<div id="impRoadmap" class="pd-nota" data-modulo="' + esc(modulo) + '" data-entregavel="' + esc(entregavel) + '">' +
        '<span>' + esc(t('roadmap.semCatalogo')) + '</span>' +
        '<button type="button" class="pd-btn pd-btn-p" data-imp="recarregarCatalogo">' + esc(t('roadmap.tentarDeNovo')) + '</button>' +
        '</div>'
      );
    }

    const grupos = Roadmap.porFrente()
      .map(function (grupo) {
        const opcoes = grupo.modulos
          .map(function (m) {
            return (
              '<option value="' + esc(m.modulo) + '"' + (m.modulo === modulo ? ' selected' : '') + '>' +
              esc(m.nome) + '</option>'
            );
          })
          .join('');
        return '<optgroup label="' + esc(t('roadmap.frente' + grupo.frente)) + '">' + opcoes + '</optgroup>';
      })
      .join('');

    return (
      '<div id="impRoadmap" class="imp-roadmap">' +
      '<div class="imp-roadmap-titulo">' + esc(t('roadmap.secao')) + '</div>' +
      '<p class="pd-ajuda">' + esc(t('roadmap.ajuda')) + '</p>' +
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="impModulo">' + esc(t('roadmap.modulo')) + '</label>' +
      '<select id="impModulo" class="pd-campo">' +
      '<option value="">' + esc(t('roadmap.moduloVazio')) + '</option>' + grupos + '</select></div>' +
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="impEntregavel">' + esc(t('roadmap.entregavel')) + '</label>' +
      '<textarea id="impEntregavel" class="pd-campo" rows="3" placeholder="' + esc(t('roadmap.entregavelPlaceholder')) + '">' +
      esc(entregavel) + '</textarea></div>' +
      '</div>'
    );
  }

  function nomeDoModulo(chave) {
    const modulo = Roadmap.moduloPorChave(chave);
    return modulo ? modulo.nome : chave;
  }

  function campoDataHora(id, rotulo, valor, max, obrigatorio) {
    return (
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="' + id + '">' + esc(rotulo) + '</label>' +
      '<div class="pd-campo-com-botao">' +
      '<input id="' + id + '" class="pd-campo" type="datetime-local" value="' + esc(valor) + '" max="' + esc(max) + '"' +
      (obrigatorio ? ' required' : '') + '>' +
      '<button type="button" class="pd-btn pd-btn-p" data-imp-agora="' + id + '">' + esc(t('agora')) + '</button>' +
      '</div></div>'
    );
  }

  function campoMotivo(id, rotulo, valor, placeholder, obrigatorio) {
    return (
      '<div class="pd-campo-grupo"><label class="pd-rotulo" for="' + id + '">' + esc(rotulo) + '</label>' +
      '<textarea id="' + id + '" class="pd-campo" rows="2" placeholder="' + esc(placeholder) + '"' +
      (obrigatorio ? ' required' : '') + '>' + esc(valor) + '</textarea></div>'
    );
  }

  function atualizarDuracao() {
    const alvo = el('impDuracao');
    if (!alvo) return;
    const minutos = DataHora.diferencaMinutos(el('impInicio').value, el('impFim').value);
    alvo.textContent = minutos === null ? '—' : DataHora.formatarDuracao(minutos);
  }

  function mostrarErro(mensagem) {
    const caixa = el('impErro');
    if (!caixa) return;
    caixa.textContent = mensagem;
    caixa.hidden = !mensagem;
  }

  /**
   * Regras de preenchimento. Devolve a mensagem de erro, ou null.
   * O futuro é conferido com o relógio do envio, não o da abertura — um
   * formulário aberto há muito tempo não pode virar data futura.
   */
  function validar(dados) {
    const inicio = DataHora.lerInput(dados.inicio);
    if (!inicio) return t('erro.dataFutura');

    const limite = Date.now() + 60 * 1000;
    if (inicio.getTime() > limite) return t('erro.dataFutura');
    if (!dados.motivo_inicio.trim()) return t('erro.motivo');

    if (dados.fim) {
      const fim = DataHora.lerInput(dados.fim);
      if (!fim || fim.getTime() > limite) return t('erro.dataFutura');
      if (fim.getTime() < inicio.getTime()) return t('erro.terminoAntes');
      if (!dados.motivo_fim.trim()) return t('erro.motivo');

      // Todo impedimento finalizado vira item do roadmap: sem módulo e sem entregável
      // não há item que se escreva. Sem o catálogo também não se finaliza — é o que
      // impede um soluço de rede de deixar o registro fora da fila sem ninguém saber.
      if (!Roadmap.catalogoPronto()) return t('erro.semCatalogo');
      if (!dados.modulo) return t('erro.modulo');
      if ((dados.entregavel || '').trim().length < Roadmap.MIN_ENTREGAVEL) {
        return t('erro.entregavel', { n: Roadmap.MIN_ENTREGAVEL });
      }
    }
    return null;
  }

  function mensagemDeCommit(modo) {
    const quem = estado.usuario;
    const mapa = {
      iniciar: 'impedimento: inicio (' + quem + ')',
      finalizar: 'impedimento: finalizacao (' + quem + ')',
      passado: 'impedimento: registro retroativo (' + quem + ')',
      editar: 'impedimento: edicao (' + quem + ')',
      excluir: 'impedimento: exclusao (' + quem + ')',
    };
    return mapa[modo] || 'impedimento: alteracao (' + quem + ')';
  }

  function salvarFormulario(evento) {
    evento.preventDefault();

    if (!window.Github.temToken()) {
      window.UI.fecharModal();
      window.App.abrirModalToken();
      return;
    }

    const campoFim = el('impFim');
    const dados = {
      inicio: el('impInicio').value,
      motivo_inicio: el('impMotivoInicio').value,
      fim: campoFim ? campoFim.value : '',
      motivo_fim: campoFim ? el('impMotivoFim').value : '',
    };
    // Só entram quando os campos estão na tela: sem eles, a edição preserva o que havia.
    if (el('impModulo')) dados.modulo = el('impModulo').value;
    if (el('impEntregavel')) dados.entregavel = el('impEntregavel').value;

    const problema = validar(dados);
    if (problema) {
      mostrarErro(problema);
      return;
    }
    mostrarErro('');

    const botao = el('impSalvar');
    botao.disabled = true;
    botao.textContent = t('gravando');

    const modo = estado.modo;
    const editandoId = estado.editandoId;
    const usuario = estado.usuario;
    // O registro é montado aqui, fora do mutador: numa releitura por conflito o id
    // precisa ser o mesmo, porque é ele que amarra a linha da fila do roadmap.
    const novoRegistro =
      modo === 'iniciar' || modo === 'passado'
        ? Store.montarRegistro(Object.assign({ usuario: usuario }, dados))
        : null;
    const alvoId = editandoId || (novoRegistro && novoRegistro.id);
    const anterior = estado.registros.filter(function (r) { return r.id === alvoId; })[0];
    const tinhaItem = Roadmap.geraItem(anterior);
    window.App.sinalizarGravacao('gravando');

    Store.alterarUsuario(usuario, mensagemDeCommit(modo), function (registros) {
      if (modo === 'iniciar' && Store.emAberto(registros)) throw new Error('ja-aberto');
      if (modo === 'iniciar' || modo === 'passado') {
        return registros.concat([novoRegistro]);
      }
      const indice = registros.findIndex(function (r) { return r.id === editandoId; });
      // O registro sumiu (excluído em outra aba): nada a alterar.
      if (indice === -1) return null;
      const atualizado = Object.assign({}, registros[indice], dados, { atualizado_em: new Date().toISOString() });
      // Tirar o término de um registro não pode deixar dois impedimentos em andamento.
      const outroAberto = registros.some(function (r, i) {
        return i !== indice && r.status === Store.STATUS.ABERTO;
      });
      if (!atualizado.fim && outroAberto) throw new Error('ja-aberto');
      return registros.map(function (r, i) { return i === indice ? atualizado : r; });
    })
      .then(function (resultado) {
        estado.registros = resultado.registros;
        if (resultado.abortado) {
          window.App.sinalizarGravacao('ocioso');
          window.UI.toast(t('erro.sumiu'), 'erro');
        } else {
          window.App.sinalizarGravacao('salvo');
          window.UI.toast(t('gravado'), 'ok');
        }
        window.UI.fecharModal();
        if (ativo()) render();
        if (!resultado.abortado) sincronizarRoadmap(alvoId, tinhaItem);
      })
      .catch(function (erro) {
        if (erro.message === 'ja-aberto') {
          window.App.sinalizarGravacao('ocioso');
          mostrarErro(t('erro.jaAberto'));
          recarregar().then(function () {
            if (ativo()) render();
          });
        } else {
          window.App.sinalizarGravacao('erro', erro);
          mostrarErro((t('erro.gravar') + ' ' + (erro.message || '')).trim());
        }
      })
      .then(function () {
        const ainda = el('impSalvar');
        if (ainda) {
          ainda.disabled = false;
          ainda.textContent = window.I18N.t('acao.salvar');
        }
      });
  }

  /**
   * O impedimento já está gravado; a linha da fila vai depois, em segundo plano. Falhar
   * aqui não desfaz nada: módulo e entregável ficam no CSV do impedimento, e a linha é
   * reconstruível.
   */
  function sincronizarRoadmap(id, tinhaItem) {
    const registro = estado.registros.filter(function (r) { return r.id === id; })[0];
    if (Roadmap.geraItem(registro)) {
      Roadmap.enfileirar(Roadmap.linhaDoRegistro(registro, window.Auth.nomeDe(registro.usuario)));
      return;
    }
    // Reaberto ou esvaziado: a linha fica na fila, marcada, para o roadmap saber.
    if (tinhaItem) Roadmap.cancelar(id);
  }

  function excluir(id, dia) {
    if (!window.Github.temToken()) {
      window.UI.fecharModal();
      window.App.abrirModalToken();
      return;
    }

    if (!window.confirm(t('excluirConfirma'))) return;

    const tinhaItem = Roadmap.geraItem(estado.registros.filter(function (r) { return r.id === id; })[0]);
    window.App.sinalizarGravacao('gravando');
    Store.alterarUsuario(estado.usuario, mensagemDeCommit('excluir'), function (registros) {
      return registros.filter(function (r) { return r.id !== id; });
    })
      .then(function (resultado) {
        estado.registros = resultado.registros;
        window.App.sinalizarGravacao('salvo');
        window.UI.toast(t('gravado'), 'ok');
        if (tinhaItem) Roadmap.cancelar(id);
        if (ativo()) abrirDia(dia);
      })
      .catch(function (erro) {
        window.App.sinalizarGravacao('erro', erro);
        window.UI.toast((t('erro.gravar') + ' ' + (erro.message || '')).trim(), 'erro');
      });
  }

  /**
   * Lê o catálogo de novo e troca só o bloco do roadmap. O resto do formulário —
   * término, motivo — fica como a pessoa deixou.
   */
  function tentarCatalogo(botao) {
    const bloco = el('impRoadmap');
    if (!bloco) return;
    const modulo = bloco.getAttribute('data-modulo') || '';
    const entregavel = bloco.getAttribute('data-entregavel') || '';
    botao.disabled = true;
    botao.textContent = t('roadmap.tentando');
    Roadmap.carregarModulos(true).then(function () {
      const atual = el('impRoadmap');
      // O formulário foi fechado durante a espera: não há onde desenhar.
      if (!atual) return;
      atual.outerHTML = blocoRoadmap(modulo, entregavel);
      if (Roadmap.catalogoPronto()) mostrarErro('');
      else window.UI.toast(t('roadmap.aindaSemCatalogo'), 'erro');
    });
  }

  /* ---------------- eventos ---------------- */

  function mudarMes(delta) {
    const data = new Date(estado.ano, estado.mes + delta, 1);
    estado.ano = data.getFullYear();
    estado.mes = data.getMonth();
    render();
  }

  function aoClicar(evento) {
    if (!ativo()) return;

    const agora = evento.target.closest('[data-imp-agora]');
    if (agora) {
      const campo = el(agora.getAttribute('data-imp-agora'));
      if (campo) campo.value = DataHora.paraInput(new Date());
      atualizarDuracao();
      return;
    }

    const dia = evento.target.closest('[data-imp-dia]');
    if (dia) return abrirDia(dia.getAttribute('data-imp-dia'));

    const acao = evento.target.closest('[data-imp]');
    if (!acao) return;
    const nome = acao.getAttribute('data-imp');
    const id = acao.getAttribute('data-id');

    if (nome === 'iniciar' || nome === 'passado') return abrirFormulario(nome);
    if (nome === 'finalizar' || nome === 'editar') return abrirFormulario(nome, id);
    if (nome === 'excluir') return excluir(id, acao.getAttribute('data-dia'));
    if (nome === 'recarregarCatalogo') return tentarCatalogo(acao);
    if (nome === 'mesAnterior') return mudarMes(-1);
    if (nome === 'mesProximo') return mudarMes(1);
    if (nome === 'hoje') {
      irParaHoje();
      render();
    }
  }

  function iniciar() {
    document.addEventListener('click', aoClicar);
    document.addEventListener('submit', function (evento) {
      if (evento.target.id === 'impForm') salvarFormulario(evento);
    });
    ['change', 'input'].forEach(function (tipo) {
      document.addEventListener(tipo, function (evento) {
        if (evento.target.id === 'impInicio' || evento.target.id === 'impFim') atualizarDuracao();
      });
    });
  }

  I.Calendario = {
    iniciar: iniciar,
    entrar: entrar,
    sair: sair,
    recarregar: recarregar,
    carregado: carregado,
    render: render,
  };
})();
