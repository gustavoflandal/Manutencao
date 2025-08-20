const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function criarAdminDireto() {
  try {
    console.log('🔧 Criando usuário administrador direto no banco...');

    // Verificar se já existe um admin
    const adminExiste = await User.findOne({
      where: { email: 'admin@sistema.com' }
    });

    if (adminExiste) {
      console.log('✅ Usuário administrador já existe!');
      console.log('📧 Email:', adminExiste.email);
      console.log('👤 Nome:', adminExiste.nome);
      return;
    }

    // Criar hash da senha
    const senhaHash = await bcrypt.hash('123456', 10);

    // Criar usuário administrador
    const admin = await User.create({
      nome: 'Administrador Sistema',
      email: 'admin@sistema.com',
      senha: senhaHash,
      perfil: 'administrador',
      ativo: true,
      telefone: '(11) 99999-9999'
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📧 Email: admin@sistema.com');
    console.log('🔑 Senha: 123456');
    console.log('👤 ID:', admin.id);

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error);
  } finally {
    process.exit(0);
  }
}

criarAdminDireto();