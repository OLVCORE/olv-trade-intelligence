# 🤖 AUTO-ENRIQUECIMENTO DE EMPRESAS - COMO FUNCIONA

## ✅ REGRA #1: NUNCA DADOS FICTÍCIOS

**PROIBIDO:**
- ❌ Criar decisores fictícios (Ken, Sarah, David)
- ❌ Criar Apollo IDs falsos
- ❌ Inventar emails ou telefones
- ❌ Mocks de qualquer tipo

**PERMITIDO:**
- ✅ Buscar dados REAIS no Apollo API
- ✅ Buscar dados públicos no LinkedIn
- ✅ Dados da Receita Federal (CNPJ oficial)
- ✅ Deixar campos vazios se não tiver dados

---

## 🎯 COMO O AUTO-ENRIQUECIMENTO FUNCIONA

### **QUANDO UMA EMPRESA É ADICIONADA:**

#### **1️⃣ Export Dealers B2B:**
```
Busca → Edge Function retorna → Frontend salva
↓
✅ Nome, Website, País, Estado, Cidade
✅ Indústria, Funcionários
✅ Fit Score (calculado por web scraping)
✅ LinkedIn (se Apollo encontrar)
❌ Decisores (VAZIO - precisa buscar depois)
```

#### **2️⃣ Upload CSV:**
```
CSV → Edge Function processa → Banco salva
↓
✅ TODOS os campos do CSV (87 campos)
✅ LinkedIn (coluna "LinkedIn" do CSV)
❌ Apollo/Decisores (VAZIO - precisa buscar depois)
```

#### **3️⃣ SQL Manual:**
```
SQL INSERT → Campos definidos manualmente
↓
✅ Campos que você colocar no SQL
❌ Decisores (VAZIO - precisa buscar depois)
```

---

## 🔍 ENRIQUECIMENTO PÓS-INSERÇÃO (MANUAL)

### **OPÇÃO A: Apollo ID Manual (RECOMENDADO)**

**Quando usar:** Top 10 empresas (Fit Score > 80)

**Como:**
1. Vá em `/companies`
2. Expanda a empresa
3. Clique "Adicionar Apollo ID"
4. Vá no Apollo.io e ache a empresa
5. Copie o Organization ID da URL
6. Cole no modal
7. A Edge Function:
   - ✅ Busca TODOS os colaboradores (até 100)
   - ✅ Classifica: CEO > VP > Directors > Managers
   - ✅ Salva top 5 REAIS (não fictícios!)
   - ✅ Atualiza description (real do Apollo)
   - ✅ Atualiza industry (real do Apollo)
   - ✅ Salva linkedin_url (real do Apollo)

**Custo:** ~1-2 créditos Apollo por empresa

---

### **OPÇÃO B: Ações em Massa (para múltiplas)**

**Quando usar:** Enriquecer 5-10 empresas de uma vez

**Como:**
1. Vá em `/companies`
2. Selecione 5 empresas (checkbox)
3. Clique "Ações em Massa" → "Enriquecer Apollo"
4. Aguarde processo (1-2min por empresa)

**Custo:** ~1-2 créditos por empresa × 5 = 5-10 créditos

---

### **OPÇÃO C: Auto-Enriquecimento (FUTURO)**

**Status:** ⚠️ NÃO IMPLEMENTADO (caro e arriscado)

**Como seria:**
- Trigger no Supabase detecta INSERT
- Chama Edge Function automaticamente
- Busca Apollo/LinkedIn sem intervenção

**Por que NÃO fazer:**
- 💸 **Gasta créditos sem controle**
- ⚠️ **Pode enriquecer empresas erradas**
- 🐌 **Lento** (2-3min por empresa)
- ❌ **Difícil de debugar** erros

---

## 📊 ORDEM DE PRIORIDADE (TOP 10):

Execute "Apollo ID Manual" nesta ordem:

1. ✅ **Balanced Body** (95) - JÁ TEM decisores REAIS do Apollo
2. ✅ **Merrithew STOTT** (95) - JÁ TEM decisores REAIS do Apollo
3. ⏳ **Elina Pilates** (95) - PRÓXIMA
4. ⏳ **Gratz Industries** (95)
5. ⏳ **Peak Pilates** (90)
6. ⏳ **Align-Pilates** (90)
7. ⏳ **P.E.Pilates** (85)
8. ⏳ **Jaalee Fit** (85)
9. ⏳ **WellReformer** (85)
10. ⏳ **Aero Pilates** (85)

**Custo total:** ~8-10 créditos Apollo (top 10 empresas)

---

## 🎯 RESULTADO FINAL:

**Todas as 30 empresas terão:**
- ✅ Nome, Website, Localização
- ✅ Fit Score, Indústria
- ✅ LinkedIn (público)
- ✅ Card expansível funcionando

**Top 10 enriquecidas terão:**
- ✅ Todos os campos acima
- ✅ Apollo Organization ID
- ✅ 3-5 decisores REAIS (CEO, VP, Directors)
- ✅ Description REAL (do Apollo)
- ✅ Industry atualizado (do Apollo)

**Outras 20 empresas:**
- ✅ Podem ser enriquecidas quando necessário
- ✅ Botão "Adicionar Apollo ID" disponível
- ✅ Sem gastar créditos desnecessariamente

---

## ✅ EXECUTE AGORA:

**Arquivo:** `EXECUTAR_AGORA_SEQUENCIAL.sql`

1. Remove decisores fictícios
2. Adiciona LinkedIn em TODAS as 30
3. Mostra resultado final

**Depois disso, você enriquece com Apollo manualmente quando precisar!**

