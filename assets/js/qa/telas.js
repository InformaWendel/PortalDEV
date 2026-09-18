/**
 * Portal QA — telas e interação, dentro do Portal DEV.
 * Sem framework: o portal precisa rodar como página estática no GitHub Pages.
 *
 * Rotas (hash):
 *   #/qa               visão geral — dashboard de todos os projetos e testes em aberto
 *   #/qa/guia          guia de uso
 *   #/qa/p/<id>        painel do projeto
 *   #/qa/p/<id>/casos  plano executável do projeto: seções, passos e a conferência do QA
 */
(function () {
  'use strict';

  const Store = window.QA.Store;
  const Textos = window.QA.Textos;
  const esc = window.UI.esc;
  const el = window.UI.el;

  function t(chave, valores) {
    return window.I18N.t('qa.' + chave, valores);
  }

  const CORES_STATUS = {
    nao_testado: 'var(--pd-text-fraco)',
    em_teste: 'var(--pd-info)',
    liberada: 'var(--pd-ok)',
    devolvida: 'var(--pd-erro)',
    bloqueada: 'var(--pd-roxo)',
    nao_implementada: 'var(--pd-alerta)',
    nao_aplicavel: 'var(--pd-border-forte)',
  };

  const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2 };

  const vista = {
    rota: 'inicio',
    projetoId: null,
    selecionado: null,
    /** caso escolhido na árvore de abertos, a abrir quando o catálogo do projeto aparecer */
    abrirAoEntrar: null,
    /** caso a trazer para a vista no próximo desenho do plano */
    rolarAte: null,
    filtros: filtrosVazios(),
  };

  /* ---------------- utilitários ---------------- */

  function filtrosVazios() {
    return { busca: '', modulo: '', status: '', prioridade: '', tipo: '', retrabalho: '', verificacao: '' };
  }

  function pct(fracao) {
    return Math.round(fracao * 100);
  }

  function titulo(caso) {
    return window.I18N.campo(caso, 'titulo') || caso.id;
  }

  function criterio(caso) {
    return window.I18N.campo(caso, 'criterio');
  }

  function passos(caso) {
    return window.I18N.campo(caso, 'passos');
  }

  function voltas(caso) {
    return parseInt(caso.devolucoes, 10) || 0;
  }

  /** Prioridade desconhecida vai para o fim — sem confundir "alta" (0) com ausência. */
  function ordemPrioridade(prioridade) {
    return Object.prototype.hasOwnProperty.call(ORDEM_PRIORIDADE, prioridade) ? ORDEM_PRIORIDADE[prioridade] : 3;
  }

  /** Nome de quem está logado — assina o teste. */
  function nomeDaSessao() {
    return window.Auth.sessao ? window.Auth.sessao.nome : '';
  }

  function podeRegistrar() {
    return window.Acesso.pode('qa.registrar');
  }

  /** Registrar exige o papel certo e um token de escrita. */
  function podeGravar() {
    return window.Github.temToken() && podeRegistrar();
  }

  function ativo() {
    return !!window.App && window.App.ferramentaAtual() === 'qa';
  }

  /* ---------------- rota ---------------- */

  function interpretar(segmentos) {
    const partes = segmentos.slice(1);
    if (!partes.length) return { rota: 'inicio', projetoId: null };
    if (partes[0] === 'guia') return { rota: 'guia', projetoId: null };
    if (partes[0] === 'p' && partes[1]) {
      return { rota: partes[2] === 'casos' ? 'casos' : 'painel', projetoId: partes[1] };
    }
    return { rota: 'inicio', projetoId: null };
  }

  function entrar(segmentos) {
    const nova = interpretar(segmentos);
    if (nova.projetoId !== vista.projetoId) {
      fecharGaveta();
      vista.filtros = filtrosVazios();
      if (nova.projetoId && vista.abrirAoEntrar) {
        vista.selecionado = vista.abrirAoEntrar;
        vista.rolarAte = vista.abrirAoEntrar;
      }
    }
    vista.abrirAoEntrar = null;
    vista.rota = nova.rota;
    vista.projetoId = nova.projetoId;
    if (!Store.estado.carregado) return Store.carregar();
    // Catálogo cuja leitura falhou na carga inicial é relido quando alguém entra no projeto.
    if (vista.projetoId && Store.projetoPorId(vista.projetoId) && !Store.estado.catalogos[vista.projetoId]) {
      return Store.carregarCatalogo(vista.projetoId);
    }
    return null;
  }

  function sair() {
    fecharGaveta();
    vista.projetoId = null;
    vista.rota = 'inicio';
  }

  /** Só relê o que já foi carregado: quem nunca abriu o QA não precisa baixar os catálogos. */
  function recarregar() {
    return Store.estado.carregado ? Store.carregar(true) : null;
  }

  function descarregar() {
    return Store.gravarTudo();
  }

  function permitido() {
    return window.Acesso.pode('qa.consultar');
  }

  function projetoAtual() {
    return vista.projetoId ? Store.projetoPorId(vista.projetoId) : null;
  }

  /* ---------------- partes da casca do portal ---------------- */

  function abas() {
    const projeto = projetoAtual();
    if (projeto) {
      return [
        { chave: 'voltar', rotulo: '← ' + t('nav.voltar'), hash: '#/qa', voltar: true },
        { chave: 'painel', rotulo: t('nav.painel'), hash: '#/qa/p/' + projeto.id },
        { chave: 'casos', rotulo: t('nav.casos'), hash: '#/qa/p/' + projeto.id + '/casos' },
        { chave: 'guia', rotulo: t('nav.guia'), hash: '#/qa/guia' },
      ];
    }
    return [
      { chave: 'inicio', rotulo: t('nav.inicio'), hash: '#/qa' },
      { chave: 'guia', rotulo: t('nav.guia'), hash: '#/qa/guia' },
    ];
  }

  function abaAtual() {
    return vista.rota;
  }

  function subtitulo() {
    const projeto = projetoAtual();
    return projeto ? t('app.nome') + ' · ' + projeto.nome : t('app.nome');
  }

  function acoes() {
    return projetoAtual()
      ? '<button type="button" class="pd-btn pd-btn-p" data-qa="exportar">' + esc(t('acao.exportar')) + '</button>'
      : '';
  }

  /** O selo mostra "somente consulta" para quem vê o QA sem poder registrar. */
  function somenteLeitura() {
    return !podeRegistrar();
  }

  function banner() {
    const erro = Store.estado.erro;
    if (!erro || Store.estado.gravacao !== 'erro') return '';
    return (
      '<div class="pd-aviso pd-aviso-erro"><div class="pd-aviso-texto">' +
      '<div class="pd-aviso-titulo">' + esc(t('erro.gravacaoTitulo')) + '</div>' +
      '<div class="pd-aviso-detalhe">' + esc(erro.message || '') + '</div></div>' +
      (erro.credencial
        ? '<button type="button" class="pd-btn pd-btn-p" data-acao="token">' + esc(window.I18N.t('token.configurar')) + '</button>'
        : '') +
      '</div>'
    );
  }

  function temPendencias() {
    return Store.temPendencias();
  }

  /* ---------------- cartão da página inicial ---------------- */

  function nivel() {
    return window.I18N.t(podeRegistrar() ? 'inicio.nivelRegistro' : 'inicio.nivelConsulta');
  }

  function atalhos() {
    return [{ rotulo: window.I18N.t('inicio.abrir'), hash: '#/qa' }];
  }

  function aoEscape() {
    if (!el('gaveta').classList.contains('pd-aberto')) return false;
    fecharGaveta();
    return true;
  }

  /* ---------------- filtros ---------------- */

  function casosFiltrados() {
    const f = vista.filtros;
    const alvo = window.UI.normalizar(f.busca);
    return Store.casos(vista.projetoId).filter(function (c) {
      if (f.modulo && c.modulo !== f.modulo) return false;
      if (f.status && c.status !== f.status) return false;
      if (f.prioridade && c.prioridade !== f.prioridade) return false;
      if (f.tipo && c.tipo !== f.tipo) return false;
      if (f.retrabalho === 'com' && voltas(c) < 1) return false;
      if (f.retrabalho === 'sem' && voltas(c) >= 1) return false;
      if (f.verificacao === 'verificados' && !Store.verificado(c)) return false;
      if (f.verificacao === 'nao_verificados' && Store.verificado(c)) return false;
      if (f.verificacao === 'com_falha' && !Store.temFalha(c)) return false;
      if (alvo) {
        const campos = [
          c.id, c.titulo_pt, c.titulo_en, c.passos_pt, c.passos_en, c.criterio_pt, c.criterio_en,
          c.rota, c.stub, c.uc, c.rf, c.testado_por, c.referencia, c.execucao, c.falha, c.observacoes,
        ];
        const achou = campos.some(function (campo) {
          return window.UI.normalizar(campo).indexOf(alvo) !== -1;
        });
        if (!achou) return false;
      }
      return true;
    });
  }

  function temFiltro() {
    return Object.keys(vista.filtros).some(function (chave) {
      return vista.filtros[chave] !== '';
    });
  }

  /* ---------------- blocos reaproveitados ---------------- */

  function tagStatus(status) {
    const chave = status || 'nao_testado';
    return '<span class="pd-tag pd-tag-' + esc(chave) + '">' + esc(t('status.' + chave)) + '</span>';
  }

  function tagVoltas(caso) {
    const n = voltas(caso);
    if (!n) return '';
    return (
      '<span class="pd-voltas' + (n >= 2 ? ' pd-voltas-alta' : '') +
      '" title="' + esc(t('painel.voltas', { n: n })) + '">&#8635; ' + n + '</span>'
    );
  }

  function barraFases(m) {
    const base = m.consideraveis || 1;
    return (
      '<div class="pd-fases" role="img" aria-label="' +
      esc(
        t('fase.concluido') + ' ' + m.concluido + ', ' +
        t('fase.andamento') + ' ' + m.andamento + ', ' +
        t('fase.planejado') + ' ' + m.planejado
      ) + '">' +
      '<i class="pd-fase-conc" style="width:' + (m.concluido / base) * 100 + '%"></i>' +
      '<i class="pd-fase-and" style="width:' + (m.andamento / base) * 100 + '%"></i>' +
      '<i class="pd-fase-plan" style="width:' + (m.planejado / base) * 100 + '%"></i>' +
      '</div>'
    );
  }

  function legendaFases() {
    return (
      '<div class="pd-legenda">' +
      '<span><i class="pd-cor-conc"></i>' + esc(t('fase.concluido')) + '</span>' +
      '<span><i class="pd-cor-and"></i>' + esc(t('fase.andamento')) + '</span>' +
      '<span><i class="pd-cor-plan"></i>' + esc(t('fase.planejado')) + '</span>' +
      '</div>'
    );
  }

  function cartaoKpi(rotulo, valor, ajuda, fracao, classe) {
    return (
      '<div class="pd-kpi ' + (classe || '') + '">' +
      '<div class="pd-kpi-rotulo">' + esc(rotulo) + '</div>' +
      '<div class="pd-kpi-valor">' + esc(valor) + '</div>' +
      '<div class="pd-kpi-barra"><i style="width:' + Math.min(100, pct(fracao)) + '%"></i></div>' +
      '<div class="pd-kpi-ajuda">' + esc(ajuda) + '</div>' +
      '</div>'
    );
  }

  /* ---------------- visão geral ---------------- */

  function renderInicio() {
    const projetos = Store.estado.projetos;
    if (!projetos.length) {
      el('vista').innerHTML = '<div class="pd-cartao pd-vazio">' + esc(t('inicio.semProjetos')) + '</div>';
      return;
    }

    const m = Store.metricas(Store.todosOsCasos());
    const base = m.consideraveis || 1;

    const kpis =
      cartaoKpi(t('kpi.planejado'), String(m.planejado), t('kpi.planejadoAjuda'), m.planejado / base, 'pd-kpi-plan') +
      cartaoKpi(t('kpi.andamento'), String(m.andamento), t('kpi.andamentoAjuda'), m.andamento / base, 'pd-kpi-and') +
      cartaoKpi(t('kpi.concluido'), String(m.concluido), t('kpi.concluidoAjuda'), m.concluido / base, 'pd-kpi-conc') +
      cartaoKpi(
        t('kpi.retrabalho'), pct(m.retrabalho) + '%',
        t('kpi.retrabalhoAjuda', { casos: m.comRetrabalho, voltas: m.totalDevolucoes }),
        m.retrabalho, 'pd-kpi-atencao'
      );

    const resumoGeral =
      '<div class="pd-cartao">' +
      '<div class="pd-resumo-topo"><span class="pd-resumo-total">' + m.total + '</span>' +
      '<span class="pd-resumo-rotulo">' + esc(t('kpi.totalCasos')) + '</span></div>' +
      barraFases(m) + legendaFases() + '</div>';

    const cartoesProjeto = projetos
      .map(function (p) {
        const mp = Store.metricas(Store.casos(p.id));
        return (
          '<a class="pd-projeto" href="#/qa/p/' + esc(p.id) + '">' +
          '<div class="pd-projeto-topo"><div>' +
          '<div class="pd-projeto-nome">' + esc(p.nome) + '</div>' +
          (p.produto ? '<div class="pd-projeto-produto">' + esc(p.produto) + '</div>' : '') +
          '</div><span class="pd-pilula">' + esc(t('inicio.casos', { n: mp.total })) + '</span></div>' +
          '<p class="pd-projeto-desc">' + esc(Textos.descricaoProjeto(p)) + '</p>' +
          barraFases(mp) +
          '<div class="pd-projeto-numeros">' +
          '<span><b>' + mp.concluido + '</b> ' + esc(t('fase.concluido')) + '</span>' +
          '<span><b>' + mp.andamento + '</b> ' + esc(t('fase.andamento')) + '</span>' +
          '<span><b>' + mp.planejado + '</b> ' + esc(t('fase.planejado')) + '</span>' +
          (mp.totalDevolucoes ? '<span class="pd-projeto-retrabalho">&#8635; ' + mp.totalDevolucoes + '</span>' : '') +
          '</div></a>'
        );
      })
      .join('');

    el('vista').innerHTML =
      '<section class="pd-secao"><div class="pd-kpis">' + kpis + '</div></section>' +
      '<section class="pd-secao">' + resumoGeral + '</section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('inicio.projetos')) + '</h2>' +
      '<div class="pd-projetos">' + cartoesProjeto + '</div></section>' +
      renderAbertos(projetos);
  }

  /** Árvore de tudo que está em aberto: projeto -> módulo -> casos. */
  function renderAbertos(projetos) {
    const blocos = projetos
      .map(function (p) {
        const abertos = Store.emAberto(Store.casos(p.id));
        if (!abertos.length) return '';

        const modulos = Store
          .porModulo(abertos)
          .map(function (grupo) {
            const linhas = grupo.casos
              .slice()
              .sort(function (a, b) {
                return ordemPrioridade(a.prioridade) - ordemPrioridade(b.prioridade);
              })
              .map(function (c) {
                return (
                  '<li><a href="#/qa/p/' + esc(p.id) + '/casos" data-qa-abrir="' + esc(c.id) + '">' +
                  '<span class="pd-arv-id">' + esc(c.id) + '</span>' +
                  '<span class="pd-arv-titulo">' + esc(titulo(c)) + '</span>' +
                  tagVoltas(c) + tagStatus(c.status) + '</a></li>'
                );
              })
              .join('');

            return (
              '<details class="pd-arv-modulo"><summary>' +
              '<span class="pd-arv-modulo-nome">' + esc(Textos.nomeModulo(grupo.modulo)) + '</span>' +
              '<span class="pd-pilula">' + grupo.casos.length + '</span></summary>' +
              '<ul class="pd-arv-lista">' + linhas + '</ul></details>'
            );
          })
          .join('');

        return (
          '<details class="pd-arv-projeto"><summary>' +
          '<span class="pd-arv-projeto-nome">' + esc(p.nome) + '</span>' +
          '<span class="pd-pilula">' + esc(t('inicio.aberto', { n: abertos.length })) + '</span></summary>' +
          '<div class="pd-arv-modulos">' + modulos + '</div></details>'
        );
      })
      .join('');

    return (
      '<section class="pd-secao">' +
      '<div class="pd-secao-linha">' +
      '<h2 class="pd-secao-titulo">' + esc(t('inicio.abertos')) + '</h2>' +
      '<div class="pd-secao-acoes">' +
      '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-qa="expandirTudo">' + esc(t('acao.expandirTudo')) + '</button>' +
      '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-qa="recolherTudo">' + esc(t('acao.recolherTudo')) + '</button>' +
      '</div></div>' +
      '<p class="pd-secao-ajuda">' + esc(t('inicio.abertosAjuda')) + '</p>' +
      (blocos
        ? '<div class="pd-arvore">' + blocos + '</div>'
        : '<div class="pd-cartao pd-vazio">' + esc(t('inicio.semAbertos')) + '</div>') +
      '</section>'
    );
  }

  /* ---------------- painel do projeto ---------------- */

  function renderPainelProjeto() {
    const todos = Store.casos(vista.projetoId);
    const m = Store.metricas(todos);
    const base = m.consideraveis || 1;

    const kpis =
      cartaoKpi(
        t('kpi.verificados'), pct(m.verificacao) + '%',
        t('kpi.verificadosAjuda', { feitos: m.verificados, total: m.consideraveis, falhas: m.comFalha }),
        m.verificacao, 'pd-kpi-info'
      ) +
      cartaoKpi(t('kpi.cobertura'), pct(m.cobertura) + '%', t('kpi.coberturaAjuda'), m.cobertura, '') +
      cartaoKpi(t('kpi.liberado'), pct(m.liberacao) + '%', t('kpi.liberadoAjuda'), m.liberacao, 'pd-kpi-conc') +
      cartaoKpi(t('kpi.devolvidas'), String(m.devolvidas), t('kpi.devolvidasAjuda'), m.devolvidas / base, 'pd-kpi-erro') +
      cartaoKpi(
        t('kpi.retrabalho'), pct(m.retrabalho) + '%',
        t('kpi.retrabalhoAjuda', { casos: m.comRetrabalho, voltas: m.totalDevolucoes }),
        m.retrabalho, 'pd-kpi-atencao'
      );

    const distribuicao = Store.porStatus(todos);
    const maior = Math.max.apply(null, distribuicao.map(function (d) { return d.total; }));
    const linhasDist = distribuicao
      .map(function (d) {
        return (
          '<div class="pd-dist-linha">' +
          '<div class="pd-dist-rotulo"><i class="pd-dist-ponto" style="background:' + CORES_STATUS[d.status] + '"></i>' +
          esc(t('status.' + d.status)) + '</div>' +
          '<div class="pd-dist-trilho"><i style="width:' + (maior ? (d.total / maior) * 100 : 0) +
          '%;background:' + CORES_STATUS[d.status] + '"></i></div>' +
          '<div class="pd-dist-valor">' + d.total + '</div></div>'
        );
      })
      .join('');

    const modulos = Store
      .porModulo(todos)
      .map(function (grupo) {
        const g = grupo.metricas;
        return (
          '<div class="pd-modulo" data-modulo="' + esc(grupo.modulo) + '">' +
          '<div><div class="pd-modulo-nome">' + esc(Textos.nomeModulo(grupo.modulo)) + '</div>' +
          '<div class="pd-modulo-qtd">' + grupo.casos.length + ' ' + esc(t('painel.total')) + '</div></div>' +
          barraFases(g) +
          '<div class="pd-modulo-numeros">' +
          '<span><b>' + pct(g.cobertura) + '%</b> ' + esc(t('painel.testados')) + '</span>' +
          '<span><b>' + pct(g.liberacao) + '%</b> ' + esc(t('painel.liberados')) + '</span>' +
          (g.totalDevolucoes ? '<span class="pd-projeto-retrabalho">&#8635; ' + g.totalDevolucoes + '</span>' : '') +
          '</div></div>'
        );
      })
      .join('');

    const atencao = todos
      .filter(function (c) {
        return ['devolvida', 'bloqueada', 'nao_implementada'].indexOf(c.status) !== -1;
      })
      .sort(function (a, b) {
        return voltas(b) - voltas(a) || ordemPrioridade(a.prioridade) - ordemPrioridade(b.prioridade);
      });

    const retrabalho = todos
      .filter(function (c) { return voltas(c) >= 1; })
      .sort(function (a, b) { return voltas(b) - voltas(a); });

    el('vista').innerHTML =
      '<section class="pd-secao"><div class="pd-kpis">' + kpis + '</div></section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('painel.porModulo')) + '</h2>' +
      '<div class="pd-cartao"><div class="pd-modulos">' + modulos + '</div>' + legendaFases() + '</div></section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('painel.distribuicao')) + '</h2>' +
      '<div class="pd-cartao"><div class="pd-distribuicao">' + linhasDist + '</div></div></section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('painel.retrabalho')) + '</h2>' +
      (retrabalho.length ? listaCompacta(retrabalho, true)
        : '<div class="pd-cartao pd-vazio">' + esc(t('painel.semRetrabalho')) + '</div>') + '</section>' +
      '<section class="pd-secao"><h2 class="pd-secao-titulo">' + esc(t('painel.atencao')) + '</h2>' +
      (atencao.length ? listaCompacta(atencao, false)
        : '<div class="pd-cartao pd-vazio">' + esc(t('painel.semAtencao')) + '</div>') + '</section>';
  }

  function listaCompacta(lista, mostrarVoltas) {
    return (
      '<div class="pd-tabela-caixa pd-tabela-caixa-livre"><table class="pd-tabela"><tbody>' +
      lista
        .map(function (c) {
          return (
            '<tr data-id="' + esc(c.id) + '">' +
            '<td class="pd-cel-id">' + esc(c.id) + '</td>' +
            '<td class="pd-cel-caso"><div class="pd-cel-titulo">' + esc(titulo(c)) + '</div></td>' +
            '<td class="pd-esconde-p"><span class="pd-pilula">' + esc(Textos.nomeModulo(c.modulo)) + '</span></td>' +
            (mostrarVoltas ? '<td class="pd-cel-centro">' + tagVoltas(c) + '</td>' : '') +
            '<td>' + tagStatus(c.status) + '</td>' +
            '<td class="pd-esconde-p">' + esc(c.testado_por || '') + '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div>'
    );
  }

  /* ---------------- casos de teste: o plano executável ---------------- */

  /** Seções na ordem do catálogo: é a ordem em que o plano foi escrito para ser executado. */
  function secoes(lista) {
    const grupos = [];
    const indice = {};
    lista.forEach(function (c) {
      if (!indice[c.modulo]) {
        indice[c.modulo] = { modulo: c.modulo, casos: [] };
        grupos.push(indice[c.modulo]);
      }
      indice[c.modulo].casos.push(c);
    });
    return grupos;
  }

  /** O âncora não pode ir para o hash: o hash é a rota do portal. A seção rola por botão. */
  function ancoraSecao(modulo) {
    return 'qa-secao-' + modulo;
  }

  function contagem(lista) {
    const m = Store.metricas(lista);
    return { texto: m.verificados + '/' + m.consideraveis, completo: m.consideraveis > 0 && m.verificados === m.consideraveis };
  }

  function contagemHtml(modulo, lista) {
    const c = contagem(lista);
    return (
      '<span class="pd-exec-cont' + (c.completo ? ' pd-exec-cont-completo' : '') + '" data-cont="' + esc(modulo) +
      '" title="' + esc(t('exec.contagemSecao')) + '">' + c.texto + '</span>'
    );
  }

  /** Faixa na borda do caso: âmbar com falha registrada, verde verificado sem falha. */
  function classeFaixa(caso) {
    if (Store.temFalha(caso)) return ' pd-exec-falha';
    if (Store.verificado(caso)) return ' pd-exec-ok';
    return '';
  }

  function idCaso(caso) {
    return (
      '<button type="button" class="pd-exec-id-btn" data-qa="detalhe" data-id="' + esc(caso.id) + '">' + esc(caso.id) + '</button>' +
      (caso._gravando ? '<i class="pd-marca-alterado"></i>' : '')
    );
  }

  function assinatura(caso) {
    const partes = [caso.testado_por, caso.data_teste].filter(Boolean).map(esc);
    return partes.join(' · ') + (voltas(caso) ? ' ' + tagVoltas(caso) : '');
  }

  function opcoesStatus(atual) {
    const valor = atual || 'nao_testado';
    return Textos.ordemStatus
      .map(function (s) {
        return '<option value="' + s + '"' + (s === valor ? ' selected' : '') + '>' + esc(t('status.' + s)) + '</option>';
      })
      .join('');
  }

  function conferencia(caso, gravavel) {
    const marcado = Store.verificado(caso);
    const idCampo = 'qa-verificado-' + caso.id;
    const controles = gravavel
      ? '<label class="pd-exec-chk" for="' + esc(idCampo) + '">' +
        '<input type="checkbox" id="' + esc(idCampo) + '" data-qa-campo="verificado"' + (marcado ? ' checked' : '') + '>' +
        '<span><span class="pd-sr">' + esc(caso.id) + ': </span>' + esc(t('exec.verificado')) + '</span></label>' +
        '<select class="pd-campo pd-exec-situacao" data-qa-campo="status" aria-label="' +
        esc(caso.id + ': ' + t('detalhe.status')) + '">' + opcoesStatus(caso.status) + '</select>'
      : '<span class="pd-exec-selo' + (marcado ? ' pd-exec-selo-ok' : '') + '">' +
        esc(t(marcado ? 'exec.verificado' : 'exec.naoVerificado')) + '</span>' + tagStatus(caso.status);
    return (
      '<span class="pd-exec-rotulo">' + esc(t('exec.conferencia')) + '</span>' +
      '<div class="pd-exec-controles">' + controles + '</div>' +
      '<div class="pd-exec-rodape"><span class="pd-exec-assinatura">' + assinatura(caso) + '</span>' +
      '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-qa="detalhe" data-id="' + esc(caso.id) + '">' +
      esc(t('exec.detalhes')) + '</button></div>'
    );
  }

  const ANOTACOES = {
    execucao: { rotulo: 'exec.execucao', ajuda: 'exec.execucaoAjuda' },
    falha: { rotulo: 'exec.falha', ajuda: 'exec.falhaAjuda' },
  };

  function anotacao(caso, campo, gravavel) {
    const valor = caso[campo] || '';
    const cheio = valor.trim() !== '';
    const alerta = campo === 'falha' && cheio;
    const rotulo = t(ANOTACOES[campo].rotulo);
    if (!gravavel) {
      return (
        '<span class="pd-exec-rotulo">' + esc(rotulo) + '</span>' +
        '<div class="pd-exec-lido' + (alerta ? ' pd-exec-lido-falha' : '') + '">' +
        (cheio ? esc(valor) : '<span class="pd-exec-vazio">' + esc(t('exec.semAnotacao')) + '</span>') + '</div>'
      );
    }
    const idCampo = 'qa-' + campo + '-' + caso.id;
    // A quebra depois da tag é descartada pelo HTML; sem ela, uma anotação que começa
    // com quebra de linha perderia essa quebra na primeira edição.
    return (
      '<label class="pd-exec-rotulo" for="' + esc(idCampo) + '"><span class="pd-sr">' + esc(caso.id) + ': </span>' +
      esc(rotulo) + '</label>' +
      '<textarea id="' + esc(idCampo) + '" class="pd-campo pd-exec-nota' + (alerta ? ' pd-exec-nota-falha' : '') +
      '" data-qa-campo="' + campo + '" rows="2" placeholder="' + esc(t(ANOTACOES[campo].ajuda)) + '">\n' +
      esc(valor) + '</textarea>'
    );
  }

  function htmlCaso(caso, gravavel) {
    const codigo = Textos.codigoPrioridade(caso.prioridade);
    const roteiro = passos(caso);
    return (
      '<tbody class="pd-exec-caso' + classeFaixa(caso) + (vista.selecionado === caso.id ? ' pd-selecionada' : '') +
      '" data-caso="' + esc(caso.id) + '">' +
      '<tr class="pd-exec-linha">' +
      '<td class="pd-exec-id">' + idCaso(caso) + '</td>' +
      '<td class="pd-exec-prio-cel">' +
      (codigo
        ? '<span class="pd-exec-prio pd-exec-prio-' + esc(caso.prioridade) + '" title="' + esc(t('prioridade.' + caso.prioridade)) + '">' + codigo + '</span>'
        : '') +
      '</td>' +
      '<td class="pd-exec-cenario">' + esc(titulo(caso)) +
      (caso.rota ? '<div class="pd-cel-rota">' + esc(caso.rota) + '</div>' : '') + '</td>' +
      '<td class="pd-exec-texto" data-rotulo="' + esc(t('tabela.passos')) + '">' +
      (roteiro ? esc(roteiro) : '<span class="pd-exec-vazio">' + esc(t('exec.semPassos')) + '</span>') + '</td>' +
      '<td class="pd-exec-texto" data-rotulo="' + esc(t('tabela.resultado')) + '">' + esc(criterio(caso)) + '</td>' +
      '</tr>' +
      '<tr class="pd-exec-registro">' +
      '<td colspan="3" class="pd-exec-conferencia">' + conferencia(caso, gravavel) + '</td>' +
      '<td>' + anotacao(caso, 'execucao', gravavel) + '</td>' +
      '<td>' + anotacao(caso, 'falha', gravavel) + '</td>' +
      '</tr></tbody>'
    );
  }

  function htmlSecao(grupo, numero, todos, gravavel) {
    const preparo = Textos.preparoModulo(grupo.modulo);
    const doModulo = todos.filter(function (c) { return c.modulo === grupo.modulo; });
    return (
      '<section class="pd-exec-secao" id="' + esc(ancoraSecao(grupo.modulo)) + '">' +
      '<h3 class="pd-exec-secao-titulo"><span>' + numero + '. ' + esc(Textos.nomeModulo(grupo.modulo)) + '</span>' +
      contagemHtml(grupo.modulo, doModulo) + '</h3>' +
      (preparo ? '<p class="pd-exec-preparo">' + esc(preparo) + '</p>' : '') +
      '<div class="pd-exec-caixa"><table class="pd-exec-tabela">' +
      '<colgroup><col class="pd-exec-col-id"><col class="pd-exec-col-prio"><col class="pd-exec-col-cenario">' +
      '<col class="pd-exec-col-passos"><col class="pd-exec-col-resultado"></colgroup>' +
      '<thead><tr>' +
      '<th scope="col">' + esc(t('tabela.id')) + '</th>' +
      '<th scope="col"><abbr title="' + esc(t('tabela.prioridade')) + '">' + esc(t('tabela.prioridadeCurta')) + '</abbr></th>' +
      '<th scope="col">' + esc(t('tabela.cenario')) + '</th>' +
      '<th scope="col">' + esc(t('tabela.passos')) + '</th>' +
      '<th scope="col">' + esc(t('tabela.resultado')) + '</th>' +
      '</tr></thead>' +
      grupo.casos.map(function (c) { return htmlCaso(c, gravavel); }).join('') +
      '</table></div></section>'
    );
  }

  function htmlProgresso(m) {
    return (
      '<div class="pd-exec-progresso">' +
      '<div class="pd-exec-progresso-linha">' +
      '<span id="qaProgresso">' + esc(t('exec.progresso', { feitos: m.verificados, total: m.consideraveis })) + '</span>' +
      '<span id="qaFalhas" class="pd-exec-falhas' + (m.comFalha ? ' pd-exec-falhas-ativo' : '') + '">' +
      esc(t('exec.falhas', { n: m.comFalha })) + '</span></div>' +
      '<div class="pd-exec-trilho" aria-hidden="true"><i id="qaBarra" style="width:' + pct(m.verificacao) + '%"></i></div>' +
      '</div>'
    );
  }

  /** Progresso e contadores sem redesenhar a tela: quem está digitando não perde o campo. */
  function atualizarContadores() {
    const progresso = el('qaProgresso');
    if (!progresso) return;
    const todos = Store.casos(vista.projetoId);
    const m = Store.metricas(todos);
    progresso.textContent = t('exec.progresso', { feitos: m.verificados, total: m.consideraveis });
    const falhas = el('qaFalhas');
    falhas.textContent = t('exec.falhas', { n: m.comFalha });
    falhas.classList.toggle('pd-exec-falhas-ativo', m.comFalha > 0);
    el('qaBarra').style.width = pct(m.verificacao) + '%';
    Array.prototype.forEach.call(document.querySelectorAll('#vista [data-cont]'), function (alvo) {
      const modulo = alvo.getAttribute('data-cont');
      const c = contagem(todos.filter(function (caso) { return caso.modulo === modulo; }));
      alvo.textContent = c.texto;
      alvo.classList.toggle('pd-exec-cont-completo', c.completo);
    });
  }

  function casoNaTela(id) {
    return document.querySelector('#vista tbody[data-caso="' + String(id).replace(/["\\]/g, '\\$&') + '"]');
  }

  /**
   * Redesenha só o que muda num caso — faixa, caixa, situação, assinatura. O texto
   * que a pessoa está digitando fica como está.
   */
  function atualizarCaso(id) {
    const corpo = casoNaTela(id);
    const c = Store.caso(vista.projetoId, id);
    if (!corpo || !c) return;
    corpo.classList.toggle('pd-exec-ok', Store.verificado(c) && !Store.temFalha(c));
    corpo.classList.toggle('pd-exec-falha', Store.temFalha(c));
    corpo.querySelector('.pd-exec-id').innerHTML = idCaso(c);
    const assinado = corpo.querySelector('.pd-exec-assinatura');
    if (assinado) assinado.innerHTML = assinatura(c);
    const caixa = corpo.querySelector('input[data-qa-campo="verificado"]');
    if (caixa) caixa.checked = Store.verificado(c);
    const situacao = corpo.querySelector('select[data-qa-campo="status"]');
    if (situacao) situacao.value = c.status || 'nao_testado';
    Object.keys(ANOTACOES).forEach(function (campo) {
      const area = corpo.querySelector('textarea[data-qa-campo="' + campo + '"]');
      if (!area) return;
      if (area !== document.activeElement && area.value !== (c[campo] || '')) area.value = c[campo] || '';
      if (campo === 'falha') area.classList.toggle('pd-exec-nota-falha', Store.temFalha(c));
    });
  }

  /** Registro feito direto no plano, pela caixa, pela situação ou pelas anotações. */
  function registrarNoPlano(alvo, campo, valor) {
    const corpo = alvo.closest('tbody[data-caso]');
    if (!corpo || !podeGravar()) return;
    const id = corpo.getAttribute('data-caso');
    const campos = {};
    campos[campo] = valor;
    Store.registrar(vista.projetoId, id, campos, nomeDaSessao());
    atualizarCaso(id);
    atualizarContadores();
  }

  function rolarParaSecao(modulo) {
    const alvo = el(ancoraSecao(modulo));
    if (!alvo) return;
    const suave = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    alvo.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
  }

  function renderCasosProjeto() {
    const todos = Store.casos(vista.projetoId);
    const lista = casosFiltrados();
    const gravavel = podeGravar();

    const modulosDisponiveis = [];
    todos.forEach(function (c) {
      if (modulosDisponiveis.indexOf(c.modulo) === -1) modulosDisponiveis.push(c.modulo);
    });

    const filtros =
      '<input id="fBusca" class="pd-campo pd-busca" type="search" placeholder="' + esc(t('filtro.busca')) +
      '" aria-label="' + esc(t('filtro.busca')) + '" value="' + esc(vista.filtros.busca) + '">' +
      seletor('fModulo', 'filtro.modulo', vista.filtros.modulo, modulosDisponiveis, Textos.nomeModulo) +
      seletor('fStatus', 'filtro.status', vista.filtros.status, Textos.ordemStatus, function (s) { return t('status.' + s); }) +
      seletor('fPrioridade', 'filtro.prioridade', vista.filtros.prioridade, Textos.ordemPrioridade, function (p) { return t('prioridade.' + p); }) +
      seletor('fTipo', 'filtro.tipo', vista.filtros.tipo, Textos.ordemTipo, function (x) { return t('tipo.' + x); }) +
      seletor('fRetrabalho', 'filtro.retrabalho', vista.filtros.retrabalho, ['com', 'sem'], function (v) {
        return v === 'com' ? t('filtro.comRetrabalho') : t('filtro.semRetrabalho');
      }) +
      seletor('fVerificacao', 'filtro.verificacao', vista.filtros.verificacao, ['verificados', 'nao_verificados', 'com_falha'], function (v) {
        return t({ verificados: 'filtro.verificados', nao_verificados: 'filtro.naoVerificados', com_falha: 'filtro.comFalha' }[v]);
      }) +
      (temFiltro() ? '<button type="button" class="pd-btn pd-btn-fantasma pd-btn-p" data-qa="limparFiltros">' + esc(t('acao.limparFiltros')) + '</button>' : '') +
      '<span class="pd-contagem">' + esc(t('filtro.resultado', { n: lista.length, total: todos.length })) + '</span>';

    // A numeração vem do plano inteiro: filtrar não renumera as seções.
    const ordem = secoes(todos).map(function (g) { return g.modulo; });
    const grupos = secoes(lista);

    const sumario =
      // Em tela estreita o sumário vem antes dos casos; fechado, não empurra o plano para baixo.
      '<details class="pd-exec-sumario"' + (window.innerWidth > 1100 ? ' open' : '') + '>' +
      '<summary>' + esc(t('exec.sumario')) + '</summary><ol>' +
      grupos
        .map(function (g) {
          return (
            '<li><button type="button" data-qa="irSecao" data-modulo="' + esc(g.modulo) + '">' +
            '<span>' + (ordem.indexOf(g.modulo) + 1) + '. ' + esc(Textos.nomeModulo(g.modulo)) + '</span>' +
            contagemHtml(g.modulo, todos.filter(function (c) { return c.modulo === g.modulo; })) +
            '</button></li>'
          );
        })
        .join('') +
      '</ol></details>';

    el('vista').innerHTML =
      '<div class="pd-filtros">' + filtros + '</div>' +
      htmlProgresso(Store.metricas(todos)) +
      avisoGaveta() +
      (grupos.length
        ? '<div class="pd-exec">' + sumario +
          '<div class="pd-exec-secoes">' +
          grupos.map(function (g) { return htmlSecao(g, ordem.indexOf(g.modulo) + 1, todos, gravavel); }).join('') +
          '</div></div>'
        : '<div class="pd-cartao pd-vazio">' + esc(t('tabela.vazio')) + '</div>');
  }

  function seletor(id, chaveRotulo, valor, opcoes, rotulador) {
    const itens = opcoes
      .map(function (o) {
        return '<option value="' + esc(o) + '"' + (valor === o ? ' selected' : '') + '>' + esc(rotulador(o)) + '</option>';
      })
      .join('');
    return (
      '<select id="' + id + '" class="pd-campo" aria-label="' + esc(t(chaveRotulo)) + '">' +
      '<option value="">' + esc(t(chaveRotulo)) + ': ' + esc(t('filtro.todos')) + '</option>' + itens + '</select>'
    );
  }

  /* ---------------- guia ---------------- */

  function renderGuia() {
    const statuses = Textos.ordemStatus
      .map(function (s) {
        const chave = 'guia.status' + s.split('_').map(function (p) {
          return p.charAt(0).toUpperCase() + p.slice(1);
        }).join('');
        return '<li>' + tagStatus(s) + esc(t(chave)) + '</li>';
      })
      .join('');

    el('vista').innerHTML =
      '<div class="pd-guia">' +
      '<h2>' + esc(t('guia.titulo')) + '</h2>' +
      '<h3>' + esc(t('guia.introH')) + '</h3>' +
      '<p>' + esc(t('guia.introP1')) + '</p><p>' + esc(t('guia.introP2')) + '</p>' +
      '<h3>' + esc(t('guia.acessoH')) + '</h3><p>' + esc(t('guia.acessoP')) + '</p>' +
      '<h3>' + esc(t('guia.fluxoH')) + '</h3><ol>' +
      ['fluxo1', 'fluxo2', 'fluxo3', 'fluxo4', 'fluxo5']
        .map(function (k) { return '<li>' + esc(t('guia.' + k)) + '</li>'; }).join('') +
      '</ol>' +
      '<h3>' + esc(t('guia.camposH')) + '</h3><ul>' +
      ['camposCenario', 'camposPassos', 'camposResultado', 'camposVerificado', 'camposExecucao', 'camposFalha']
        .map(function (k) { return '<li>' + esc(t('guia.' + k)) + '</li>'; }).join('') +
      '</ul>' +
      '<h3>' + esc(t('guia.statusH')) + '</h3><ul class="pd-guia-status">' + statuses + '</ul>' +
      '<h3>' + esc(t('guia.persistenciaH')) + '</h3><p>' + esc(t('guia.persistenciaP')) + '</p>' +
      '<h3>' + esc(t('guia.metricasH')) + '</h3><ul>' +
      ['metricasFases', 'metricasVerificados', 'metricasCobertura', 'metricasLiberado', 'metricasRetrabalho']
        .map(function (k) { return '<li>' + esc(t('guia.' + k)) + '</li>'; }).join('') +
      '</ul>' +
      '<h3>' + esc(t('guia.novoProjetoH')) + '</h3><p>' + esc(t('guia.novoProjetoP')) + '</p>' +
      '</div>';
  }

  /* ---------------- gaveta de detalhe ---------------- */

  /** Por que o formulário está travado — o papel ou a falta de token. */
  function avisoGaveta() {
    if (!podeRegistrar()) {
      return '<div class="pd-nota">' + esc(t('detalhe.somenteConsulta')) + '</div>';
    }
    if (!window.Github.temToken()) {
      return (
        '<div class="pd-nota"><span>' + esc(t('detalhe.semToken')) + '</span>' +
        '<button type="button" class="pd-btn pd-btn-primario pd-btn-p" data-acao="token">' +
        esc(window.I18N.t('token.configurar')) + '</button></div>'
      );
    }
    return '';
  }

  function abrirGaveta(id) {
    const c = Store.caso(vista.projetoId, id);
    if (!c) return;
    vista.selecionado = id;

    const somenteLeitura = !podeGravar();

    el('gavetaId').textContent = c.id;
    el('gavetaTitulo').textContent = titulo(c);
    el('gavetaMeta').innerHTML =
      '<span class="pd-pilula">' + esc(Textos.nomeModulo(c.modulo)) + '</span>' +
      (c.tipo ? '<span class="pd-pilula">' + esc(t('tipo.' + c.tipo)) + '</span>' : '') +
      (c.prioridade
        ? '<span class="pd-pilula pd-prio-' + esc(c.prioridade) + '">' + esc(t('prioridade.' + c.prioridade)) + '</span>'
        : '') +
      tagVoltas(c);
    el('btnFecharGaveta').setAttribute('aria-label', t('detalhe.fechar'));

    const referencias = [c.uc, c.rf].filter(Boolean).join(';').split(';')
      .map(function (x) { return x.trim(); }).filter(Boolean);
    const preparo = Textos.preparoModulo(c.modulo);
    const roteiro = passos(c);

    el('gavetaCorpo').innerHTML =
      avisoGaveta() +
      (preparo
        ? '<div class="pd-bloco"><h3 class="pd-bloco-titulo">' + esc(t('detalhe.preparo')) + '</h3>' +
          '<div class="pd-texto-bloco">' + esc(preparo) + '</div></div>'
        : '') +
      '<div class="pd-bloco"><h3 class="pd-bloco-titulo">' + esc(t('detalhe.passos')) + '</h3>' +
      (roteiro
        ? '<div class="pd-texto-bloco">' + esc(roteiro) + '</div>'
        : '<div class="pd-texto-bloco pd-exec-vazio">' + esc(t('exec.semPassos')) + '</div>') + '</div>' +
      '<div class="pd-bloco"><h3 class="pd-bloco-titulo">' + esc(t('detalhe.criterio')) + '</h3>' +
      '<div class="pd-criterio">' + esc(criterio(c)) + '</div></div>' +

      '<div class="pd-bloco"><h3 class="pd-bloco-titulo">' + esc(t('detalhe.onde')) + '</h3><dl class="pd-linhas">' +
      linhaDetalhe(t('detalhe.rota'), c.rota ? '<span class="pd-mono">' + esc(c.rota) + '</span>' : '—') +
      linhaDetalhe(t('detalhe.stub'), c.stub ? '<span class="pd-mono">' + esc(c.stub) + '</span>' : esc(t('detalhe.semStub'))) +
      linhaDetalhe(t('detalhe.referencias'), referencias.length
        ? referencias.map(function (r) { return '<span class="pd-pilula">' + esc(r) + '</span>'; }).join(' ') : '—') +
      '</dl></div>' +

      '<div class="pd-bloco"><h3 class="pd-bloco-titulo">' + esc(t('detalhe.registro')) + '</h3><div class="pd-form">' +
      campoSelect('eStatus', t('detalhe.status'), c.status || 'nao_testado', Textos.ordemStatus, function (s) { return t('status.' + s); }, somenteLeitura) +
      '<div><span class="pd-form-rotulo">' + esc(t('detalhe.verificacao')) + '</span>' +
      '<label class="pd-exec-chk" for="eVerificado"><input type="checkbox" id="eVerificado"' +
      (Store.verificado(c) ? ' checked' : '') + (somenteLeitura ? ' disabled' : '') + '><span>' + esc(t('exec.verificado')) +
      '</span></label></div>' +
      campoTexto('eTestadoPor', t('detalhe.testadoPor'), c.testado_por || (somenteLeitura ? '' : nomeDaSessao()), '', somenteLeitura) +
      campoData('eDataTeste', t('detalhe.dataTeste'), c.data_teste || '', somenteLeitura) +
      campoAreaLarga('eExecucao', t('exec.execucao'), c.execucao, t('exec.execucaoAjuda'), somenteLeitura) +
      campoAreaLarga('eFalha', t('exec.falha'), c.falha, t('exec.falhaAjuda'), somenteLeitura) +
      '<div class="pd-form-largo">' +
      campoTexto('eReferencia', t('detalhe.referencia'), c.referencia || '', t('detalhe.referenciaPlaceholder'), somenteLeitura) +
      '</div>' +
      campoAreaLarga('eObservacoes', t('detalhe.observacoes'), c.observacoes, '', somenteLeitura) +
      '</div></div>' +

      '<div class="pd-bloco"><h3 class="pd-bloco-titulo">' + esc(t('detalhe.retrabalho')) + '</h3><dl class="pd-linhas">' +
      linhaDetalhe(t('detalhe.devolucoes'), '<b>' + voltas(c) + '</b>') +
      linhaDetalhe(t('detalhe.ultimaDevolucao'), esc(c.ultima_devolucao || '—')) +
      '</dl></div>' +

      (somenteLeitura || c.status === 'nao_testado'
        ? ''
        : '<div class="pd-gaveta-acoes"><button type="button" class="pd-btn pd-btn-perigo pd-btn-p" data-qa="limparCaso">' +
          esc(t('acao.limparRegistro')) + '</button></div>');

    el('gaveta').classList.add('pd-aberto');
    el('fundo').classList.add('pd-aberto');
    if (!somenteLeitura) ligarCamposDetalhe(id);
    marcarSelecionada();
  }

  function linhaDetalhe(rotulo, valorHtml) {
    return '<div class="pd-linha"><dt>' + esc(rotulo) + '</dt><dd>' + valorHtml + '</dd></div>';
  }

  function campoSelect(id, rotulo, valor, opcoes, rotulador, desabilitado) {
    const itens = opcoes
      .map(function (o) {
        return '<option value="' + esc(o) + '"' + (valor === o ? ' selected' : '') + '>' + esc(rotulador(o)) + '</option>';
      })
      .join('');
    return '<div><label for="' + id + '">' + esc(rotulo) + '</label><select id="' + id + '" class="pd-campo"' +
      (desabilitado ? ' disabled' : '') + '>' + itens + '</select></div>';
  }

  function campoTexto(id, rotulo, valor, placeholder, desabilitado) {
    return (
      '<div><label for="' + id + '">' + esc(rotulo) + '</label>' +
      '<input id="' + id + '" class="pd-campo" type="text" value="' + esc(valor) + '" placeholder="' + esc(placeholder) + '"' +
      (desabilitado ? ' disabled' : '') + '></div>'
    );
  }

  function campoAreaLarga(id, rotulo, valor, placeholder, desabilitado) {
    return (
      '<div class="pd-form-largo"><label for="' + id + '">' + esc(rotulo) + '</label>' +
      '<textarea id="' + id + '" class="pd-campo" placeholder="' + esc(placeholder) + '"' + (desabilitado ? ' disabled' : '') +
      '>\n' + esc(valor || '') + '</textarea></div>'
    );
  }

  function campoData(id, rotulo, valor, desabilitado) {
    return (
      '<div><label for="' + id + '">' + esc(rotulo) + '</label>' +
      '<input id="' + id + '" class="pd-campo" type="date" value="' + esc(valor) + '"' +
      (desabilitado ? ' disabled' : '') + '></div>'
    );
  }

  function ligarCamposDetalhe(id) {
    const mapa = {
      eStatus: 'status',
      eVerificado: 'verificado',
      eTestadoPor: 'testado_por',
      eDataTeste: 'data_teste',
      eExecucao: 'execucao',
      eFalha: 'falha',
      eReferencia: 'referencia',
      eObservacoes: 'observacoes',
    };
    const autor = nomeDaSessao();

    Object.keys(mapa).forEach(function (idCampo) {
      const campo = el(idCampo);
      if (!campo) return;
      const nome = mapa[idCampo];
      const evento = campo.tagName === 'SELECT' || campo.type === 'checkbox' ? 'change' : 'input';
      campo.addEventListener(evento, function () {
        const campos = {};
        campos[nome] = campo.type === 'checkbox' ? (campo.checked ? 'sim' : 'nao') : campo.value;

        // O nome que aparece no campo vai junto com a primeira edição real do caso.
        // Na troca de situação não: quem retesta assina de novo, e quem assina vem
        // da sessão corrente.
        if (nome !== 'status' && nome !== 'testado_por') {
          const testador = el('eTestadoPor');
          if (testador && testador.value) campos.testado_por = testador.value;
        }

        Store.registrar(vista.projetoId, id, campos, autor);

        if (vista.rota === 'casos') {
          atualizarCaso(id);
          atualizarContadores();
        } else if (vista.rota === 'painel') {
          renderPainelProjeto();
        }

        // Situação e conferência mexem uma na outra, e na assinatura e nas voltas:
        // redesenha a gaveta. Nos textos não, para não tirar o cursor de quem digita.
        if (nome === 'status' || nome === 'verificado') abrirGaveta(id);
        else sincronizarGaveta(id);
      });
    });
  }

  /** Anotar num caso não testado o põe em teste e assina: a gaveta acompanha sem perder o foco. */
  function sincronizarGaveta(id) {
    const c = Store.caso(vista.projetoId, id);
    if (!c) return;
    const situacao = el('eStatus');
    if (situacao) situacao.value = c.status || 'nao_testado';
    const caixa = el('eVerificado');
    if (caixa) caixa.checked = Store.verificado(c);
    [['eTestadoPor', 'testado_por'], ['eDataTeste', 'data_teste']].forEach(function (par) {
      const campo = el(par[0]);
      if (campo && campo !== document.activeElement && c[par[1]]) campo.value = c[par[1]];
    });
  }

  function marcarSelecionada() {
    Array.prototype.forEach.call(document.querySelectorAll('#vista .pd-tabela tbody tr[data-id]'), function (linha) {
      linha.classList.toggle('pd-selecionada', linha.getAttribute('data-id') === vista.selecionado);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#vista tbody[data-caso]'), function (corpo) {
      corpo.classList.toggle('pd-selecionada', corpo.getAttribute('data-caso') === vista.selecionado);
    });
  }

  function fecharGaveta() {
    vista.selecionado = null;
    el('gaveta').classList.remove('pd-aberto');
    el('fundo').classList.remove('pd-aberto');
    marcarSelecionada();
    // Não deixa registro esperando o temporizador quando o usuário já saiu do caso.
    if (vista.projetoId && Store.temPendencias()) {
      Store.gravarAgora(vista.projetoId).catch(function () {
        /* o erro já foi sinalizado para a interface */
      });
    }
  }

  /* ---------------- CSV ---------------- */

  function exportar() {
    const projeto = projetoAtual();
    if (!projeto) return;
    // Sem BOM: exportar sem editar devolve o arquivo idêntico ao do repositório.
    window.UI.baixarArquivo(projeto.arquivo.split('/').pop(), Store.exportarCsv(projeto.id));
  }

  /* ---------------- render e eventos ---------------- */

  function render() {
    if (!Store.estado.carregado) {
      el('vista').innerHTML = '<div class="pd-cartao pd-vazio">' + esc(t('carregando')) + '</div>';
      return;
    }

    if (vista.projetoId && !projetoAtual()) vista.rota = 'inicio';

    if (vista.rota === 'guia') renderGuia();
    else if (vista.rota === 'painel') renderPainelProjeto();
    else if (vista.rota === 'casos') renderCasosProjeto();
    else renderInicio();

    if (vista.selecionado && vista.projetoId && Store.caso(vista.projetoId, vista.selecionado)) {
      abrirGaveta(vista.selecionado);
    }

    // Vindo da árvore de abertos, o caso escolhido aparece na tela, atrás da gaveta.
    if (vista.rolarAte && vista.rota === 'casos') {
      const corpo = casoNaTela(vista.rolarAte);
      if (corpo) corpo.scrollIntoView({ block: 'center' });
      vista.rolarAte = null;
    }
  }

  function aoClicar(evento) {
    if (!ativo()) return;

    const acao = evento.target.closest('[data-qa]');
    if (acao) {
      const nome = acao.getAttribute('data-qa');
      if (nome === 'exportar') return exportar();
      if (nome === 'limparFiltros') {
        vista.filtros = filtrosVazios();
        return renderCasosProjeto();
      }
      if (nome === 'limparCaso') {
        if (window.confirm(t('confirma.limparCaso'))) {
          const id = vista.selecionado;
          Store.limparCaso(vista.projetoId, id);
          render();
          abrirGaveta(id);
        }
        return;
      }
      if (nome === 'expandirTudo' || nome === 'recolherTudo') {
        const abrir = nome === 'expandirTudo';
        Array.prototype.forEach.call(document.querySelectorAll('.pd-arvore details'), function (d) {
          d.open = abrir;
        });
      }
      if (nome === 'detalhe') return abrirGaveta(acao.getAttribute('data-id'));
      if (nome === 'irSecao') return rolarParaSecao(acao.getAttribute('data-modulo'));
      return;
    }

    const atalho = evento.target.closest('[data-qa-abrir]');
    if (atalho) {
      vista.abrirAoEntrar = atalho.getAttribute('data-qa-abrir');
      return;
    }

    if (!evento.target.closest('#vista')) return;

    const modulo = evento.target.closest('.pd-modulo[data-modulo]');
    if (modulo) {
      vista.filtros.modulo = modulo.getAttribute('data-modulo');
      return window.App.irPara('#/qa/p/' + vista.projetoId + '/casos');
    }

    const linha = evento.target.closest('tr[data-id]');
    if (linha && !evento.target.closest('a')) abrirGaveta(linha.getAttribute('data-id'));
  }

  function aoDigitar(evento) {
    if (!ativo()) return;
    const campoDoCaso = evento.target.tagName === 'TEXTAREA' && evento.target.getAttribute('data-qa-campo');
    if (campoDoCaso && evento.target.closest('#vista')) {
      return registrarNoPlano(evento.target, campoDoCaso, evento.target.value);
    }
    if (evento.target.id !== 'fBusca') return;
    vista.filtros.busca = evento.target.value;
    const posicao = evento.target.selectionStart;
    renderCasosProjeto();
    const novo = el('fBusca');
    if (novo) {
      novo.focus();
      novo.setSelectionRange(posicao, posicao);
    }
  }

  function aoMudarFiltro(evento) {
    if (!ativo()) return;
    // Caixa e situação de um caso do plano. A anotação já foi gravada a cada tecla.
    const campoDoCaso = evento.target.getAttribute && evento.target.getAttribute('data-qa-campo');
    if (campoDoCaso && evento.target.closest('#vista')) {
      if (campoDoCaso === 'verificado') registrarNoPlano(evento.target, 'verificado', evento.target.checked ? 'sim' : 'nao');
      else if (campoDoCaso === 'status') registrarNoPlano(evento.target, 'status', evento.target.value);
      return;
    }
    const mapa = {
      fModulo: 'modulo',
      fStatus: 'status',
      fPrioridade: 'prioridade',
      fTipo: 'tipo',
      fRetrabalho: 'retrabalho',
      fVerificacao: 'verificacao',
    };
    const campo = mapa[evento.target.id];
    if (!campo) return;
    vista.filtros[campo] = evento.target.value;
    renderCasosProjeto();
  }

  function iniciar() {
    Store.aoMudarGravacao = function (situacao) {
      window.App.sinalizarGravacao(situacao, Store.estado.erro);
      if (situacao === 'erro' || situacao === 'salvo') window.App.renderBanners();
      if (situacao === 'salvo' && ativo() && vista.rota === 'casos') {
        Array.prototype.forEach.call(document.querySelectorAll('#vista .pd-marca-alterado'), function (marca) {
          const corpo = marca.closest('tbody[data-caso]');
          if (corpo) atualizarCaso(corpo.getAttribute('data-caso'));
        });
      }
    };

    el('btnFecharGaveta').addEventListener('click', fecharGaveta);
    el('fundo').addEventListener('click', fecharGaveta);
    document.addEventListener('click', aoClicar);
    document.addEventListener('input', aoDigitar);
    document.addEventListener('change', aoMudarFiltro);
  }

  window.QA.Telas = {
    iniciar: iniciar,
    permitido: permitido,
    entrar: entrar,
    sair: sair,
    recarregar: recarregar,
    descarregar: descarregar,
    abas: abas,
    abaAtual: abaAtual,
    subtitulo: subtitulo,
    acoes: acoes,
    banner: banner,
    render: render,
    somenteLeitura: somenteLeitura,
    temPendencias: temPendencias,
    aoEscape: aoEscape,
    icone: 'QA',
    nivel: nivel,
    atalhos: atalhos,
  };
})();
