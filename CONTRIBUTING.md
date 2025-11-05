# 🎯 Guia de Contribuição — OLV Intelligence Prospect v2

**Última atualização:** 2025-11-05  
**Versão:** 1.0.0

---

## 🛡️ Regras Operacionais (Guardrails)

### Regra 1: Não alterar regras de negócio sem SPEC assinada

❌ **PROIBIDO:**
- Modificar lógica de cálculo (score, weight, confidence)
- Alterar fluxos de aprovação/rejeição
- Mudar estrutura de dados do Supabase
- Adicionar/remover campos de formulários

✅ **PERMITIDO:**
- Telemetria e logs (guardados por flags)
- Refatoração sem mudança de comportamento
- Correção de bugs documentados
- Melhorias de UI/UX aprovadas

**Processo:**
1. Abrir issue descrevendo a necessidade
2. Criar SPEC (docs/specs/SPEC_XXX.md)
3. Aguardar aprovação (tech lead ou PO)
4. Implementar com referência à SPEC no commit

---

### Regra 2: Sempre mostrar diffs antes de escrever

❌ **PROIBIDO:**
- Commits sem review de diffs
- "Trust me, I know what I'm doing"
- Mudanças em lote sem auditoria

✅ **OBRIGATÓRIO:**
```bash
# Antes de commitar
git diff

# Ou filtrado por arquivo
git diff src/components/totvs/SaveBar.tsx

# Ou usando ferramentas visuais
git difftool
```

**Processo:**
1. Fazer mudanças localmente
2. Revisar diffs linha por linha
3. Testar no navegador (console + network)
4. Commitar com mensagem estruturada

---

### Regra 3: Mudanças fora dos arquivos listados no SPEC = rejeitar

**Exemplo de SPEC válida:**

```markdown
## Arquivos Modificados

- src/components/totvs/SaveBar.tsx
- src/components/icp/tabs/useReportAutosave.ts
- src/lib/flags.ts (novo)
```

❌ **REJEITAR** se commits incluem arquivos não listados (exceto: docs, testes)

✅ **ACEITAR** apenas mudanças nos arquivos declarados

**Exceções permitidas:**
- Adicionar testes (`*.test.tsx`, `*.spec.ts`)
- Atualizar documentação (`*.md`)
- Adicionar tipos (`*.d.ts`)

---

### Regra 4: Se houver erro no console/Network, travar SPEC e emitir Hotfix

**Gatilhos de bloqueio:**

| Erro | Ação | Exemplo |
|------|------|---------|
| TypeScript error | ❌ BLOQUEAR | `Property 'x' does not exist` |
| Linter error | ⚠️ AVISAR | `Unused variable` |
| Console error | ❌ BLOQUEAR | `Cannot read property of undefined` |
| Network 4xx/5xx | ❌ BLOQUEAR | `401 Unauthorized`, `500 Internal` |
| React warning | ⚠️ AVISAR | `Keys should be unique` |

**Processo de Hotfix:**
1. Identificar causa raiz (debugging)
2. Criar SPEC Hotfix (ex: `SPEC_005_D_1_SaveBar_Fix.md`)
3. Documentar: **Causa → Impacto → Solução**
4. Implementar correção mínima
5. Validar com testes
6. Commit com referência ao Hotfix

---

## 🔒 Safe Mode (SPEC #SAFE-00)

Durante diagnóstico e desenvolvimento, use Safe Mode para evitar custos acidentais:

### Ativar Safe Mode

Criar/editar `.env.local`:

```bash
VITE_SAFE_MODE=1
VITE_DISABLE_AUTOSAVE=1
VITE_DISABLE_AUTO_DISCOVERY=1
VITE_BLOCK_WRITES=1
VITE_DEBUG_SAVEBAR=1
```

### Proteções Ativas

| Flag | Efeito | Uso |
|------|--------|-----|
| `VITE_SAFE_MODE` | Ativa banner de aviso | Sempre ativar em diagnóstico |
| `VITE_DISABLE_AUTOSAVE` | Bloqueia autosave automático | Testar SaveBar sem persistência |
| `VITE_DISABLE_AUTO_DISCOVERY` | Bloqueia discovery automático | Economizar créditos de APIs |
| `VITE_BLOCK_WRITES` | Bloqueia TODAS as escritas no Supabase | Dry-run total |
| `VITE_DEBUG_SAVEBAR` | Ativa telemetria detalhada | Debugging de SaveBar/Autosave |

### Indicadores Visuais

- **Banner amarelo** no canto inferior direito
- **SaveBar com borda amarela** (diagnóstico)
- **Botão "Salvar (Dry-Run)"** em vez de "Salvar Relatório"
- **Texto "writes bloqueadas"** visível

---

## 📝 Padrão de Commits

### Conventional Commits

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**Types permitidos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração sem mudança de comportamento
- `test`: Adicionar/modificar testes
- `chore`: Manutenção (deps, config)
- `perf`: Performance
- `style`: Formatação (não muda lógica)

**Scopes recomendados:**
- `savebar`, `autosave`, `pipeline`, `quarantine`, `icp`, `discovery`, `totvs`

**Exemplos:**

```bash
# Feature com SPEC
git commit -m "feat(savebar): SPEC #005 barra fixa de acoes criticas"

# Hotfix
git commit -m "fix(autosave): SPEC #005.D.1 helpers centralizados de telemetria"

# Documentação
git commit -m "docs: adicionar CONTRIBUTING.md com guardrails"

# Refatoração
git commit -m "refactor(flags): centralizar feature flags em lib/flags.ts"
```

---

