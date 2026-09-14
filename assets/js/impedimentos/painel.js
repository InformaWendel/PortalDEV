/**
 * Controle de Impedimentos — painel consolidado: junta os CSV de todos os
 * usuários e monta indicadores, gráficos interativos e a tabela detalhada, com
 * filtros cruzados.
 */
(function () {
  'use strict';

  const I = window.Impedimentos;
  const DataHora = I.DataHora;
  const Graficos = I.Graficos;
  const Store = I.Store;
  const esc = window.UI.esc;
  const el = window.UI.el;

  function t(chave, valores) {
    return window.I18N.t('imp.' + chave, valores);
  }

  const estado = {
    registros: [],
    erros: [],
    erro: '',
    carregado: false,
    carregando: false,
    iniciado: false,
    filtros: filtrosVazios(),
  };

  let temporizadorBusca = null;

  function filtrosVazios() {
    return { de: '', ate: '', status: '', busca: '', usuarios: [] };
  }

  function ativo() {
    return window.App.ferramentaAtual() === 'impedimentos' && I.Telas.abaAtual() === 'painel';
  }

  /**
   * Todo o cadastro, ativo ou não: quem saiu da equipe ou mudou de papel continua
   * com o histórico contando no painel.
   */
  function usuariosDoPainel() {
    return window.Auth.estado.usuarios.slice().sort(function (a, b) {
      return a.nome.localeCompare(b.nome, window.I18N.locale);
    });
  }

  /* ---------------- carga ---------------- */

  /** Padrão: últimos 30 dias. "Limpar filtros" abre para todo o histórico. */
  function aplicarIntervaloPadrao() {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 29);
    estado.filtros.de = DataHora.paraData(inicio);
    estado.filtros.ate = DataHora.paraData(hoje);
  }

  function entrar() {
    if (!estado.iniciado) {
      aplicarIntervaloPadrao();
      estado.iniciado = true;
    }
    if (!estado.carregado && !estado.carregando) return recarregar();
    return null;
  }

  function recarregar() {
    estado.carregando = true;
    if (ativo()) renderStatus();
    const logins = usuariosDoPainel().map(function (u) {
      return u.usuario;
    });
    return Store.carregarVarios(logins)
      .then(
        function (r) {
          estado.registros = r.registros;
          estado.erros = r.erros;
          estado.erro = '';
        },
        function (erro) {
          estado.erro = t('erro.carregar') + ' ' + (erro.message || '');
        }
      )
      .then(function () {
        estado.carregando = false;
        estado.carregado = true;
      });
  }

  function carregado() {
    return estado.carregado;
  }

  /* ---------------- filtros ---------------- */

  /** Lista de usuários vazia significa "todos", não "nenhum". */
  function filtrados() {
    const f = estado.filtros;
    const agulha = window.UI.normalizar(f.busca.trim());
    return estado.registros.filter(function (r) {
      const dia = DataHora.chaveDia(r.inicio);
      if (!dia) return false;
      if (f.de && dia < f.de) return false;
      if (f.ate && dia > f.ate) return false;
      if (f.status && r.status !== f.status) return false;
      if (f.usuarios.length && f.usuarios.indexOf(r.usuario) === -1) return false;
      if (agulha && window.UI.normalizar(r.motivo_inicio + ' ' + r.motivo_fim).indexOf(agulha) === -1) return false;
      return true;
    });
  }

  function alternarUsuario(login) {
    const lista = estado.filtros.usuarios;
    const indice = lista.indexOf(login);
    if (indice === -1) lista.push(login);
    else lista.splice(indice, 1);
    sincronizarChips();
    renderResultados();
  }

  function sincronizarChips() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-imp-painel-usuario]'), function (botao) {
      const ligado = estado.filtros.usuarios.indexOf(botao.getAttribute('data-imp-painel-usuario')) !== -1;
      botao.classList.toggle('imp-usuario-ativo', ligado);
      botao.setAttribute('aria-pressed', String(ligado));
    });
  }

  /* ---------------- render ---------------- */

  function render() {
    const f = estado.filtros;
    const opcoesStatus = ['', Store.STATUS.ABERTO, Store.STATUS.FINALIZADO]
      .map(function (valor) {
        return (
          '<option value="' + valor + '"' + (f.status === valor ? ' selected' : '') + '>' +
          esc(valor ? t('status.' + valor) : t('painel.todas')) + '</option>'
        );
      })
      .join('');

    const chips = usuariosDoPainel()
      .map(function (u) {
        const ligado = f.usuarios.indexOf(u.usuario) !== -1;
        return (
          '<button type="button" class="imp-usuario' + (ligado ? ' imp-usuario-ativo' : '') + '"' +
          ' data-imp-painel-usuario="' + esc(u.usuario) + '" aria-pressed="' + ligado + '">' + esc(u.nome) + '</button>'
        );
      })
      .join('');

    el('vista').innerHTML =
      '<div class="imp-pilha">' +
      '<section class="pd-cartao">' +
      '<div class="imp-filtros">' +
      '<label class="imp-filtro"><span class="pd-rotulo">' + esc(t('painel.de')) + '</span>' +
      '<input id="impDe" class="pd-campo" type="date" value="' + esc(f.de) + '"></label>' +
      '<label class="imp-filtro"><span class="pd-rotulo">' + esc(t('painel.ate')) + '</span>' +
      '<input id="impAte" class="pd-campo" type="date" value="' + esc(f.ate) + '"></label>' +
      '<label class="imp-filtro"><span class="pd-rotulo">' + esc(t('painel.situacao')) + '</span>' +
      '<select id="impStatus" class="pd-campo">' + opcoesStatus + '</select></label>' +
      '<label class="imp-filtro imp-filtro-largo"><span class="pd-rotulo">' + esc(t('painel.busca')) + '</span>' +
      '<input id="impBusca" class="pd-campo" type="search" autocomplete="off" value="' + esc(f.busca) + '"></label>' +
      '<div class="imp-filtros-acoes">' +
      '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-imp-painel="limpar">' + esc(t('painel.limpar')) + '</button>' +
      '<button type="button" class="pd-btn pd-btn-p" data-imp-painel="atualizar">' + esc(t('painel.atualizar')) + '</button>' +
      '</div></div>' +
      '<div class="imp-filtros-usuarios"><span class="pd-rotulo">' + esc(t('painel.usuarios')) + '</span>' +
      '<div class="imp-usuarios">' + chips + '</div></div>' +
      '</section>' +
      '<div id="impPainelStatus"></div>' +
      '<div id="impResultados" class="imp-pilha"></div>' +
      '</div>';

    renderStatus();
    renderResultados();
  }

  function renderStatus() {
    const caixa = el('impPainelStatus');
    if (!caixa) return;
    let html = '';
    if (estado.carregando) {
      html = '<div class="pd-aviso pd-aviso-info"><div class="pd-aviso-texto">' + esc(t('painel.carregando')) + '</div></div>';
    } else if (estado.erro) {
      html = '<div class="pd-aviso pd-aviso-erro"><div class="pd-aviso-texto">' + esc(estado.erro) + '</div></div>';
    } else if (estado.erros.length) {
      const nomes = estado.erros.map(function (e) { return window.Auth.nomeDe(e.usuario); }).join(', ');
      html = '<div class="pd-aviso pd-aviso-erro"><div class="pd-aviso-texto">' + esc(t('painel.parcial') + ' ' + nomes) + '</div></div>';
    }
    caixa.innerHTML = html;
  }

  function renderResultados() {
    const caixa = el('impResultados');
    if (!caixa) return;
    Graficos.esconderDica();
    if (!estado.carregado) {
      caixa.innerHTML = '';
      return;
    }

    const linhas = filtrados();
    caixa.innerHTML =
      indicadores(linhas) +
      '<div class="imp-graficos">' +
      cartaoGrafico('impGrafEsforco', t('painel.graficoEsforcoUsuario'), t('painel.cliqueFiltra'), false) +
      cartaoGrafico('impGrafQtd', t('painel.graficoQtdUsuario'), t('painel.cliqueFiltra'), false) +
      cartaoGrafico('impGrafDia', t('painel.graficoEsforcoDia'), '', true) +
      cartaoGrafico('impGrafMotivos', t('painel.graficoMotivos'), '', true) +
      '</div>' +
      tabela(linhas);

    desenharGraficos(linhas);
  }

  function indicadores(linhas) {
    const finalizados = linhas.filter(function (r) { return r.status === Store.STATUS.FINALIZADO; });
    const minutos = finalizados.reduce(function (soma, r) { return soma + (Number(r.duracao_min) || 0); }, 0);
    const abertos = linhas.length - finalizados.length;
    const pessoas = new Set(linhas.map(function (r) { return r.usuario; })).size;
    const medio = finalizados.length ? minutos / finalizados.length : 0;

    const itens = [
      { rotulo: t('painel.kpiTotal'), valor: DataHora.formatarNumero(linhas.length), classe: '' },
      { rotulo: t('painel.kpiEsforco'), valor: DataHora.formatarDuracao(minutos), classe: 'pd-kpi-info' },
      { rotulo: t('painel.kpiMedio'), valor: DataHora.formatarDuracao(medio), classe: '' },
      { rotulo: t('painel.kpiAbertos'), valor: DataHora.formatarNumero(abertos), classe: abertos ? 'pd-kpi-atencao' : '' },
      { rotulo: t('painel.kpiUsuarios'), valor: DataHora.formatarNumero(pessoas), classe: '' },
    ];

    return (
      '<div class="pd-kpis pd-kpis-compactos">' +
      itens
        .map(function (k) {
          return (
            '<div class="pd-kpi ' + k.classe + '"><div class="pd-kpi-rotulo">' + esc(k.rotulo) + '</div>' +
            '<div class="pd-kpi-valor">' + esc(k.valor) + '</div></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function cartaoGrafico(id, titulo, ajuda, largo) {
    return (
      '<section class="pd-cartao imp-grafico' + (largo ? ' imp-grafico-largo' : '') + '">' +
      '<h3 class="imp-grafico-titulo">' + esc(titulo) + '</h3>' +
      (ajuda ? '<p class="imp-grafico-ajuda">' + esc(ajuda) + '</p>' : '') +
      '<div class="imp-grafico-corpo" id="' + id + '"></div></section>'
    );
  }

  function desenharGraficos(linhas) {
    const vazio = t('painel.vazio');

    const porUsuario = new Map();
    linhas.forEach(function (r) {
      const entrada = porUsuario.get(r.usuario) || { minutos: 0, quantidade: 0 };
      entrada.minutos += Number(r.duracao_min) || 0;
      entrada.quantidade += 1;
      porUsuario.set(r.usuario, entrada);
    });
    const itensUsuario = Array.from(porUsuario.entries()).map(function (par) {
      return { chave: par[0], rotulo: window.Auth.nomeDe(par[0]), minutos: par[1].minutos, quantidade: par[1].quantidade };
    });
    const maxUsuarios = Math.max(1, usuariosDoPainel().length);

    Graficos.barrasHorizontais(
      el('impGrafEsforco'),
      itensUsuario.map(function (u) { return { chave: u.chave, rotulo: u.rotulo, valor: u.minutos }; }),
      {
        formatarValor: DataHora.formatarDuracao,
        aoSelecionar: alternarUsuario,
        selecionados: estado.filtros.usuarios,
        mensagemVazia: vazio,
        maxItens: maxUsuarios,
        titulo: t('painel.graficoEsforcoUsuario'),
      }
    );

    Graficos.barrasHorizontais(
      el('impGrafQtd'),
      itensUsuario.map(function (u) { return { chave: u.chave, rotulo: u.rotulo, valor: u.quantidade }; }),
      {
        formatarValor: function (v) { return DataHora.formatarNumero(v); },
        aoSelecionar: alternarUsuario,
        selecionados: estado.filtros.usuarios,
        mensagemVazia: vazio,
        maxItens: maxUsuarios,
        titulo: t('painel.graficoQtdUsuario'),
      }
    );

    // Série diária com todos os dias do intervalo, inclusive os zerados, para
    // que os vazios apareçam como vale em vez de sumirem do gráfico.
    const porDia = new Map();
    linhas.forEach(function (r) {
      const chave = DataHora.chaveDia(r.inicio);
      porDia.set(chave, (porDia.get(chave) || 0) + (Number(r.duracao_min) || 0));
    });
    const chaves = Array.from(porDia.keys()).sort();
    const serie = [];
    if (chaves.length) {
      const MAX_PONTOS = 400;
      const formatoDia = new Intl.DateTimeFormat(window.I18N.locale, { day: '2-digit', month: '2-digit' });
      const ultimo = new Date((estado.filtros.ate || chaves[chaves.length - 1]) + 'T00:00:00');
      let primeiro = new Date((estado.filtros.de || chaves[0]) + 'T00:00:00');

      // Um SVG com milhares de pontos trava a página. Passando do limite ficam
      // os dias MAIS RECENTES — cortar pelo começo esconderia os registros novos.
      if (Math.floor((ultimo - primeiro) / 86400000) + 1 > MAX_PONTOS) {
        primeiro = new Date(ultimo);
        primeiro.setDate(primeiro.getDate() - (MAX_PONTOS - 1));
      }

      const cursor = new Date(primeiro);
      while (cursor <= ultimo) {
        const chave = DataHora.paraData(cursor);
        serie.push({ chave: chave, rotulo: formatoDia.format(cursor), valor: porDia.get(chave) || 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    Graficos.serieArea(el('impGrafDia'), serie, {
      formatarValor: DataHora.formatarDuracao,
      mensagemVazia: vazio,
      titulo: t('painel.graficoEsforcoDia'),
    });

    // Motivos: agrupa ignorando caixa, acento e espaços extras.
    const porMotivo = new Map();
    linhas.forEach(function (r) {
      const bruto = (r.motivo_inicio || '').trim();
      if (!bruto) return;
      const chave = window.UI.normalizar(bruto).replace(/\s+/g, ' ');
      const entrada = porMotivo.get(chave) || { rotulo: bruto, minutos: 0 };
      entrada.minutos += Number(r.duracao_min) || 0;
      porMotivo.set(chave, entrada);
    });
    Graficos.barrasHorizontais(
      el('impGrafMotivos'),
      Array.from(porMotivo.entries()).map(function (par) {
        return { chave: par[0], rotulo: par[1].rotulo, valor: par[1].minutos };
      }),
      { formatarValor: DataHora.formatarDuracao, mensagemVazia: vazio, maxItens: 10, titulo: t('painel.graficoMotivos') }
    );
  }

  function tabela(linhas) {
    const corpo = linhas.length
      ? linhas
          .map(function (r) {
            const aberto = r.status === Store.STATUS.ABERTO;
            return (
              '<tr>' +
              '<td class="pd-cel-nowrap">' + esc(window.Auth.nomeDe(r.usuario)) + '</td>' +
              '<td class="pd-cel-nowrap">' + esc(DataHora.formatarDataHora(r.inicio)) + '</td>' +
              '<td class="pd-cel-nowrap">' + (aberto ? '—' : esc(DataHora.formatarDataHora(r.fim))) + '</td>' +
              '<td class="pd-cel-nowrap">' + (aberto ? '—' : esc(DataHora.formatarDuracao(r.duracao_min))) + '</td>' +
              '<td class="pd-cel-motivo">' + esc(r.motivo_inicio) + '</td>' +
              '<td class="pd-cel-motivo">' + esc(r.motivo_fim || '—') + '</td>' +
              '<td><span class="pd-tag pd-tag-' + (aberto ? 'aberto' : 'finalizado') + '">' + esc(t('status.' + r.status)) + '</span></td>' +
              '</tr>'
            );
          })
          .join('')
      : '<tr><td colspan="7" class="pd-vazio">' + esc(t('painel.vazio')) + '</td></tr>';

    return (
      '<section class="pd-cartao">' +
      '<div class="imp-tabela-topo"><h3 class="pd-secao-titulo">' + esc(t('painel.tabela')) + '</h3>' +
      '<button type="button" class="pd-btn pd-btn-p" data-imp-painel="exportar">' + esc(t('painel.exportar')) + '</button></div>' +
      '<div class="imp-tabela-rolagem"><table class="pd-tabela"><thead><tr>' +
      '<th>' + esc(t('usuario')) + '</th>' +
      '<th>' + esc(t('inicio')) + '</th>' +
      '<th>' + esc(t('termino')) + '</th>' +
      '<th>' + esc(t('esforco')) + '</th>' +
      '<th>' + esc(t('motivoInicio')) + '</th>' +
      '<th>' + esc(t('motivoFim')) + '</th>' +
      '<th>' + esc(t('situacao')) + '</th>' +
      '</tr></thead><tbody>' + corpo + '</tbody></table></div></section>'
    );
  }

  /* ---------------- eventos ---------------- */

  function exportar() {
    const linhas = filtrados();
    if (!linhas.length) {
      window.UI.toast(t('painel.vazio'));
      return;
    }
    const nome = 'impedimentos-consolidado-' + DataHora.paraData(new Date()) + '.csv';
    window.UI.baixarArquivo(nome, window.CSV.serialize(linhas, Store.COLUNAS), { bom: true });
  }

  function iniciar() {
    document.addEventListener('click', function (evento) {
      if (!ativo()) return;

      const chip = evento.target.closest('[data-imp-painel-usuario]');
      if (chip) return alternarUsuario(chip.getAttribute('data-imp-painel-usuario'));

      const acao = evento.target.closest('[data-imp-painel]');
      if (!acao) return;
      const nome = acao.getAttribute('data-imp-painel');

      if (nome === 'limpar') {
        estado.filtros = filtrosVazios();
        return render();
      }
      if (nome === 'atualizar') {
        return recarregar().then(function () {
          if (ativo()) render();
        });
      }
      if (nome === 'exportar') exportar();
    });

    document.addEventListener('change', function (evento) {
      if (!ativo()) return;
      const id = evento.target.id;
      if (id === 'impDe') estado.filtros.de = evento.target.value;
      else if (id === 'impAte') estado.filtros.ate = evento.target.value;
      else if (id === 'impStatus') estado.filtros.status = evento.target.value;
      else return;
      renderResultados();
    });

    document.addEventListener('input', function (evento) {
      if (!ativo() || evento.target.id !== 'impBusca') return;
      const valor = evento.target.value;
      window.clearTimeout(temporizadorBusca);
      temporizadorBusca = window.setTimeout(function () {
        estado.filtros.busca = valor;
        renderResultados();
      }, 250);
    });

    // Os gráficos são desenhados na largura do cartão: mudou a janela, redesenha.
    let larguraAnterior = window.innerWidth;
    let temporizadorJanela = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(temporizadorJanela);
      temporizadorJanela = window.setTimeout(function () {
        if (window.innerWidth === larguraAnterior) return;
        larguraAnterior = window.innerWidth;
        if (ativo() && estado.carregado && el('impGrafEsforco')) desenharGraficos(filtrados());
      }, 200);
    });
  }

  I.Painel = {
    iniciar: iniciar,
    entrar: entrar,
    recarregar: recarregar,
    carregado: carregado,
    render: render,
  };
})();
