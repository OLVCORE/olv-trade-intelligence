# 🛡️ SPEC #SAFE-00 — Safe Mode & Proteções de Custo

**Data:** 2025-11-05  
**Status:** ✅ IMPLEMENTADO  
**Commit:** `8da6d39` + hotfixes  
**Autor:** Statutory Builder

---

## 🎯 Objetivo

Implementar um **sistema de proteção completo** contra custos acidentais e gravações não intencionais durante desenvolvimento e diagnóstico, sem alterar regras de negócio.

---

## 🔒 Flags de Proteção

### 1. VITE_SAFE_MODE=1

**Efeito:** Ativa modo de segurança geral

**O que faz:**
- Exibe banner de aviso no canto inferior direito
- Muda cor da SaveBar (amarelo em vez de verde)
- Log de boot detalhado das flags

**Quando usar:** Sempre que estiver diagnosticando ou desenvolvendo

---

### 2. VITE_DISABLE_AUTOSAVE=1

**Efeito:** Desabilita salvamento automático

**O que faz:**
- `scheduleSave()` vira no-op (não agenda)
- `flushSave()` vira no-op (não executa)
- Log de aviso ao iniciar o hook

**Quando usar:** Testar UI da SaveBar sem persistir dados

**Exemplo de log:**
```
[SAFE] ⚠️ Autosave desabilitado para aba 'keywords' — nenhum salvamento automático será executado
[SAFE] ⏸️ Autosave desabilitado — agendamento ignorado para 'keywords'
```

---

### 3. VITE_DISABLE_AUTO_DISCOVERY=1

**Efeito:** Desabilita discovery automático de websites

**O que faz:**
- `handleSmartDiscovery()` retorna early com toast de aviso
- Economiza créditos de APIs (Serper, Hunter, Jina, etc.)
- Discovery manual continua disponível

**Quando usar:** Diagnosticar outras features sem gastar créditos

**Exemplo de toast:**
```
⏸️ Discovery Desabilitado
Auto-discovery está desabilitado para economia de créditos.
Para ativar, remova VITE_DISABLE_AUTO_DISCOVERY do .env.local.
```

---

### 4. VITE_BLOCK_WRITES=1

**Efeito:** Bloqueia TODAS as escritas no Supabase (dry-run total)

**O que faz:**
- `updateFullReport()` retorna payload sem gravar
- Simula sucesso (status 200) sem side-effects
- Maior nível de proteção

**Quando usar:** Auditoria profunda sem risco de corrupção de dados

**Exemplo de log:**
```
[SAFE] 🛡️ BLOCK_WRITES ativo — simulando persistência (no-op)
```

---

### 5. VITE_DEBUG_SAVEBAR=1

**Efeito:** Ativa telemetria detalhada de SaveBar/Autosave

**O que faz:**
- Logs de montagem, props, ciclo de vida
- Grupos organizados no console
- Tabelas de status por aba

**Quando usar:** Diagnosticar problemas de SaveBar/Autosave

**Detalhes:** Ver `SPEC_005_D_DIAGNOSTIC_GUIDE.md`

---

## 📊 Componentes Implementados

### 1. src/lib/flags.ts

Helper centralizado de feature flags.

**Exports:**
```typescript
export const SAFE_MODE: boolean
export const DISABLE_AUTOSAVE: boolean
export const DISABLE_AUTO_DISCOVERY: boolean
export const BLOCK_WRITES: boolean
export const DEBUG_SAVEBAR: boolean

export function flag(name: string, def?: string): string
export function isProtectionActive(): boolean
export function getActiveFlagsReport(): object
export function logFlagsOnBoot(): void
```

**Uso:**
```typescript
import { SAFE_MODE, BLOCK_WRITES } from '@/lib/flags';

if (SAFE_MODE) {
  // modo seguro ativo
}
```

---

### 2. src/components/dev/SafeModeBanner.tsx

Banner de aviso visual no canto inferior direito.

**Características:**
- Fixed position, z-index 9999
- Amarelo/laranja (destaque)
- Expansível (clique para ver detalhes)
- Lista flags ativas

**Renderização condicional:**
```typescript
if (!SAFE_MODE) return null;
```

---

### 3. src/main.tsx

Boot echo ao iniciar a aplicação.

**Log de exemplo:**
```
🛡️ [SAFE MODE] Feature Flags
┌─────────────────────────┬────────┐
│ (index)                 │ Values │
├─────────────────────────┼────────┤
│ safeMode                │ true   │
│ disableAutosave         │ true   │
│ disableAutoDiscovery    │ true   │
│ blockWrites             │ true   │
│ debugSaveBar            │ true   │
└─────────────────────────┴────────┘
```

---

### 4. useReportAutosave.ts

Autosave com bloqueios integrados.

**Proteções:**
- `DISABLE_AUTOSAVE` → scheduleSave/flushSave viram no-op
- `BLOCK_WRITES` → updateFullReport retorna payload sem gravar

**Logs:**
```
[SAFE] ⚠️ Autosave desabilitado para aba 'keywords'
[SAFE] ⏸️ Autosave desabilitado — agendamento ignorado
[SAFE] 🛡️ BLOCK_WRITES ativo — simulando persistência (no-op)
```

---

### 5. SaveBar.tsx

SaveBar com indicações visuais de Safe Mode.

