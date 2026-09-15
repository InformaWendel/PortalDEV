/**
 * Configuração do Portal DEV.
 *
 * O portal reúne as ferramentas do time de desenvolvimento — Portal QA e
 * Controle de Impedimentos — sobre um único login, um único cadastro de
 * permissões e um único repositório de dados. Todos os CSV moram nesse
 * repositório e são lidos e gravados pela API do GitHub; por isso um token por
 * pessoa, informado uma vez, serve para todas as ferramentas.
 */
window.PORTAL_CONFIG = {
  /**
   * Repositório onde código e dados moram. Precisa ser um só: token
   * fine-grained do GitHub não enxerga repositórios de donos diferentes.
   */
  github: {
    owner: 'InformaWendel',
    repo: 'PortalDEV',
    branch: 'main',
  },

  /** Caminhos dentro do repositório. */
  dados: {
    usuarios: 'data/usuarios.csv',
    papeis: 'data/papeis.csv',
    qaProjetos: 'data/projetos.csv',
    impedimentos: 'data/impedimentos',
    /** Catálogo dos módulos do roadmap e a fila que o roadmap consome na carga dele. */
    roadmapModulos: 'data/roadmap/modulos.csv',
    roadmapFila: 'data/roadmap/fila.csv',
  },

  /**
   * Como uma linha aprovada da fila vira item do roadmap do OPSView.
   *
   * Isto é acordo com quem é dono daquele ambiente, não dedução nossa: `ambiente`
   * cria valor novo em silêncio se o nome divergir, e `area` é enum fechado. Os 28
   * módulos de data/roadmap/modulos.csv já existem lá como produto, com o nome
   * escrito exatamente assim — não renomeie de um lado só.
   *
   * O portal monta o pacote e para aí. O POST não sai do navegador: o endereço não
   * responde à verificação prévia (OPTIONS devolve 405, sem
   * Access-Control-Allow-Origin), e um token de serviço não tem o que fazer numa
   * página estática. Quem envia digita o curl.
   */
  opsview: {
    endpoint: 'https://opsview.informa.solutions/roadmap/api/import-json',

    /**
     * Chave do item. Contador próprio, cunhado na aprovação e imutável depois — é
     * o que faz reenviar atualizar em vez de duplicar. As 61 chaves já em uso no
     * OPSView não colidem com este prefixo.
     */
    prefixoChave: 'RMAP-I',
    digitosChave: 3,

    /** Frente do módulo -> ambiente · area · deploy_model, conforme o plano de exportação. */
    frentes: {
      S: { ambiente: 'SaaS', area: 'radio_saas', deploy_model: 'saas' },
      P: { ambiente: 'Premise', area: 'radio_onprem', deploy_model: 'onprem' },
      T: { ambiente: 'Informa', area: 'plataforma', deploy_model: 'hibrido' },
    },

    /** Item nascido de impedimento é trabalho já concluído. */
    fase: 'entregue',

    /**
     * O nome do item nunca é "MVP <n> - <módulo>": a numeração de MVP é do roadmap
     * e é recurso finito. O que sai daqui é sempre tarefa.
     */
    prefixoTitulo: 'TarefaInterna - ',

    /** O contrato só tem título curto. O maior dos 61 já enviados tem 56 caracteres. */
    maxTitulo: 56,
  },

  /**
   * Tempero do hash de senha — o mesmo do Portal QA, para as senhas pessoais já
   * cadastradas continuarem valendo.
   *
   * ATENÇÃO: o login identifica quem registrou; não protege nada. O portal é
   * estático e data/usuarios.csv é público para quem abrir a página. Não use
   * senha reaproveitada de outro sistema.
   */
  salt: 'portalqa-informa-2026',

  /**
   * SHA-256 da senha compartilhada do antigo Controle de Impedimentos. Vale só
   * para quem ainda não tem senha pessoal (senha_hash vazio), e o portal pede a
   * troca logo na entrada.
   */
  senhaCompartilhadaHash: '90ecc336d6200b1389eb49c4b557ee42892345c2f727453ae82c96e6de94098e',

  /** Tamanho mínimo da senha pessoal. */
  senhaMinima: 8,

  /** Espera, em milissegundos, entre a última tecla e o commit do catálogo de QA. */
  atrasoGravacao: 1500,

  /**
   * Chaves de armazenamento local. Guardam preferência e credencial — nunca
   * registro. A chave do token termina no usuário do portal: numa máquina
   * compartilhada, cada pessoa grava com o próprio token.
   */
  storageKeys: {
    lang: 'portaldev:lang:v1',
    sessao: 'portaldev:sessao:v1',
    token: 'portaldev:token:v1:',
  },

  /**
   * Catálogo de permissões. É código, não dado: cada chave liga um recurso da
   * tela. Quem recebe cada uma fica em data/papeis.csv, editável pela
   * Administração. `requer` indica a permissão sem a qual esta não faz sentido.
   */
  permissoes: [
    { chave: 'qa.consultar', ferramenta: 'qa' },
    { chave: 'qa.registrar', ferramenta: 'qa', requer: 'qa.consultar' },
    { chave: 'impedimentos.registrar', ferramenta: 'impedimentos' },
    { chave: 'impedimentos.painel', ferramenta: 'impedimentos' },
    { chave: 'admin.usuarios', ferramenta: 'admin' },
  ],

  /** Ordem das ferramentas no menu e na página inicial. */
  ferramentas: ['qa', 'impedimentos', 'admin'],
};
