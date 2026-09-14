/**
 * Leitura e escrita de CSV no formato RFC 4180 (aspas duplas, escape por "").
 * Sem dependência externa — o portal roda em GitHub Pages, só HTML/CSS/JS.
 *
 * Os textos livres (observações, motivos) trazem vírgula, aspas e quebra de
 * linha: um split(',') quebraria o arquivo na primeira vírgula digitada.
 */
(function () {
  'use strict';

  /** Converte texto CSV em array de objetos, usando a primeira linha como cabeçalho. */
  function parse(texto) {
    const limpo = String(texto || '').replace(/^\uFEFF/, '');
    const linhas = tokenizar(limpo);
    if (!linhas.length) return { colunas: [], linhas: [] };

    const colunas = linhas[0];
    const registros = [];

    for (let i = 1; i < linhas.length; i++) {
      const campos = linhas[i];
      // Ignora linhas em branco no fim do arquivo.
      if (campos.length === 1 && campos[0].trim() === '') continue;
      const registro = {};
      colunas.forEach((coluna, indice) => {
        registro[coluna] = campos[indice] !== undefined ? campos[indice] : '';
      });
      registros.push(registro);
    }

    return { colunas: colunas, linhas: registros };
  }

  /** Percorre o texto caractere a caractere respeitando aspas e quebras internas. */
  function tokenizar(texto) {
    const linhas = [];
    let campos = [];
    let campo = '';
    let dentroDeAspas = false;

    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];

      if (dentroDeAspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') {
            campo += '"';
            i++;
          } else {
            dentroDeAspas = false;
          }
        } else {
          campo += c;
        }
        continue;
      }

      if (c === '"') {
        dentroDeAspas = true;
      } else if (c === ',') {
        campos.push(campo);
        campo = '';
      } else if (c === '\n') {
        campos.push(campo);
        linhas.push(campos);
        campos = [];
        campo = '';
      } else if (c === '\r') {
        // Ignorado; a quebra é tratada no \n seguinte.
      } else {
        campo += c;
      }
    }

    campos.push(campo);
    linhas.push(campos);
    return linhas;
  }

  /** Gera texto CSV a partir de uma lista de objetos e da ordem de colunas. */
  function serialize(registros, colunas) {
    const cabecalho = colunas.map(escapar).join(',');
    const corpo = registros.map(function (registro) {
      return colunas
        .map(function (coluna) {
          return escapar(registro[coluna] === undefined || registro[coluna] === null ? '' : String(registro[coluna]));
        })
        .join(',');
    });
    return [cabecalho].concat(corpo).join('\n') + '\n';
  }

  /** Só coloca aspas quando o campo precisa — mantém o arquivo legível no diff do Git. */
  function escapar(valor) {
    const precisa = /[",\n\r]/.test(valor);
    if (!precisa) return valor;
    return '"' + valor.replace(/"/g, '""') + '"';
  }

  window.CSV = { parse: parse, serialize: serialize };
})();
