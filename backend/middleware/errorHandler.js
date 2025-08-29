const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleSequelizeError = (err) => {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    return new AppError('Erro de validação', 400, errors);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Registro relacionado não encontrado', 400);
  }

  if (err.name === 'SequelizeDatabaseError') {
    return new AppError('Erro no banco de dados', 500);
  }

  return err;
};

const handleJWTError = () => new AppError('Token inválido. Por favor, faça login novamente.', 401);

const handleJWTExpiredError = () => new AppError('Seu token expirou. Por favor, faça login novamente.', 401);

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('Arquivo muito grande. Tamanho máximo permitido: 5MB', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Número máximo de arquivos excedido', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Tipo de arquivo não permitido', 400);
  }
  return new AppError('Erro no upload de arquivo', 400);
};

const sendErrorDev = (err, res) => {
  logger.error('Error 🔥', {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });

  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  logger.error('Error 🔥', {
    status: err.status,
    error: err,
    message: err.message
  });

  // Erro operacional conhecido
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors
    });
  }

  // Erro de programação ou desconhecido
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Algo deu errado!'
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Tratamento de erros específicos
  if (err.name === 'JsonWebTokenError') err = handleJWTError();
  if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
  if (err.name && err.name.startsWith('Sequelize')) err = handleSequelizeError(err);
  if (err.name === 'MulterError') err = handleMulterError(err);

  // Envio da resposta de erro
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

module.exports = {
  AppError,
  errorHandler
};