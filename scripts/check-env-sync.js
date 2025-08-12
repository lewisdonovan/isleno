#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envExamplePath = path.resolve(__dirname, '../.env.example');
const turboJsonPath = path.resolve(__dirname, '../turbo.json');

function parseEnvExample(file) {
  return fs.readFileSync(file, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => line.split('=')[0]);
}

function parseTurboGlobalEnv(file) {
  const turbo = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return turbo.globalEnv || [];
}

const envVars = parseEnvExample(envExamplePath);
const turboVars = parseTurboGlobalEnv(turboJsonPath);

const missingInEnv = turboVars.filter(v => !envVars.includes(v));
const missingInTurbo = envVars.filter(v => !turboVars.includes(v));

let hasError = false;
if (missingInEnv.length) {
  console.error('❌ These variables are in turbo.json globalEnv but missing from .env.example:', missingInEnv);
  hasError = true;
}
if (missingInTurbo.length) {
  console.warn('⚠️  These variables are in .env.example but missing from turbo.json globalEnv (this is allowed for documentation, but consider cleaning up):', missingInTurbo);
}
if (hasError) {
  process.exit(1);
} else {
  console.log('✅ turbo.json globalEnv and .env.example are in sync!');
} 