## 🧪 Testes Obrigatórios

Antes de commitar, execute:

### 1. Lint
```bash
pnpm lint
```

### 2. Type Check
```bash
pnpm tsc --noEmit
```

### 3. Build
```bash
pnpm build
```

### 4. Teste Manual (Checklist)

- [ ] Console sem erros TypeScript/React
- [ ] Network sem erros 4xx/5xx (exceto esperados)
- [ ] UI renderiza corretamente
- [ ] Funcionalidade principal testada
- [ ] Safe Mode testado (se aplicável)

---

## 🔍 Processo de Code Review

### Self-Review (antes de commitar)

1. **Ler o diff completo:** `git diff`
2. **Validar formatação:** `pnpm lint`
3. **Testar no navegador:** F12 → Console + Network
4. **Verificar SPEC:** Todos arquivos listados?
5. **Validar commit message:** Segue Conventional Commits?

### Peer Review (antes de merge)

1. Verificar se SPEC foi seguida
2. Testar localmente (pull + test)
3. Validar que não há regressões
4. Aprovar ou solicitar mudanças

---

## 📚 Estrutura de Documentação

```
/
├── docs/
│   ├── specs/              # SPECs individuais
│   │   ├── SPEC_001_Autosave.md
│   │   ├── SPEC_005_SaveBar.md
│   │   └── SPEC_SAFE_00_SafeMode.md
│   ├── adrs/               # Architecture Decision Records
│   │   ├── 001-why-vite.md
│   │   └── 002-why-supabase.md
│   └── playbooks/          # Guias operacionais
│       ├── deployment.md
│       └── debugging.md
├── CONTRIBUTING.md         # Este arquivo
├── CHANGELOG.md            # Histórico de mudanças
└── README.md               # Visão geral do projeto
```

---

## 🚫 Anti-Patterns (Evitar)

### ❌ Commits sem contexto

```bash
git commit -m "fix"
git commit -m "update"
git commit -m "wip"
```

### ❌ Mudanças massivas sem SPEC

```bash
# 50 arquivos modificados sem documentação
git add .
git commit -m "refactor everything"
```

### ❌ Código comentado em produção

```typescript
// const oldFunction = () => { ... }; // DELETAR
// TODO: fix this later // CRIAR ISSUE
```

### ❌ Console.log em produção (sem guards)

```typescript
console.log('debug info'); // ❌
```

**Correto:**
```typescript
if (isDiagEnabled()) {
  dlog('Component', 'debug info'); // ✅
}
```

---

## ✅ Best Practices

### 1. Sempre usar helpers centralizados

```typescript
// ❌ Evitar
if (import.meta.env.VITE_SAFE_MODE === '1') { ... }

// ✅ Usar
import { SAFE_MODE } from '@/lib/flags';
if (SAFE_MODE) { ... }
```

### 2. Telemetria com guards

```typescript
// ❌ Evitar
console.log('[DEBUG]', data);

// ✅ Usar
if (isDiagEnabled()) {
  dlog('Component', 'event', data);
}
```

### 3. Commits atômicos

Cada commit deve:
- Resolver 1 problema específico
- Ser reversível isoladamente
- Ter mensagem descritiva
- Incluir testes (quando aplicável)

---

## 🔄 Workflow Recomendado

### Feature Branch

```bash
# Criar branch
git checkout -b feat/spec-007-keywords-refinement

# Implementar com commits atômicos
git commit -m "feat(keywords): SPEC #007 adicionar filtro de relevancia"
git commit -m "test(keywords): adicionar testes do filtro"
git commit -m "docs: atualizar SPEC #007 com exemplos"

# Push
git push origin feat/spec-007-keywords-refinement

# Pull Request (GitHub/GitLab)
# Code review → Merge
```

### Hotfix

```bash
# Criar branch de hotfix
git checkout -b hotfix/savebar-z-index

# Fix
git commit -m "fix(savebar): SPEC #005.D.2 ajustar z-index para 9999"

# Merge direto na main (após review rápido)
```

---

## 🧹 Limpeza de Código

### Antes de commitar, verificar:

- [ ] Imports não utilizados removidos
- [ ] Console.logs de debug removidos (ou guardados)
- [ ] Código comentado removido
- [ ] TODOs convertidos em issues
- [ ] Formatação consistente (Prettier)

### Ferramentas

```bash
# Auto-fix de lint
pnpm lint --fix

# Formatar código
pnpm format  # (se configurado)
```

---

## 📞 Suporte

**Dúvidas sobre:**
- SPECs → consultar `docs/specs/`
- Arquitetura → consultar `docs/adrs/`
- Debugging → consultar `SPEC_005_D_DIAGNOSTIC_GUIDE.md`
- Safe Mode → consultar `SPEC_SAFE_00.md`

**Processo de escalação:**
1. Consultar documentação
2. Buscar no histórico de commits (`git log --grep`)
3. Abrir issue no GitHub
4. Consultar tech lead

---

## ✅ Checklist Final (Antes de Push)

- [ ] Código lintado (`pnpm lint`)
- [ ] Type check passou (`pnpm tsc --noEmit`)
- [ ] Build funciona (`pnpm build`)
- [ ] Testes manuais executados
- [ ] SPEC seguida (arquivos corretos)
- [ ] Commit message válida (Conventional Commits)
- [ ] Documentação atualizada (se aplicável)
- [ ] Safe Mode testado (se aplicável)
- [ ] Zero regressões visuais/funcionais

---

**Autor:** Statutory Builder + Claude Sonnet 4.5  
**Data:** 2025-11-05  
**Versão:** 1.0.0

