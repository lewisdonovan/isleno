#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../messages');
const enFile = path.join(messagesDir, 'en.json');
const esFile = path.join(messagesDir, 'es.json');

function addTranslation(namespace, key, enValue, esValue) {
  try {
    // Read existing files
    const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const esData = JSON.parse(fs.readFileSync(esFile, 'utf8'));

    // Ensure namespace exists
    if (!enData[namespace]) {
      enData[namespace] = {};
    }
    if (!esData[namespace]) {
      esData[namespace] = {};
    }

    // Add translations
    enData[namespace][key] = enValue;
    esData[namespace][key] = esValue;

    // Write back to files
    fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
    fs.writeFileSync(esFile, JSON.stringify(esData, null, 2));

    console.log(`✅ Added translation: ${namespace}.${key}`);
    console.log(`   EN: ${enValue}`);
    console.log(`   ES: ${esValue}`);
  } catch (error) {
    console.error('❌ Error adding translation:', error.message);
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 4) {
    console.log('Usage: node add-translation.js <namespace> <key> <english> <spanish>');
    console.log('Example: node add-translation.js common save "Save" "Guardar"');
    process.exit(1);
  }

  const [namespace, key, enValue, esValue] = args;
  addTranslation(namespace, key, enValue, esValue);
}

module.exports = { addTranslation }; 