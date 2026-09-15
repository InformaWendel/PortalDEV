/**
 * Controle de Impedimentos — persistência: um CSV por usuário em
 * data/impedimentos/<usuario>.csv.
 *
 * Toda gravação é um ciclo ler -> alterar -> gravar com o sha da versão lida.
 * Se o arquivo mudou no meio do caminho a API responde conflito, e a operação é
 * refeita sobre a versão nova em vez de sobrescrever o que chegou.
 */
(function () {
  'use strict';

  const DataHora = window.Impedimentos.DataHora;

  /**
   * Colunas do CSV, nesta ordem exata. `modulo` e `entregavel` são o que o analista
   * informa ao finalizar e o que alimenta o item do roadmap — ficam aqui, e não só na
   * fila, para o que ele digitou nunca depender da segunda gravação.
   */
  const COLUNAS = [
    'id',
    'usuario',
    'inicio',
    'motivo_inicio',
    'fim',
    'motivo_fim',
    'duracao_min',
    'status',
    'criado_em',
    'atualizado_em',
    'modulo',
    'entregavel',
  ];

  const STATUS = { ABERTO: 'aberto', FINALIZADO: 'finalizado' };

  function caminho(usuario) {
    return window.PORTAL_CONFIG.dados.impedimentos + '/' + usuario + '.csv';
  }

  /** Identificador estável e legível para o registro. */
  function novoId() {
    return 'imp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Garante todas as colunas e recalcula os campos derivados. Editar o CSV na
   * mão não corrompe nada: duração e situação saem sempre de início e fim.
   */
  function normalizar(registro) {
    const linha = {};
    COLUNAS.forEach(function (coluna) {
      linha[coluna] = registro[coluna] !== undefined && registro[coluna] !== null ? String(registro[coluna]) : '';
    });
    if (linha.fim) {
      linha.status = STATUS.FINALIZADO;
      const minutos = DataHora.diferencaMinutos(linha.inicio, linha.fim);
      linha.duracao_min = minutos === null ? '' : String(minutos);
    } else {
      linha.status = STATUS.ABERTO;
      linha.duracao_min = '';
    }
    return linha;
  }

  /** Do mais recente para o mais antigo, pelo início. */
  function ordenar(registros) {
    return registros.slice().sort(function (a, b) {
      const da = DataHora.lerInput(a.inicio);
      const db = DataHora.lerInput(b.inicio);
      return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
    });
  }

  function lerRegistros(texto, usuario) {
    return window.CSV.parse(texto)
      .linhas.filter(function (r) {
        return r.id;
      })
      .map(function (r) {
        return normalizar(Object.assign({}, r, { usuario: r.usuario || usuario }));
      });
  }

  /** Registros de um usuário. Sem CSV ainda (usuário novo) a lista vem vazia. */
  function carregarUsuario(usuario) {
    return window.Github.lerArquivo(caminho(usuario)).then(function (arquivo) {
      return { registros: ordenar(lerRegistros(arquivo.texto, usuario)), existe: arquivo.existe };
    });
  }

  /**
   * Aplica uma alteração no CSV do usuário. `mutador` recebe a lista atual — lida
   * de novo a cada tentativa — e devolve a lista nova, ou null para desistir.
   */
  function alterarUsuario(usuario, mensagem, mutador) {
    return window.Github
      .alterarArquivo(
        caminho(usuario),
        function (texto) {
          const novos = mutador(lerRegistros(texto, usuario));
          if (novos === null) return null;
          return window.CSV.serialize(ordenar(novos.map(normalizar)), COLUNAS);
        },
        mensagem
      )
      .then(function (resultado) {
        return { registros: ordenar(lerRegistros(resultado.texto, usuario)), abortado: resultado.abortado };
      });
  }

  /** Novo impedimento, aberto ou já finalizado. */
  function montarRegistro(dados) {
    const agora = new Date().toISOString();
    return normalizar({
      id: novoId(),
      usuario: dados.usuario,
      inicio: dados.inicio,
      motivo_inicio: dados.motivo_inicio,
      fim: dados.fim || '',
      motivo_fim: dados.motivo_fim || '',
      modulo: dados.modulo || '',
      entregavel: dados.entregavel || '',
      criado_em: agora,
      atualizado_em: agora,
    });
  }

  /** O impedimento aberto do usuário, se houver — só existe um por vez. */
  function emAberto(registros) {
    return (
      registros.filter(function (r) {
        return r.status === STATUS.ABERTO;
      })[0] || null
    );
  }

  /**
   * Agrupa por dia: { 'AAAA-MM-DD': { quantidade, minutos, abertos } }.
   * O impedimento conta no dia em que COMEÇOU, inteiro, mesmo atravessando a
   * meia-noite — assim a soma do calendário e a do painel batem.
   */
  function porDia(registros) {
    const mapa = new Map();
    registros.forEach(function (r) {
      const chave = DataHora.chaveDia(r.inicio);
      if (!chave) return;
      const entrada = mapa.get(chave) || { quantidade: 0, minutos: 0, abertos: 0 };
      entrada.quantidade += 1;
      entrada.minutos += Number(r.duracao_min) || 0;
      if (r.status === STATUS.ABERTO) entrada.abertos += 1;
      mapa.set(chave, entrada);
    });
    return mapa;
  }

  function registrosDoDia(registros, chave) {
    return registros
      .filter(function (r) {
        return DataHora.chaveDia(r.inicio) === chave;
      })
      .sort(function (a, b) {
        return a.inicio.localeCompare(b.inicio);
      });
  }

  /** Vários usuários em paralelo. Um que falhe não derruba o painel: volta em `erros`. */
  function carregarVarios(usuarios) {
    return Promise.allSettled(usuarios.map(carregarUsuario)).then(function (resultados) {
      const registros = [];
      const erros = [];
      resultados.forEach(function (resultado, indice) {
        if (resultado.status === 'fulfilled') registros.push.apply(registros, resultado.value.registros);
        else erros.push({ usuario: usuarios[indice], erro: resultado.reason });
      });
      return { registros: ordenar(registros), erros: erros };
    });
  }

  window.Impedimentos.Store = {
    COLUNAS: COLUNAS,
    STATUS: STATUS,
    caminho: caminho,
    normalizar: normalizar,
    carregarUsuario: carregarUsuario,
    alterarUsuario: alterarUsuario,
    montarRegistro: montarRegistro,
    emAberto: emAberto,
    porDia: porDia,
    registrosDoDia: registrosDoDia,
    carregarVarios: carregarVarios,
  };
})();
