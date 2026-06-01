const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('Agent Delivery Island - Build Script');
console.log('========================================\n');

// Step 1: Clean up running processes
console.log('[1/4] Cleaning up running processes...');
try {
  execSync('taskkill /F /IM AgentDeliveryIsland.exe 2>nul', { stdio: 'ignore' });
} catch (e) {}
try {
  execSync('taskkill /F /IM electron.exe 2>nul', { stdio: 'ignore' });
} catch (e) {}

// Step 2: Wait a bit
console.log('[2/4] Waiting for processes to exit...');
const waitStart = Date.now();
while (Date.now() - waitStart < 2000) {}

// Step 3: Build with Vite
console.log('[3/4] Building with Vite...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (e) {
  console.error('Vite build failed!');
  process.exit(1);
}

// Step 4: Build with electron-builder - 关键修改：每次都用新目录！
console.log('\n[4/4] Building with electron-builder...');

// 创建临时构建配置
const configPath = path.join(__dirname, '..', 'temp-builder.json');
const timestamp = Date.now();
const outputDir = `release/build-${timestamp}`;

const config = {
  appId: "com.shan.agent-delivery-island",
  productName: "AgentDeliveryIsland",
  directories: {
    output: outputDir
  },
  win: {
    target: "dir",
    sign: null,
    signAndEditExecutable: false
  },
  files: [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ]
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`  Output directory: ${outputDir}`);

try {
  const result = spawnSync('npx', ['electron-builder', '--config', configPath], {
    stdio: 'inherit',
    shell: true
  });
  
  // 删除临时配置文件
  fs.unlinkSync(configPath);
  
  if (result.status === 0) {
    console.log('\n✅ Build SUCCESS!');
    console.log(`   Output: ${outputDir}`);
    console.log(`   Run: ${outputDir}\\win-unpacked\\AgentDeliveryIsland.exe`);
  } else {
    console.log('\n❌ Build FAILED!');
    process.exit(1);
  }
} catch (e) {
  console.error(e);
  fs.unlinkSync(configPath);
  process.exit(1);
}
