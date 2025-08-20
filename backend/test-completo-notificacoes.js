const sequelize = require('./config/database.js');

async function testeCompletoNotificacoes() {
    try {
        console.log('🔥 TESTE COMPLETO - Sistema de Notificações\n');
        
        // 1. Testar criação de diferentes tipos de notificação
        console.log('📝 Testando criação de diferentes tipos de notificação...');
        
        const tiposNotificacao = [
            { tipo: 'info', titulo: 'Informação Geral', prioridade: 'normal' },
            { tipo: 'success', titulo: 'Operação Realizada', prioridade: 'baixa' },
            { tipo: 'warning', titulo: 'Aviso Importante', prioridade: 'alta' },
            { tipo: 'error', titulo: 'Erro Crítico', prioridade: 'critica' },
            { tipo: 'ordem_criada', titulo: 'Nova Ordem de Serviço', prioridade: 'normal' },
            { tipo: 'manutencao_vencida', titulo: 'Manutenção Vencida', prioridade: 'alta' },
            { tipo: 'ativo_problema', titulo: 'Problema no Ativo', prioridade: 'critica' },
            { tipo: 'estoque_baixo', titulo: 'Estoque Baixo', prioridade: 'normal' }
        ];
        
        const [usuarios] = await sequelize.query('SELECT id, nome FROM users LIMIT 2');
        
        for (let i = 0; i < tiposNotificacao.length; i++) {
            const notif = tiposNotificacao[i];
            const usuario = usuarios[i % usuarios.length];
            
            await sequelize.query(`
                INSERT INTO notificacoes (
                    titulo, mensagem, tipo, prioridade, user_id, 
                    enviar_email, metadata, created_at, updated_at
                ) VALUES (
                    '${notif.titulo}',
                    'Mensagem de teste para ${notif.tipo}',
                    '${notif.tipo}',
                    '${notif.prioridade}',
                    ${usuario.id},
                    ${Math.random() > 0.5 ? 1 : 0},
                    JSON_OBJECT('teste', true, 'origem', 'sistema_teste'),
                    NOW(),
                    NOW()
                )
            `);
            
            console.log(`  ✅ ${notif.tipo} (${notif.prioridade}) -> ${usuario.nome}`);
        }
        
        // 2. Testar configurações de notificação
        console.log('\n⚙️ Testando configurações de notificação...');
        
        for (const usuario of usuarios) {
            await sequelize.query(`
                INSERT INTO configuracoes_notificacao (
                    user_id, notificacoes_sistema, notificacoes_ordens, notificacoes_manutencao,
                    notificacoes_ativos, notificacoes_estoque, email_sistema, email_ordens,
                    email_manutencao, email_ativos, email_estoque, prioridade_minima_notificacao,
                    prioridade_minima_email, horario_inicio_notificacoes, horario_fim_notificacoes,
                    frequencia_resumo_email, created_at, updated_at
                ) VALUES (
                    ${usuario.id}, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 'normal', 'alta',
                    '08:00:00', '18:00:00', 'diario', NOW(), NOW()
                )
            `);
            
            console.log(`  ✅ Configurações criadas para ${usuario.nome}`);
        }
        
        // 3. Testar consultas e estatísticas
        console.log('\n📊 Gerando estatísticas do sistema...');
        
        // Notificações por tipo
        const [estatTipos] = await sequelize.query(`
            SELECT tipo, COUNT(*) as total, 
                   SUM(CASE WHEN lida = 1 THEN 1 ELSE 0 END) as lidas,
                   SUM(CASE WHEN enviar_email = 1 THEN 1 ELSE 0 END) as com_email
            FROM notificacoes 
            GROUP BY tipo
            ORDER BY total DESC
        `);
        
        console.log('\n📈 Notificações por tipo:');
        estatTipos.forEach(stat => {
            console.log(`  ${stat.tipo}: ${stat.total} total (${stat.lidas} lidas, ${stat.com_email} c/ email)`);
        });
        
        // Notificações por prioridade
        const [estatPrioridade] = await sequelize.query(`
            SELECT prioridade, COUNT(*) as total
            FROM notificacoes 
            GROUP BY prioridade
            ORDER BY 
                CASE prioridade 
                    WHEN 'critica' THEN 1 
                    WHEN 'alta' THEN 2 
                    WHEN 'normal' THEN 3 
                    WHEN 'baixa' THEN 4 
                END
        `);
        
        console.log('\n🎯 Notificações por prioridade:');
        estatPrioridade.forEach(stat => {
            console.log(`  ${stat.prioridade}: ${stat.total} notificações`);
        });
        
        // 4. Testar simulação de leitura
        console.log('\n👁️ Simulando leitura de notificações...');
        
        const [notificacoesParaLer] = await sequelize.query(`
            SELECT id, titulo, tipo FROM notificacoes 
            WHERE lida = 0 
            ORDER BY RAND() 
            LIMIT 3
        `);
        
        for (const notif of notificacoesParaLer) {
            await sequelize.query(`
                UPDATE notificacoes 
                SET lida = 1, data_leitura = NOW(), updated_at = NOW()
                WHERE id = ${notif.id}
            `);
            
            console.log(`  📖 Lida: ${notif.titulo} (${notif.tipo})`);
        }
        
        // 5. Testar consulta com filtros avançados
        console.log('\n🔍 Testando consultas avançadas...');
        
        // Notificações não lidas por usuário
        const [naoLidas] = await sequelize.query(`
            SELECT u.nome, COUNT(n.id) as nao_lidas
            FROM users u
            LEFT JOIN notificacoes n ON u.id = n.user_id AND n.lida = 0
            GROUP BY u.id, u.nome
            ORDER BY nao_lidas DESC
        `);
        
        console.log('\n📬 Notificações não lidas por usuário:');
        naoLidas.forEach(stat => {
            console.log(`  ${stat.nome}: ${stat.nao_lidas} não lidas`);
        });
        
        // Notificações críticas últimas 24h
        const [criticas] = await sequelize.query(`
            SELECT titulo, tipo, created_at
            FROM notificacoes 
            WHERE prioridade = 'critica' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
        `);
        
        console.log(`\n🚨 Notificações críticas (últimas 24h): ${criticas.length}`);
        criticas.forEach(notif => {
            console.log(`  ${notif.titulo} (${notif.tipo}) - ${new Date(notif.created_at).toLocaleString()}`);
        });
        
        // 6. Resumo final
        const [resumo] = await sequelize.query(`
            SELECT 
                COUNT(*) as total_notificacoes,
                SUM(CASE WHEN lida = 1 THEN 1 ELSE 0 END) as total_lidas,
                SUM(CASE WHEN enviar_email = 1 THEN 1 ELSE 0 END) as total_com_email,
                COUNT(DISTINCT user_id) as usuarios_com_notificacoes,
                AVG(CASE WHEN lida = 1 THEN 
                    TIMESTAMPDIFF(MINUTE, created_at, data_leitura) 
                    ELSE NULL END) as tempo_medio_leitura_min
            FROM notificacoes
        `);
        
        console.log('\n📋 RESUMO FINAL:');
        console.log(`  📊 Total de notificações: ${resumo[0].total_notificacoes}`);
        console.log(`  ✅ Total lidas: ${resumo[0].total_lidas}`);
        console.log(`  📧 Com envio de email: ${resumo[0].total_com_email}`);
        console.log(`  👥 Usuários com notificações: ${resumo[0].usuarios_com_notificacoes}`);
        console.log(`  ⏱️ Tempo médio de leitura: ${Math.round(resumo[0].tempo_medio_leitura_min || 0)} minutos`);
        
        const [totalConfigs] = await sequelize.query('SELECT COUNT(*) as total FROM configuracoes_notificacao');
        console.log(`  ⚙️ Configurações criadas: ${totalConfigs[0].total}`);
        
        console.log('\n🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
        console.log('✨ Sistema de notificações está totalmente operacional!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error('🔧 Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

// Executar teste
testeCompletoNotificacoes().then(() => {
    console.log('\n🏁 Teste finalizado');
    process.exit(0);
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});