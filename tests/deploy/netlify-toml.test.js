// tests/deploy/netlify-toml.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const tomlPath = resolve(__dirname, '../../netlify.toml');
const tomlContent = readFileSync(tomlPath, 'utf-8');

describe('netlify.toml', () => {
  it('should set publish to dist', () => {
    expect(tomlContent).toContain('publish = "dist"');
  });

  it('should set build command to npm run build', () => {
    expect(tomlContent).toContain('command = "npm run build"');
  });

  it('should have SPA redirect for Vue Router', () => {
    expect(tomlContent).toMatch(/from\s*=\s*"\/\*"\s+to\s*=\s*"\/index\.html"\s+status\s*=\s*200/);
  });

  it('should preserve API redirect for send function', () => {
    expect(tomlContent).toContain('/api/send');
    expect(tomlContent).toContain('/.netlify/functions/send');
  });

  it('should preserve functions directory', () => {
    expect(tomlContent).toContain('functions = "netlify/functions"');
  });
});