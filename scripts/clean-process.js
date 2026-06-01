const { execSync } = require('child_process');
const fs = require('fs');

console.log('Cleaning up...');

function killProcess(name) {
  try {
    console.log(`  - Killing: ${name}`);
    execSync(`taskkill /F /IM ${name}`, { stdio: 'ignore' });
    console.log(`    OK: ${name}`);
  } catch (e) {
    console.log(`    INFO: ${name} not found`);
  }
}

// 只结束应用相关的进程，不要结束所有 node.exe
const processNames = [
  'AgentDeliveryIsland.exe',
  'electron.exe'
];

processNames.forEach(killProcess);

const waitMs = 2000;
console.log(`\nWaiting ${waitMs}ms...`);
const start = Date.now();
while (Date.now() - start < waitMs) {
  // Busy wait
}

console.log('\nRemoving release directory...');
try {
  if (fs.existsSync('release')) {
    fs.rmSync('release', { recursive: true, force: true });
    console.log('  OK: release directory removed');
  }
} catch (e) {
  console.log('  WARN: cannot remove directory');
}

console.log('\nCleanup complete!\n');
