# ✅ SPEC #005.D.1/D.2/D.3 — Hotfixes de Diagnóstico Implementados

**Commit:** `8da6d39`  
**Data:** 2025-11-05  
**Status:** 🟢 COMPLETO

---

## 📊 Resumo das Melhorias

Três hotfixes críticos para otimizar o diagnóstico da SaveBar e Autosave:

| Hotfix | Descrição | Benefício |
|--------|-----------|-----------|
| **#005.D.1** | Helpers centralizados + Boot Echo | Parse robusto de flags + logs organizados |
| **#005.D.2** | SaveBar fixa durante diagnóstico | Sempre visível (z-index 9999) |
| **#005.D.3** | Noise Suppressor | Desabilita auto-discovery (reduz ruído) |

---

## 🔧 SPEC #005.D.1 — Force Enable Telemetry + Boot Echo

### ✅ O que foi implementado

#### 1) Helpers Centralizados (`src/lib/diag.ts`)

```typescript
export function isDiagEnabled(): boolean
export function dlog(scope: string, ...args: any[])
export function dwarn(scope: string, ...args: any[])
export function dgroup(scope: string, label?: string)
export function dgroupEnd()
export function dtable(data: any)
```

**Benefícios:**
- Parse robusto da flag (aceita: `1`, `true`, `on`, `yes`)
- Logs organizados por scope (`[DIAG][SaveBar]`, `[DIAG][Autosave/keywords]`)
- Fácil manutenção (mudar apenas 1 arquivo)

#### 2) Boot Echo (`src/main.tsx`)

```typescript
console.log('[DIAG][BOOT] VITE_DEBUG_SAVEBAR =', ...);
console.log('[DIAG][BOOT] VITE_DISABLE_AUTO_DISCOVERY =', ...);
```

**Benefício:**
- Confirma imediatamente se flags estão ativas ao carregar o app

#### 3) Refatoração de Componentes

Todos os componentes agora usam os helpers:

- ✅ `TOTVSCheckCard.tsx` → `dlog`, `dgroup`, `dtable`
- ✅ `SaveBar.tsx` → `dlog`, `dgroup`, `dgroupEnd`
- ✅ `useReportAutosave.ts` → `dlog`, `dwarn`
- ✅ `tabsRegistry.ts` → `dlog`, `dwarn`, `dgroup`
- ✅ `TabIndicator.tsx` → `dlog`

**Antes:**
```typescript
if (import.meta.env.VITE_DEBUG_SAVEBAR) {
  console.log("[DIAG][SaveBar]", ...);
}
```

**Depois:**
```typescript
if (isDiagEnabled()) {
  dlog('SaveBar', ...);
}
```

---

## 🎯 SPEC #005.D.2 — SafeBar (fixo durante diagnóstico)

### ✅ O que foi implementado

#### 1) Position Fixed com Z-Index Máximo

**Classe CSS dinâmica:**

```typescript
const wrapperClass = diag
  ? "fixed inset-x-0 top-0 z-[9999] border-b-2 border-yellow-500/70 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-md shadow-2xl"
  : "sticky top-0 z-40 border-b-2 border-slate-700/70 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-md shadow-lg";
```

**Diferenças:**
- **Produção:** `sticky` + `z-40` (normal)
- **Diagnóstico:** `fixed` + `z-[9999]` + **borda amarela** (destaque)

#### 2) Body Padding-Top Automático

```typescript
useEffect(() => {
  if (!diag) return;
  const prev = document.body.style.paddingTop;
  document.body.style.paddingTop = '80px';
  return () => { document.body.style.paddingTop = prev; };
}, [diag]);
```

**Benefícios:**
- SaveBar sempre visível (não some por stacking context)
- Não cobre conteúdo (padding-top compensa altura da barra)
- Borda amarela indica modo diagnóstico ativo
- Z-index 9999 garante prioridade sobre modals/toasts

---

## 🔇 SPEC #005.D.3 — Noise Suppressor

### ✅ O que foi implementado

Flag `VITE_DISABLE_AUTO_DISCOVERY=1` desabilita auto-discovery durante diagnóstico.

**Implementação em `KeywordsSEOTabEnhanced.tsx`:**

