/**
 * Administração — textos nos dois idiomas.
 * As chaves entram no dicionário do portal com o prefixo "adm.".
 */
(function () {
  'use strict';

  window.I18N.registrar(
    {
      pt: {
        'nav.usuarios': 'Usuários',
        'nav.permissoes': 'Permissões',

        'usuarios.titulo': 'Usuários do portal',
        'usuarios.ajuda':
          'Cada pessoa entra com o próprio usuário e recebe as ferramentas do seu papel. Desativar preserva o histórico: os registros continuam no repositório e voltam a valer se a pessoa for reativada.',
        'usuarios.novo': 'Novo usuário',
        'usuarios.contagem': '{ativos} ativo(s) de {total}',
        'usuarios.nome': 'Nome',
        'usuarios.usuario': 'Usuário',
        'usuarios.papel': 'Papel',
        'usuarios.senha': 'Senha',
        'usuarios.situacao': 'Situação',
        'usuarios.acoes': 'Ações',
        'usuarios.senhaPessoal': 'Pessoal',
        'usuarios.senhaCompartilhada': 'Compartilhada · troca pendente',
        'usuarios.ativo': 'Ativo',
        'usuarios.inativo': 'Inativo',
        'usuarios.editar': 'Editar',
        'usuarios.redefinir': 'Redefinir senha',
        'usuarios.voce': 'você',
        'usuarios.papelDesconhecido': 'papel inexistente',

        'form.tituloNovo': 'Novo usuário',
        'form.tituloEditar': 'Editar {nome}',
        'form.usuario': 'Usuário (login)',
        'form.usuarioAjuda':
          'Letras minúsculas, números, ponto, hífen ou sublinhado. Não muda depois: é o nome do CSV de impedimentos da pessoa.',
        'form.nome': 'Nome completo',
        'form.papel': 'Papel',
        'form.ativo': 'Usuário ativo',
        'form.senha': 'Senha inicial',
        'form.senhaAjuda':
          'Pelo menos {n} caracteres. Entregue por canal separado; a pessoa troca depois pelo menu da conta.',
        'form.erroUsuario': 'Informe um usuário válido: letras minúsculas, números, ponto, hífen ou sublinhado.',
        'form.erroDuplicado': 'Já existe um usuário com esse login.',
        'form.erroNome': 'Informe o nome.',
        'form.erroPapel': 'Escolha um papel.',
        'form.erroVoce': 'Você não pode desativar o próprio usuário.',
        'form.erroUltimoAdmin':
          'A alteração deixaria o portal sem ninguém ativo com a permissão de administrar usuários.',
        'form.erroSumiu': 'Esse registro não existe mais no cadastro. Recarregue a página.',

        'senha.titulo': 'Redefinir a senha de {nome}',
        'senha.ajuda':
          'A senha nova vale a partir do próximo login. Entregue por canal separado e oriente a pessoa a trocá-la.',
        'senha.campo': 'Nova senha',
        'senha.salva': 'Senha de {nome} redefinida.',

        'permissoes.titulo': 'Matriz de permissões',
        'permissoes.ajuda':
          'Marque o que cada papel pode fazer. Nada vale até salvar; quem estiver com o portal aberto vê a mudança ao recarregar a página.',
        'permissoes.permissao': 'Permissão',
        'permissoes.usuarios': '{n} usuário(s) ativo(s)',
        'permissoes.novoPapel': 'Novo papel',
        'permissoes.salvar': 'Salvar permissões',
        'permissoes.descartar': 'Descartar alterações',
        'permissoes.pendente': 'Há alterações não salvas.',
        'permissoes.salvas': 'Permissões salvas.',
        'permissoes.editarPapel': 'Editar',
        'permissoes.excluirPapel': 'Excluir',
        'permissoes.excluirConfirma': 'Excluir o papel {papel}?',
        'permissoes.emUso': 'O papel está em uso por {n} usuário(s): troque o papel dessas pessoas antes de excluí-lo.',
        'permissoes.requer': 'inclui "{permissao}"',
        'permissoes.marca': '{papel} — {permissao}',

        'papel.tituloNovo': 'Novo papel',
        'papel.tituloEditar': 'Editar o papel {papel}',
        'papel.chave': 'Identificador',
        'papel.chaveAjuda':
          'Letras minúsculas, números, hífen ou sublinhado. É o valor gravado na coluna papel de data/usuarios.csv.',
        'papel.nomePt': 'Nome em português',
        'papel.nomeEn': 'Nome em inglês',
        'papel.copiar': 'Começar com as permissões de',
        'papel.nenhum': 'Nenhuma permissão',
        'papel.erroChave': 'Informe um identificador válido.',
        'papel.erroDuplicado': 'Já existe um papel com esse identificador.',
        'papel.erroNome': 'Informe o nome em português.',
        'papel.salvo': 'Papel salvo.',
        'papel.excluido': 'Papel excluído.',

        'semToken': 'Sem token do GitHub a administração fica só para consulta.',
        'salvo': 'Cadastro salvo.',
        'falha': 'Não foi possível gravar: {erro}',
      },

      en: {
        'nav.usuarios': 'Users',
        'nav.permissoes': 'Permissions',

        'usuarios.titulo': 'Portal users',
        'usuarios.ajuda':
          'Each person signs in with their own user and gets the tools of their role. Deactivating keeps the history: records stay in the repository and count again if the person is reactivated.',
        'usuarios.novo': 'New user',
        'usuarios.contagem': '{ativos} active of {total}',
        'usuarios.nome': 'Name',
        'usuarios.usuario': 'User',
        'usuarios.papel': 'Role',
        'usuarios.senha': 'Password',
        'usuarios.situacao': 'Status',
        'usuarios.acoes': 'Actions',
        'usuarios.senhaPessoal': 'Personal',
        'usuarios.senhaCompartilhada': 'Shared · change pending',
        'usuarios.ativo': 'Active',
        'usuarios.inativo': 'Inactive',
        'usuarios.editar': 'Edit',
        'usuarios.redefinir': 'Reset password',
        'usuarios.voce': 'you',
        'usuarios.papelDesconhecido': 'unknown role',

        'form.tituloNovo': 'New user',
        'form.tituloEditar': 'Edit {nome}',
        'form.usuario': 'User (login)',
        'form.usuarioAjuda':
          'Lowercase letters, digits, dot, hyphen or underscore. It cannot change later: it names the person’s impediment CSV.',
        'form.nome': 'Full name',
        'form.papel': 'Role',
        'form.ativo': 'Active user',
        'form.senha': 'Initial password',
        'form.senhaAjuda':
          'At least {n} characters. Hand it over through a separate channel; the person changes it later from the account menu.',
        'form.erroUsuario': 'Enter a valid user: lowercase letters, digits, dot, hyphen or underscore.',
        'form.erroDuplicado': 'A user with that login already exists.',
        'form.erroNome': 'Enter the name.',
        'form.erroPapel': 'Pick a role.',
        'form.erroVoce': 'You cannot deactivate your own user.',
        'form.erroUltimoAdmin': 'This change would leave the portal with no active person allowed to manage users.',
        'form.erroSumiu': 'That record no longer exists in the registry. Reload the page.',

        'senha.titulo': 'Reset the password of {nome}',
        'senha.ajuda':
          'The new password takes effect at the next sign-in. Hand it over through a separate channel and ask the person to change it.',
        'senha.campo': 'New password',
        'senha.salva': 'Password of {nome} reset.',

        'permissoes.titulo': 'Permission matrix',
        'permissoes.ajuda':
          'Tick what each role may do. Nothing applies until saved; anyone with the portal open sees the change after reloading the page.',
        'permissoes.permissao': 'Permission',
        'permissoes.usuarios': '{n} active user(s)',
        'permissoes.novoPapel': 'New role',
        'permissoes.salvar': 'Save permissions',
        'permissoes.descartar': 'Discard changes',
        'permissoes.pendente': 'There are unsaved changes.',
        'permissoes.salvas': 'Permissions saved.',
        'permissoes.editarPapel': 'Edit',
        'permissoes.excluirPapel': 'Delete',
        'permissoes.excluirConfirma': 'Delete the {papel} role?',
        'permissoes.emUso': 'The role is used by {n} user(s): change their role before deleting it.',
        'permissoes.requer': 'includes "{permissao}"',
        'permissoes.marca': '{papel} — {permissao}',

        'papel.tituloNovo': 'New role',
        'papel.tituloEditar': 'Edit the {papel} role',
        'papel.chave': 'Identifier',
        'papel.chaveAjuda':
          'Lowercase letters, digits, hyphen or underscore. It is the value written to the papel column of data/usuarios.csv.',
        'papel.nomePt': 'Name in Portuguese',
        'papel.nomeEn': 'Name in English',
        'papel.copiar': 'Start with the permissions of',
        'papel.nenhum': 'No permission',
        'papel.erroChave': 'Enter a valid identifier.',
        'papel.erroDuplicado': 'A role with that identifier already exists.',
        'papel.erroNome': 'Enter the Portuguese name.',
        'papel.salvo': 'Role saved.',
        'papel.excluido': 'Role deleted.',

        'semToken': 'Without a GitHub token the administration is view only.',
        'salvo': 'Registry saved.',
        'falha': 'Could not save: {erro}',
      },
    },
    'adm.'
  );
})();
