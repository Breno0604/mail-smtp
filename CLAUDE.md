# PowerShell 5.1 Only — Windows

**ZERO TOLERÂNCIA** para sintaxe bash no PowerShell.

| ❌ NÃO USE | ✅ USE INSTEAD |
|------------|----------------|
| `&&` | `; if ($?) { ... }` |
| `||` | `; if (-not $?) { ... }` |
| `head -n N` | `Select-Object -First N` |
| `grep "pattern"` | `Select-String "pattern"` ou `findstr "pattern"` |
| `chmod +x` | `git update-index --chmod=+x` |
| `timeout N cmd` | Evite; use `Start-Job` se necessário |
| `\` (escape) | `` ` `` (acento grave) |

**Regras obrigatórias:**
- Separador de comandos: `;` (não `&&`/`||`)
- Aspas duplas para interpolação: `"valor $var"`
- Caminhos com espaços: `"C:\caminho\com espaços"`
- Shell: `powershell.exe` (não bash, não zsh)

> Este arquivo é lido automaticamente pelo Claude Code. O opencode usa AGENTS.md — mantenha ambos sincronizados.