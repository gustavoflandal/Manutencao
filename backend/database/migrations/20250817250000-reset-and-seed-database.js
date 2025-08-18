'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🧹 Limpando dados existentes (preservando usuários)...');
      
      // Desabilitar verificações de chave estrangeira temporariamente
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { transaction });
      
      // Limpar tabelas na ordem correta (respeitando dependências)
      const tablesToClear = [
        'planos_preventivos',
        'ordens_servico', 
        'solicitacoes',
        'ativos',
        'setores',
        'categories',
        'subcategories',
        'departments'
      ];
      
      for (const table of tablesToClear) {
        try {
          await queryInterface.bulkDelete(table, null, { transaction });
          console.log(`✅ Tabela ${table} limpa`);
        } catch (error) {
          console.log(`⚠️ Tabela ${table} não encontrada ou já vazia`);
        }
      }
      
      // Reabilitar verificações de chave estrangeira
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { transaction });
      
      console.log('📊 Inserindo dados consistentes...');
      
      // 1. Inserir Categories
      await queryInterface.bulkInsert('categories', [
        {
          id: 1,
          nome: 'Equipamentos Industriais',
          descricao: 'Máquinas e equipamentos para produção',
          cor: '#007bff',
          icone: 'fas fa-cogs',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          nome: 'Veículos',
          descricao: 'Veículos e equipamentos de transporte',
          cor: '#28a745',
          icone: 'fas fa-truck',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          nome: 'Informática',
          descricao: 'Equipamentos de TI e informática',
          cor: '#6f42c1',
          icone: 'fas fa-laptop',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });
      
      // 2. Inserir SubCategories
      await queryInterface.bulkInsert('subcategories', [
        {
          id: 1,
          nome: 'Compressores',
          descricao: 'Equipamentos de compressão de ar',
          categoria_id: 1,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          nome: 'Motores',
          descricao: 'Motores elétricos e a combustão',
          categoria_id: 1,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          nome: 'Empilhadeiras',
          descricao: 'Equipamentos de movimentação',
          categoria_id: 2,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });
      
      // 3. Inserir Departments
      await queryInterface.bulkInsert('departments', [
        {
          id: 1,
          nome: 'Manutenção Industrial',
          descricao: 'Departamento de manutenção de equipamentos',
          codigo: 'MAINT',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          nome: 'Produção',
          descricao: 'Departamento de produção',
          codigo: 'PROD',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          nome: 'Logística',
          descricao: 'Departamento de logística e armazenagem',
          codigo: 'LOG',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });
      
      // 4. Inserir Setores
      await queryInterface.bulkInsert('setores', [
        {
          id: 1,
          codigo: 'PROD-01',
          nome: 'Produção Linha 1',
          descricao: 'Linha de produção principal',
          localizacao: 'Galpão A - Térreo',
          responsavel_id: 1, // Assumindo que existe usuário com ID 1
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          codigo: 'PROD-02',
          nome: 'Produção Linha 2',
          descricao: 'Linha de produção secundária',
          localizacao: 'Galpão A - 1º Andar',
          responsavel_id: 1,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          codigo: 'MANUT-01',
          nome: 'Oficina de Manutenção',
          descricao: 'Setor de manutenção e reparos',
          localizacao: 'Galpão B - Térreo',
          responsavel_id: 1,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          codigo: 'ESTO-01',
          nome: 'Estoque Geral',
          descricao: 'Estoque de materiais e peças',
          localizacao: 'Galpão C',
          responsavel_id: 1,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });
      
      // 5. Inserir Ativos
      await queryInterface.bulkInsert('ativos', [
        {
          id: 1,
          codigo_patrimonio: 'AT000001',
          nome: 'Compressor de Ar Atlas Copco',
          fabricante: 'Atlas Copco',
          modelo: 'GA22',
          numero_serie: 'AC220001',
          ano_fabricacao: 2020,
          data_aquisicao: '2020-03-15',
          valor_aquisicao: 85000.00,
          valor_atual: 75000.00,
          categoria_id: 1,
          subcategoria_id: 1,
          department_id: 2,
          localizacao_completa: 'Galpão A - Térreo - Sala de Compressores',
          predio: 'Galpão A',
          andar: 'Térreo',
          sala: 'Sala de Compressores',
          posicao: 'Posição 1',
          estado: 'operacional',
          criticidade: 'alta',
          potencia: '22kW',
          tensao: '380V',
          frequencia: '60Hz',
          peso: 450.00,
          dimensoes: '1.2m x 0.8m x 1.5m',
          capacidade: '3.5 m³/min',
          responsavel_id: 1,
          setor_id: 1,
          data_proxima_inspecao: '2025-09-01',
          horas_funcionamento: 2450.50,
          contador_producao: 0,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          codigo_patrimonio: 'AT000002',
          nome: 'Motor Elétrico WEG',
          fabricante: 'WEG',
          modelo: 'W22',
          numero_serie: 'WEG440001',
          ano_fabricacao: 2021,
          data_aquisicao: '2021-01-20',
          valor_aquisicao: 12000.00,
          valor_atual: 10500.00,
          categoria_id: 1,
          subcategoria_id: 2,
          department_id: 2,
          localizacao_completa: 'Galpão A - Térreo - Linha 1',
          predio: 'Galpão A',
          andar: 'Térreo',
          sala: 'Linha 1',
          posicao: 'Estação 3',
          estado: 'operacional',
          criticidade: 'media',
          potencia: '5CV',
          tensao: '220V',
          frequencia: '60Hz',
          peso: 85.00,
          responsavel_id: 1,
          setor_id: 1,
          data_proxima_inspecao: '2025-08-25',
          horas_funcionamento: 1820.25,
          contador_producao: 15420,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          codigo_patrimonio: 'AT000003',
          nome: 'Empilhadeira Toyota',
          fabricante: 'Toyota',
          modelo: '8FBE20',
          numero_serie: 'TOY330001',
          ano_fabricacao: 2019,
          data_aquisicao: '2019-11-10',
          valor_aquisicao: 65000.00,
          valor_atual: 52000.00,
          categoria_id: 2,
          subcategoria_id: 3,
          department_id: 3,
          localizacao_completa: 'Galpão C - Estoque',
          predio: 'Galpão C',
          andar: 'Térreo',
          sala: 'Estoque',
          posicao: 'Área de Carga',
          estado: 'operacional',
          criticidade: 'alta',
          capacidade: '2000kg',
          responsavel_id: 1,
          setor_id: 4,
          data_proxima_inspecao: '2025-12-01',
          horas_funcionamento: 3250.75,
          contador_producao: 0,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          codigo_patrimonio: 'AT000004',
          nome: 'Torno CNC Romi',
          fabricante: 'Romi',
          modelo: 'Centur 30D',
          numero_serie: 'ROM440001',
          ano_fabricacao: 2022,
          data_aquisicao: '2022-05-15',
          valor_aquisicao: 125000.00,
          valor_atual: 115000.00,
          categoria_id: 1,
          subcategoria_id: 2,
          department_id: 2,
          localizacao_completa: 'Galpão A - 1º Andar - Linha 2',
          predio: 'Galpão A',
          andar: '1º Andar',
          sala: 'Linha 2',
          posicao: 'Estação 1',
          estado: 'operacional',
          criticidade: 'critica',
          potencia: '15kW',
          tensao: '380V',
          frequencia: '60Hz',
          peso: 2800.00,
          dimensoes: '3.2m x 1.8m x 2.1m',
          responsavel_id: 1,
          setor_id: 2,
          data_proxima_inspecao: '2025-09-15',
          horas_funcionamento: 890.00,
          contador_producao: 5240,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });
      
      // 6. Inserir Planos Preventivos
      await queryInterface.bulkInsert('planos_preventivos', [
        {
          id: 1,
          codigo: 'PP000001',
          nome: 'Manutenção Preventiva - Compressor Atlas Copco',
          descricao: 'Manutenção preventiva completa do compressor de ar',
          ativo_id: 1,
          setor_id: 1,
          responsavel_id: 1,
          tipo_periodicidade: 'mensal',
          intervalo_periodicidade: 1,
          prioridade: 'alta',
          categoria: 'inspecao',
          duracao_estimada: 120,
          custo_estimado: 850.00,
          procedimento: 'Verificar filtros de ar, óleo e separador. Checar níveis de óleo. Testar válvulas de segurança. Verificar vazamentos. Limpar trocador de calor.',
          ferramentas_necessarias: 'Chaves de fenda, chaves philips, torquímetro, multímetro, manômetro',
          pecas_necessarias: 'Filtro de ar, filtro de óleo, óleo lubrificante',
          data_inicio: '2025-08-01',
          proxima_execucao: '2025-09-01',
          dias_antecedencia_alerta: 7,
          status: 'ativo',
          total_execucoes: 0,
          observacoes: 'Equipamento crítico para produção',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          codigo: 'PP000002',
          nome: 'Lubrificação Motor WEG',
          descricao: 'Lubrificação e inspeção do motor elétrico',
          ativo_id: 2,
          setor_id: 1,
          responsavel_id: 1,
          tipo_periodicidade: 'quinzenal',
          intervalo_periodicidade: 1,
          prioridade: 'normal',
          categoria: 'lubrificacao',
          duracao_estimada: 45,
          custo_estimado: 125.00,
          procedimento: 'Aplicar graxa nos rolamentos. Verificar conexões elétricas. Medir vibração. Verificar temperatura.',
          ferramentas_necessarias: 'Pistola de graxa, multímetro, termômetro infravermelho',
          pecas_necessarias: 'Graxa para rolamentos',
          data_inicio: '2025-08-01',
          proxima_execucao: '2025-08-15',
          dias_antecedencia_alerta: 3,
          status: 'ativo',
          total_execucoes: 0,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          codigo: 'PP000003',
          nome: 'Inspeção Empilhadeira Toyota',
          descricao: 'Inspeção de segurança e manutenção da empilhadeira',
          ativo_id: 3,
          setor_id: 4,
          responsavel_id: 1,
          tipo_periodicidade: 'semanal',
          intervalo_periodicidade: 1,
          prioridade: 'alta',
          categoria: 'inspecao',
          duracao_estimada: 60,
          custo_estimado: 280.00,
          procedimento: 'Verificar freios, direção, elevação. Checar níveis de fluidos. Testar buzina e sinais. Verificar pneus e correntes.',
          ferramentas_necessarias: 'Chaves diversas, medidor de pressão, lanterna',
          pecas_necessarias: 'Óleo hidráulico, filtros',
          data_inicio: '2025-08-01',
          proxima_execucao: '2025-08-08',
          dias_antecedencia_alerta: 2,
          status: 'ativo',
          total_execucoes: 0,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 4,
          codigo: 'PP000004',
          nome: 'Calibração Torno CNC',
          descricao: 'Calibração e ajuste de precisão do torno CNC',
          ativo_id: 4,
          setor_id: 2,
          responsavel_id: 1,
          tipo_periodicidade: 'mensal',
          intervalo_periodicidade: 3,
          prioridade: 'critica',
          categoria: 'calibracao',
          duracao_estimada: 240,
          custo_estimado: 1500.00,
          procedimento: 'Calibrar eixos X, Y, Z. Verificar precisão dimensional. Ajustar ferramentas. Testar programas de referência.',
          ferramentas_necessarias: 'Relógio comparador, esquadro de precisão, micrômetros',
          pecas_necessarias: 'Peças de calibração, pastilhas de corte',
          data_inicio: '2025-08-01',
          proxima_execucao: '2025-11-01',
          dias_antecedencia_alerta: 14,
          status: 'ativo',
          total_execucoes: 0,
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], { transaction });
      
      // Reset dos auto-increment para evitar conflitos futuros
      await queryInterface.sequelize.query('ALTER TABLE categories AUTO_INCREMENT = 4;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE subcategories AUTO_INCREMENT = 4;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE departments AUTO_INCREMENT = 4;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE setores AUTO_INCREMENT = 5;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE ativos AUTO_INCREMENT = 5;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE planos_preventivos AUTO_INCREMENT = 5;', { transaction });
      
      await transaction.commit();
      
      console.log('🎉 Database reset and seeded successfully!');
      console.log('📊 Dados inseridos:');
      console.log('   • 3 Categories');
      console.log('   • 3 SubCategories');  
      console.log('   • 3 Departments');
      console.log('   • 4 Setores');
      console.log('   • 4 Ativos');
      console.log('   • 4 Planos Preventivos');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erro durante reset/seed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Desabilitar verificações de chave estrangeira temporariamente
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { transaction });
      
      // Limpar tabelas na ordem correta
      const tablesToClear = [
        'planos_preventivos',
        'ordens_servico',
        'solicitacoes', 
        'ativos',
        'setores',
        'categories',
        'subcategories',
        'departments'
      ];
      
      for (const table of tablesToClear) {
        try {
          await queryInterface.bulkDelete(table, null, { transaction });
        } catch (error) {
          console.log(`Tabela ${table} não encontrada`);
        }
      }
      
      // Reabilitar verificações de chave estrangeira
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { transaction });
      
      await transaction.commit();
      console.log('🧹 Rollback completed - all seeded data removed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Erro durante rollback:', error);
      throw error;
    }
  }
};