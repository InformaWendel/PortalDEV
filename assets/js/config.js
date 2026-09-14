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
