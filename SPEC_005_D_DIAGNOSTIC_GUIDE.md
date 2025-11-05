# SPEC #005.D — Guia de Diagnóstico da SaveBar e Autosave

**Data de implementação:** 2025-11-05  
**Status:** ✅ Instrumentação completa  
**Modo:** Não destrutivo (telemetria temporária)

---

## 📊 Resumo da Instrumentação

Foram instrumentados **5 componentes críticos** com telemetria de diagnóstico:

1. ✅ `TOTVSCheckCard.tsx` — Validação de props da SaveBar
2. ✅ `SaveBar.tsx` — Ciclo de vida e derivação de agregados
3. ✅ `useReportAutosave.ts` — Eventos de autosave (schedule, flush, persist)
4. ✅ `tabsRegistry.ts` — Registro de abas e salvamento em lote
5. ✅ `TabIndicator.tsx` — Coerência visual de status

**Todos os logs são guardados pela flag:** `VITE_DEBUG_SAVEBAR=1`

---

## 🚀 Como Ativar o Diagnóstico

### Passo 1: Criar/editar `.env.local`

Adicione a flag de diagnóstico:

```bash
# Diagnóstico SPEC #005.D - SaveBar & Autosave
VITE_DEBUG_SAVEBAR=1
```

### Passo 2: Reiniciar o servidor de desenvolvimento

```bash
pnpm dev
```

### Passo 3: Abrir o Console do DevTools

1. Abra o navegador (Chrome/Edge recomendado)
2. Pressione `F12` para abrir DevTools
3. Vá para a aba **Console**
4. Ative filtros para `[DIAG]` se necessário

---

## 🔍 Roteiro de Teste (Cenário Completo)

Execute este cenário para coletar todos os artefatos necessários:

### 1️⃣ Navegação inicial

1. **Acesse o relatório ICP** de uma empresa com `stcHistoryId` conhecido
2. **Observe no console** os logs iniciais:
   - `[DIAG][TOTVSCheckCard] SaveBar props` → valida montagem
   - `[DIAG][SaveBar] mount/update` → confirma renderização
   - `[DIAG][tabsRegistry]` → lista abas registradas

### 2️⃣ Interação na aba Keywords

1. **Vá para a aba "Keywords"**
2. **Observe no console:**
   - `[DIAG][Autosave][keywords] init` → hook inicializado
   - `[DIAG][tabsRegistry] registered: keywords` → aba registrada

3. **Execute uma ação** (ex: clicar em "Descobrir Website")
4. **Observe a sequência:**
   - `[DIAG][Autosave][keywords] scheduleSave` → agendamento do debounce
   - `[DIAG][Autosave][keywords] persist:start` → início da persistência
   - `[DIAG][Autosave][keywords] persist:success` → sucesso no Supabase
   - `[DIAG][SaveBar] mount/update` → atualização dos status

### 3️⃣ Navegação entre abas

1. **Troque para outra aba** (ex: "Competitors")
2. **Observe:**
   - `[DIAG][Autosave][keywords] flushSave:immediate` → salvamento imediato
   - `[DIAG][tabsRegistry] registered: competitors` → nova aba registrada

3. **Volte para "Keywords"**
4. **Verifique:**
   - Dados devem estar preservados (reidratação)
   - Status deve mostrar `completed` (bolinha verde)

### 4️⃣ Salvamento em lote

1. **Clique em "Salvar Relatório"** na SaveBar
2. **Observe:**
   - `[DIAG][tabsRegistry] saveAllTabs` → início do lote
   - `[DIAG][tabsRegistry] saveAllTabs:results` → resultado por aba

---

## 📋 Logs Esperados por Componente

### 🔹 TOTVSCheckCard (montagem)

```
[DIAG][TOTVSCheckCard] SaveBar props
  props.readOnly: false
  props.isSaving: false
  props.snapshot: null (editável)
  ┌─────────┬─────────────┐
  │ (index) │ status      │
  ├─────────┼─────────────┤
  │ keywords│ 'draft'     │
  └─────────┴─────────────┘
  registry size: 1
```

### 🔹 SaveBar (ciclo de vida)

```
[DIAG][SaveBar] mount/update
  readOnly: false | isSaving: false
  ┌─────────┬──────────┬──────────┐
  │ (index) │ tab      │ status   │
  ├─────────┼──────────┼──────────┤
  │ 0       │ keywords │ draft    │
  └─────────┴──────────┴──────────┘
  Agregados → anyProcessing: false | allCompleted: false | anyDraft: true | anyError: false
  DOM element: ✅ Found
```

