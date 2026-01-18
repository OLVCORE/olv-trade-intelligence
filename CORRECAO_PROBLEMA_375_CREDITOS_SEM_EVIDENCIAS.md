# 🔧 CORREÇÃO: 375 Créditos Consumidos Sem Evidências

## 🚨 PROBLEMA IDENTIFICADO

Após consumir **375 créditos do Serper**, o relatório SCI retornou:
- ✅ Buscas executadas com sucesso (375 créditos consumidos)
- ❌ **0 evidências detectadas**
- ❌ Dados zerados no frontend
- ❌ Relatório não aparecendo no novo formato

## 🔍 CAUSA RAIZ

1. **Evidências estão sendo coletadas** (logs mostram `evidencias.length > 0`)
2. **Mas a extração de sinais está falhando** - A função `extractSignalsFromEvidences()` está procurando por keywords **exatas** em inglês, mas:
   - Empresas chinesas podem não ter conteúdo em inglês
   - Keywords podem não estar presentes nos snippets retornados
   - Formato dos resultados do Serper pode estar diferente do esperado

## ✅ CORREÇÕES APLICADAS

### 1. **Logs de Debug Detalhados**

Adicionados logs para rastrear:
- Quantos resultados cada portal retorna
- Primeiros 3 resultados de cada busca (title + snippet)
- Processamento de cada evidência
- Keywords que corresponderam
- Total de sinais extraídos vs. total de evidências processadas

**Arquivo:** `supabase/functions/strategic-intelligence-check/index.ts`

```typescript
// Log quando nenhum resultado é encontrado
if (results.length === 0) {
  console.warn(`[SCI-MULTI-PORTAL] ⚠️ ${portal}: Nenhum resultado encontrado para "${query.substring(0, 80)}..."`);
}

// Log dos primeiros resultados
if (evidencias.length < 3) {
  console.log(`[SCI-MULTI-PORTAL] 🔍 Resultado exemplo:`, {
    title: evidence.title.substring(0, 100),
    snippet: evidence.snippet.substring(0, 150),
    source: evidence.source
  });
}
```

### 2. **Melhorar CORS Headers**

Adicionados headers adicionais para resolver erro CORS no Vercel:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400', // 24 horas
};
```

### 3. **Logs de Extração de Sinais**

Logs detalhados na função `extractSignalsFromEvidences()`:

```typescript
console.log(`[SCI-SIGNALS] 🔍 Processando ${evidencias.length} evidências para extrair sinais...`);
// ... processamento ...
console.log(`[SCI-SIGNALS] ✅ Extração concluída: ${matchedCount}/${processedCount} evidências corresponderam a keywords`);
```

## 📋 PRÓXIMOS PASSOS PARA DIAGNÓSTICO

### 1. **Verificar Logs do Supabase**

Após o deploy, verificar os logs da edge function no Supabase Dashboard:

```
Supabase Dashboard → Edge Functions → strategic-intelligence-check → Logs
```

**Procure por:**
- `[SCI-MULTI-PORTAL] 📊` - Ver quantos resultados cada busca retornou
- `[SCI-MULTI-PORTAL] ⚠️` - Ver quais queries não retornaram resultados
- `[SCI-SIGNALS] 🔍` - Ver quantas evidências foram processadas
- `[SCI-SIGNALS] ✅` - Ver quantas evidências corresponderam a keywords

### 2. **Possíveis Problemas Identificados**

Se os logs mostrarem:
- **"Nenhum resultado encontrado"** → As queries podem estar muito específicas para empresas chinesas
- **"0 evidências corresponderam a keywords"** → Keywords em inglês não funcionam para conteúdo chinês/português
- **Resultados existem mas não são processados** → Formato dos resultados pode estar diferente

### 3. **Solução Futura (Se Confirmado)**

Se o problema for **keywords em inglês vs. conteúdo chinês/português**, precisaremos:

1. **Expandir keywords para múltiplos idiomas:**
   ```typescript
   const expansionKeywords = [
     // Inglês
     'opening new office', 'expanding to', 'new location',
     // Chinês (simplificado)
     '新办公室', '扩张', '新地点',
     // Português
     'abertura de novo escritório', 'expansão para', 'nova localização'
   ];
   ```

2. **Usar detecção de idioma** e aplicar keywords apropriadas

3. **Relaxar matching** - usar fuzzy matching ou NLP em vez de keywords exatas

## 🚀 DEPLOY

A edge function foi atualizada com logs de debug. Faça o deploy:

```bash
supabase functions deploy strategic-intelligence-check
```

## 📊 MONITORAMENTO

Após o próximo teste, verifique os logs e identifique:
1. Quantos resultados cada query retornou
2. Por que os resultados não estão sendo processados
3. Se o problema é keywords, idioma, ou formato de dados

---

**Status:** ✅ Logs de debug adicionados | ⏳ Aguardando próximo teste para diagnóstico completo
