# Guia de Contribuição — OLV Intelligence Prospect v2

Este documento estabelece as **regras operacionais** para desenvolvimento com governança e conformidade.

---

## 🎯 Princípios Fundamentais

### Regra 1: Não alterar regras de negócio sem SPEC assinada

✅ **Permitido:**
- Correções de bugs documentados
- Melhorias de performance sem mudança de comportamento
- Refatoração com testes aprovados
- Telemetria e diagnóstico (protegido por flags)

❌ **Proibido:**
- Mudanças em lógica de negócio sem SPEC
- Alterações em cálculos/algoritmos sem validação
- Remoção de validações existentes
- Bypass de guardrails de segurança

### Regra 2: Sempre mostrar diffs antes de escrever

✅ **Fluxo correto:**
1. Ler o arquivo atual (`read_file`)
2. Propor mudanças com diff visível
3. Aguardar aprovação do revisor
4. Aplicar mudanças
5. Verificar lints (`read_lints`)
6. Commit com mensagem estruturada

❌ **Proibido:**
- Modificar arquivos sem mostrar o que muda
- "Confie em mim, está certo"
- Commits sem revisar diff

### Regra 3: Mudanças fora dos arquivos listados no SPEC = rejeitar

Cada SPEC deve listar **explicitamente** os arquivos que serão modificados.

