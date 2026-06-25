// cleanup.mjs — Remove arquivos mortos do projeto
// Execute com: node cleanup.mjs

import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = [
  'vite.config.js',
  'vite.config.d.ts',
  'tsconfig.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
];

files.forEach(f => {
  const fullPath = join(__dirname, f);
  if (existsSync(fullPath)) {
    try {
      unlinkSync(fullPath);
      console.log(`✅ Removido: ${f}`);
    } catch (err) {
      console.error(`❌ Erro ao remover ${f}: ${err.message}`);
    }
  } else {
    console.log(`⚠️  Não encontrado: ${f} (já foi removido?)`);
  }
});

console.log('\n🗑️  Limpeza concluída.');