### 🔹 Autosave (ciclo completo)

```
[DIAG][Autosave][keywords] init { stcHistoryId: 'abc123', tabKey: 'keywords', cacheKey: 'cnpj|domain|...', hasInitialData: false }

[DIAG][Autosave][keywords] scheduleSave { status: 'draft', dataKeys: ['seoData', 'digitalPresence'], cacheKey: '...', debounceMs: 1200 }

[DIAG][Autosave][keywords] persist:start { payloadSize: 15432, tabsCount: 3 }

[DIAG][Autosave][keywords] persist:success { timestamp: '2025-11-05T14:30:00.000Z', payloadSize: 15432, tabsInReport: 3 }
```

### 🔹 tabsRegistry (salvamento em lote)

```
[DIAG][tabsRegistry] saveAllTabs
  registered tabs: ['keywords', 'competitors']
  statuses before save: { keywords: 'completed', competitors: 'draft' }

[REGISTRY] ✅ Salvo: 2 abas | ❌ Falhas: 0

[DIAG][tabsRegistry] saveAllTabs:results
  successes: 2 | failures: 0
  statuses after save: { keywords: 'completed', competitors: 'completed' }
```

### 🔹 TabIndicator (renderização)

```
[DIAG][TabIndicator] render with status: completed
[DIAG][TabIndicator] render with status: draft
[DIAG][TabIndicator] render with status: processing
```

---

## 🎯 Artefatos a Coletar

Para validar o diagnóstico, colete os seguintes itens:

### 1️⃣ Console Log (completo)

- **Copiar todo o output do console** durante o cenário de teste
- Incluir timestamps se possível
- Destacar sequências `[DIAG]` relevantes

### 2️⃣ Network Tab (HAR ou screenshot)

- Filtrar por `stc_verification_history` ou `updateFullReport`
- Capturar:
  - Request Headers
  - Request Payload (JSON do `full_report`)
  - Response Status (200 OK esperado)
  - Response Time

### 3️⃣ DOM Inspector (SaveBar)

Selecionar o elemento `.sticky.top-0.z-40` e capturar:

**Computed Tab:**
```
position: sticky
top: 0px
z-index: 40
backdrop-filter: blur(12px)
width: [valor calculado]
```

**Layout Tab:**
- Box Model (margin, padding, border)
- Stacking context (verificar se não há transform/filter em ancestrais)

### 4️⃣ Supabase Log (SQL)

Query para verificar persistência:

```sql
SELECT 
  id,
  company_name,
  full_report,
  updated_at
FROM stc_verification_history
WHERE id = 'seu-stcHistoryId'
ORDER BY updated_at DESC
LIMIT 1;
```

Verificar:
- ✅ `full_report.keywords` existe e contém dados
- ✅ `full_report.__status.keywords.status` é `'completed'`
- ✅ `updated_at` é recente (dentro do período do teste)

### 5️⃣ Build/Commit Info

```bash
git rev-parse --short HEAD
git log -1 --format="%h - %s (%ci)"
```

---

## ✅ Checklist de Validação

### Visual (SaveBar)

- [ ] **Sticky ativa**: barra fixa no topo ao rolar a página
- [ ] **Z-index dominante**: SaveBar visível sobre outros elementos
- [ ] **Largura correta**: estica até `max-w-screen-2xl`
- [ ] **Sem recorte**: nenhum overflow oculto
- [ ] **Semáforos visíveis**: bolinhas coloridas por aba (verde/amarelo/azul/vermelho)
- [ ] **Tooltips funcionais**: hover exibe status detalhado

### Funcional (Autosave)

- [ ] **Agendamento**: `scheduleSave` chamado após edição
- [ ] **Debounce**: apenas 1 persistência por burst de digitação
- [ ] **Flush**: `flushSave` executa ao trocar de aba
- [ ] **Sucesso**: `persist:success` com payload > 0 e status 200
- [ ] **Erro**: `persist:error` exibido se falhar (com stack trace)
- [ ] **Status coerente**: transições `draft → processing → completed`

### Persistência (Supabase)

- [ ] **UPDATE registrado**: query retorna registro com timestamp recente
- [ ] **Payload completo**: `full_report` contém dados das abas testadas
- [ ] **Status consolidado**: `__status` tem metadados de cada aba
- [ ] **Cache key**: presente e coerente com inputs