**Mudanças:**
- Cor amarela se `SAFE_MODE` ativo
- Texto "Salvar (Dry-Run)" em vez de "Salvar Relatório"
- Badge "writes bloqueadas" visível
- Fixed position + z-9999 durante diagnóstico (SPEC #005.D.2)

---

### 6. KeywordsSEOTabEnhanced.tsx

Discovery com bloqueio configurável.

**Proteção:**
- `DISABLE_AUTO_DISCOVERY` → handleSmartDiscovery retorna early
- Toast de aviso amigável
- Discovery manual continua disponível

---

## 🚀 Como Usar (Roteiro Completo)

### Passo 1: Ativar Safe Mode

Criar `.env.local` na raiz do projeto:

```bash
# Safe Mode COMPLETO (máxima proteção)
VITE_SAFE_MODE=1
VITE_DISABLE_AUTOSAVE=1
VITE_DISABLE_AUTO_DISCOVERY=1
VITE_BLOCK_WRITES=1
VITE_DEBUG_SAVEBAR=1
```

### Passo 2: Reiniciar servidor

```bash
pnpm dev
```

### Passo 3: Verificar Boot Echo

Console deve mostrar:

```
🛡️ [SAFE MODE] Feature Flags
┌─────────────────────────┬────────┐
│ safeMode                │ true   │
│ disableAutosave         │ true   │
│ disableAutoDiscovery    │ true   │
│ blockWrites             │ true   │
│ debugSaveBar            │ true   │
└─────────────────────────┴────────┘
```

### Passo 4: Validar Indicadores Visuais

- [ ] **Banner amarelo** no canto inferior direito
- [ ] SaveBar com **borda amarela** (se diagnóstico)
- [ ] Botão mostra **"Salvar (Dry-Run)"**
- [ ] Texto **"writes bloqueadas"** visível

### Passo 5: Testar Bloqueios

#### Autosave
1. Editar algo na aba Keywords
2. Console deve mostrar: `[SAFE] ⏸️ Autosave desabilitado — agendamento ignorado`
3. ✅ Nenhuma requisição ao Supabase

#### Discovery
1. Clicar em "Descobrir Website"
2. Toast deve mostrar: "⏸️ Discovery Desabilitado"
3. ✅ Nenhuma API externa chamada (Serper, Hunter, etc.)

#### Writes
1. Clicar em "Salvar Relatório"
2. Console deve mostrar: `[SAFE] 🛡️ BLOCK_WRITES ativo — simulando persistência`
3. ✅ Nenhuma escrita no Supabase

---

## 📈 Métricas de Economia

Com Safe Mode ativo, você economiza:

| Ação Bloqueada | Custo Estimado | Proteção |
|----------------|----------------|----------|
| Autosave (10x/hora) | R$ 0,50/hora | DISABLE_AUTOSAVE |
| Discovery automático | R$ 2,00/consulta | DISABLE_AUTO_DISCOVERY |
| Writes no Supabase | Grátis (mas evita dados ruins) | BLOCK_WRITES |
| **Total/dia** | **~R$ 20/dia** | **SAFE_MODE** |

---

## 🧪 Testes de Validação

### Checklist de Conformidade

- [ ] Boot echo exibe todas as flags
- [ ] Banner amarelo aparece
- [ ] SaveBar tem borda amarela
- [ ] Botão mostra "Dry-Run"
- [ ] Autosave NÃO dispara (log de bloqueio)
- [ ] Discovery NÃO dispara (toast de aviso)
- [ ] Writes NÃO executam (log de no-op)
- [ ] Console sem erros TypeScript/React
- [ ] Network sem requisições bloqueadas

---

## 🔧 Troubleshooting

### ❌ Banner não aparece

**Causa:** Flag `VITE_SAFE_MODE` não está ativa

**Solução:**
1. Verificar `.env.local` contém `VITE_SAFE_MODE=1`
2. Reiniciar servidor (`Ctrl+C` → `pnpm dev`)
3. Verificar boot echo no console

---

### ❌ Autosave ainda dispara

**Causa:** Flag `VITE_DISABLE_AUTOSAVE` não está ativa

**Solução:**
1. Adicionar `VITE_DISABLE_AUTOSAVE=1` no `.env.local`
2. Reiniciar servidor
3. Verificar log: `[SAFE] ⚠️ Autosave desabilitado`

---

### ❌ Discovery ainda executa

**Causa:** Flag `VITE_DISABLE_AUTO_DISCOVERY` não está ativa

**Solução:**
1. Adicionar `VITE_DISABLE_AUTO_DISCOVERY=1` no `.env.local`
2. Reiniciar servidor
3. Verificar toast de aviso ao clicar

---

## 📚 Referências

- **SPEC #005:** SaveBar UI Minimalista (commit `1563a9a`)
- **SPEC #005.D:** Diagnóstico inicial (commit `6ea046e`)
- **SPEC #005.D.1/D.2/D.3:** Hotfixes (commit `8da6d39`)
- **SPEC #SAFE-00:** Este documento (commit atual)

---

## 🏁 Definição de Pronto

Para considerar o Safe Mode **APROVADO**:

1. ✅ Todas as 5 flags implementadas e funcionando
2. ✅ Banner visível quando `SAFE_MODE=1`
3. ✅ Autosave bloqueado quando flag ativa
4. ✅ Discovery bloqueado quando flag ativa
5. ✅ Writes bloqueadas quando flag ativa
6. ✅ Logs organizados e informativos
7. ✅ Zero regressões no comportamento normal (sem flags)
8. ✅ Documentação completa (este arquivo + CONTRIBUTING.md)

---

**Status:** 🟢 COMPLETO — Safe Mode operacional

