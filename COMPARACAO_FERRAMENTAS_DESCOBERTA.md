# 🔍 COMPARAÇÃO DETALHADA: Export Dealers vs Sala Global de Alvos

## 📊 RESUMO EXECUTIVO

| Característica | Export Dealers (B2B) | Sala Global - Inteligência B2B | Sala Global - Motor Trade |
|----------------|---------------------|-------------------------------|--------------------------|
| **Edge Function** | `discover-dealers-realtime` | `discover-dealers-realtime` ⚠️ **MESMA** | `discover-companies-global` ✅ **DIFERENTE** |
| **Onde salva** | Estado local (memória) | `global_companies` (banco) | `global_companies` (banco) |
| **Salvamento** | Manual (botão "Salvar") | Automático (ao rodar) | Automático (ao rodar) |
| **Fluxo de dados** | Dealers → Companies → Quarentena | global_companies → Companies → Quarentena | global_companies → Companies → Quarentena |
| **Fonte de dados** | Apollo + Serper + Google | Apollo + Serper + Google ⚠️ **MESMA** | Trade Data (ImportGenius, Panjiva, Volza) ✅ **DIFERENTE** |
| **Foco** | Decisores B2B | Decisores B2B ⚠️ **MESMO** | Importadores reais (trade data) ✅ **DIFERENTE** |

---

## 🎯 EVIDÊNCIAS DO CÓDIGO

### 1️⃣ **Export Dealers (B2B)**

**Arquivo:** `src/pages/ExportDealersPage.tsx`

```typescript
// Linha 107: Chama discover-dealers-realtime
const { data, error } = await supabase.functions.invoke('discover-dealers-realtime', {
  body: {
    hsCode,
    country,
    keywords: allKeywords,
    minVolume: params.minVolume || null,
  },
});

// Linha 36: Salva em ESTADO LOCAL (não no banco)
const [dealers, setDealers] = useState<Dealer[]>([]);

// Linha 223: Salvamento MANUAL via botão
const result = await saveDealersToCompanies(dealers, currentWorkspace!);
```

**Fluxo:**
1. Busca → `discover-dealers-realtime`
2. Resultados → Estado local (`dealers`)
3. Usuário clica "Salvar" → `saveDealersToCompanies()` → `companies` → Quarentena

**Características:**
- ✅ Resultados imediatos na tela
- ✅ Não salva automaticamente (proteção contra perda de créditos)
- ✅ Botão "Salvar" obrigatório
- ❌ Dados perdidos se fechar página sem salvar

---

### 2️⃣ **Sala Global - Inteligência B2B**

**Arquivo:** `src/pages/GlobalTargetsPage.tsx`

```typescript
// Linha 221: Chama discover-dealers-realtime (MESMA FUNÇÃO!)
const { data, error } = await supabase.functions.invoke("discover-dealers-realtime", {
  body: {
    hsCode,
    country,
    keywords: Array.from(keywordsSet),
    minVolume: Number(b2bParams.volumeMin) || null,
    includeTypes: b2bParams.includeTypes.split(","),
    excludeTypes: b2bParams.excludeTypes.split(","),
    includeRoles: b2bParams.includeRoles.split(","),
  },
});

// Linha 340-360: Salva AUTOMATICAMENTE em global_companies
const payload = dealers.map((dealer: any) => ({
  tenant_id: currentTenant.id,
  company_name: companyName,
  domain: domain,
  country: dealer.country,
  // ...
}));

await supabase.from("global_companies").insert(payload);
```

**Fluxo:**
1. Busca → `discover-dealers-realtime` (MESMA função do Export Dealers)
2. Resultados → `global_companies` (AUTOMÁTICO)
3. Usuário seleciona empresas → "Transferir para Base" → `transferGlobalToCompanies()` → `companies` → Quarentena

**Características:**
- ✅ Salva automaticamente em `global_companies`
- ✅ Dados persistem (não perde ao fechar)
- ✅ Permite seleção múltipla antes de transferir
- ⚠️ **USA A MESMA Edge Function** que Export Dealers

