/**
 * Impedimentos — a fila do roadmap.
 *
 * Cada impedimento finalizado vira uma linha em data/roadmap/fila.csv, gravada no
 * próprio repositório com o token de quem registrou. A Administração tria essa fila
 * em #/admin/roadmap e monta dali o pacote do OPSView (admin/roadmap.js).
 *
 * Este lado escreve fatos e para aí: nunca "RMAP-…", nunca prefixo de título, nunca
 * fase nem ambiente — isso é da triagem.
 *
 * Coluna que este lado não conhece é preservada: é assim que a triagem guarda
 * roadmap_key, enviado_em e o resto no mesmo arquivo sem que um lado atropele o outro.
 */
(function () {
  'use strict';

  const COLUNAS = [
    'id',
    'usuario',
    'pessoa',
    'modulo',
    'modulo_nome',
    'entregavel',
    'motivo_inicio',
    'motivo_fim',
    'inicio',
    'fim',
    'duracao_min',
    'situacao',
    'criado_em',
    'atualizado_em',
  ];

  const SITUACAO = { ATIVO: 'ativo', CANCELADO: 'cancelado' };

  /** Entregável curto demais não descreve o que a pessoa passa a conseguir fazer. */
  const MIN_ENTREGAVEL = 20;

  /** Campos que a linha copia do registro — os que valem comparar na reconciliação. */
  const CAMPOS_DO_REGISTRO = ['modulo', 'modulo_nome', 'entregavel', 'motivo_inicio', 'motivo_fim', 'inicio', 'fim', 'duracao_min'];

  /**
   * Quanto tempo uma linha recém-gravada pode ainda não aparecer nos registros lidos:
   * a mesma pessoa finalizando noutra aba, ou noutra máquina com o relógio um pouco
   * adiantado, entre a leitura do CSV dela e a leitura da fila.
   */
  const MARGEM_MS = 2 * 60 * 1000;

  const estado = {
    modulos: [],
    catalogoCarregado: false,
    erroCatalogo: null,
    /** id do impedimento -> linha a gravar */
    pendentes: {},
    /** Promise do commit em andamento; um por vez, como no Portal QA */
    emVoo: null,
    erro: null,
  };

  function caminhoFila() {
    return window.PORTAL_CONFIG.dados.roadmapFila;
  }

  function caminhoModulos() {
    return window.PORTAL_CONFIG.dados.roadmapModulos;
  }

  function agora() {
    return new Date().toISOString();
  }

  /** O aviso da ferramenta depende da fila; a casca redesenha só a faixa de avisos. */
  function avisarCasca() {
    if (window.App && window.App.renderBanners) window.App.renderBanners();
  }

  /* ---------------- catálogo de módulos ---------------- */

  /**
   * O catálogo é cópia versionada dos módulos do roadmap: o portal não lê arquivo de
   * fora do repositório em tempo de execução. Falha de leitura não rejeita — quem chama
   * decide: iniciar um impedimento segue sem ele, finalizar oferece tentar de novo.
   */
  function carregarModulos(forcar) {
    if (estado.catalogoCarregado && !forcar) return Promise.resolve(estado.modulos);
    return window.Github.lerArquivo(caminhoModulos())
      .then(function (r) {
        if (!r.existe) throw new Error(caminhoModulos() + ' não encontrado');
        estado.modulos = window.CSV.parse(r.texto).linhas.filter(function (m) {
          return m.modulo;
        });
        estado.catalogoCarregado = true;
        estado.erroCatalogo = null;
        return estado.modulos;
      })
      .catch(function (erro) {
        estado.erroCatalogo = erro;
        estado.catalogoCarregado = false;
        return estado.modulos;
      });
  }

  function moduloPorChave(chave) {
    return (
      estado.modulos.filter(function (m) {
        return m.modulo === chave;
      })[0] || null
    );
  }

  /**
   * Pronto é ter o que oferecer no seletor. Catálogo lido mas sem módulo ativo numa
   * frente conhecida não serve: a validação exigiria um módulo que a lista não mostra,
   * e ninguém conseguiria finalizar.
   */
  function catalogoPronto() {
    return estado.catalogoCarregado && porFrente().length > 0;
  }

  function erroCatalogo() {
    return estado.erroCatalogo;
  }

  /** Módulos ativos agrupados por frente, na ordem do seletor. */
  function porFrente() {
    const ativos = estado.modulos.filter(function (m) {
      return m.ativo === 'sim';
    });
    return ['S', 'P', 'T']
      .map(function (frente) {
        return {
          frente: frente,
          modulos: ativos
            .filter(function (m) {
              return m.frente === frente;
            })
            .sort(function (a, b) {
              return a.nome.localeCompare(b.nome, window.I18N.locale);
            }),
        };
      })
      .filter(function (grupo) {
        return grupo.modulos.length;
      });
  }

  /* ---------------- fila ---------------- */

  /** Registro finalizado, com módulo e entregável, é o que vira linha da fila. */
  function geraItem(registro) {
    return !!(
      registro &&
      registro.status === window.Impedimentos.Store.STATUS.FINALIZADO &&
      registro.modulo &&
      registro.entregavel
    );
  }

  /** A linha da fila a partir de um registro de impedimento já normalizado. */
  function linhaDoRegistro(registro, pessoa) {
    const modulo = moduloPorChave(registro.modulo);
    return {
      id: registro.id,
      usuario: registro.usuario,
      pessoa: pessoa || '',
      modulo: registro.modulo || '',
      modulo_nome: modulo ? modulo.nome : '',
      entregavel: registro.entregavel || '',
      motivo_inicio: registro.motivo_inicio || '',
      motivo_fim: registro.motivo_fim || '',
      inicio: registro.inicio || '',
      fim: registro.fim || '',
      duracao_min: registro.duracao_min || '',
      situacao: SITUACAO.ATIVO,
      criado_em: registro.criado_em || agora(),
      atualizado_em: agora(),
    };
  }

  /**
   * Só marca a linha como pendente. O carimbo de atualização é calculado aqui, uma vez:
   * se mudasse a cada tentativa, uma reescrita idêntica viraria commit vazio.
   */
  function prepararPendente(linha) {
    const anterior = estado.pendentes[linha.id] || {};
    estado.pendentes[linha.id] = Object.assign({}, anterior, linha, { atualizado_em: agora() });
  }

  function enfileirar(linha) {
    prepararPendente(linha);
    return gravar();
  }

  /**
   * Impedimento excluído ou reaberto: a linha fica, marcada. Apagar faria o roadmap
   * perder o rastro de um item que talvez já tenha ido para o OPSView.
   */
  function cancelar(id) {
    return enfileirar({ id: id, situacao: SITUACAO.CANCELADO });
  }

  /** Só os campos que a linha realmente traz — o resto do que está no arquivo fica. */
  function aplicarSobre(destino, origem) {
    let mudou = false;
    Object.keys(origem).forEach(function (campo) {
      if (campo === 'atualizado_em' || origem[campo] === undefined) return;
      if (destino[campo] !== origem[campo]) {
        destino[campo] = origem[campo];
        mudou = true;
      }
    });
    return mudou;
  }

  /**
   * Upsert por id sobre o texto atual do arquivo. Linha alheia é copiada como está. As
   * colunas deste lado vêm primeiro, na ordem de COLUNAS; as que ele não conhece — as da
   * triagem — seguem depois, na ordem em que vieram. Num arquivo escrito só pelo portal
   * essa já é a ordem de sempre, então nada se move de uma gravação para a outra.
   */
  function mutarFila(texto, existe) {
    const atual = existe && texto.trim() ? window.CSV.parse(texto) : { colunas: [], linhas: [] };
    const colunas = COLUNAS.concat(
      atual.colunas.filter(function (c) {
        return c && COLUNAS.indexOf(c) === -1;
      })
    );
    const linhas = atual.linhas.filter(function (l) {
      return l.id;
    });
    const porId = {};
    linhas.forEach(function (l) {
      porId[l.id] = l;
    });

    let mudou = false;
    Object.keys(estado.pendentes).forEach(function (id) {
      const nova = estado.pendentes[id];
      const antiga = porId[id];
      if (antiga) {
        if (aplicarSobre(antiga, nova)) {
          antiga.atualizado_em = nova.atualizado_em;
          mudou = true;
        }
        return;
      }
      // Cancelamento de linha que nunca chegou ao arquivo não tem o que cancelar:
      // criar uma linha vazia só para marcá-la cancelada seria lixo para a triagem.
      if (nova.situacao === SITUACAO.CANCELADO && !nova.inicio) return;
      const linha = {};
      colunas.forEach(function (c) {
        linha[c] = nova[c] !== undefined ? nova[c] : '';
      });
      if (!linha.criado_em) linha.criado_em = nova.atualizado_em;
      linhas.push(linha);
      porId[id] = linha;
      mudou = true;
    });

    // Nada mudou de fato: devolve o texto original e nenhum commit é feito.
    if (!mudou) return texto;
    return window.CSV.serialize(linhas, colunas);
  }

  function mensagemDeCommit(enviado) {
    const ids = Object.keys(enviado);
    const quem = window.Auth.sessao ? window.Auth.sessao.usuario : '';
    if (ids.length === 1) {
      const sinal = enviado[ids[0]].situacao === SITUACAO.CANCELADO ? '-' : '+';
      return 'roadmap: fila ' + sinal + ids[0] + ' (' + quem + ')';
    }
    return 'roadmap: fila ' + ids.length + ' itens (' + quem + ')';
  }

  /**
   * Grava o que estiver pendente. Sem token a linha fica na fila e é retentada quando
   * o token chegar — o impedimento em si já está gravado, nada se perde.
   *
   * Não mexe no selo do cabeçalho: ele já disse "Salvo" sobre o impedimento, que é o que
   * a pessoa gravou. Falha aqui aparece no aviso da ferramenta, com botão de tentar de
   * novo, em vez de pintar "Falha ao salvar" sobre um registro que salvou.
   */
  function gravar() {
    if (estado.emVoo) return estado.emVoo;
    if (!Object.keys(estado.pendentes).length) return Promise.resolve();
    if (!window.Github.temToken()) return Promise.resolve();

    const enviado = JSON.parse(JSON.stringify(estado.pendentes));

    const envio = window.Github.alterarArquivo(caminhoFila(), mutarFila, mensagemDeCommit(enviado)).then(
      function () {
        estado.emVoo = null;
        estado.erro = null;
        // Só sai da fila o que foi gravado com o carimbo que enviamos: o que mudou com
        // o commit em voo continua pendente e sai no próximo.
        Object.keys(enviado).forEach(function (id) {
          const pendente = estado.pendentes[id];
          if (pendente && pendente.atualizado_em === enviado[id].atualizado_em) delete estado.pendentes[id];
        });
        if (Object.keys(estado.pendentes).length) return gravar();
        avisarCasca();
      },
      function (erro) {
        estado.emVoo = null;
        estado.erro = erro;
        window.UI.toast(window.I18N.t('imp.roadmap.pendente'), 'erro');
        avisarCasca();
      }
    );

    estado.emVoo = envio;
    return envio;
  }

  function temPendencias() {
    return Object.keys(estado.pendentes).length > 0;
  }

  function pendencias() {
    return Object.keys(estado.pendentes);
  }

  /** Chamada pela casca no logout e na troca de token. */
  function descarregar() {
    return gravar();
  }

  /** Leitura da fila inteira: a reconciliação compara com ela. */
  function carregarFila() {
    return window.Github.lerArquivo(caminhoFila()).then(function (r) {
      if (!r.existe) return { colunas: COLUNAS.slice(), linhas: [] };
      const dados = window.CSV.parse(r.texto);
      return {
        colunas: dados.colunas,
        linhas: dados.linhas.filter(function (l) {
          return l.id;
        }),
      };
    });
  }

  /**
   * Põe a fila em dia com os registros da pessoa. É o que devolve a linha que ficou só
   * em memória — falha de rede seguida de F5, aba fechada no meio do commit — e o
   * cancelamento que não chegou a sair.
   *
   * Só roda com catálogo pronto: sem ele o nome do módulo sai vazio, e reescrever a linha
   * apagaria o que já está certo no arquivo. Só roda com token: sem ele não há como
   * gravar, e a linha pendente só acenderia o aviso de sair da página.
   *
   * `lidoEm` é o instante em que os registros começaram a ser lidos. Linha da fila mais
   * nova que isso não é cancelada: pode ser de um registro que a leitura não pegou.
   */
  function reconciliar(usuario, registros, pessoa, lidoEm) {
    if (!window.Github.temToken() || !catalogoPronto()) return Promise.resolve(0);

    return carregarFila().then(function (fila) {
      const naFila = {};
      fila.linhas.forEach(function (l) {
        if (l.usuario === usuario) naFila[l.id] = l;
      });

      let enfileiradas = 0;
      const comItem = {};

      registros.forEach(function (registro) {
        if (!geraItem(registro)) return;
        comItem[registro.id] = true;
        if (estado.pendentes[registro.id]) return;
        const esperada = linhaDoRegistro(registro, pessoa);
        const atual = naFila[registro.id];
        const emDia =
          atual &&
          atual.situacao === SITUACAO.ATIVO &&
          CAMPOS_DO_REGISTRO.every(function (c) {
            return String(atual[c] || '') === String(esperada[c] || '');
          });
        if (emDia) return;
        prepararPendente(esperada);
        enfileiradas++;
      });

      const limite = new Date(new Date(lidoEm).getTime() - MARGEM_MS).toISOString();
      Object.keys(naFila).forEach(function (id) {
        const linha = naFila[id];
        if (comItem[id] || estado.pendentes[id] || linha.situacao === SITUACAO.CANCELADO) return;
        if (String(linha.atualizado_em || '') >= limite) return;
        prepararPendente({ id: id, situacao: SITUACAO.CANCELADO });
        enfileiradas++;
      });

      // Um commit para tudo o que a reconciliação achou, não um por linha.
      if (enfileiradas) gravar();
      return enfileiradas;
    });
  }

  window.Impedimentos = window.Impedimentos || {};
  window.Impedimentos.Roadmap = {
    COLUNAS: COLUNAS,
    SITUACAO: SITUACAO,
    MIN_ENTREGAVEL: MIN_ENTREGAVEL,
    estado: estado,
    carregarModulos: carregarModulos,
    moduloPorChave: moduloPorChave,
    catalogoPronto: catalogoPronto,
    erroCatalogo: erroCatalogo,
    porFrente: porFrente,
    geraItem: geraItem,
    linhaDoRegistro: linhaDoRegistro,
    enfileirar: enfileirar,
    cancelar: cancelar,
    mutarFila: mutarFila,
    gravar: gravar,
    temPendencias: temPendencias,
    pendencias: pendencias,
    descarregar: descarregar,
    carregarFila: carregarFila,
    reconciliar: reconciliar,
  };
})();
