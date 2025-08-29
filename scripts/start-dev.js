const { spawn } = require('child_process');
const path = require('path');

// Função para iniciar um processo
function startProcess(command, args, cwd, name) {
  const process = spawn(command, args, {
    cwd: path.join(__dirname, '..', cwd),
    shell: true
  });

  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[${name}] ${data}`);
  });

  process.on('close', (code) => {
    console.log(`[${name}] processo finalizado com código ${code}`);
  });

  return process;
}

// Iniciar backend
console.log('🚀 Iniciando servidor backend...');
const backend = startProcess('npm', ['run', 'dev'], 'backend', 'Backend');

// Aguardar um pouco para o backend iniciar
setTimeout(() => {
  // Iniciar frontend
  console.log('🚀 Iniciando servidor frontend...');
  const frontend = startProcess('npm', ['run', 'dev'], 'frontend', 'Frontend');

  // Tratamento para encerrar os processos
  process.on('SIGINT', () => {
    console.log('⚠️ Encerrando servidores...');
    backend.kill();
    frontend.kill();
    process.exit();
  });
}, 2000);

