#!/usr/bin/env node
console.log('Node starting...');
console.log('PORT:', process.env.PORT);
try {
  require('./dist/src/main.js');
} catch (err) {
  console.error('Failed to load main:', err);
  process.exit(1);
}
