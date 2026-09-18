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
        'kpi.verificados': 'Verificados pelo QA',
        'kpi.verificadosAjuda': '{feitos} de {total} casos · {falhas} com falha registrada',

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

        'filtro.busca': 'Buscar por cenário, id, passos, rota ou anotação…',
        'filtro.modulo': 'Módulo',
        'filtro.status': 'Situação',
        'filtro.prioridade': 'Prioridade',
        'filtro.tipo': 'Tipo',
        'filtro.retrabalho': 'Retrabalho',
        'filtro.verificacao': 'Verificação',
        'filtro.verificados': 'Verificados',
        'filtro.naoVerificados': 'Não verificados',
        'filtro.comFalha': 'Com falha registrada',
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
        'tabela.prioridadeCurta': 'Prio.',
        'tabela.cenario': 'Cenário',
        'tabela.passos': 'Passos',
        'tabela.resultado': 'Resultado esperado',

        'exec.progresso': '{feitos} de {total} casos verificados',
        'exec.falhas': '{n} com falha registrada',
        'exec.sumario': 'Seções',
        'exec.contagemSecao': 'Casos verificados nesta seção',
        'exec.conferencia': 'Conferência',
        'exec.verificado': 'Verificado',
        'exec.naoVerificado': 'Não verificado',
        'exec.execucao': 'O que foi testado',
        'exec.execucaoAjuda': 'Ambiente, massa usada, passos executados e evidência',
        'exec.falha': 'Possível falha',
        'exec.falhaAjuda': 'Comportamento divergente, mensagem de erro, horário',
        'exec.semPassos': 'Passos a detalhar',
        'exec.semAnotacao': 'Sem anotação',
        'exec.detalhes': 'Detalhes',

        'detalhe.fechar': 'Fechar',
        'detalhe.preparo': 'Preparação da seção',
        'detalhe.passos': 'Passos',
        'detalhe.criterio': 'Resultado esperado',
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
        'detalhe.verificacao': 'Conferência do QA',
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

        'prioridade.alta': 'P0 · Alta',
        'prioridade.media': 'P1 · Média',
        'prioridade.baixa': 'P2 · Baixa',

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
        'guia.fluxo2':
          'Abra os casos de teste do projeto. Cada seção diz como preparar o ambiente, e cada caso traz os passos e o resultado esperado.',
        'guia.fluxo3':
          'Executou? Marque "Verificado" e escreva o que foi testado. Achou divergência? Descreva em "Possível falha" — comportamento, mensagem de erro e horário.',
        'guia.fluxo4':
          'Dê o desfecho na situação: "liberada" se passou, "devolvida" se precisa de ajuste. Quem testou e a data são preenchidos sozinhos, e cada devolução sobe o contador de voltas — é essa a métrica de retrabalho.',
        'guia.fluxo5':
          'Cada registro é salvo direto no repositório em poucos segundos — o colega que abrir o portal depois já vê o que você marcou.',
        'guia.camposH': 'O que cada caso traz',
        'guia.camposCenario': 'Cenário: o que está sendo verificado, em poucas palavras.',
        'guia.camposPassos': 'Passos: o roteiro de execução. Caso que ainda não tem roteiro mostra "Passos a detalhar".',
        'guia.camposResultado': 'Resultado esperado: o critério que decide se o caso passou.',
        'guia.camposVerificado':
          'Verificado: a conferência do QA. Marcar um caso não testado, ou anotar nele, o põe "em teste"; dar um desfecho marca verificado sozinho.',
        'guia.camposExecucao': 'O que foi testado: ambiente, massa usada, passos executados e evidência.',
        'guia.camposFalha':
          'Possível falha: o que divergiu do esperado. Caso com falha registrada ganha a faixa âmbar; verificado sem falha, a verde.',
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
        'guia.metricasVerificados':
          'Verificados: casos conferidos pelo QA sobre o total, ignorando os que não se aplicam. Ao lado, quantos têm falha registrada.',
        'guia.metricasRetrabalho':
          'Retrabalho: casos que voltaram ao desenvolvimento pelo menos uma vez, sobre os casos que já tiveram desfecho. O total de devoluções e os reincidentes (duas voltas ou mais) aparecem ao lado.',
        'guia.novoProjetoH': 'Acrescentar um projeto',
        'guia.novoProjetoP':
          'Crie o CSV do catálogo em data/projetos/, com as mesmas colunas dos projetos existentes — cenário, passos e resultado esperado nos dois idiomas —, e acrescente uma linha em data/projetos.csv apontando para ele. Cada seção (módulo) ganha nome e texto de preparação em assets/js/qa/i18n.js.',
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
        'kpi.verificados': 'Verified by QA',
        'kpi.verificadosAjuda': '{feitos} of {total} cases · {falhas} with a failure recorded',

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

        'filtro.busca': 'Search by scenario, id, steps, route or note…',
        'filtro.modulo': 'Module',
        'filtro.status': 'Status',
        'filtro.prioridade': 'Priority',
        'filtro.tipo': 'Type',
        'filtro.retrabalho': 'Rework',
        'filtro.verificacao': 'Verification',
        'filtro.verificados': 'Verified',
        'filtro.naoVerificados': 'Not verified',
        'filtro.comFalha': 'With a failure recorded',
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
        'tabela.prioridadeCurta': 'Prio.',
        'tabela.cenario': 'Scenario',
        'tabela.passos': 'Steps',
        'tabela.resultado': 'Expected result',

        'exec.progresso': '{feitos} of {total} cases verified',
        'exec.falhas': '{n} with a failure recorded',
        'exec.sumario': 'Sections',
        'exec.contagemSecao': 'Cases verified in this section',
        'exec.conferencia': 'Check',
        'exec.verificado': 'Verified',
        'exec.naoVerificado': 'Not verified',
        'exec.execucao': 'What was tested',
        'exec.execucaoAjuda': 'Environment, test data, steps run and evidence',
        'exec.falha': 'Possible failure',
        'exec.falhaAjuda': 'Diverging behavior, error message, time',
        'exec.semPassos': 'Steps to be written',
        'exec.semAnotacao': 'No note',
        'exec.detalhes': 'Details',

        'detalhe.fechar': 'Close',
        'detalhe.preparo': 'Section setup',
        'detalhe.passos': 'Steps',
        'detalhe.criterio': 'Expected result',
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
        'detalhe.verificacao': 'QA check',
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

        'prioridade.alta': 'P0 · High',
        'prioridade.media': 'P1 · Medium',
        'prioridade.baixa': 'P2 · Low',

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
        'guia.fluxo2':
          "Open the project's test cases. Each section says how to set up the environment, and each case brings the steps and the expected result.",
        'guia.fluxo3':
          'Ran it? Tick "Verified" and write what was tested. Found a divergence? Describe it under "Possible failure" — behavior, error message and time.',
        'guia.fluxo4':
          'Give the outcome in the status: "released" if it passed, "returned" if it needs a fix. Who tested and the date are filled in on their own, and each return raises the counter — that is the rework metric.',
        'guia.fluxo5':
          'Every record is saved straight to the repository within seconds — whoever opens the portal next already sees what you marked.',
        'guia.camposH': 'What each case brings',
        'guia.camposCenario': 'Scenario: what is being verified, in a few words.',
        'guia.camposPassos': 'Steps: the execution script. A case with no script yet shows "Steps to be written".',
        'guia.camposResultado': 'Expected result: the criterion that decides whether the case passed.',
        'guia.camposVerificado':
          'Verified: the QA check. Ticking a case that was not tested, or writing a note on it, puts it "in testing"; giving an outcome ticks it on its own.',
        'guia.camposExecucao': 'What was tested: environment, test data, steps run and evidence.',
        'guia.camposFalha':
          'Possible failure: what diverged from the expected result. A case with a failure recorded gets the amber stripe; verified with no failure, the green one.',
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
        'guia.metricasVerificados':
          'Verified: cases checked by QA over the total, ignoring the not applicable ones. Next to it, how many have a failure recorded.',
        'guia.metricasRetrabalho':
          'Rework: cases that went back to development at least once, over the cases that already had an outcome. The total of returns and the repeat offenders (two returns or more) show next to it.',
        'guia.novoProjetoH': 'Adding a project',
        'guia.novoProjetoP':
          'Create the catalog CSV under data/projetos/, with the same columns as the existing projects — scenario, steps and expected result in both languages —, and add a row to data/projetos.csv pointing to it. Each section (module) gets its name and setup text in assets/js/qa/i18n.js.',
      },
    },
    'qa.'
  );

  /**
   * Módulos do catálogo, que a tela de casos mostra como seções do plano: nome nos dois
   * idiomas e, quando alguém escreveu, `preparo` — como montar o ambiente antes de
   * executar a seção. A chave é global: prefixe por projeto.
   */
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
    'aud-acesso': {
      pt: 'Acesso, configuração e cadastros básicos',
      en: 'Access, configuration and basic records',
      preparo: {
        pt: 'Base transversal. Usar o frontend Angular, menu Audience. Preparar perfis com e sem cada privilégio; conferir também URL direta e API.',
        en: 'Cross-cutting base. Use the Angular frontend, Audience menu. Prepare profiles with and without each privilege; also check direct URL and API.',
      },
    },
    'aud-ouvintes': {
      pt: 'Ouvintes, identidade e mesclagem',
      en: 'Listeners, identity and merging',
      preparo: {
        pt: 'E1; ANG-01/02; AUD-08/09. Menu Ouvintes, ficha e fila de duplicados.',
        en: 'E1; ANG-01/02; AUD-08/09. Listeners menu, listener record and duplicates queue.',
      },
    },
    'aud-importacao': {
      pt: 'Importação CSV e migração de ouvintes',
      en: 'CSV import and listener migration',
      preparo: {
        pt: 'E14; AUD-02/03; TEC-04. Menu Ouvintes → Importação. Importar somente massa descartável nesta rodada.',
        en: 'E14; AUD-02/03; TEC-04. Listeners menu → Import. Import only disposable test data in this round.',
      },
    },
    'aud-atendimento': {
      pt: 'Atendimento, redes sociais e mídia',
      en: 'Service desk, social networks and media',
      preparo: {
        pt: 'E13; AUD-13/14/17; TEC-02/07. Exige contas de teste dos provedores nos casos de recepção real.',
        en: 'E13; AUD-13/14/17; TEC-02/07. Requires provider test accounts for the real-reception cases.',
      },
    },
    'aud-participacoes': {
      pt: 'Participações automáticas, vínculo e moderação',
      en: 'Automatic participations, linking and moderation',
      preparo: {
        pt: 'E16/E11; AUD-07/18. Lista de participações de programa e Locução, duas sessões abertas.',
        en: 'E16/E11; AUD-07/18. Program participations list and Announcer screen, two sessions open.',
      },
    },
    'aud-promocoes': {
      pt: 'Promoções, sorteios, recorrência e brindes',
      en: 'Promotions, draws, recurrence and prizes',
      preparo: {
        pt: 'E4/E8/E9/E15. Menu Promoções, Sorteios e Brindes. Usar promoção exclusiva de QA.',
        en: 'E4/E8/E9/E15. Promotions, Draws and Prizes menu. Use a QA-only promotion.',
      },
    },
    'aud-relatorios': {
      pt: 'Dashboards, relatórios e exportações',
      en: 'Dashboards, reports and exports',
      preparo: {
        pt: 'E2/E3; AUD-04/05/06/09/19; TEC-04. Abrir Dashboard → Ouvintes, Programas, Promoções, Brindes e Rankings.',
        en: 'E2/E3; AUD-04/05/06/09/19; TEC-04. Open Dashboard → Listeners, Programs, Promotions, Prizes and Rankings.',
      },
    },
    'aud-link': {
      pt: 'Link público e avisos ao ganhador',
      en: 'Public link and winner notices',
      preparo: {
        pt: 'E5/E7. Executar também os cenários detalhados dos procedimentos citados ao final.',
        en: 'E5/E7. Also run the detailed scenarios of the procedures cited at the end.',
      },
    },
    'aud-privacidade': {
      pt: 'Privacidade, retenção e expurgo',
      en: 'Privacy, retention and purge',
      preparo: {
        pt: 'E6; AUD-03/10/11/12. QA valida o comportamento implementado; avaliação jurídica permanece com o responsável de privacidade. Expurgo em base descartável e com Ops.',
        en: 'E6; AUD-03/10/11/12. QA validates the implemented behavior; legal assessment remains with the privacy officer. Purge on a disposable database and with Ops.',
      },
    },
    'aud-infoaudio': {
      pt: 'InfoAudio, Locução e vídeo',
      en: 'InfoAudio, Announcer screen and video',
      preparo: {
        pt: 'E17/E12; AUD-15/20. Integração real exige premise conectado e versão/capabilities registradas.',
        en: 'E17/E12; AUD-15/20. Real integration requires a connected premise and registered version/capabilities.',
      },
    },
    'aud-interface': {
      pt: 'Interface Angular, acessibilidade e operação',
      en: 'Angular interface, accessibility and operation',
      preparo: {
        pt: 'ANG-03…09; TEC-01…08. Aplicar às telas usadas nos casos anteriores.',
        en: 'ANG-03…09; TEC-01…08. Apply to the screens used in the previous cases.',
      },
    },
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

  /** Como preparar o ambiente antes de executar os casos da seção; vazio quando ninguém escreveu ainda. */
  function preparoModulo(chave) {
    const entrada = MODULOS[chave];
    if (!entrada || !entrada.preparo) return '';
    return entrada.preparo[window.I18N.atual] || entrada.preparo.pt || '';
  }

  /** P0, P1, P2: o código que o QA usa no plano. O valor gravado continua alta, media, baixa. */
  function codigoPrioridade(prioridade) {
    const posicao = ORDEM_PRIORIDADE.indexOf(prioridade);
    return posicao === -1 ? '' : 'P' + posicao;
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
    preparoModulo: preparoModulo,
    codigoPrioridade: codigoPrioridade,
    descricaoProjeto: descricaoProjeto,
  };
})();
