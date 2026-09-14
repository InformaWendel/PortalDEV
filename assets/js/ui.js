/**
 * Utilitários de interface compartilhados pelas ferramentas: escape de HTML,
 * aviso flutuante, diálogo e download.
 */
(function () {
  'use strict';

  function esc(valor) {
    return String(valor === undefined || valor === null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function el(id) {
    return document.getElementById(id);
  }

  /** Normaliza para busca sem acento e sem caixa. */
  function normalizar(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /* ---------------- aviso flutuante ---------------- */

  let temporizadorToast = null;

  function toast(mensagem, tipo) {
    const caixa = el('toast');
    if (!caixa) return;
    caixa.textContent = mensagem;
    caixa.className = 'pd-toast' + (tipo ? ' pd-toast-' + tipo : '');
    caixa.hidden = false;
    window.clearTimeout(temporizadorToast);
    temporizadorToast = window.setTimeout(function () {
      caixa.hidden = true;
    }, 3800);
  }

  /* ---------------- diálogo ---------------- */

  /** Um diálogo por vez: abrir outro troca o conteúdo. */
  function abrirModal(html, opcoes) {
    const caixa = el('modalCorpo');
    caixa.className = 'pd-modal-caixa' + (opcoes && opcoes.largo ? ' pd-modal-largo' : '');
    caixa.innerHTML = html;
    el('modal').classList.add('pd-aberto');
    const foco = caixa.querySelector('[autofocus], input:not([type="hidden"]):not([disabled]), select, textarea');
    if (foco) foco.focus();
  }

  function fecharModal() {
    el('modal').classList.remove('pd-aberto');
    el('modalCorpo').innerHTML = '';
  }

  function modalAberto() {
    return el('modal').classList.contains('pd-aberto');
  }

  /* ---------------- arquivo ---------------- */

  /**
   * Dispara o download de um texto. O BOM só entra quando pedido: o Excel
   * precisa dele para os acentos, mas o CSV de catálogo exportado tem de sair
   * idêntico ao do repositório.
   */
  function baixarArquivo(nome, texto, opcoes) {
    const conteudo = (opcoes && opcoes.bom ? '\uFEFF' : '') + texto;
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  window.UI = {
    esc: esc,
    el: el,
    normalizar: normalizar,
    toast: toast,
    abrirModal: abrirModal,
    fecharModal: fecharModal,
    modalAberto: modalAberto,
    baixarArquivo: baixarArquivo,
  };
})();