```typescript
const handleSmartDiscovery = () => {
  const disableAutoDiscovery = String((import.meta as any)?.env?.VITE_DISABLE_AUTO_DISCOVERY ?? '').trim().toLowerCase();
  const isDiscoveryDisabled = ['1','true','on','yes'].includes(disableAutoDiscovery);
  
  if (isDiscoveryDisabled) {
    console.info('[DISCOVERY] ⏸️ Auto discovery desabilitado em dev (diagnóstico SPEC #005.D.3)');
    toast({
      title: '⏸️ Discovery Desabilitado',
      description: 'Auto-discovery está desabilitado (VITE_DISABLE_AUTO_DISCOVERY=1).',
      duration: 5000
    });
    return;
  }
  
  // ... resto do código
};
```

**Benefícios:**
- Reduz ruído de logs durante diagnóstico da SaveBar
- Evita consumo desnecessário de créditos de APIs (Serper, Hunter, etc.)
- Foco total no fluxo SaveBar → Autosave

---

## 🚀 Como Usar

### 1️⃣ Criar `.env.local`

```bash
# Diagnóstico COMPLETO (3 hotfixes)
VITE_DEBUG_SAVEBAR=1
VITE_DISABLE_AUTO_DISCOVERY=1
```

**Variações aceitas:**
```bash
VITE_DEBUG_SAVEBAR=true    # ✅
VITE_DEBUG_SAVEBAR=on      # ✅
VITE_DEBUG_SAVEBAR=yes     # ✅
VITE_DEBUG_SAVEBAR=1       # ✅
```

### 2️⃣ Iniciar o servidor

```bash
pnpm dev
```

### 3️⃣ Verificar Boot Echo

Ao carregar o app, você deve ver no console:

```
[DIAG][BOOT] VITE_DEBUG_SAVEBAR = 1
[DIAG][BOOT] VITE_DISABLE_AUTO_DISCOVERY = 1
```

✅ Se aparecer, as flags estão ATIVAS  
❌ Se não aparecer ou mostrar `undefined`, verifique o `.env.local`

### 4️⃣ Observar SaveBar

Com diagnóstico ativo:
- SaveBar terá **borda amarela** (2px, destaque)
- SaveBar ficará **fixada** no topo (não some ao rolar)
- Body terá **padding-top de 80px** (não cobre conteúdo)

### 5️⃣ Observar Logs Organizados

Os logs agora aparecem estruturados:

```
[DIAG][TOTVSCheckCard] SaveBar props
  props.readOnly: false
  props.isSaving: false
  ...

[DIAG][SaveBar] mount/update
  readOnly: false | isSaving: false
  ...

[DIAG][Autosave/keywords] init { ... }
[DIAG][Autosave/keywords] scheduleSave { ... }
[DIAG][Autosave/keywords] persist:success { ... }

[DIAG][tabsRegistry] registered: keywords | total: 1
[DIAG][tabsRegistry] saveAllTabs
  registered tabs: ['keywords']
  ...
```

### 6️⃣ Testar Discovery Desabilitado

1. Vá para a aba **Keywords**
2. Clique em "🚀 Descobrir Website & Presença Digital Completa"
3. Você verá o toast:

```
⏸️ Discovery Desabilitado
Auto-discovery está desabilitado (VITE_DISABLE_AUTO_DISCOVERY=1).
```

4. Para testar o discovery, remova a flag do `.env.local` e reinicie o servidor

---

## 📋 Arquivos Modificados

```
src/lib/diag.ts                                 (NOVO - 47 linhas)
src/main.tsx                                    (+7 linhas)
src/components/totvs/TOTVSCheckCard.tsx         (+2 imports, refatoração)
src/components/totvs/SaveBar.tsx                (+23 linhas)
src/components/icp/tabs/useReportAutosave.ts    (refatoração)
src/components/icp/tabs/tabsRegistry.ts         (refatoração)
src/components/icp/tabs/TabIndicator.tsx        (refatoração)
src/components/icp/tabs/KeywordsSEOTabEnhanced.tsx (+18 linhas)
```

**Total:** +159 linhas adicionadas, -55 linhas removidas (refatoração)

---

## 📊 Métricas de Qualidade

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Arquivos com telemetria** | 5 | 6 (+1: diag.ts) |
| **Código duplicado** | Sim (guards repetidos) | Não (helpers centralizados) |
| **Parse de flags** | Frágil (`import.meta.env`) | Robusto (aceita 4 formatos) |
| **SaveBar visível** | ⚠️ Pode sumir (stacking context) | ✅ Sempre visível (fixed + z-9999) |
| **Ruído de logs** | Alto (discovery + autosave) | Baixo (discovery opcional) |
| **Manutenibilidade** | Média | Alta (1 arquivo central) |

