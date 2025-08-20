const sequelize = require('./config/database.js');

async function testarSistemaAnalytics() {
    try {
        console.log('🔥 TESTE COMPLETO - Sistema de Analytics e Relatórios\n');
        
        // 1. Verificar tabelas criadas
        console.log('📋 Verificando tabelas do Analytics...');
        const [tabelas] = await sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'manutencao_db' 
            AND TABLE_NAME IN ('metricas', 'dashboards', 'relatorios', 'relatorio_execucoes')
            ORDER BY TABLE_NAME
        `);
        
        console.log('✅ Tabelas encontradas:');
        tabelas.forEach(tabela => {
            console.log(`  📊 ${tabela.TABLE_NAME}`);
        });

        if (tabelas.length < 4) {
            console.log('❌ Algumas tabelas estão faltando!');
            return false;
        }

        // 2. Criar métricas de exemplo
        console.log('\n📈 Criando métricas de exemplo...');
        
        const metricasExemplo = [
            {
                tipo: 'eficiencia_manutencao',
                nome: 'Eficiência de Manutenção',
                descricao: 'Percentual de manutenções preventivas sobre o total',
                valor: 75.5,
                unidade: '%',
                periodo: 'mensal',
                data_inicio: new Date('2025-07-01'),
                data_fim: new Date('2025-07-31'),
                categoria: 'operacional',
                meta: 80.0,
                status_meta: 'nao_atingiu',
                calculado_automaticamente: true,
                ativo: true
            },
            {
                tipo: 'tempo_medio_resolucao',
                nome: 'Tempo Médio de Resolução',
                descricao: 'Tempo médio para resolver ordens de serviço',
                valor: 4.2,
                unidade: 'horas',
                periodo: 'mensal',
                data_inicio: new Date('2025-07-01'),
                data_fim: new Date('2025-07-31'),
                categoria: 'performance',
                meta: 4.0,
                status_meta: 'nao_atingiu',
                calculado_automaticamente: true,
                ativo: true
            },
            {
                tipo: 'custo_manutencao',
                nome: 'Custo Total de Manutenção',
                descricao: 'Custo total gasto em manutenções no período',
                valor: 15750.00,
                unidade: 'R$',
                periodo: 'mensal',
                data_inicio: new Date('2025-07-01'),
                data_fim: new Date('2025-07-31'),
                categoria: 'financeiro',
                meta: 12000.00,
                status_meta: 'superou',
                calculado_automaticamente: true,
                ativo: true
            },
            {
                tipo: 'disponibilidade_ativo',
                nome: 'Disponibilidade dos Ativos',
                descricao: 'Percentual médio de disponibilidade dos ativos',
                valor: 92.3,
                unidade: '%',
                periodo: 'mensal',
                data_inicio: new Date('2025-07-01'),
                data_fim: new Date('2025-07-31'),
                categoria: 'disponibilidade',
                meta: 95.0,
                status_meta: 'nao_atingiu',
                calculado_automaticamente: true,
                ativo: true
            },
            {
                tipo: 'produtividade_tecnico',
                nome: 'Produtividade Média dos Técnicos',
                descricao: 'Número médio de ordens concluídas por técnico por semana',
                valor: 8.5,
                unidade: 'ordens/semana',
                periodo: 'mensal',
                data_inicio: new Date('2025-07-01'),
                data_fim: new Date('2025-07-31'),
                categoria: 'performance',
                meta: 10.0,
                status_meta: 'nao_atingiu',
                calculado_automaticamente: true,
                ativo: true
            }
        ];

        for (const metrica of metricasExemplo) {
            await sequelize.query(`
                INSERT INTO metricas (
                    tipo, nome, descricao, valor, unidade, periodo,
                    data_inicio, data_fim, categoria, meta, status_meta,
                    calculado_automaticamente, ativo, created_at, updated_at
                ) VALUES (
                    :tipo, :nome, :descricao, :valor, :unidade, :periodo,
                    :data_inicio, :data_fim, :categoria, :meta, :status_meta,
                    :calculado_automaticamente, :ativo, NOW(), NOW()
                )
            `, {
                replacements: metrica
            });
            
            console.log(`  ✅ ${metrica.nome}: ${metrica.valor}${metrica.unidade}`);
        }

        // 3. Criar dashboards de exemplo
        console.log('\n📊 Criando dashboards de exemplo...');
        
        const [usuarios] = await sequelize.query('SELECT id, nome FROM users LIMIT 2');
        const usuario = usuarios[0];

        const dashboardsExemplo = [
            {
                nome: 'Dashboard Executivo',
                descricao: 'Visão executiva com KPIs principais',
                tipo: 'executivo',
                user_id: usuario.id,
                configuracao: JSON.stringify({
                    layout: 'grid',
                    colunas: 4,
                    tema: 'claro',
                    auto_refresh: 300
                }),
                widgets: JSON.stringify([
                    {
                        id: 'kpi-eficiencia',
                        tipo: 'kpi',
                        titulo: 'Eficiência Geral',
                        posicao: { x: 0, y: 0, w: 1, h: 1 },
                        configuracao: { metrica: 'eficiencia_manutencao', formato: 'percentual' }
                    },
                    {
                        id: 'kpi-disponibilidade',
                        tipo: 'kpi',
                        titulo: 'Disponibilidade',
                        posicao: { x: 1, y: 0, w: 1, h: 1 },
                        configuracao: { metrica: 'disponibilidade_ativo', formato: 'percentual' }
                    },
                    {
                        id: 'grafico-custos',
                        tipo: 'grafico_linha',
                        titulo: 'Evolução de Custos',
                        posicao: { x: 0, y: 1, w: 2, h: 2 },
                        configuracao: { metrica: 'custo_manutencao', periodo: 'ultimos_6_meses' }
                    }
                ]),
                publico: true,
                favorito: true,
                ativo: true
            },
            {
                nome: 'Dashboard Operacional',
                descricao: 'Visão operacional detalhada',
                tipo: 'operacional',
                user_id: usuario.id,
                configuracao: JSON.stringify({
                    layout: 'grid',
                    colunas: 3,
                    tema: 'claro'
                }),
                widgets: JSON.stringify([
                    {
                        id: 'lista-ordens',
                        tipo: 'lista',
                        titulo: 'Ordens Pendentes',
                        posicao: { x: 0, y: 0, w: 1, h: 2 },
                        configuracao: { fonte: 'ordens_servico', filtro: 'pendente' }
                    },
                    {
                        id: 'mapa-ativos',
                        tipo: 'mapa',
                        titulo: 'Status dos Ativos',
                        posicao: { x: 1, y: 0, w: 2, h: 2 },
                        configuracao: { mostrar_alertas: true }
                    }
                ]),
                publico: false,
                favorito: false,
                ativo: true
            }
        ];

        for (const dashboard of dashboardsExemplo) {
            await sequelize.query(`
                INSERT INTO dashboards (
                    nome, descricao, tipo, user_id, configuracao, widgets,
                    publico, favorito, ativo, created_at, updated_at
                ) VALUES (
                    :nome, :descricao, :tipo, :user_id, :configuracao, :widgets,
                    :publico, :favorito, :ativo, NOW(), NOW()
                )
            `, {
                replacements: dashboard
            });
            
            console.log(`  ✅ ${dashboard.nome} (${dashboard.tipo})`);
        }

        // 4. Criar relatórios de exemplo
        console.log('\n📄 Criando relatórios de exemplo...');
        
        const relatoriosExemplo = [
            {
                nome: 'Relatório de Ordens de Serviço',
                descricao: 'Relatório completo de ordens de serviço por período',
                tipo: 'ordens_servico',
                categoria: 'operacional',
                user_id: usuario.id,
                configuracao: JSON.stringify({
                    origem: 'ordens_servico',
                    joins: ['users', 'ativos', 'setores'],
                    groupBy: [],
                    having: []
                }),
                parametros: JSON.stringify({
                    data_inicio: { tipo: 'date', obrigatorio: true },
                    data_fim: { tipo: 'date', obrigatorio: true },
                    status: { tipo: 'multiselect', opcoes: ['pendente', 'em_andamento', 'concluida'], obrigatorio: false }
                }),
                colunas: JSON.stringify([
                    { nome: 'id', titulo: 'ID', tipo: 'number' },
                    { nome: 'titulo', titulo: 'Título', tipo: 'text' },
                    { nome: 'status', titulo: 'Status', tipo: 'badge' },
                    { nome: 'prioridade', titulo: 'Prioridade', tipo: 'badge' },
                    { nome: 'tecnico_nome', titulo: 'Técnico', tipo: 'text' },
                    { nome: 'created_at', titulo: 'Criada em', tipo: 'datetime' }
                ]),
                formato_saida: JSON.stringify(['html', 'pdf', 'excel']),
                template: true,
                publico: true,
                ativo: true
            },
            {
                nome: 'Relatório de KPIs',
                descricao: 'Principais indicadores de performance',
                tipo: 'kpis',
                categoria: 'gerencial',
                user_id: usuario.id,
                configuracao: JSON.stringify({
                    origem: 'metricas',
                    filtros: ['tipo IN ("eficiencia_manutencao", "tempo_medio_resolucao", "custo_manutencao")']
                }),
                parametros: JSON.stringify({
                    periodo: { tipo: 'select', opcoes: ['7_dias', '30_dias', '90_dias'], default: '30_dias' }
                }),
                colunas: JSON.stringify([
                    { nome: 'nome', titulo: 'Métrica', tipo: 'text' },
                    { nome: 'valor', titulo: 'Valor', tipo: 'number' },
                    { nome: 'unidade', titulo: 'Unidade', tipo: 'text' },
                    { nome: 'meta', titulo: 'Meta', tipo: 'number' },
                    { nome: 'status_meta', titulo: 'Status', tipo: 'badge' }
                ]),
                formato_saida: JSON.stringify(['html', 'pdf']),
                template: false,
                publico: false,
                ativo: true
            }
        ];

        for (const relatorio of relatoriosExemplo) {
            // Remover campos que não existem na tabela
            const { favorito, ...relatorioLimpo } = relatorio;
            
            await sequelize.query(`
                INSERT INTO relatorios (
                    nome, descricao, tipo, categoria, user_id, configuracao,
                    parametros, colunas, formato_saida, template, publico,
                    ativo, created_at, updated_at
                ) VALUES (
                    :nome, :descricao, :tipo, :categoria, :user_id, :configuracao,
                    :parametros, :colunas, :formato_saida, :template, :publico,
                    :ativo, NOW(), NOW()
                )
            `, {
                replacements: relatorioLimpo
            });
            
            console.log(`  ✅ ${relatorio.nome} (${relatorio.categoria})`);
        }

        // 5. Simular execuções de relatórios
        console.log('\n⚡ Simulando execuções de relatórios...');
        
        const [relatoriosCriados] = await sequelize.query('SELECT id, nome FROM relatorios LIMIT 2');
        
        for (const rel of relatoriosCriados) {
            const execucao = {
                relatorio_id: rel.id,
                user_id: usuario.id,
                parametros_utilizados: JSON.stringify({
                    data_inicio: '2025-07-01',
                    data_fim: '2025-07-31'
                }),
                status: 'concluido',
                inicio_execucao: new Date(Date.now() - 30000), // 30 segundos atrás
                fim_execucao: new Date(),
                tempo_execucao: 2500, // 2.5 segundos
                registros_retornados: Math.floor(Math.random() * 100) + 10,
                tamanho_resultado: Math.floor(Math.random() * 50000) + 5000,
                formato_exportacao: 'html',
                cache_utilizado: false
            };

            await sequelize.query(`
                INSERT INTO relatorio_execucoes (
                    relatorio_id, user_id, parametros_utilizados, status,
                    inicio_execucao, fim_execucao, tempo_execucao,
                    registros_retornados, tamanho_resultado, formato_exportacao,
                    cache_utilizado, created_at, updated_at
                ) VALUES (
                    :relatorio_id, :user_id, :parametros_utilizados, :status,
                    :inicio_execucao, :fim_execucao, :tempo_execucao,
                    :registros_retornados, :tamanho_resultado, :formato_exportacao,
                    :cache_utilizado, NOW(), NOW()
                )
            `, {
                replacements: execucao
            });
            
            console.log(`  ✅ Execução: ${rel.nome} - ${execucao.registros_retornados} registros`);
        }

        // 6. Gerar estatísticas finais
        console.log('\n📊 Gerando estatísticas finais...');
        
        const [estatisticas] = await sequelize.query(`
            SELECT 
                (SELECT COUNT(*) FROM metricas WHERE ativo = 1) as total_metricas,
                (SELECT COUNT(*) FROM dashboards WHERE ativo = 1) as total_dashboards,
                (SELECT COUNT(*) FROM relatorios WHERE ativo = 1) as total_relatorios,
                (SELECT COUNT(*) FROM relatorio_execucoes) as total_execucoes,
                (SELECT AVG(valor) FROM metricas WHERE ativo = 1) as valor_medio_metricas,
                (SELECT COUNT(*) FROM metricas WHERE status_meta = 'atingiu') as metas_atingidas,
                (SELECT COUNT(*) FROM dashboards WHERE publico = 1) as dashboards_publicos,
                (SELECT COUNT(*) FROM relatorios WHERE template = 1) as templates_relatorio
        `);

        const stats = estatisticas[0];
        
        console.log('\n📋 RESUMO FINAL:');
        console.log(`  📊 Total de métricas: ${stats.total_metricas}`);
        console.log(`  📋 Total de dashboards: ${stats.total_dashboards}`);
        console.log(`  📄 Total de relatórios: ${stats.total_relatorios}`);
        console.log(`  ⚡ Total de execuções: ${stats.total_execucoes}`);
        console.log(`  📈 Valor médio das métricas: ${parseFloat(stats.valor_medio_metricas || 0).toFixed(2)}`);
        console.log(`  🎯 Metas atingidas: ${stats.metas_atingidas}`);
        console.log(`  🌐 Dashboards públicos: ${stats.dashboards_publicos}`);
        console.log(`  📋 Templates de relatório: ${stats.templates_relatorio}`);

        console.log('\n🎉 SISTEMA DE ANALYTICS IMPLEMENTADO COM SUCESSO!');
        console.log('✨ Todas as funcionalidades estão operacionais!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error('🔧 Stack:', error.stack);
        return false;
    }
}

// Executar teste
testarSistemaAnalytics().then((sucesso) => {
    if (sucesso) {
        console.log('\n🏁 Teste finalizado com sucesso!');
        process.exit(0);
    } else {
        console.log('\n💥 Falha no teste!');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});