✅ **Exemplo (SPEC #005.D):**
```
Arquivos a modificar:
- src/components/totvs/SaveBar.tsx
- src/components/icp/tabs/useReportAutosave.ts
- src/lib/diag.ts (NOVO)
```

❌ **Rejeitar se:**
- Arquivo modificado não está na lista
- "Só um ajuste rápido em..."
- Modificações "de passagem"

**Exceções permitidas:**
- Arquivos de documentação (`.md`)
- Arquivos de configuração de CI/CD
- Testes relacionados

### Regra 4: Se houver erro no console/Network, travar SPEC e emitir Hotfix

✅ **Processo:**
1. Detectar erro no console ou Network Tab
2. **PARAR** implementação do SPEC atual
3. Emitir **SPEC Hotfix #XXX.Y** com:
   - **Causa raiz** do erro
   - **Impacto** (bloqueante? crítico? menor?)
   - **Solução cirúrgica** (diff mínimo)
4. Aplicar hotfix
5. Validar erro corrigido
6. Retomar SPEC original

❌ **Proibido:**
- "Vou corrigir e continuar..."
- Corrigir erro sem documentar
- Ignorar warnings que podem virar erros

---

## 🔒 Modo Seguro (SAFE MODE)

Durante diagnósticos ou desenvolvimento que não deve gerar custos:

### Flags de Proteção

Criar `.env.local` com:

```bash
# Modo seguro completo (sem custos)
VITE_SAFE_MODE=1
VITE_DISABLE_AUTOSAVE=1
VITE_DISABLE_AUTO_DISCOVERY=1
VITE_BLOCK_WRITES=1

# Diagnóstico (telemetria extra)
VITE_DEBUG_SAVEBAR=1
```

### Comportamentos em SAFE MODE

| Flag | Comportamento |
|------|---------------|
| `SAFE_MODE=1` | Ativa banner visual + combina todas as proteções |
| `DISABLE_AUTOSAVE=1` | `scheduleSave` e `flushSave` viram no-op |
| `DISABLE_AUTO_DISCOVERY=1` | Discovery só roda com clique manual |
| `BLOCK_WRITES=1` | Supabase writes retornam simulação de sucesso |
| `DEBUG_SAVEBAR=1` | Logs detalhados de SaveBar e Autosave |

### Validação Visual

Com SAFE MODE ativo, você verá:
- 🟡 **Banner amarelo** fixo no canto inferior direito
- 🟡 **Borda amarela** na SaveBar (em vez de cinza)
- 🟡 **Botão "Salvar (Dry-Run)"** (em vez de "Salvar Relatório")
- 🟡 **Texto "writes bloqueadas"** ao lado do botão

---

## 📋 Checklist de Desenvolvimento

Antes de cada commit:

- [ ] **Lint:** `pnpm lint` sem erros
- [ ] **Type check:** `pnpm tsc --noEmit` sem erros
- [ ] **Diff revisado:** Todas as mudanças fazem sentido?
- [ ] **SPEC documentada:** Mudanças estão em uma SPEC?
- [ ] **Console limpo:** Sem erros no browser console?
- [ ] **Network limpo:** Sem 4xx/5xx em requisições?
- [ ] **Safe mode testado:** Com e sem flags?

---

## 🏗️ Estrutura de Projeto

```
/docs/
├── specs/           # SPECs individuais (SPEC_001.md, SPEC_002.md, etc.)
├── adrs/            # Architecture Decision Records
└── playbooks/       # Guias operacionais

/src/
├── components/
├── lib/
│   ├── diag.ts      # Helpers de diagnóstico
│   ├── flags.ts     # Feature flags centralizadas
│   └── api/
│       └── supabaseClient.ts  # Wrapper guardado
├── services/        # Lógica de negócio
└── pages/           # Páginas da aplicação
```

---

## 🚀 Workflow de SPECs

### 1. Planejamento

```markdown
# SPEC #XXX — Título da Mudança

## Objetivo
O que será implementado e por quê

## Arquivos a modificar
- src/components/X.tsx
- src/services/Y.ts

## Critérios de aceite
- [ ] Funcionalidade X funciona
- [ ] Console sem erros
- [ ] Network sem 4xx/5xx
```

### 2. Implementação

```bash
# Criar branch (opcional)
git checkout -b spec-xxx

# Desenvolver com safe mode
echo "VITE_SAFE_MODE=1" >> .env.local

# Revisar diffs antes de commitar
git diff

# Commit estruturado
git commit -m "SPEC #XXX: Titulo conciso

Detalhes da implementação
- Mudança 1
- Mudança 2

Refs: SPEC-XXX"
```

### 3. Validação

```bash
# Lint
pnpm lint

# Type check
pnpm tsc --noEmit

# Build (se aplicável)
pnpm build

# Teste manual no navegador
# - Console limpo?
# - Network limpo?
# - UX funciona?
```

### 4. Merge

```bash
# Push para revisão
git push origin spec-xxx

# Após aprovação
git checkout master
git merge spec-xxx
git push origin master
```

---

## 🧪 Testes

### Manuais (obrigatórios)

Para cada SPEC:
1. Testar com SAFE_MODE ativo (sem custos)
2. Testar sem SAFE_MODE (comportamento real)
3. Verificar console (F12)
4. Verificar Network Tab
5. Testar em Chrome E Edge (mínimo)

### Automatizados (recomendados)

```typescript
// src/components/__tests__/SaveBar.test.tsx
import { render, screen } from '@testing-library/react';
import SaveBar from '../SaveBar';

describe('SaveBar', () => {
  it('should show dry-run when SAFE_MODE active', () => {
    // Mock da flag
    vi.stubEnv('VITE_SAFE_MODE', '1');
    
    render(<SaveBar statuses={{}} onSaveAll={vi.fn()} onApprove={vi.fn()} />);
    
    expect(screen.getByText(/dry-run/i)).toBeInTheDocument();
  });
});
```

---

## 🚫 Anti-Patterns

### ❌ NÃO faça

```typescript
// Mudança sem SPEC
function calculateICP(data) {
  // "Só vou melhorar o algoritmo rapidinho..."
  return data.score * 1.5; // 🚨 REGRESSÃO!
}

// Write direto sem guardrail
supabase.from('companies').update({ ... }); // 🚨 CUSTO!

// Commit vago
git commit -m "fix stuff"  // 🚨 SEM CONTEXTO!
```

### ✅ FAÇA

```typescript
// Com SPEC e telemetria
function calculateICP(data) {
  if (isDiagEnabled()) {
    dlog('ICP', 'calculateICP input', data);
  }
  
  const score = data.score * 1.2; // SPEC #123: Ajuste de peso
  
  if (isDiagEnabled()) {
    dlog('ICP', 'calculateICP output', score);
  }
  
  return score;
}

// Write guardado
guardedWrite(() => 
  supabase.from('companies').update({ ... })
);

// Commit estruturado
git commit -m "fix(icp): SPEC #123 ajuste de peso do score

- Mudança de multiplicador 1.0 → 1.2
- Motivo: alinhamento com benchmarks
- Refs: SPEC-123"
```

---

## 📞 Contatos / Suporte

**Maintainer:** Statutory Builder  
**Stack:** React 18 + TypeScript + Vite + Supabase  
**Deploy:** Vercel  
**Documentação:** `/docs/`

---

## 📚 Referências

- [SPEC #001](docs/specs/SPEC_001.md) — Autosave
- [SPEC #005](docs/specs/SPEC_005.md) — SaveBar
- [SPEC #005.D](SPEC_005_D_DIAGNOSTIC_GUIDE.md) — Diagnóstico
- [ORDEM #SAFE-00](SPEC_SAFE_00_OPERATIONAL_ORDER.md) — Modo Seguro

---

**Versão:** 1.0.0  
**Última atualização:** 2025-11-05  
**Status:** ✅ Ativo
