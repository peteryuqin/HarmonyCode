#!/usr/bin/env node

/**
 * HarmonyCode Integration Test
 * Ensures the framework is working before publish
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing HarmonyCode Framework...\n');

let passed = 0;
let failed = 0;

// Test 1: CLI exists and is executable
console.log('Test 1: CLI executable check');
const cliPath = path.join(__dirname, '..', 'cli', 'index.js');
if (fs.existsSync(cliPath)) {
  const stats = fs.statSync(cliPath);
  if (stats.mode & 0o100) {
    console.log('✅ CLI is executable\n');
    passed++;
  } else {
    console.log('❌ CLI exists but not executable\n');
    failed++;
  }
} else {
  console.log('❌ CLI not found\n');
  failed++;
}

// Test 2: Server file exists
console.log('Test 2: Server component check');
const serverPath = path.join(__dirname, '..', 'server', 'index.js');
if (fs.existsSync(serverPath)) {
  console.log('✅ Server component found\n');
  passed++;
} else {
  console.log('❌ Server component missing\n');
  failed++;
}

// Test 3: Required files exist
console.log('Test 3: Required files check');
const requiredFiles = ['package.json', 'README.md', 'LICENSE', '.gitignore'];
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing: ${file}`);
    allFilesExist = false;
  }
}
if (allFilesExist) {
  console.log('✅ All required files present\n');
  passed++;
} else {
  console.log('');
  failed++;
}

// Test 4: Examples directory
console.log('Test 4: Examples check');
const examplesPath = path.join(__dirname, '..', 'examples');
if (fs.existsSync(examplesPath) && fs.readdirSync(examplesPath).length > 0) {
  console.log('✅ Examples directory with content\n');
  passed++;
} else {
  console.log('❌ Examples missing or empty\n');
  failed++;
}

// Test 5: Package.json validity
console.log('Test 5: Package.json validation');
try {
  const pkg = require('../package.json');
  if (pkg.name && pkg.version && pkg.bin && pkg.bin.harmonycode) {
    console.log('✅ Valid package.json\n');
    passed++;
  } else {
    console.log('❌ Incomplete package.json\n');
    failed++;
  }
} catch (e) {
  console.log('❌ Invalid package.json\n');
  failed++;
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed === 0) {
  console.log('🎉 All tests passed! Ready to publish.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please fix before publishing.');
  process.exit(1);
}