---

### 3️⃣ **Sala Global - Motor Trade**

**Arquivo:** `src/pages/GlobalTargetsPage.tsx` + `src/services/globalDiscovery.ts`

```typescript
// Linha 150: Chama runGlobalDiscovery
return runGlobalDiscovery({
  tenantId: currentTenant.id,
  hsCodes: normalizedHs,
  keywords: normalizedKeywords,
  countries: normalizedCountries,
  limit,
});

// globalDiscovery.ts linha 25: Chama discover-companies-global (DIFERENTE!)
const { data, error } = await supabase.functions.invoke("discover-companies-global", {
  body: {
    tenant_id: params.tenantId,
    hs_codes: params.hsCodes,
    keywords: params.keywords,
    countries: params.countries,
    limit: params.limit,
  },
});
```

**Edge Function:** `supabase/functions/discover-companies-global/index.ts`

```typescript
// Linha 49-100: Foca em TRADE DATA (não Apollo!)
const candidateSources = await Promise.all([
  runTradeDataSearch(payload), // ImportGenius, Panjiva, Volza
  runSerperTradeSearch(payload), // Portais de trade
  runGoogleCSESearch(payload), // Google com foco em trade
]);
```

**Fluxo:**
1. Busca → `discover-companies-global` (DIFERENTE!)
2. Resultados → `global_companies` (AUTOMÁTICO)
3. Usuário seleciona empresas → "Transferir para Base" → `transferGlobalToCompanies()` → `companies` → Quarentena

**Características:**
- ✅ **FONTE DIFERENTE**: Trade Data (ImportGenius, Panjiva, Volza)
- ✅ Foca em **importadores reais** (não decisores)
- ✅ Salva automaticamente em `global_companies`
- ✅ Dados de trade reais (HS Codes, volumes, etc.)

---

## ⚠️ PROBLEMA IDENTIFICADO

### **Export Dealers e Sala Global B2B fazem a MESMA coisa!**

**Evidência:**

1. **Mesma Edge Function:**
   - Export Dealers: `discover-dealers-realtime` (linha 107)
   - Sala Global B2B: `discover-dealers-realtime` (linha 221)

2. **Mesmas fontes de dados:**
   - Apollo.io
   - Serper (30 portais B2B)
   - Google Custom Search

3. **Mesmo foco:**
   - Decisores B2B (Procurement Manager, etc.)
   - Tipos B2B (Distributor, Wholesaler, etc.)

**ÚNICA DIFERENÇA:**
- Export Dealers: Salva em estado local (manual)
- Sala Global B2B: Salva em `global_companies` (automático)

---

## ✅ RECOMENDAÇÃO

### **Opção 1: Unificar Export Dealers e Sala Global B2B**

**Justificativa:**
- Fazem a mesma busca
- Usam a mesma Edge Function
- Apenas diferem no salvamento

**Solução:**
- Remover "Export Dealers" ou
- Fazer Export Dealers salvar direto em `global_companies` também

### **Opção 2: Diferenciar claramente**

**Export Dealers:**
- Foco: Busca rápida, visualização imediata
- Não salva (apenas visualiza)
- Para: Testes rápidos, validação de parâmetros

**Sala Global B2B:**
- Foco: Descoberta persistente
- Salva automaticamente
- Para: Descoberta sistemática, armazenamento

**Motor Trade:**
- Foco: Trade data real
- Fonte diferente (ImportGenius, Panjiva)
- Para: Importadores reais com dados de trade

---

## 📋 CONCLUSÃO

1. **Export Dealers** e **Sala Global B2B** são **REDUNDANTES** - fazem a mesma busca
2. **Motor Trade** é **DIFERENTE** - usa fonte de dados diferente (trade data)
3. **Recomendação:** Unificar Export Dealers e Sala Global B2B, ou diferenciar claramente o propósito de cada uma