---

## 🚨 Possíveis Problemas e Diagnósticos

### ❌ SaveBar não aparece

**Sintomas:**
- Console mostra logs `[DIAG][SaveBar]` mas visualmente não aparece
- `DOM element: ❌ Not found` no log

**Diagnóstico:**
1. Verificar z-index de outros elementos (modais, toasts)
2. Inspecionar ancestrais com `transform` ou `filter` (quebram sticky)
3. Verificar se há `overflow: hidden` no container pai

**Solução temporária para teste:**
- Elevar z-index para `z-50` temporariamente
- Mover sticky para container superior

### ❌ Autosave não persiste

**Sintomas:**
- `scheduleSave` é chamado mas não há `persist:success`
- Network Tab não mostra requisição ao Supabase
- Ao voltar para a aba, dados são perdidos

**Diagnóstico:**
1. Verificar `stcHistoryId` (deve ser válido e existir na tabela)
2. Verificar sessão Supabase (401/403 indica auth expirado)
3. Verificar RLS (Row Level Security) da tabela

**Verificar no console:**
```
[DIAG][Autosave][keywords] persist:error { error: {...}, message: '...' }
```

### ❌ Registry vazio

**Sintomas:**
- `registry size: 0` no log de TOTVSCheckCard
- SaveBar não exibe semáforos

**Diagnóstico:**
1. Verificar se a aba Keywords está usando `useReportAutosave`
2. Verificar se o `useEffect` de registro está executando
3. Verificar se há `stcHistoryId` válido

**Esperado:**
```
[DIAG][tabsRegistry] registered: keywords | total: 1 | keys: ['keywords']
```

---

## 🧹 Limpeza Pós-Diagnóstico

Após coletar os artefatos e validar, **remover a telemetria**:

### Opção 1: Desativar via `.env.local`

```bash
# Comentar ou remover a flag
# VITE_DEBUG_SAVEBAR=1
```

### Opção 2: Remover o código de diagnóstico

Reverter os commits ou fazer busca/substituição:

```bash
# Buscar por
🔍 SPEC #005.D

# E remover os blocos guardados por:
if (import.meta.env.VITE_DEBUG_SAVEBAR)
```

**Importante:** A telemetria está **inerte em produção** (flag não existe), mas é boa prática removê-la após o diagnóstico.

---

## 📦 Estrutura de Pastas (Referência)

```
src/
├── components/
│   ├── icp/
│   │   └── tabs/
│   │       ├── KeywordsSEOTabEnhanced.tsx
│   │       ├── useReportAutosave.ts        [INSTRUMENTADO]
│   │       ├── TabIndicator.tsx            [INSTRUMENTADO]
│   │       ├── tabsRegistry.ts             [INSTRUMENTADO]
│   │       └── snapshotReport.ts
│   └── totvs/
│       ├── TOTVSCheckCard.tsx              [INSTRUMENTADO]
│       └── SaveBar.tsx                     [INSTRUMENTADO]
```

---

## 🎓 Glossário de Termos

| Termo | Significado |
|-------|-------------|
| **SaveBar** | Barra fixa no topo com status e ações críticas |
| **Autosave** | Hook de salvamento automático com debounce |
| **Registry** | Mapa global de abas registradas para salvamento em lote |
| **Status** | Estado de uma aba: `draft`, `processing`, `completed`, `error` |
| **Flush** | Salvamento imediato (bypass do debounce) |
| **Snapshot** | Foto final do relatório (imutável) para read-only |
| **stcHistoryId** | ID do registro em `stc_verification_history` |
| **cache_key** | Hash determinística para anti-reprocesso |

---

## 📞 Próximos Passos

1. ✅ **Ativar diagnóstico** com `VITE_DEBUG_SAVEBAR=1`
2. ✅ **Executar cenário de teste** completo
3. ✅ **Coletar 5 artefatos** (console, network, DOM, SQL, build)
4. ✅ **Validar checklists** visual + funcional + persistência
5. ✅ **Identificar causa raiz** se houver problema
6. ✅ **Emitir Hotfix** se necessário (SPEC #005.D.x)
7. ✅ **Desativar diagnóstico** após validação
8. ✅ **Liberar SPEC #007** (Refino de Keywords + Similares)

---

**Autor:** Claude (Sonnet 4.5) + Statutory Builder  
**Data:** 2025-11-05  
**Versão:** 1.0.0  
**Status:** 🟢 Pronto para execução

