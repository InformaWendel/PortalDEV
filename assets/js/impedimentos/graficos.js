/**
 * Controle de Impedimentos — gráficos em SVG puro, sem biblioteca externa.
 *
 * Cada gráfico é um <svg> com viewBox e largura fluida: acompanha o contêiner
 * sem precisar de listener de resize. Uma série só por gráfico, então não há
 * legenda — o título do cartão diz o que está sendo medido.
 */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const esc = window.UI.esc;

  function no(tag, atributos, texto) {
    const elemento = document.createElementNS(NS, tag);
    Object.keys(atributos || {}).forEach(function (chave) {
      elemento.setAttribute(chave, atributos[chave]);
    });
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  /* ---------------- dica ---------------- */

  let dica = null;

  function elementoDica() {
    if (!dica) {
      dica = document.createElement('div');
      dica.className = 'pd-tooltip';
      dica.setAttribute('role', 'tooltip');
      document.body.appendChild(dica);
    }
    return dica;
  }

  function mostrarDica(evento, html) {
    const caixa = elementoDica();
    caixa.innerHTML = html;
    caixa.classList.add('pd-tooltip-visivel');
    moverDica(evento);
  }

  function moverDica(evento) {
    const caixa = elementoDica();
    const margem = 14;
    const r = caixa.getBoundingClientRect();
    let x = evento.clientX + margem;
    let y = evento.clientY + margem;
    if (x + r.width > window.innerWidth - 8) x = evento.clientX - r.width - margem;
    if (y + r.height > window.innerHeight - 8) y = evento.clientY - r.height - margem;
    caixa.style.left = Math.max(8, x) + 'px';
    caixa.style.top = Math.max(8, y) + 'px';
  }

  function esconderDica() {
    if (dica) dica.classList.remove('pd-tooltip-visivel');
  }

  /* ---------------- utilitários ---------------- */

  function tetoRedondo(valor) {
    if (valor <= 0) return 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(valor)));
    const normalizado = valor / magnitude;
    const passo = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
    return passo * magnitude;
  }

  /**
   * O SVG é desenhado na largura real do cartão: o texto fica com o mesmo corpo
   * em qualquer tela, sem encolher num cartão estreito nem inchar num largo.
   */
  function larguraDe(conteiner) {
    return Math.max(280, Math.round(conteiner.clientWidth || 600));
  }

  function truncar(texto, max) {
    return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
  }

  function vazio(conteiner, mensagem) {
    conteiner.innerHTML = '<p class="pd-graf-vazio">' + esc(mensagem) + '</p>';
  }

  /** Barra com a ponta de dados arredondada e a base reta, colada no eixo. */
  function caminhoBarra(x, y, largura, altura) {
    const r = Math.min(4, largura, altura / 2);
    return (
      'M' + x + ',' + y +
      'h' + (largura - r) +
      'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
      'v' + (altura - 2 * r) +
      'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + r +
      'h' + -(largura - r) + 'z'
    );
  }

  /* ---------------- barras horizontais ---------------- */

  /**
   * Barras horizontais: os rótulos são nomes de pessoas e textos de motivo, que
   * ficariam ilegíveis girados sob barras verticais.
   *
   * itens: [{ chave, rotulo, valor }]
   */
  function barrasHorizontais(conteiner, itens, opcoes) {
    const o = Object.assign(
      { formatarValor: String, aoSelecionar: null, selecionados: [], mensagemVazia: '—', maxItens: 12, titulo: '' },
      opcoes
    );

    const dados = itens
      .slice()
      .sort(function (a, b) {
        return b.valor - a.valor;
      })
      .slice(0, o.maxItens);

    if (!dados.length || dados.every(function (d) { return !d.valor; })) {
      vazio(conteiner, o.mensagemVazia);
      return;
    }

    const largura = larguraDe(conteiner);
    const alturaBarra = 18;
    const espaco = 12;
    const larguraRotulo = Math.min(150, Math.round(largura * 0.32));
    const larguraValor = 70;
    const areaBarra = largura - larguraRotulo - larguraValor;
    const altura = dados.length * (alturaBarra + espaco) + espaco;
    const max = Math.max.apply(null, dados.map(function (d) { return d.valor; })) || 1;
    const maxCaracteres = Math.max(8, Math.floor(larguraRotulo / 7));

    conteiner.innerHTML = '';
    const svg = no('svg', {
      viewBox: '0 0 ' + largura + ' ' + altura,
      width: largura,
      height: altura,
      class: 'pd-graf pd-graf-barras',
      role: 'img',
      'aria-label': o.titulo,
      preserveAspectRatio: 'xMidYMid meet',
    });

    dados.forEach(function (item, indice) {
      const y = espaco + indice * (alturaBarra + espaco);
      const larguraItem = Math.max(2, (item.valor / max) * areaBarra);
      const selecionado = o.selecionados.indexOf(item.chave) !== -1;
      const html = '<strong>' + esc(item.rotulo) + '</strong><br>' + esc(o.formatarValor(item.valor));

      const grupo = no('g', {
        class: 'pd-graf-linha' + (o.aoSelecionar ? ' pd-graf-clicavel' : '') + (selecionado ? ' pd-graf-selecionada' : ''),
      });

      // Alvo da linha inteira: a barra curta de quem tem pouco esforço também precisa ser clicável.
      grupo.appendChild(no('rect', { x: 0, y: y - espaco / 2, width: largura, height: alturaBarra + espaco, class: 'pd-graf-alvo' }));
      grupo.appendChild(
        no('text', {
          x: larguraRotulo - 10,
          y: y + alturaBarra / 2,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          class: 'pd-graf-rotulo',
        }, truncar(item.rotulo, maxCaracteres))
      );
      grupo.appendChild(no('path', { d: caminhoBarra(larguraRotulo, y, larguraItem, alturaBarra), class: 'pd-graf-barra' }));
      grupo.appendChild(
        no('text', {
          x: larguraRotulo + areaBarra + 10,
          y: y + alturaBarra / 2,
          'dominant-baseline': 'central',
          class: 'pd-graf-valor',
        }, o.formatarValor(item.valor))
      );

      grupo.addEventListener('mouseenter', function (e) { mostrarDica(e, html); });
      grupo.addEventListener('mousemove', moverDica);
      grupo.addEventListener('mouseleave', esconderDica);

      if (o.aoSelecionar) {
        grupo.setAttribute('tabindex', '0');
        grupo.setAttribute('role', 'button');
        grupo.setAttribute('aria-pressed', String(selecionado));
        grupo.setAttribute('aria-label', item.rotulo + ': ' + o.formatarValor(item.valor));
        grupo.addEventListener('click', function () { o.aoSelecionar(item.chave); });
        grupo.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            o.aoSelecionar(item.chave);
          }
        });
      }

      svg.appendChild(grupo);
    });

    conteiner.appendChild(svg);
  }

  /* ---------------- série temporal ---------------- */

  /**
   * Área + linha para séries por dia, com guia vertical e dica no ponto mais
   * próximo do cursor.
   * pontos: [{ chave, rotulo, valor }] já em ordem cronológica.
   */
  function serieArea(conteiner, pontos, opcoes) {
    const o = Object.assign({ formatarValor: String, mensagemVazia: '—', titulo: '' }, opcoes);

    if (!pontos.length) {
      vazio(conteiner, o.mensagemVazia);
      return;
    }

    const largura = larguraDe(conteiner);
    const altura = 240;
    const margem = { topo: 16, direita: 16, base: 34, esquerda: 52 };
    const larguraPlot = largura - margem.esquerda - margem.direita;
    const alturaPlot = altura - margem.topo - margem.base;
    const max = tetoRedondo(Math.max.apply(null, pontos.map(function (p) { return p.valor; })));

    // Com um ponto só não há intervalo: centraliza para não dividir por zero.
    const passoX = pontos.length > 1 ? larguraPlot / (pontos.length - 1) : 0;
    function xEm(i) {
      return pontos.length > 1 ? margem.esquerda + i * passoX : margem.esquerda + larguraPlot / 2;
    }
    function yEm(v) {
      return margem.topo + alturaPlot - (v / max) * alturaPlot;
    }

    conteiner.innerHTML = '';
    const svg = no('svg', {
      viewBox: '0 0 ' + largura + ' ' + altura,
      width: largura,
      height: altura,
      class: 'pd-graf pd-graf-area',
      role: 'img',
      'aria-label': o.titulo,
      preserveAspectRatio: 'xMidYMid meet',
    });

    const divisoes = 4;
    for (let i = 0; i <= divisoes; i++) {
      const valor = (max / divisoes) * i;
      const y = yEm(valor);
      svg.appendChild(no('line', { x1: margem.esquerda, y1: y, x2: largura - margem.direita, y2: y, class: 'pd-graf-grade' }));
      svg.appendChild(
        no('text', {
          x: margem.esquerda - 8,
          y: y,
          'text-anchor': 'end',
          'dominant-baseline': 'central',
          class: 'pd-graf-eixo',
        }, o.formatarValor(valor))
      );
    }

    const linha = pontos
      .map(function (p, i) {
        return (i === 0 ? 'M' : 'L') + xEm(i) + ',' + yEm(p.valor);
      })
      .join(' ');
    const base = margem.topo + alturaPlot;
    svg.appendChild(no('path', { d: linha + ' L' + xEm(pontos.length - 1) + ',' + base + ' L' + xEm(0) + ',' + base + ' Z', class: 'pd-graf-preenchimento' }));
    svg.appendChild(no('path', { d: linha, class: 'pd-graf-traco' }));

    // Rótulos do eixo X: um a cada ~80px, para não empilhar texto no celular.
    const passoRotulo = Math.max(1, Math.ceil(pontos.length / Math.max(2, Math.floor(larguraPlot / 80))));
    pontos.forEach(function (ponto, i) {
      if (i % passoRotulo === 0 || i === pontos.length - 1) {
        svg.appendChild(no('text', { x: xEm(i), y: altura - 10, 'text-anchor': 'middle', class: 'pd-graf-eixo' }, ponto.rotulo));
      }
    });

    // Marcadores fixos só enquanto cabem; numa série longa viram um contínuo ilegível.
    if (pontos.length <= 45) {
      pontos.forEach(function (ponto, i) {
        svg.appendChild(no('circle', { cx: xEm(i), cy: yEm(ponto.valor), r: 4, class: 'pd-graf-ponto' }));
      });
    }

    const guia = no('line', { x1: 0, y1: margem.topo, x2: 0, y2: base, class: 'pd-graf-guia' });
    const destaque = no('circle', { cx: 0, cy: 0, r: 5, class: 'pd-graf-destaque' });
    svg.appendChild(guia);
    svg.appendChild(destaque);

    const camada = no('rect', {
      x: margem.esquerda - 10,
      y: margem.topo,
      width: larguraPlot + 20,
      height: alturaPlot,
      class: 'pd-graf-alvo',
    });
    svg.appendChild(camada);

    function indicePerto(evento) {
      if (pontos.length === 1) return 0;
      const ctm = svg.getScreenCTM();
      if (!ctm) return 0;
      const p = svg.createSVGPoint();
      p.x = evento.clientX;
      p.y = evento.clientY;
      const local = p.matrixTransform(ctm.inverse());
      return Math.max(0, Math.min(pontos.length - 1, Math.round((local.x - margem.esquerda) / passoX)));
    }

    function aoMover(evento) {
      const i = indicePerto(evento);
      const ponto = pontos[i];
      guia.setAttribute('x1', xEm(i));
      guia.setAttribute('x2', xEm(i));
      destaque.setAttribute('cx', xEm(i));
      destaque.setAttribute('cy', yEm(ponto.valor));
      svg.classList.add('pd-graf-ativo');
      mostrarDica(evento, '<strong>' + esc(ponto.rotulo) + '</strong><br>' + esc(o.formatarValor(ponto.valor)));
    }

    camada.addEventListener('pointermove', aoMover);
    camada.addEventListener('pointerdown', aoMover);
    camada.addEventListener('pointerleave', function () {
      svg.classList.remove('pd-graf-ativo');
      esconderDica();
    });

    conteiner.appendChild(svg);
  }

  window.Impedimentos = window.Impedimentos || {};
  window.Impedimentos.Graficos = {
    barrasHorizontais: barrasHorizontais,
    serieArea: serieArea,
    esconderDica: esconderDica,
  };
})();