---

## ✅ Checklists de Validação

### Visual (SaveBar)

- [ ] **Borda amarela** visível no topo?
- [ ] SaveBar **fixa** (não some ao rolar)?
- [ ] Conteúdo **não coberto** (padding-top ativo)?
- [ ] Z-index **dominante** (sobre modals/toasts)?

### Boot Echo

- [ ] Console mostra `[DIAG][BOOT]` ao iniciar?
- [ ] Valor da flag `VITE_DEBUG_SAVEBAR` está correto?
- [ ] Valor da flag `VITE_DISABLE_AUTO_DISCOVERY` está correto?

### Logs Organizados

- [ ] Logs com prefixo `[DIAG][scope]`?
- [ ] Logs em grupos (`console.group`)?
- [ ] Tabelas formatadas (`console.table`)?

### Noise Suppressor

- [ ] Discovery bloqueado quando flag ativa?
- [ ] Toast de aviso exibido?
- [ ] Discovery funciona quando flag desabilitada?

---

## 🔧 Troubleshooting

### ❌ Boot Echo não aparece

**Causa:** `.env.local` não está sendo lido

**Solução:**
1. Verificar se o arquivo está na raiz do projeto
2. Verificar se o nome é exatamente `.env.local` (não `.env`)
3. Reiniciar o servidor (`Ctrl+C` → `pnpm dev`)

### ❌ SaveBar não tem borda amarela

**Causa:** Flag não está ativa ou valor incorreto

**Solução:**
1. Verificar `[DIAG][BOOT]` no console
2. Testar valores aceitos: `1`, `true`, `on`, `yes`
3. Verificar se não há espaços extras no `.env.local`

### ❌ Discovery ainda dispara

**Causa:** Flag `VITE_DISABLE_AUTO_DISCOVERY` não está ativa

**Solução:**
1. Adicionar `VITE_DISABLE_AUTO_DISCOVERY=1` no `.env.local`
2. Reiniciar o servidor
3. Verificar `[DIAG][BOOT]` confirma o valor

### ❌ Logs não aparecem

**Causa:** Flag `VITE_DEBUG_SAVEBAR` não está ativa

**Solução:**
1. Verificar `.env.local` existe e contém `VITE_DEBUG_SAVEBAR=1`
2. Verificar `[DIAG][BOOT]` confirma o valor
3. Limpar cache do navegador (`Ctrl+Shift+R`)

---

## 🎯 Próximos Passos

1. ✅ Ativar as 2 flags no `.env.local`
2. ✅ Reiniciar o servidor
3. ✅ Verificar Boot Echo
4. ✅ Testar cenário completo:
   - Keywords → editar → autosave
   - Trocar de aba → voltar
   - Salvar Relatório
5. ✅ Coletar evidências (5 artefatos do SPEC #005.D)
6. ✅ Validar checklists
7. ✅ Desativar diagnóstico (remover flags)
8. ✅ Liberar SPEC #007

---

## 📚 Referências

- **SPEC #005:** SaveBar UI Minimalista (commit `1563a9a`)
- **SPEC #005.D:** Diagnóstico inicial (commit `6ea046e`)
- **SPEC #005.D.1/D.2/D.3:** Este hotfix (commit `8da6d39`)

---

## 🏁 Status Final

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ✅ SPEC #005.D.1/D.2/D.3 — HOTFIXES COMPLETOS              ║
║                                                              ║
║  📦 Commit: 8da6d39                                         ║
║  📊 8 arquivos modificados (+159/-55 linhas)                ║
║  🔧 3 hotfixes implementados                                ║
║  📚 1 helper library criada (diag.ts)                       ║
║  🎯 SaveBar 100% visível durante diagnóstico                ║
║  🔇 Noise suppressor ativo                                  ║
║  🚀 Pronto para diagnóstico otimizado                       ║
║                                                              ║
║  ⏭️  Próximo: Coletar evidências e liberar SPEC #007       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Data:** 2025-11-05  
**Versão:** 1.0.0  
**Status:** 🟢 ATIVO - Aguardando teste do usuário

