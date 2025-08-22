const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function promoverUsuario() {
  try {
    console.log('🔧 Verificando e atualizando usuários...');

    // Encontrar usuário com perfil de solicitante  
    const usuarios = await User.findAll();
    console.log('📋 Usuários encontrados:');
    
    for (const user of usuarios) {
      console.log(`   - ${user.email}: ${user.perfil}`);
      
      // Promover solicitantes para técnico para acessar analytics
      if (user.perfil === 'solicitante') {
        await user.update({ perfil: 'tecnico' });
        console.log(`✅ ${user.email} promovido para técnico`);
      }
    }

    // Verificar se já existe um admin
    const adminExiste = await User.findOne({
      where: { email: 'admin@sistema.com' }
    });

    if (!adminExiste) {
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
    } else {
      console.log('✅ Usuário administrador já existe!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

promoverUsuario();