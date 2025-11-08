# 🏗️ ARQUITETURA DE DADOS - ESTADO ATUAL

## 📊 TABELAS PRINCIPAIS E REDUNDÂNCIAS IDENTIFICADAS

### **PROBLEMA: MÚLTIPLAS TABELAS ARMAZENAM OS MESMOS DADOS**

```
companies (TABELA MESTRE)
├─ company_name, cnpj, industry, employees, location, raw_data
│
├─ icp_analysis_results (REDUNDÂNCIA)
│  ├─ razao_social (= company_name)
│  ├─ cnpj (DUPLICADO)
│  ├─ segmento (= industry)
│  └─ raw_analysis (= raw_data parcial)
│
├─ leads_pool (REDUNDÂNCIA)
│  ├─ razao_social (= company_name)
│  ├─ cnpj (DUPLICADO)
│  └─ Usa company_id mas duplica dados
│
└─ sdr_deals (CORRETO - APENAS REFERENCIA)
   └─ company_id → companies (✅)
```

---

## ✅ **SOLUÇÃO: NORMALIZAÇÃO 3NF (TERCEIRA FORMA NORMAL)**

### **TABELA MESTRE: `companies`**
```sql
companies
├─ id (PK)
├─ company_name, cnpj (UNIQUE), industry, employees
├─ location (JSONB)
├─ raw_data (JSONB - dados de APIs)
└─ metadata (timestamps, source)
```

### **TABELAS AUXILIARES (SÓ REFERENCIAM):**

```sql
icp_analysis_results
├─ id (PK)
├─ company_id (FK → companies) ✅
├─ status (pendente/aprovada/descartada)
├─ icp_score, temperatura
└─ raw_analysis (APENAS dados da análise ICP)

leads_pool (PODE SER ELIMINADA)
├─ Substituir por: icp_analysis_results.status = 'aprovada'
└─ Queries filtram por status ao invés de tabela separada

sdr_deals
├─ id (PK)
├─ company_id (FK → companies) ✅
├─ deal_title, deal_stage, deal_value
└─ NUNCA duplica dados da empresa
```

---

## 🎯 **BENEFÍCIOS DA NORMALIZAÇÃO:**

1. ✅ **Single Source of Truth** - Dados da empresa em 1 lugar só
2. ✅ **Sem duplicação** - CNPJ não repetido em 4 tabelas
3. ✅ **Atualizações atômicas** - Muda em 1 lugar, reflete em todos
4. ✅ **Performance** - Queries menores, joins eficientes
5. ✅ **Integridade** - Constraints garantem consistência

---

## 📋 **PRÓXIMA AÇÃO:**

Vou criar a **Central de Comando** que mostra:
- Total de empresas importadas (`companies`)
- Em quarentena (`icp_analysis_results.status = 'pendente'`)
- Aprovadas (`icp_analysis_results.status = 'aprovada'`)
- No pipeline (`sdr_deals`)

**CONTINUAR?**

