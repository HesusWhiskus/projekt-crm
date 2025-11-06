const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// Użyj __dirname aby znaleźć katalog projektu (jeden poziom wyżej od scripts/)
const PROJECT_PATH = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

// Ustaw kodowanie UTF-8 dla Windows
if (os.platform() === 'win32') {
  process.env.CHCP = '65001'; // UTF-8
}

if (args.length === 0) {
  console.error('Usage: node git-wrapper.js <git-command> [args...]');
  console.error('Examples:');
  console.error('  node git-wrapper.js status');
  console.error('  node git-wrapper.js add .');
  console.error('  node git-wrapper.js commit -m "message"');
  console.error('  node git-wrapper.js commit --interactive');
  console.error('  node git-wrapper.js push');
  process.exit(1);
}

// Obsługa specjalnego przypadku: commit bez -m (interaktywny)
if (args[0] === 'commit' && !args.includes('-m') && !args.includes('--message') && !args.includes('--amend') && !args.includes('--no-edit')) {
  // Jeśli commit bez wiadomości, użyj interaktywnego edytora
  const commitArgs = args.slice(1);
  const gitCommand = `git commit ${commitArgs.join(' ')}`;
  
  try {
    execSync(gitCommand, {
      cwd: PROJECT_PATH,
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true,
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });
  } catch (error) {
    process.exit(error.status || 1);
  }
} else {
  // Dla wszystkich innych komend, buduj komendę git
  // Używamy shell: true aby poprawnie obsłużyć cudzysłowy i specjalne znaki
  const gitCommand = args.join(' ');
  
  try {
    execSync(`git ${gitCommand}`, {
      cwd: PROJECT_PATH,
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true,
      env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8' }
    });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

