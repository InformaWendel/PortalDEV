/**
 * Portal QA — estado: os projetos de teste e o catálogo de cada um.
 *
 * O CSV do repositório é a única fonte de verdade. Uma alteração é aplicada em
 * memória e, logo em seguida, vira commit — não existe cópia local de registro
 * esperando exportação. Quem entrar depois lê o que o colega gravou.
 */
(function () {
  'use strict';

  /** Colunas que o portal deixa preencher pela tela; o resto vem do catálogo. */
  const CAMPOS_EDITAVEIS = [
    'status',
    'testado_por',
    'data_teste',
    'devolucoes',
    'ultima_devolucao',
    'referencia',
    'observacoes',
  ];

  /** Situações que representam um desfecho — o caso saiu da fila. */
  const COM_DESFECHO = ['liberada', 'devolvida', 'bloqueada', 'nao_implementada'];

  /** Situações que continuam pedindo ação de alguém. */
  const EM_ABERTO = ['nao_testado', 'em_teste', 'devolvida', 'bloqueada', 'nao_implementada'];

  /** Agrupamento do dashboard: planejado, em andamento, concluído. */
  const FASES = {
    planejado: ['nao_testado'],
    andamento: ['em_teste', 'devolvida', 'bloqueada', 'nao_implementada'],
    concluido: ['liberada'],
  };

  const MAX_TENTATIVAS = 3;

  const estado = {
    projetos: [],
    catalogos: {}, // id do projeto -> { colunas, linhas }
    pendentes: {}, // id do projeto -> { id do caso -> campos } (fila de gravação)
    temporizadores: {},
    tentativas: {},
    emVoo: {}, // id do projeto -> Promise do commit em andamento
    falhasLeitura: {}, // id do projeto -> erro da última leitura do catálogo que falhou
    gravacao: 'ocioso', // ocioso | gravando | salvo | erro | leitura
    erro: null,
    autor: '',
    carregado: false,
  };

  let carga = null;

  /** A interface assina isto para mostrar o estado da gravação. */
  let aoMudar = function () {};

  function sinalizar(novo, erro) {
    estado.gravacao = novo;
    estado.erro = erro || null;
    aoMudar(novo, erro || null);
  }

  /* ---------------- carregamento ---------------- */

  function carregarProjetos() {
    return window.Github.lerArquivo(window.PORTAL_CONFIG.dados.qaProjetos)
      .then(function (r) {
        if (!r.existe) throw new Error(window.PORTAL_CONFIG.dados.qaProjetos + ' não encontrado');
        estado.projetos = window.CSV.parse(r.texto).linhas.filter(function (p) {
          return p.id && p.ativo === 'sim';
        });
        return estado.projetos;
      })
      .catch(function (erro) {
        sinalizar('erro', erro);
        estado.projetos = [];
        return [];
      });
  }

  function carregarCatalogo(projetoId) {
    const projeto = projetoPorId(projetoId);
    if (!projeto) return Promise.resolve(null);

    return window.Github.lerArquivo(projeto.arquivo)
      .then(function (r) {
        if (!r.existe) throw new Error(projeto.arquivo + ' não encontrado');
        aplicarCsv(projetoId, r.texto);
        delete estado.falhasLeitura[projetoId];
        // O aviso só sai se era de leitura e nenhum outro catálogo continua sem carregar.
        if (estado.gravacao === 'erro' && estado.erro && estado.erro.leitura) {
          const restantes = Object.keys(estado.falhasLeitura);
          if (restantes.length) sinalizar('erro', estado.falhasLeitura[restantes[0]]);
          else if (!temPendencias()) sinalizar('ocioso');
        }
        return estado.catalogos[projetoId];
      })
      .catch(function (erro) {
        erro.leitura = true;
        estado.falhasLeitura[projetoId] = erro;
        sinalizar('erro', erro);
        return null;
      });
  }

  function carregarTodosCatalogos() {
    return Promise.all(
      estado.projetos.map(function (p) {
        return carregarCatalogo(p.id);
      })
    );
  }

  /**
   * Projetos e todos os catálogos, uma vez só: a visão geral soma tudo.
   * Recarregar com registro pendente descartaria o que ainda não foi gravado,
   * então nesse caso fica a carga anterior.
   */
  function carregar(forcar) {
    if (carga && (!forcar || temPendencias())) return carga;
    carga = carregarProjetos()
      .then(function () {
        return carregarTodosCatalogos();
      })
      .then(function () {
        estado.carregado = true;
      });
    return carga;
  }

  function aplicarCsv(projetoId, texto) {
    const resultado = window.CSV.parse(texto);
    estado.catalogos[projetoId] = {
      colunas: resultado.colunas,
      linhas: resultado.linhas.filter(function (linha) {
        return linha.id && linha.id.trim() !== '';
      }),
    };
  }

  /* ---------------- leitura ---------------- */

  function projetoPorId(id) {
    return estado.projetos.filter(function (p) {
      return p.id === id;
    })[0];
  }

  function casos(projetoId) {
    const catalogo = estado.catalogos[projetoId];
    if (!catalogo) return [];
    const fila = estado.pendentes[projetoId] || {};
    return catalogo.linhas.map(function (linha) {
      const caso = Object.assign({}, linha);
      caso._projeto = projetoId;
      caso._gravando = !!fila[linha.id];
      return caso;
    });
  }

  function caso(projetoId, id) {
    return casos(projetoId).filter(function (c) {
      return c.id === id;
    })[0];
  }

  function todosOsCasos() {
    return estado.projetos.reduce(function (acumulado, p) {
      return acumulado.concat(casos(p.id));
    }, []);
  }

  function emAberto(lista) {
    return (lista || []).filter(function (c) {
      return EM_ABERTO.indexOf(c.status) !== -1;
    });
  }

  /* ---------------- escrita ---------------- */

  function linhaDe(projetoId, id) {
    const catalogo = estado.catalogos[projetoId];
    if (!catalogo) return null;
    return catalogo.linhas.filter(function (l) {
      return l.id === id;
    })[0];
  }

  /** AAAA-MM-DD no dia de quem registra — toISOString daria o dia seguinte depois das 21h em Brasília. */
  function dataLocal(data) {
    return data.getFullYear() + '-' + String(data.getMonth() + 1).padStart(2, '0') + '-' + String(data.getDate()).padStart(2, '0');
  }

  /**
   * Aplica a alteração em memória e agenda o commit.
   *
   * A contagem de devoluções é automática: cada entrada em "devolvida" vinda de
   * outra situação soma uma volta. É isso que vira a métrica de retrabalho.
   */
  function registrar(projetoId, id, campos, autor) {
    const linha = linhaDe(projetoId, id);
    if (!linha) return;

    const hoje = dataLocal(new Date());
    const mudancas = Object.assign({}, campos);

    if (mudancas.status !== undefined && mudancas.status !== linha.status) {
      // Quem mexeu no resultado assina o teste, com a data.
      if (mudancas.status !== 'nao_testado') {
        if (autor && !mudancas.testado_por) mudancas.testado_por = autor;
        if (!mudancas.data_teste) mudancas.data_teste = hoje;
      }
      if (mudancas.status === 'devolvida') {
        mudancas.devolucoes = String((parseInt(linha.devolucoes, 10) || 0) + 1);
        mudancas.ultima_devolucao = hoje;
      }
    }

    const fila = (estado.pendentes[projetoId] = estado.pendentes[projetoId] || {});
    const doCaso = (fila[id] = fila[id] || {});

    Object.keys(mudancas).forEach(function (campo) {
      if (CAMPOS_EDITAVEIS.indexOf(campo) === -1) return;
      const valor = mudancas[campo] === undefined || mudancas[campo] === null ? '' : String(mudancas[campo]);
      linha[campo] = valor;
      doCaso[campo] = valor;
    });

    if (autor) estado.autor = autor;
    agendarGravacao(projetoId);
  }

  function limparCaso(projetoId, id) {
    const linha = linhaDe(projetoId, id);
    if (!linha) return;
    const campos = {};
    CAMPOS_EDITAVEIS.forEach(function (campo) {
      campos[campo] = campo === 'devolucoes' ? '0' : campo === 'status' ? 'nao_testado' : '';
    });
    const fila = (estado.pendentes[projetoId] = estado.pendentes[projetoId] || {});
    fila[id] = Object.assign({}, campos);
    Object.keys(campos).forEach(function (campo) {
      linha[campo] = campos[campo];
    });
    agendarGravacao(projetoId);
  }

  function agendarGravacao(projetoId) {
    if (!window.Github.temToken()) {
      sinalizar('leitura');
      return;
    }
    sinalizar('gravando');
    window.clearTimeout(estado.temporizadores[projetoId]);
    estado.temporizadores[projetoId] = window.setTimeout(function () {
      gravar(projetoId).catch(function () {
        /* o erro já foi sinalizado para a interface */
      });
    }, window.PORTAL_CONFIG.atrasoGravacao);
  }

  /** Força o commit do que estiver pendente, sem esperar o temporizador. */
  function gravarAgora(projetoId) {
    window.clearTimeout(estado.temporizadores[projetoId]);
    return gravar(projetoId);
  }

  function mensagemDeCommit(projetoId) {
    const fila = estado.pendentes[projetoId] || {};
    const ids = Object.keys(fila);
    const projeto = projetoPorId(projetoId);
    const quem = estado.autor ? ' por ' + estado.autor : '';
    if (ids.length === 1) {
      const situacao = fila[ids[0]].status;
      return 'chore(qa): ' + ids[0] + (situacao ? ' ' + situacao : ' atualizado') + quem;
    }
    return 'chore(qa): ' + (projeto ? projeto.id : projetoId) + ' — ' + ids.length + ' casos atualizados' + quem;
  }

  function gravar(projetoId) {
    // Um commit por projeto de cada vez: o que for registrado com um PUT em voo
    // espera por ele e sai logo em seguida, já com o sha novo.
    if (estado.emVoo[projetoId]) return estado.emVoo[projetoId];

    const projeto = projetoPorId(projetoId);
    const fila = estado.pendentes[projetoId];
    if (!projeto || !fila || !Object.keys(fila).length) {
      sinalizar('ocioso');
      return Promise.resolve();
    }
    if (!window.Github.temToken()) {
      sinalizar('leitura');
      return Promise.resolve();
    }

    sinalizar('gravando');
    const mensagem = mensagemDeCommit(projetoId);
    // Fotografia do que vai neste commit: o que chegar depois continua na fila.
    const enviado = JSON.parse(JSON.stringify(fila));

    const envio = window.Github.gravarArquivo(projeto.arquivo, exportarCsv(projetoId), mensagem).then(
      function () {
        estado.emVoo[projetoId] = null;
        estado.tentativas[projetoId] = 0;
        if (descontarEnviado(projetoId, enviado)) return gravar(projetoId);
        sinalizar('salvo');
      },
      function (erro) {
        estado.emVoo[projetoId] = null;
        if (!erro.conflito) {
          sinalizar('erro', erro);
          throw erro;
        }
        // Alguém gravou entre a nossa leitura e a nossa escrita: relemos o
        // arquivo e reaplicamos por cima só o que este navegador alterou.
        const tentativa = (estado.tentativas[projetoId] || 0) + 1;
        estado.tentativas[projetoId] = tentativa;
        if (tentativa > MAX_TENTATIVAS) {
          estado.tentativas[projetoId] = 0;
          sinalizar('erro', new Error('conflito persistente'));
          return;
        }
        return window.Github.lerArquivo(projeto.arquivo).then(function (r) {
          const guardado = estado.pendentes[projetoId] || {};
          aplicarCsv(projetoId, r.texto);
          Object.keys(guardado).forEach(function (id) {
            const linha = linhaDe(projetoId, id);
            if (!linha) return;
            Object.keys(guardado[id]).forEach(function (campo) {
              linha[campo] = guardado[id][campo];
            });
          });
          return gravar(projetoId);
        });
      }
    );

    estado.emVoo[projetoId] = envio;
    return envio;
  }

  /**
   * Tira da fila o que foi no commit que acabou de voltar. Campo alterado de novo
   * enquanto o PUT estava em voo fica. Devolve true quando sobra algo a gravar.
   */
  function descontarEnviado(projetoId, enviado) {
    const fila = estado.pendentes[projetoId] || {};
    Object.keys(enviado).forEach(function (id) {
      const doCaso = fila[id];
      if (!doCaso) return;
      Object.keys(enviado[id]).forEach(function (campo) {
        if (doCaso[campo] === enviado[id][campo]) delete doCaso[campo];
      });
      if (!Object.keys(doCaso).length) delete fila[id];
    });
    if (Object.keys(fila).length) return true;
    delete estado.pendentes[projetoId];
    return false;
  }

  function temPendencias() {
    return Object.keys(estado.pendentes).some(function (p) {
      return Object.keys(estado.pendentes[p] || {}).length > 0;
    });
  }

  /** Grava tudo que está pendente em todos os projetos — antes de sair do portal, por exemplo. */
  function gravarTudo() {
    return Promise.all(
      Object.keys(estado.pendentes).map(function (projetoId) {
        return gravarAgora(projetoId).catch(function () {
          /* o erro já foi sinalizado para a interface */
        });
      })
    );
  }

  /* ---------------- métricas ---------------- */

  /** "Não se aplica" sai do denominador — não é dívida de teste nem de entrega. */
  function metricas(lista) {
    const todos = lista || [];
    const consideraveis = todos.filter(function (c) {
      return c.status !== 'nao_aplicavel';
    });

    function conta(status) {
      return consideraveis.filter(function (c) {
        return c.status === status;
      }).length;
    }

    function contaFase(fase) {
      return consideraveis.filter(function (c) {
        return FASES[fase].indexOf(c.status) !== -1;
      }).length;
    }

    const comDesfecho = consideraveis.filter(function (c) {
      return COM_DESFECHO.indexOf(c.status) !== -1;
    });

    // Retrabalho: casos que já voltaram ao desenvolvimento pelo menos uma vez.
    const voltas = consideraveis.map(function (c) {
      return parseInt(c.devolucoes, 10) || 0;
    });
    const totalDevolucoes = voltas.reduce(function (soma, n) {
      return soma + n;
    }, 0);
    const comRetrabalho = voltas.filter(function (n) {
      return n >= 1;
    }).length;
    const reincidentes = voltas.filter(function (n) {
      return n >= 2;
    }).length;

    return {
      total: todos.length,
      consideraveis: consideraveis.length,
      comDesfecho: comDesfecho.length,
      liberadas: conta('liberada'),
      devolvidas: conta('devolvida'),
      bloqueadas: conta('bloqueada'),
      naoImplementadas: conta('nao_implementada'),
      emTeste: conta('em_teste'),
      naoTestadas: conta('nao_testado'),
      planejado: contaFase('planejado'),
      andamento: contaFase('andamento'),
      concluido: contaFase('concluido'),
      abertos: consideraveis.filter(function (c) {
        return EM_ABERTO.indexOf(c.status) !== -1;
      }).length,
      pendencias: conta('devolvida') + conta('bloqueada') + conta('nao_implementada'),
      totalDevolucoes: totalDevolucoes,
      comRetrabalho: comRetrabalho,
      reincidentes: reincidentes,
      cobertura: consideraveis.length ? comDesfecho.length / consideraveis.length : 0,
      liberacao: consideraveis.length ? conta('liberada') / consideraveis.length : 0,
      retrabalho: comDesfecho.length ? comRetrabalho / comDesfecho.length : 0,
    };
  }

  function porStatus(lista) {
    return window.QA.Textos.ordemStatus.map(function (status) {
      return {
        status: status,
        total: (lista || []).filter(function (c) {
          return c.status === status;
        }).length,
      };
    });
  }

  function porModulo(lista) {
    const todos = lista || [];
    const chaves = [];
    todos.forEach(function (c) {
      if (chaves.indexOf(c.modulo) === -1) chaves.push(c.modulo);
    });
    return chaves
      .map(function (chave) {
        const doModulo = todos.filter(function (c) {
          return c.modulo === chave;
        });
        return { modulo: chave, casos: doModulo, metricas: metricas(doModulo) };
      })
      .sort(function (a, b) {
        return b.casos.length - a.casos.length;
      });
  }

  /** CSV do projeto no estado atual — é o que vai para o commit e para o download. */
  function exportarCsv(projetoId) {
    const catalogo = estado.catalogos[projetoId];
    if (!catalogo) return '';
    return window.CSV.serialize(catalogo.linhas, catalogo.colunas);
  }

  window.QA = window.QA || {};
  window.QA.Store = {
    estado: estado,
    carregar: carregar,
    carregarProjetos: carregarProjetos,
    carregarCatalogo: carregarCatalogo,
    carregarTodosCatalogos: carregarTodosCatalogos,
    aplicarCsv: aplicarCsv,
    projetoPorId: projetoPorId,
    casos: casos,
    caso: caso,
    todosOsCasos: todosOsCasos,
    emAberto: emAberto,
    registrar: registrar,
    limparCaso: limparCaso,
    gravarAgora: gravarAgora,
    gravarTudo: gravarTudo,
    temPendencias: temPendencias,
    metricas: metricas,
    porStatus: porStatus,
    porModulo: porModulo,
    exportarCsv: exportarCsv,
    camposEditaveis: CAMPOS_EDITAVEIS,
    comDesfecho: COM_DESFECHO,
    emAbertoStatus: EM_ABERTO,
    fases: FASES,
    set aoMudarGravacao(fn) {
      aoMudar = fn || function () {};
    },
  };
})();
