/**
 * Controle de Impedimentos — ligação com a casca do portal.
 *
 * Rotas (hash):
 *   #/impedimentos          meu calendário (permissão impedimentos.registrar)
 *   #/impedimentos/painel   painel consolidado (permissão impedimentos.painel)
 */
(function () {
  'use strict';

  const I = window.Impedimentos;

  function t(chave, valores) {
    return window.I18N.t('imp.' + chave, valores);
  }

  const ICONE =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8.6" r="5.6"/><path d="M8 5.6v3l2 1.4M6.4 1.6h3.2"/></svg>';

  let aba = 'calendario';

  function podeCalendario() {
    return window.Acesso.pode('impedimentos.registrar');
  }

  function podePainel() {
    return window.Acesso.pode('impedimentos.painel');
  }

  function permitido() {
    return podeCalendario() || podePainel();
  }

  /** Quem só tem uma das duas permissões cai direto na aba que pode ver. */
  function interpretar(segmentos) {
    const pedida = segmentos[1] === 'painel' ? 'painel' : 'calendario';
    if (pedida === 'painel' && !podePainel()) return 'calendario';
    if (pedida === 'calendario' && !podeCalendario()) return 'painel';
    return pedida;
  }

  function entrar(segmentos) {
    aba = interpretar(segmentos);
    if (aba === 'painel') {
      I.Calendario.sair();
      return I.Painel.entrar();
    }
    return I.Calendario.entrar();
  }

  function sair() {
    I.Calendario.sair();
  }

  function recarregar() {
    return Promise.all([
      I.Calendario.carregado() ? I.Calendario.recarregar() : null,
      I.Painel.carregado() ? I.Painel.recarregar() : null,
    ]);
  }

  function abas() {
    const lista = [];
    if (podeCalendario()) lista.push({ chave: 'calendario', rotulo: t('nav.calendario'), hash: '#/impedimentos' });
    if (podePainel()) lista.push({ chave: 'painel', rotulo: t('nav.painel'), hash: '#/impedimentos/painel' });
    return lista;
  }

  function abaAtual() {
    return aba;
  }

  /** Cartão da página inicial: um atalho para cada aba que o papel alcança. */
  function atalhos() {
    return abas().map(function (a) {
      return { rotulo: a.rotulo, hash: a.hash };
    });
  }

  function subtitulo() {
    return t('app.nome');
  }

  function render() {
    if (aba === 'painel') I.Painel.render();
    else I.Calendario.render();
  }

  /** O painel consolidado só lê. */
  function somenteLeitura() {
    return aba === 'painel';
  }

  function iniciar() {
    I.Calendario.iniciar();
    I.Painel.iniciar();
  }

  I.Telas = {
    iniciar: iniciar,
    permitido: permitido,
    entrar: entrar,
    sair: sair,
    recarregar: recarregar,
    abas: abas,
    abaAtual: abaAtual,
    subtitulo: subtitulo,
    render: render,
    somenteLeitura: somenteLeitura,
    icone: ICONE,
    atalhos: atalhos,
  };
})();
