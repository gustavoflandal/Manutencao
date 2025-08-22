// Exemplo de como ficaria o AtivoController com RocksDB

const ImageStorageService = require('../services/ImageStorageService');

class AtivoController {
  // Upload de imagens usando RocksDB
  async uploadImagensRocksDB(req, res, next) {
    try {
      const { id } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem enviada'
        });
      }

      const ativo = await Ativo.findByPk(id);
      if (!ativo) {
        return res.status(404).json({
          success: false,
          message: 'Ativo não encontrado'
        });
      }

      // Verificar limite de imagens
      const imagensExistentes = await AtivoImagem.count({ where: { ativo_id: id }});
      if (imagensExistentes >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Limite máximo de 5 imagens atingido'
        });
      }

      const imagens = [];
      
      for (let i = 0; i < files.length && (imagensExistentes + i) < 5; i++) {
        const file = files[i];
        
        // Gerar chave única para RocksDB
        const rocksdbKey = `ativo_${id}_img_${Date.now()}_${i}`;
        
        // Salvar imagem no RocksDB
        await ImageStorageService.saveImage(rocksdbKey, file.buffer);
        
        // Salvar metadados no MySQL
        const imagem = await AtivoImagem.create({
          ativo_id: id,
          nome_arquivo: file.originalname,
          tipo: file.mimetype,
          tamanho: file.size,
          rocksdb_key: rocksdbKey,
          ordem: imagensExistentes + i
        });
        
        imagens.push({
          id: imagem.id,
          nome_arquivo: imagem.nome_arquivo,
          tipo: imagem.tipo,
          tamanho: imagem.tamanho,
          url: `/api/ativos/${id}/imagens/${imagem.id}/download`
        });
      }

      res.json({
        success: true,
        message: 'Imagens enviadas com sucesso',
        data: { imagens }
      });

    } catch (error) {
      logger.error('Erro no upload de imagens:', error);
      next(error);
    }
  }

  // Servir imagem do RocksDB
  async downloadImagem(req, res, next) {
    try {
      const { id, imagemId } = req.params;

      const imagem = await AtivoImagem.findOne({
        where: { id: imagemId, ativo_id: id }
      });

      if (!imagem) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }

      // Recuperar imagem do RocksDB
      const imageBuffer = await ImageStorageService.getImage(imagem.rocksdb_key);

      // Configurar headers de resposta
      res.set({
        'Content-Type': imagem.tipo,
        'Content-Length': imagem.tamanho,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
        'ETag': `"${imagem.rocksdb_key}"`
      });

      res.send(imageBuffer);

    } catch (error) {
      logger.error('Erro ao baixar imagem:', error);
      next(error);
    }
  }

  // Remover imagem do RocksDB
  async removerImagemRocksDB(req, res, next) {
    try {
      const { id, imagemId } = req.params;

      const imagem = await AtivoImagem.findOne({
        where: { id: imagemId, ativo_id: id }
      });

      if (!imagem) {
        return res.status(404).json({
          success: false,
          message: 'Imagem não encontrada'
        });
      }

      // Remover do RocksDB
      await ImageStorageService.deleteImage(imagem.rocksdb_key);

      // Remover metadados do MySQL
      await imagem.destroy();

      res.json({
        success: true,
        message: 'Imagem removida com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao remover imagem:', error);
      next(error);
    }
  }
}

module.exports = AtivoController;