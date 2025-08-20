const sequelize = require('./config/database.js');

async function criarTabelasAnalytics() {
    try {
        console.log('🏗️ Criando tabelas do sistema de Analytics...\n');

        // 1. Tabela de Métricas
        console.log('📊 Criando tabela metricas...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS metricas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo ENUM(
                    'tempo_medio_resolucao',
                    'eficiencia_manutencao',
                    'disponibilidade_ativo',
                    'custo_manutencao',
                    'produtividade_tecnico',
                    'taxa_retrabalho',
                    'consumo_estoque',
                    'preventiva_vs_corretiva',
                    'satisfacao_usuario',
                    'kpi_personalizado'
                ) NOT NULL COMMENT 'Tipo da métrica coletada',
                nome VARCHAR(255) NOT NULL COMMENT 'Nome descritivo da métrica',
                descricao TEXT COMMENT 'Descrição detalhada da métrica',
                valor DECIMAL(15,4) NOT NULL COMMENT 'Valor numérico da métrica',
                unidade VARCHAR(50) COMMENT 'Unidade de medida (horas, %, R$, etc.)',
                periodo ENUM(
                    'diario',
                    'semanal',
                    'mensal',
                    'trimestral',
                    'anual',
                    'tempo_real'
                ) NOT NULL COMMENT 'Período de coleta da métrica',
                data_inicio DATE NOT NULL COMMENT 'Data de início do período medido',
                data_fim DATE NOT NULL COMMENT 'Data de fim do período medido',
                ativo_id INT NULL COMMENT 'ID do ativo relacionado (se aplicável)',
                setor_id INT NULL COMMENT 'ID do setor relacionado (se aplicável)',
                user_id INT NULL COMMENT 'ID do usuário relacionado (se aplicável)',
                categoria VARCHAR(100) COMMENT 'Categoria da métrica para agrupamento',
                metadata JSON COMMENT 'Dados adicionais em formato JSON',
                tendencia ENUM('crescente', 'decrescente', 'estavel', 'volatil') COMMENT 'Tendência identificada automaticamente',
                meta DECIMAL(15,4) COMMENT 'Meta estabelecida para esta métrica',
                status_meta ENUM('atingiu', 'nao_atingiu', 'superou', 'em_progresso') COMMENT 'Status em relação à meta',
                calculado_automaticamente BOOLEAN DEFAULT TRUE COMMENT 'Se foi calculado automaticamente ou inserido manualmente',
                ativo BOOLEAN DEFAULT TRUE COMMENT 'Se a métrica está ativa para coleta',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_metricas_tipo (tipo),
                INDEX idx_metricas_periodo (periodo, data_inicio, data_fim),
                INDEX idx_metricas_ativo (ativo_id),
                INDEX idx_metricas_setor (setor_id),
                INDEX idx_metricas_usuario (user_id),
                INDEX idx_metricas_categoria (categoria),
                
                FOREIGN KEY (ativo_id) REFERENCES ativos(id) ON DELETE SET NULL,
                FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela metricas criada com sucesso');

        // 2. Tabela de Dashboards
        console.log('\n📋 Criando tabela dashboards...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS dashboards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL COMMENT 'Nome do dashboard',
                descricao TEXT COMMENT 'Descrição do dashboard',
                tipo ENUM(
                    'executivo',
                    'operacional',
                    'tecnico',
                    'gerencial',
                    'personalizado'
                ) NOT NULL COMMENT 'Tipo do dashboard',
                user_id INT NOT NULL COMMENT 'Proprietário do dashboard',
                configuracao JSON NOT NULL COMMENT 'Configuração dos widgets e layout',
                widgets JSON NOT NULL COMMENT 'Lista de widgets e suas configurações',
                filtros_padrao JSON COMMENT 'Filtros padrão aplicados ao dashboard',
                periodo_padrao ENUM(
                    'hoje',
                    'ontem',
                    'ultimos_7_dias',
                    'ultimos_30_dias',
                    'ultimo_mes',
                    'ultimos_3_meses',
                    'ultimo_ano',
                    'personalizado'
                ) DEFAULT 'ultimos_30_dias' COMMENT 'Período padrão para dados',
                publico BOOLEAN DEFAULT FALSE COMMENT 'Se o dashboard é visível para outros usuários',
                compartilhado_com JSON COMMENT 'Lista de IDs de usuários com acesso',
                auto_refresh INT DEFAULT 300 COMMENT 'Intervalo de atualização automática em segundos',
                favorito BOOLEAN DEFAULT FALSE COMMENT 'Se está marcado como favorito pelo usuário',
                ordem INT DEFAULT 0 COMMENT 'Ordem de exibição na lista',
                ativo BOOLEAN DEFAULT TRUE COMMENT 'Se o dashboard está ativo',
                template_id INT NULL COMMENT 'ID do template base (se criado a partir de template)',
                versao INT DEFAULT 1 COMMENT 'Versão do dashboard para controle de alterações',
                backup_configuracao JSON COMMENT 'Backup da configuração anterior',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_dashboards_usuario (user_id),
                INDEX idx_dashboards_tipo (tipo),
                INDEX idx_dashboards_publico (publico, ativo),
                INDEX idx_dashboards_favorito (user_id, favorito),
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (template_id) REFERENCES dashboards(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela dashboards criada com sucesso');

        // 3. Tabela de Relatórios
        console.log('\n📄 Criando tabela relatorios...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS relatorios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL COMMENT 'Nome do relatório',
                descricao TEXT COMMENT 'Descrição do relatório',
                tipo ENUM(
                    'ordens_servico',
                    'ativos',
                    'manutencao_preventiva',
                    'custos',
                    'produtividade',
                    'disponibilidade',
                    'estoque',
                    'kpis',
                    'personalizado'
                ) NOT NULL COMMENT 'Tipo do relatório',
                categoria ENUM(
                    'operacional',
                    'gerencial',
                    'estrategico',
                    'financeiro',
                    'tecnico'
                ) NOT NULL COMMENT 'Categoria do relatório',
                user_id INT NOT NULL COMMENT 'Usuário que criou o relatório',
                query_sql TEXT COMMENT 'Query SQL para relatórios personalizados',
                configuracao JSON NOT NULL COMMENT 'Configuração do relatório (filtros, campos, etc.)',
                parametros JSON COMMENT 'Parâmetros configuráveis do relatório',
                colunas JSON NOT NULL COMMENT 'Definição das colunas do relatório',
                filtros_padrao JSON COMMENT 'Filtros padrão aplicados',
                ordenacao_padrao JSON COMMENT 'Ordenação padrão',
                formato_saida JSON NOT NULL COMMENT 'Formatos de saída suportados',
                agendamento JSON COMMENT 'Configuração de agendamento automático',
                publico BOOLEAN DEFAULT FALSE COMMENT 'Se o relatório é público',
                compartilhado_com JSON COMMENT 'Usuários com acesso ao relatório',
                template BOOLEAN DEFAULT FALSE COMMENT 'Se é um template de relatório',
                ativo BOOLEAN DEFAULT TRUE COMMENT 'Se o relatório está ativo',
                favorito BOOLEAN DEFAULT FALSE COMMENT 'Se está marcado como favorito',
                execucoes INT DEFAULT 0 COMMENT 'Número de execuções do relatório',
                ultima_execucao DATETIME COMMENT 'Data da última execução',
                tempo_medio_execucao INT COMMENT 'Tempo médio de execução em milissegundos',
                tamanho_medio_resultado INT COMMENT 'Tamanho médio do resultado em bytes',
                versao INT DEFAULT 1 COMMENT 'Versão do relatório',
                tags JSON COMMENT 'Tags para organização e busca',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_relatorios_usuario (user_id),
                INDEX idx_relatorios_tipo (tipo),
                INDEX idx_relatorios_categoria (categoria),
                INDEX idx_relatorios_publico (publico, ativo),
                INDEX idx_relatorios_template (template, ativo),
                INDEX idx_relatorios_favorito (user_id, favorito),
                
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela relatorios criada com sucesso');

        // 4. Tabela de Execuções de Relatórios
        console.log('\n⚡ Criando tabela relatorio_execucoes...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS relatorio_execucoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                relatorio_id INT NOT NULL COMMENT 'ID do relatório executado',
                user_id INT NOT NULL COMMENT 'Usuário que executou o relatório',
                parametros_utilizados JSON COMMENT 'Parâmetros utilizados na execução',
                status ENUM(
                    'executando',
                    'concluido',
                    'erro',
                    'cancelado',
                    'timeout'
                ) NOT NULL DEFAULT 'executando' COMMENT 'Status da execução',
                inicio_execucao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Início da execução',
                fim_execucao DATETIME COMMENT 'Fim da execução',
                tempo_execucao INT COMMENT 'Tempo de execução em milissegundos',
                registros_retornados INT COMMENT 'Número de registros retornados',
                tamanho_resultado INT COMMENT 'Tamanho do resultado em bytes',
                formato_exportacao ENUM('html', 'pdf', 'excel', 'csv', 'json') COMMENT 'Formato de exportação utilizado',
                arquivo_gerado VARCHAR(500) COMMENT 'Caminho do arquivo gerado (se exportado)',
                hash_resultado VARCHAR(64) COMMENT 'Hash MD5 do resultado para cache',
                mensagem_erro TEXT COMMENT 'Mensagem de erro (se houver)',
                stack_trace TEXT COMMENT 'Stack trace do erro (se houver)',
                agendado BOOLEAN DEFAULT FALSE COMMENT 'Se foi uma execução agendada',
                enviado_por_email BOOLEAN DEFAULT FALSE COMMENT 'Se o resultado foi enviado por email',
                destinatarios_email JSON COMMENT 'Lista de destinatários do email',
                ip_origem VARCHAR(45) COMMENT 'IP de origem da execução',
                user_agent TEXT COMMENT 'User agent do navegador',
                cache_utilizado BOOLEAN DEFAULT FALSE COMMENT 'Se utilizou cache na execução',
                cache_key VARCHAR(255) COMMENT 'Chave do cache utilizada',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_execucoes_relatorio (relatorio_id),
                INDEX idx_execucoes_usuario (user_id),
                INDEX idx_execucoes_status (status),
                INDEX idx_execucoes_data (inicio_execucao),
                INDEX idx_execucoes_agendado (agendado, status),
                INDEX idx_execucoes_cache (cache_key),
                
                FOREIGN KEY (relatorio_id) REFERENCES relatorios(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela relatorio_execucoes criada com sucesso');

        console.log('\n🎉 Todas as tabelas do sistema de Analytics foram criadas com sucesso!');
        
        // Verificar se as tabelas foram criadas
        console.log('\n🔍 Verificando tabelas criadas...');
        const [tabelas] = await sequelize.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'manutencao_db' 
            AND TABLE_NAME IN ('metricas', 'dashboards', 'relatorios', 'relatorio_execucoes')
            ORDER BY TABLE_NAME
        `);
        
        console.log('📋 Tabelas encontradas:');
        tabelas.forEach(tabela => {
            console.log(`  ✅ ${tabela.TABLE_NAME}`);
        });

        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error.message);
        console.error('🔧 Stack:', error.stack);
        return false;
    }
}

// Executar criação das tabelas
criarTabelasAnalytics().then((sucesso) => {
    if (sucesso) {
        console.log('\n🏁 Criação das tabelas finalizada com sucesso!');
        process.exit(0);
    } else {
        console.log('\n💥 Falha na criação das tabelas!');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});