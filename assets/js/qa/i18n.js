/**
 * Portal QA — textos nos dois idiomas e taxonomias do catálogo.
 * As chaves entram no dicionário do portal com o prefixo "qa.".
 */
(function () {
  'use strict';

  window.I18N.registrar(
    {
      pt: {
        'app.nome': 'Portal QA',
        'app.descricao': 'Acompanhamento dos testes de qualidade',

        'nav.inicio': 'Visão geral',
        'nav.guia': 'Guia',
        'nav.painel': 'Painel',
        'nav.casos': 'Casos de teste',
        'nav.voltar': 'Projetos',

        'acao.exportar': 'Exportar CSV',
        'acao.limparFiltros': 'Limpar filtros',
        'acao.limparRegistro': 'Limpar registro deste caso',
        'acao.expandirTudo': 'Expandir tudo',
        'acao.recolherTudo': 'Recolher tudo',

        'carregando': 'Carregando os catálogos de teste…',

        'fase.planejado': 'Planejado',
        'fase.andamento': 'Em andamento',
        'fase.concluido': 'Concluído',

        'kpi.totalCasos': 'Funcionalidades catalogadas',
        'kpi.planejado': 'Planejado',
        'kpi.planejadoAjuda': 'Ainda não testado — a fila de trabalho',
        'kpi.andamento': 'Em andamento',
        'kpi.andamentoAjuda': 'Em teste, devolvido, bloqueado ou não implementado',
        'kpi.concluido': 'Concluído',
        'kpi.concluidoAjuda': 'Funcionalidades liberadas para uso',
        'kpi.cobertura': 'Cobertura de testes',
        'kpi.coberturaAjuda': 'Casos com desfecho registrado sobre o total do catálogo',
        'kpi.liberado': 'Liberado para uso',
        'kpi.liberadoAjuda': 'Casos liberados sobre o total do catálogo',
        'kpi.devolvidas': 'Devolvidas ao desenvolvimento',
        'kpi.devolvidasAjuda': 'Aguardando ajuste para voltar ao teste',
        'kpi.retrabalho': 'Retrabalho',
        'kpi.retrabalhoAjuda': '{casos} caso(s) já voltaram ao desenvolvimento, somando {voltas} devolução(ões)',

        'inicio.projetos': 'Projetos de teste',
        'inicio.abertos': 'Testes em aberto',
        'inicio.abertosAjuda': 'Tudo que ainda pede ação, agrupado por projeto e módulo.',
        'inicio.semAbertos': 'Nada em aberto — todo o catálogo está liberado.',
        'inicio.semProjetos': 'Nenhum projeto ativo em data/projetos.csv.',
        'inicio.casos': '{n} casos',
        'inicio.aberto': '{n} em aberto',

        'painel.porModulo': 'Progresso por módulo',
        'painel.distribuicao': 'Situação do catálogo',
        'painel.atencao': 'Precisam de atenção',
        'painel.semAtencao': 'Nenhuma pendência registrada.',
        'painel.retrabalho': 'Retrabalho por caso',
        'painel.semRetrabalho': 'Nenhuma devolução registrada até aqui.',
        'painel.total': 'casos no catálogo',
        'painel.testados': 'com desfecho',
        'painel.liberados': 'liberados',
        'painel.voltas': '{n} devolução(ões)',

        'filtro.busca': 'Buscar por funcionalidade, id, rota ou stub…',
        'filtro.modulo': 'Módulo',
        'filtro.status': 'Situação',
        'filtro.prioridade': 'Prioridade',
        'filtro.tipo': 'Tipo',
        'filtro.retrabalho': 'Retrabalho',
        'filtro.comRetrabalho': 'Só os que voltaram',
        'filtro.semRetrabalho': 'Sem devolução',
        'filtro.todos': 'Todos',
        'filtro.resultado': '{n} de {total} casos',

        'tabela.id': 'ID',
        'tabela.caso': 'Funcionalidade a testar',
        'tabela.modulo': 'Módulo',
        'tabela.prioridade': 'Prioridade',
        'tabela.status': 'Situação',
        'tabela.voltas': 'Voltas',
        'tabela.testadoPor': 'Testado por',
        'tabela.dataTeste': 'Data',
        'tabela.vazio': 'Nenhum caso corresponde aos filtros.',

        'detalhe.fechar': 'Fechar',
        'detalhe.criterio': 'Como validar',
        'detalhe.onde': 'Onde testar',
        'detalhe.rota': 'Rota',
        'detalhe.stub': 'Stub de referência',
        'detalhe.referencias': 'Referências do SRS',
        'detalhe.registro': 'Registro do teste',
        'detalhe.status': 'Situação',
        'detalhe.testadoPor': 'Testado por',
        'detalhe.dataTeste': 'Data do teste',
        'detalhe.referencia': 'Referência',
        'detalhe.referenciaPlaceholder': 'chamado, issue, commit…',
        'detalhe.observacoes': 'Observações',
        'detalhe.retrabalho': 'Retrabalho',
        'detalhe.devolucoes': 'Devoluções',
        'detalhe.ultimaDevolucao': 'Última devolução',
        'detalhe.semStub': 'Sem stub associado',
        'detalhe.somenteConsulta': 'O seu papel permite consultar o catálogo, não registrar testes.',
        'detalhe.semToken': 'Para registrar, configure o token do GitHub.',

        'status.nao_testado': 'Não testado',
        'status.em_teste': 'Em teste',
        'status.liberada': 'Liberada',
        'status.devolvida': 'Devolvida',
        'status.bloqueada': 'Bloqueada',
        'status.nao_implementada': 'Não implementada',
        'status.nao_aplicavel': 'Não se aplica',

        'prioridade.alta': 'Alta',
        'prioridade.media': 'Média',
        'prioridade.baixa': 'Baixa',

        'tipo.funcional': 'Funcional',
        'tipo.interface': 'Interface',
        'tipo.permissao': 'Permissão',
        'tipo.integracao': 'Integração',
        'tipo.dados': 'Dados',

        'confirma.limparCaso': 'Limpar o registro de teste deste caso?',

        'erro.gravacaoTitulo': 'Não foi possível ler ou gravar no repositório',

        'guia.titulo': 'Como usar o Portal QA',
        'guia.introH': 'Para que serve',
        'guia.introP1':
          'O Portal QA reúne os projetos de teste da casa. Cada projeto tem o seu catálogo: a lista das funcionalidades que precisam ser testadas, com o critério que diz quando cada uma pode ser considerada boa.',
        'guia.introP2':
          'O catálogo de um projeto é dimensionado pelo que foi prototipado e validado com o cliente, e não apenas pelo que já foi codificado. Uma funcionalidade que ainda não existe no ambiente deve ser marcada como "não implementada" — é assim que o portal mostra a distância entre o que foi combinado e o que já está de pé.',
        'guia.acessoH': 'Quem registra e quem consulta',
        'guia.acessoP':
          'Registrar testes depende do papel: analistas de QA e gestores registram. Desenvolvedores consultam o catálogo inteiro — o que foi devolvido, o que está bloqueado, o critério de cada caso e o retrabalho acumulado — para saber o que precisa de ajuste antes do próximo teste.',
        'guia.fluxoH': 'O fluxo de trabalho',
        'guia.fluxo1': 'Entre com o seu usuário — é o que carimba o seu nome no registro do teste.',
        'guia.fluxo2': 'Escolha a funcionalidade no catálogo do projeto e execute o teste no ambiente.',
        'guia.fluxo3': 'Passou? Marque "liberada". Precisa de ajuste? Marque "devolvida" e descreva o problema nas observações.',
        'guia.fluxo4': 'Quem testou e a data são preenchidos sozinhos. A cada devolução o contador de voltas sobe — é essa a métrica de retrabalho.',
        'guia.fluxo5':
          'Cada registro é salvo direto no repositório em poucos segundos — o colega que abrir o portal depois já vê o que você marcou.',
        'guia.persistenciaH': 'Onde ficam os dados',
        'guia.persistenciaP':
          'Os catálogos em CSV no repositório são a única fonte de verdade. O que você registra é gravado lá na hora, como um commit assinado com o seu nome — não fica cópia no navegador esperando exportação. O selo no topo mostra se o registro chegou. O botão Exportar CSV serve para tirar uma cópia do catálogo, não para salvar.',
        'guia.statusH': 'O que cada situação significa',
        'guia.statusNaoTestado': 'ainda não foi executado. Entra como planejado.',
        'guia.statusEmTeste': 'execução em andamento.',
        'guia.statusLiberada': 'passou no critério e está liberada para uso.',
        'guia.statusDevolvida': 'voltou ao desenvolvimento para ajuste; conta uma volta.',
        'guia.statusBloqueada': 'não foi possível testar (dependência, ambiente, dado, acesso).',
        'guia.statusNaoImplementada': 'existe no protótipo, ainda não existe no ambiente.',
        'guia.statusNaoAplicavel': 'saiu do escopo ou foi absorvida por outro caso.',
        'guia.metricasH': 'Como as métricas são calculadas',
        'guia.metricasFases':
          'Planejado, em andamento e concluído: "planejado" é o que não foi testado; "em andamento" reúne em teste, devolvida, bloqueada e não implementada; "concluído" são as liberadas.',
        'guia.metricasCobertura':
          'Cobertura: casos com desfecho (liberada, devolvida, bloqueada ou não implementada) sobre o total. "Em teste" e "não testado" não contam; "não se aplica" sai do total.',
        'guia.metricasLiberado': 'Liberado: casos liberados sobre o total, ignorando os que não se aplicam.',
        'guia.metricasRetrabalho':
          'Retrabalho: casos que voltaram ao desenvolvimento pelo menos uma vez, sobre os casos que já tiveram desfecho. O total de devoluções e os reincidentes (duas voltas ou mais) aparecem ao lado.',
        'guia.novoProjetoH': 'Acrescentar um projeto',
        'guia.novoProjetoP':
          'Crie o CSV do catálogo em data/projetos/, com as mesmas colunas do projeto existente, e acrescente uma linha em data/projetos.csv apontando para ele. O portal passa a listar o projeto na visão geral sem nenhuma alteração de código.',
      },

      en: {
        'app.nome': 'QA Portal',
        'app.descricao': 'Quality testing tracker',

        'nav.inicio': 'Overview',
        'nav.guia': 'Guide',
        'nav.painel': 'Dashboard',
        'nav.casos': 'Test cases',
        'nav.voltar': 'Projects',

        'acao.exportar': 'Export CSV',
        'acao.limparFiltros': 'Clear filters',
        'acao.limparRegistro': 'Clear this case record',
        'acao.expandirTudo': 'Expand all',
        'acao.recolherTudo': 'Collapse all',

        'carregando': 'Loading the test catalogs…',

        'fase.planejado': 'Planned',
        'fase.andamento': 'In progress',
        'fase.concluido': 'Done',

        'kpi.totalCasos': 'Catalogued features',
        'kpi.planejado': 'Planned',
        'kpi.planejadoAjuda': 'Not tested yet — the work queue',
        'kpi.andamento': 'In progress',
        'kpi.andamentoAjuda': 'In testing, returned, blocked or not implemented',
        'kpi.concluido': 'Done',
        'kpi.concluidoAjuda': 'Features released for use',
        'kpi.cobertura': 'Test coverage',
        'kpi.coberturaAjuda': 'Cases with a recorded outcome over the whole catalog',
        'kpi.liberado': 'Released for use',
        'kpi.liberadoAjuda': 'Released cases over the whole catalog',
        'kpi.devolvidas': 'Returned to development',
        'kpi.devolvidasAjuda': 'Waiting on a fix to come back to testing',
        'kpi.retrabalho': 'Rework',
        'kpi.retrabalhoAjuda': '{casos} case(s) have gone back to development, adding up to {voltas} return(s)',

        'inicio.projetos': 'Test projects',
        'inicio.abertos': 'Open tests',
        'inicio.abertosAjuda': 'Everything still asking for action, grouped by project and module.',
        'inicio.semAbertos': 'Nothing open — the whole catalog is released.',
        'inicio.semProjetos': 'No active project in data/projetos.csv.',
        'inicio.casos': '{n} cases',
        'inicio.aberto': '{n} open',

        'painel.porModulo': 'Progress by module',
        'painel.distribuicao': 'Catalog status',
        'painel.atencao': 'Need attention',
        'painel.semAtencao': 'No pending items recorded.',
        'painel.retrabalho': 'Rework by case',
        'painel.semRetrabalho': 'No return recorded so far.',
        'painel.total': 'cases in the catalog',
        'painel.testados': 'with an outcome',
        'painel.liberados': 'released',
        'painel.voltas': '{n} return(s)',

        'filtro.busca': 'Search by feature, id, route or stub…',
        'filtro.modulo': 'Module',
        'filtro.status': 'Status',
        'filtro.prioridade': 'Priority',
        'filtro.tipo': 'Type',
        'filtro.retrabalho': 'Rework',
        'filtro.comRetrabalho': 'Only those that came back',
        'filtro.semRetrabalho': 'No return',
        'filtro.todos': 'All',
        'filtro.resultado': '{n} of {total} cases',

        'tabela.id': 'ID',
        'tabela.caso': 'Feature to test',
        'tabela.modulo': 'Module',
        'tabela.prioridade': 'Priority',
        'tabela.status': 'Status',
        'tabela.voltas': 'Returns',
        'tabela.testadoPor': 'Tested by',
        'tabela.dataTeste': 'Date',
        'tabela.vazio': 'No case matches the filters.',

        'detalhe.fechar': 'Close',
        'detalhe.criterio': 'How to validate',
        'detalhe.onde': 'Where to test',
        'detalhe.rota': 'Route',
        'detalhe.stub': 'Reference stub',
        'detalhe.referencias': 'SRS references',
        'detalhe.registro': 'Test record',
        'detalhe.status': 'Status',
        'detalhe.testadoPor': 'Tested by',
        'detalhe.dataTeste': 'Test date',
        'detalhe.referencia': 'Reference',
        'detalhe.referenciaPlaceholder': 'ticket, issue, commit…',
        'detalhe.observacoes': 'Notes',
        'detalhe.retrabalho': 'Rework',
        'detalhe.devolucoes': 'Returns',
        'detalhe.ultimaDevolucao': 'Last return',
        'detalhe.semStub': 'No stub attached',
        'detalhe.somenteConsulta': 'Your role can view the catalog, not record tests.',
        'detalhe.semToken': 'To record, set up the GitHub token.',

        'status.nao_testado': 'Not tested',
        'status.em_teste': 'In testing',
        'status.liberada': 'Released',
        'status.devolvida': 'Returned',
        'status.bloqueada': 'Blocked',
        'status.nao_implementada': 'Not implemented',
        'status.nao_aplicavel': 'Not applicable',

        'prioridade.alta': 'High',
        'prioridade.media': 'Medium',
        'prioridade.baixa': 'Low',

        'tipo.funcional': 'Functional',
        'tipo.interface': 'Interface',
        'tipo.permissao': 'Permission',
        'tipo.integracao': 'Integration',
        'tipo.dados': 'Data',

        'confirma.limparCaso': 'Clear the test record for this case?',

        'erro.gravacaoTitulo': 'The repository could not be read or updated',

        'guia.titulo': 'How to use the QA Portal',
        'guia.introH': 'What it is for',
        'guia.introP1':
          'The QA Portal gathers the house test projects. Each project has its own catalog: the list of features that need testing, with the criterion that says when each one can be considered good.',
        'guia.introP2':
          "A project's catalog is scoped from what was prototyped and validated with the customer, not only from what has already been coded. A feature that does not exist in the environment yet should be marked \"not implemented\" — that is how the portal shows the distance between what was agreed and what is already standing.",
        'guia.acessoH': 'Who records and who views',
        'guia.acessoP':
          'Recording tests depends on the role: QA analysts and managers record. Developers view the whole catalog — what was returned, what is blocked, the criterion of each case and the accumulated rework — to know what needs fixing before the next test.',
        'guia.fluxoH': 'The workflow',
        'guia.fluxo1': 'Sign in with your user — that is what stamps your name on the test record.',
        'guia.fluxo2': "Pick the feature in the project's catalog and run the test in the environment.",
        'guia.fluxo3': 'Passed? Mark it "released". Needs a fix? Mark it "returned" and describe the problem in the notes.',
        'guia.fluxo4': 'Who tested and the date are filled in on their own. Each return raises the counter — that is the rework metric.',
        'guia.fluxo5':
          'Every record is saved straight to the repository within seconds — whoever opens the portal next already sees what you marked.',
        'guia.persistenciaH': 'Where the data lives',
        'guia.persistenciaP':
          'The CSV catalogs in the repository are the single source of truth. What you record is written there right away, as a commit signed with your name — no copy waits in the browser for an export. The badge at the top shows whether the record arrived. The Export CSV button is for taking a copy of the catalog, not for saving.',
        'guia.statusH': 'What each status means',
        'guia.statusNaoTestado': 'has not been executed yet. It counts as planned.',
        'guia.statusEmTeste': 'execution under way.',
        'guia.statusLiberada': 'met the criterion and is released for use.',
        'guia.statusDevolvida': 'went back to development for a fix; counts one return.',
        'guia.statusBloqueada': 'could not be tested (dependency, environment, data, access).',
        'guia.statusNaoImplementada': 'exists in the prototype, does not exist in the environment yet.',
        'guia.statusNaoAplicavel': 'left the scope or was absorbed by another case.',
        'guia.metricasH': 'How the metrics are calculated',
        'guia.metricasFases':
          'Planned, in progress and done: "planned" is what has not been tested; "in progress" gathers in testing, returned, blocked and not implemented; "done" are the released ones.',
        'guia.metricasCobertura':
          'Coverage: cases with an outcome (released, returned, blocked or not implemented) over the total. "In testing" and "not tested" do not count; "not applicable" leaves the total.',
        'guia.metricasLiberado': 'Released: released cases over the total, ignoring the not applicable ones.',
        'guia.metricasRetrabalho':
          'Rework: cases that went back to development at least once, over the cases that already had an outcome. The total of returns and the repeat offenders (two returns or more) show next to it.',
        'guia.novoProjetoH': 'Adding a project',
        'guia.novoProjetoP':
          'Create the catalog CSV under data/projetos/, with the same columns as the existing project, and add a row to data/projetos.csv pointing to it. The portal starts listing the project in the overview with no code change.',
      },
    },
    'qa.'
  );

  /** Nomes dos módulos, nos dois idiomas. A chave é global: prefixe por projeto. */
  const MODULOS = {
    'news-auth': { pt: 'Acesso e emissora', en: 'Access and station' },
    'news-shell': { pt: 'Navegação e shell', en: 'Navigation and shell' },
    'news-dashboard': { pt: 'Painel do dia', en: 'Daily dashboard' },
    'news-configuracao': { pt: 'Configuração da emissora', en: 'Station setup' },
    'news-pautas': { pt: 'Pauta', en: 'Assignment' },
    'news-apuracao': { pt: 'Apuração', en: 'Newsgathering' },
    'news-materias': { pt: 'Matéria e Gate 1', en: 'Story and Gate 1' },
    'news-laudas': { pt: 'Lauda e Gate 2', en: 'Script and Gate 2' },
    'news-edicao': { pt: 'Edição de texto', en: 'Copy editing' },
    'news-espelhos': { pt: 'Espelho e Gate 3', en: 'Rundown and Gate 3' },
    'news-visualizador': { pt: 'Apresentação e estúdio', en: 'Presentation and studio' },
    'news-biblioteca': { pt: 'Biblioteca de mídias', en: 'Media library' },
    'news-cadastros': { pt: 'Cadastros', en: 'Master data' },
    'news-chat': { pt: 'Chat da redação', en: 'Newsroom chat' },
    'news-auditoria': { pt: 'Trilha de auditoria', en: 'Audit trail' },
    'news-lixeira': { pt: 'Lixeira', en: 'Recycle bin' },
    'news-alertas': { pt: 'Alertas e avisos', en: 'Alerts and notices' },
    'news-transversal': { pt: 'Transversal', en: 'Cross-cutting' },
    'ed-abertura': { pt: 'Abertura da mídia', en: 'Opening the media' },
    'ed-pontos': { pt: 'Pontos de edição', en: 'Edit points' },
    'ed-refrao': { pt: 'Refrão', en: 'Chorus' },
    'ed-carimbos': { pt: 'Carimbos e vinhetas', en: 'Stamps and jingles' },
    'ed-passagem': { pt: 'Passagem entre eventos', en: 'Segue between events' },
    'ed-navegacao': { pt: 'Navegação entre itens', en: 'Navigation between items' },
    'ed-salvamento': { pt: 'Salvamento e descarte', en: 'Saving and discarding' },
    'ed-sincronizacao': { pt: 'Sincronização', en: 'Synchronization' },
    'ed-voicetracker': { pt: 'Remote VoiceTracker', en: 'Remote VoiceTracker' },
    'ed-configuracao': { pt: 'Configuração', en: 'Settings' },
    'ed-resiliencia': { pt: 'Falhas e reconexão', en: 'Failures and reconnection' },
    'vt-edicao': { pt: 'Edição de voice tracking', en: 'Voice tracking editing' },
    'vt-hotkeys': { pt: 'Hot Keys e beds', en: 'Hot Keys and beds' },
    'vt-rede': { pt: 'Robustez de rede', en: 'Network robustness' },
    'vt-multisite': { pt: 'Multi-Site', en: 'Multi-Site' },
    'vt-plataforma': { pt: 'Plataforma modular', en: 'Modular platform' },
    'vt-onair': { pt: 'On-Air e biblioteca', en: 'On-Air and library' },
    'vt-seguranca': { pt: 'Segurança e acesso', en: 'Security and access' },
    'aud-ouvintes': { pt: 'Ouvintes', en: 'Listeners' },
    'aud-importacao': { pt: 'Importação e migração', en: 'Import and migration' },
    'aud-dashboards': { pt: 'Dashboards e relatórios', en: 'Dashboards and reports' },
    'aud-sorteios': { pt: 'Sorteios', en: 'Draws' },
    'aud-promocoes': { pt: 'Promoções', en: 'Promotions' },
    'aud-brindes': { pt: 'Brindes', en: 'Prizes' },
    'aud-notificacao': { pt: 'Notificação ao ganhador', en: 'Winner notification' },
    'aud-lgpd': { pt: 'Retenção e LGPD', en: 'Retention and privacy' },
    'aud-infoaudio': { pt: 'Integração InfoAudio', en: 'InfoAudio integration' },
    'aud-atendimento': { pt: 'Atendimento e moderação', en: 'Service desk and moderation' },
    'aud-programas': { pt: 'Programas', en: 'Programs' },
    'aud-locutor': { pt: 'Tela do locutor', en: 'Announcer screen' },
    'aud-redes': { pt: 'Redes sociais', en: 'Social networks' },
    'aud-chatbot': { pt: 'Chatbot', en: 'Chatbot' },
    'aud-configuracao': { pt: 'Configuração da emissora', en: 'Station settings' },
    'aud-transversal': { pt: 'Transversal', en: 'Cross-cutting' },
  };

  const ORDEM_STATUS = [
    'nao_testado',
    'em_teste',
    'liberada',
    'devolvida',
    'bloqueada',
    'nao_implementada',
    'nao_aplicavel',
  ];
  const ORDEM_PRIORIDADE = ['alta', 'media', 'baixa'];
  const ORDEM_TIPO = ['funcional', 'interface', 'permissao', 'integracao', 'dados'];

  function nomeModulo(chave) {
    const entrada = MODULOS[chave];
    if (!entrada) return chave;
    return entrada[window.I18N.atual] || entrada.pt;
  }

  /** Descrição do projeto no idioma corrente, vinda de data/projetos.csv. */
  function descricaoProjeto(projeto) {
    return window.I18N.campo(projeto, 'descricao');
  }

  window.QA = window.QA || {};
  window.QA.Textos = {
    modulos: MODULOS,
    ordemStatus: ORDEM_STATUS,
    ordemPrioridade: ORDEM_PRIORIDADE,
    ordemTipo: ORDEM_TIPO,
    nomeModulo: nomeModulo,
    descricaoProjeto: descricaoProjeto,
  };
})();
