/**
 * Controle de Impedimentos — utilitários de data e hora.
 *
 * Convenção: datas são gravadas no CSV como "AAAA-MM-DDTHH:mm" em horário
 * LOCAL, sem fuso. A equipe toda trabalha no mesmo fuso e esse formato é
 * exatamente o que o <input type="datetime-local"> produz e consome, o que evita
 * conversões silenciosas de UTC que deslocariam os registros.
 */
(function () {
  'use strict';

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function t(chave) {
    return window.I18N.t('imp.' + chave);
  }

  function locale() {
    return window.I18N.locale;
  }

  /** Date -> "AAAA-MM-DDTHH:mm" (local). */
  function paraInput(data) {
    return (
      data.getFullYear() + '-' + pad2(data.getMonth() + 1) + '-' + pad2(data.getDate()) +
      'T' + pad2(data.getHours()) + ':' + pad2(data.getMinutes())
    );
  }

  /** Date -> "AAAA-MM-DD" (local). */
  function paraData(data) {
    return data.getFullYear() + '-' + pad2(data.getMonth() + 1) + '-' + pad2(data.getDate());
  }

  /** Momento atual, no formato aceito pelo input. */
  function agoraInput() {
    return paraInput(new Date());
  }

  /**
   * "AAAA-MM-DDTHH:mm" -> Date local, ou null se o valor for inválido.
   * O parse é manual de propósito: passar a string direto para new Date()
   * deixa o resultado à mercê de diferenças entre navegadores.
   */
  function lerInput(valor) {
    if (!valor) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(valor).trim());
    if (!m) return null;
    const ano = Number(m[1]);
    const mes = Number(m[2]);
    const dia = Number(m[3]);
    const data = new Date(ano, mes - 1, dia, Number(m[4]), Number(m[5]), 0, 0);
    // Rejeita datas impossíveis como 2026-02-31, que o construtor "corrige".
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
    return data;
  }

  /** "AAAA-MM-DDTHH:mm" -> "AAAA-MM-DD", usado para agrupar por dia. */
  function chaveDia(valor) {
    return valor ? String(valor).slice(0, 10) : '';
  }

  /** Diferença em minutos inteiros entre duas datas/horas. */
  function diferencaMinutos(inicio, fim) {
    const a = lerInput(inicio);
    const b = lerInput(fim);
    if (!a || !b) return null;
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
  }

  /** 135 -> "2h 15min" · 45 -> "45min" · 0 -> "0min" */
  function formatarDuracao(minutos) {
    const total = Math.max(0, Math.round(Number(minutos) || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h && m) return h + t('unidade.h') + ' ' + m + t('unidade.min');
    if (h) return h + t('unidade.h');
    return m + t('unidade.min');
  }

  /** Segundos -> "HH:MM:SS", para o cronômetro do impedimento em andamento. */
  function formatarCronometro(segundos) {
    const total = Math.max(0, Math.floor(segundos));
    return pad2(Math.floor(total / 3600)) + ':' + pad2(Math.floor((total % 3600) / 60)) + ':' + pad2(total % 60);
  }

  function formatarDataHora(valor) {
    const data = lerInput(valor);
    if (!data) return '—';
    return new Intl.DateTimeFormat(locale(), { dateStyle: 'short', timeStyle: 'short' }).format(data);
  }

  function formatarHora(valor) {
    const data = lerInput(valor);
    if (!data) return '—';
    return new Intl.DateTimeFormat(locale(), { timeStyle: 'short' }).format(data);
  }

  /** "AAAA-MM-DD" -> data por extenso no idioma ativo. */
  function formatarDataLonga(chave) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(chave || '');
    if (!m) return '—';
    const data = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'long', year: 'numeric' }).format(data);
  }

  /** "Setembro de 2026" / "September 2026" */
  function formatarMesAno(ano, mes) {
    const rotulo = new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(new Date(ano, mes, 1));
    return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
  }

  /** Dias da semana abreviados, começando no domingo. */
  function rotulosSemana() {
    const formato = new Intl.DateTimeFormat(locale(), { weekday: 'short' });
    const rotulos = [];
    // 2023-01-01 foi um domingo; serve só como semana de referência.
    for (let i = 0; i < 7; i++) {
      rotulos.push(formato.format(new Date(2023, 0, 1 + i)).replace('.', '').slice(0, 3));
    }
    return rotulos;
  }

  function formatarNumero(valor, casas) {
    const digitos = casas || 0;
    return new Intl.NumberFormat(locale(), {
      minimumFractionDigits: digitos,
      maximumFractionDigits: digitos,
    }).format(Number(valor) || 0);
  }

  window.Impedimentos = window.Impedimentos || {};
  window.Impedimentos.DataHora = {
    paraInput: paraInput,
    paraData: paraData,
    agoraInput: agoraInput,
    lerInput: lerInput,
    chaveDia: chaveDia,
    diferencaMinutos: diferencaMinutos,
    formatarDuracao: formatarDuracao,
    formatarCronometro: formatarCronometro,
    formatarDataHora: formatarDataHora,
    formatarHora: formatarHora,
    formatarDataLonga: formatarDataLonga,
    formatarMesAno: formatarMesAno,
    rotulosSemana: rotulosSemana,
    formatarNumero: formatarNumero,
  };
})();
