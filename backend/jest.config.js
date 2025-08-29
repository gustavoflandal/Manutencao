module.exports = {
  // Diretório raiz do projeto
  rootDir: '.',

  // Padrões de arquivos de teste
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Ambiente de teste
  testEnvironment: 'node',

  // Cobertura de código
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**'
  ],

  // Configurações de timeout
  testTimeout: 10000,

  // Setup de ambiente
  setupFiles: ['./tests/setup.js'],

  // Ignorar arquivos
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ]
};

