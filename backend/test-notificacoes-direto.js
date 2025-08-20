const sequelize = require('./config/database.js');

async function testarSistemaNotificacoes() {
    try {
        console.log('🔍 Testando sistema de notificações...\n');
        
        // 1. Testar conexão com banco
        await sequelize.authenticate();
        console.log('✅ Conexão com banco de dados OK');
        
        // 2. Verificar se as tabelas existem
        const [tabelas] = await sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'manutencao_db' 
            AND TABLE_NAME IN ('notificacoes', 'configuracoes_notificacao', 'users')
        `);
        
        console.log('📋 Tabelas encontradas:', tabelas.map(t => t.TABLE_NAME));
        
        if (tabelas.length < 3) {
            console.log('❌ Algumas tabelas estão faltando');
            return;
        }
        
        // 3. Verificar estrutura da tabela notificacoes
        const [colunas] = await sequelize.query(`
            DESCRIBE notificacoes
        `);
        
        console.log('\n📊 Estrutura da tabela notificacoes:');
        colunas.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type}`);
        });
        
        // 4. Contar registros nas tabelas
        const [countNotif] = await sequelize.query('SELECT COUNT(*) as total FROM notificacoes');
        const [countConfig] = await sequelize.query('SELECT COUNT(*) as total FROM configuracoes_notificacao');
        const [countUsers] = await sequelize.query('SELECT COUNT(*) as total FROM users');
        
        console.log('\n📈 Contagem de registros:');
        console.log(`  Notificações: ${countNotif[0].total}`);
        console.log(`  Configurações: ${countConfig[0].total}`);
        console.log(`  Usuários: ${countUsers[0].total}`);
        
        // 5. Testar inserção de notificação de teste
        if (countUsers[0].total > 0) {
            const [usuarios] = await sequelize.query('SELECT id, nome FROM users LIMIT 1');
            const usuario = usuarios[0];
            
            console.log(`\n🧪 Testando inserção de notificação para usuário: ${usuario.nome}`);
            
            await sequelize.query(`
                INSERT INTO notificacoes (
                    titulo, mensagem, tipo, prioridade, 
                    user_id, lida, data_expiracao, created_at, updated_at
                ) VALUES (
                    'Teste Sistema Notificações',
                    'Notificação de teste criada automaticamente',
                    'sistema',
                    'baixa',
                    ${usuario.id},
                    0,
                    DATE_ADD(NOW(), INTERVAL 30 DAY),
                    NOW(),
                    NOW()
                )
            `);
            
            console.log('✅ Notificação de teste criada com sucesso!');
            
            // Verificar a notificação criada
            const [notifCriada] = await sequelize.query(`
                SELECT * FROM notificacoes 
                WHERE titulo = 'Teste Sistema Notificações' 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            if (notifCriada.length > 0) {
                console.log('📬 Notificação criada:', {
                    id: notifCriada[0].id,
                    titulo: notifCriada[0].titulo,
                    tipo: notifCriada[0].tipo,
                    prioridade: notifCriada[0].prioridade,
                    lida: notifCriada[0].lida
                });
            }
        }
        
        console.log('\n🎉 Teste do sistema de notificações concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await sequelize.close();
    }
}

// Executar teste
testarSistemaNotificacoes().then(() => {
    console.log('\n🏁 Teste finalizado');
    process.exit(0);
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});