# 🚨 AÇÃO URGENTE NECESSÁRIA!

## ⚠️ VOCÊ PRECISA EXECUTAR A MIGRATION 5 AGORA!

**SEM ISSO, AS FOTOS E ESPECIFICAÇÕES NÃO VÃO FUNCIONAR!**

---

## 📋 PASSO A PASSO (5 MINUTOS):

### **1. EXECUTAR MIGRATION 5 NO SUPABASE** ⚠️

**Acesse:** https://app.supabase.com/project/kdalsopwfkrxiaxxophh/sql

**Copie TODO o conteúdo deste arquivo:**
`supabase/migrations/20251111000005_enhance_product_catalog.sql`

**Como copiar:**
1. Abrir o arquivo no VS Code/Cursor
2. `Ctrl+A` (selecionar tudo)
3. `Ctrl+C` (copiar)
4. Ir no SQL Editor do Supabase
5. `Ctrl+V` (colar)
6. Clicar **RUN** ▶️

**O que vai criar:**
- ✅ Colunas: `images`, `main_image`, `weight_kg`, `dimensions_cm`, `volume_m3`
- ✅ Colunas: `sku`, `brand`, `materials`, `warranty_months`
- ✅ Colunas: `technical_specs`, `certifications_detailed`
- ✅ Storage bucket: `product-images`
- ✅ +15 colunas técnicas profissionais

---

### **2. DELETAR PRODUTOS ANTIGOS (OPCIONAL)**

No SQL Editor:
```sql
DELETE FROM public.tenant_products 
WHERE tenant_id = '2afccefc-011a-4fb4-98e1-c47994b6f137';
```

Ou na interface `/catalog` → Selecionar todos → Deletar

---

### **3. IMPORTAR CSV COM FOTOS E ESPECIFICAÇÕES** 🎯

**Opção A: CSV com 10 equipamentos COM FOTOS** ⭐ **RECOMENDADO**

Arquivo: `METALIFE_COM_FOTOS.csv`

**Como importar:**
1. Refresh da página (`Ctrl+Shift+R`)
2. Ir em `/catalog`
3. Clicar **"CSV/Excel"** (botão ao lado de Deep Import)
4. Escolher arquivo: `METALIFE_COM_FOTOS.csv`
5. Ver preview
6. Clicar "Importar 10 Produto(s)"

**Produtos que vão ser importados:**
1. Reformer Advanced - USD 3,500 [📸 COM FOTO]
2. Reformer Infinity - USD 4,200 [📸 COM FOTO]
3. Reformer W23 - USD 3,200 [📸 COM FOTO]
4. Reformer Original - USD 2,800 [📸 COM FOTO]
5. Cadillac Infinity - USD 5,200 [📸 COM FOTO]
6. Cadillac W23 - USD 4,500 [📸 COM FOTO]
7. Chair Combo - USD 1,800 [📸 COM FOTO]
8. Ladder Barrel - USD 2,200 [📸 COM FOTO]
9. Reformer Tower - USD 4,800 [📸 COM FOTO]
10. Spin MetaLife - USD 1,999 [📸 COM FOTO]

**TODOS COM:**
- ✅ Fotos (URLs reais do site MetaLife)
- ✅ Peso e dimensões
- ✅ Volume (m³)
- ✅ SKU profissional
- ✅ HS Code 9506.91.00
- ✅ Materiais
- ✅ Garantia 24 meses
- ✅ Descrições profissionais

---

**Opção B: CSV com 15 equipamentos SEM FOTOS**

Arquivo: `METALIFE_EQUIPAMENTOS_PRINCIPAIS.csv`

Mesmos produtos + 5 adicionais, mas sem URLs de fotos.

---

### **4. VERIFICAR RESULTADO** ✅

Na página `/catalog` você deve ver:

```
┌───┬──────┬────────────────────┬──────────┬──────────┬────────────────┬─────────┬────────┐
│ ☑ │ FOTO │ PRODUTO            │ CATEGORIA│ HS CODE  │ ESPECIFICAÇÕES │ PREÇOS  │ STATUS │
├───┼──────┼────────────────────┼──────────┼──────────┼────────────────┼─────────┼────────┤
│ ☑ │ [📸] │ Reformer Advanced  │ Advanced │ 9506.91  │ ⚖️ 85 kg       │ $3,500  │ Ativo  │
│   │      │ SKU: RF-ADV-001    │          │          │ 📏 240x60x35   │ R$19,250│        │
│   │      │                    │          │          │ 📦 0.504 m³    │         │        │
├───┼──────┼────────────────────┼──────────┼──────────┼────────────────┼─────────┼────────┤
│ ☑ │ [📸] │ Cadillac Infinity  │ Infinity │ 9506.91  │ ⚖️ 120 kg      │ $5,200  │ Ativo  │
│   │      │ SKU: CAD-INF-001   │          │          │ 📏 280x80x220  │ R$28,600│        │
│   │      │                    │          │          │ 📦 4.928 m³    │         │        │
└───┴──────┴────────────────────┴──────────┴──────────┴────────────────┴─────────┴────────┘
```

---

## 🎯 DEPOIS DISSO:

### **TESTAR PROPOSTA COMERCIAL:**

1. Ir em `/export-dealers`
2. HS Code: `9506.91.00`
3. País: `United States`
4. Buscar dealers
5. Clicar "Gerar Proposta"
6. Selecionar 3 equipamentos
7. **VER PDF COM FOTOS E ESPECIFICAÇÕES!** 🎉

---

## ⏱️ TEMPO TOTAL: 5 MINUTOS

- Migration 5: 1 minuto
- Deletar produtos: 30 segundos
- Importar CSV: 1 minuto
- Refresh e verificar: 1 minuto
- Testar proposta: 2 minutos

---

## 🚨 SEM A MIGRATION 5:

- ❌ Fotos NÃO vão aparecer
- ❌ Especificações NÃO vão aparecer
- ❌ CSV vai dar erro (colunas não existem)
- ❌ Nada vai funcionar

---

**EXECUTE A MIGRATION 5 AGORA E ME AVISE!** 🎯

