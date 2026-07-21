const mappings = require('./nicks_mappings');
for (const key of Object.keys(mappings)) {
  if (key.startsWith('Utah')) {
    console.log(`${key}: ${mappings[key]}`);
  }
}
