# 📊 ANÁLISE COMPLETA: Adaptação para Foco Exclusivo em Importação/Exportação

## 🎯 O QUE ENTENDI

### **Contexto Atual:**
- Sistema originalmente criado para **mercado local brasileiro** (CNPJ, Receita Federal)
- Agora **100% focado em importação/exportação internacional**
- Export Dealers já funciona bem: busca por HS-Code/NCM + País → retorna dealers com **country** e **city** automaticamente

### **Requisitos:**
1. **Localização = Cidade + País** (onde o importador/exportador está situado)
2. **Origem Unificada**: Significa duas coisas:
   - **Origem Geográfica**: Cidade + País onde a empresa está
   - **Origem da Descoberta**: Onde foi encontrado (ex: "47 fontes", nome da campanha)
3. **Remover dependências de CNPJ**: Não necessário para empresas internacionais
4. **Renomear TOTVS Check → SCI**: Strategic Commercial Intelligence (já em progresso)
5. **Preservar dados existentes**: Não quebrar nada

---

## 🔍 DIAGNÓSTICO DAS DIFERENÇAS NAS TABELAS

### **1. CompaniesManagementPage (Base de Empresas) - PADRÃO ATUAL**

#### **Colunas:**
```
1. ☑️ Checkbox
2. 🏢 Empresa (com ChevronDown)
3. 📍 Localização (País Badge + UF + Cidade) ← DEPOIS DE EMPRESA
4. 🗺️ Origem (ColumnFilter)
5. 📄 Status CNPJ (ColumnFilter) ← ❌ REMOVER (não relevante para internacional)
6. 🏭 Setor (ColumnFilter)
7. 🗺️ UF (ColumnFilter) ← ❌ REMOVER (não relevante para internacional)
8. 📊 Score ICP
9. ✅ Status Análise (ColumnFilter)
10. 🔍 TOTVS Check ← ❌ RENOMEAR para "SCI"
11. 🌐 Website
12. ⚙️ Ações
```

#### **Fonte de Localização:**
```typescript
// Prioridade (atual):
1. company.location.city / state / country (JSONB)
2. company.raw_data.receita_federal.municipio / uf
3. company.raw_data.municipio / uf
4. company.city / state / country (campos diretos)

// ✅ RECOMENDAÇÃO: Nova prioridade (internacional):
1. company.country (campo direto) ← PRINCIPAL
2. company.city (campo direto) ← PRINCIPAL
3. company.raw_data.apollo_organization.city / country
4. company.location.city / country (JSONB fallback)
5. company.raw_data.receita_federal.municipio / país (Brasil apenas)
```

---

### **2. ICPQuarantine (Quarentena ICP) - PRECISA AJUSTES**

#### **Colunas Atuais:**
```
1. ☑️ Checkbox
2. 🏢 Empresa
3. 📄 CNPJ ← ❌ REMOVER (não relevante)
4. 🗺️ Origem (ColumnFilter)
5. 📄 Status CNPJ (ColumnFilter) ← ❌ REMOVER
6. 🏭 Setor (ColumnFilter)
7. 🗺️ UF (ColumnFilter) ← ❌ REMOVER
8. 📊 Score (ICP)
9. ✅ Status Análise (ColumnFilter)
10. 🌐 Website
11. 🔍 STC ← ❌ RENOMEAR para "SCI"
12. ⚙️ ⚙️
```

#### **Faltando:**
- ❌ Coluna **Localização** (Cidade + País)
- ❌ Dropdown expandido com "Informações Gerais"

---

### **3. ApprovedLeads (Leads Aprovados) - ESTRUTURA DIFERENTE**

#### **Atual:**
- Usa **Cards** (não tabela)
- ❌ Não mostra **Localização**
- ❌ Não tem dropdown expandido

#### **Fonte de Dados:**
- Tabela: `icp_analysis_results` (status = 'aprovado')
- Campos: `razao_social`, `cnpj`, `country`, `city` (se existir)

---

## 📋 RECOMENDAÇÕES PARA PADRONIZAÇÃO

### **🎯 PADRÃO UNIFICADO DE COLUNAS (INTERNACIONAL)**

```
1. ☑️ Checkbox
2. 🏢 Empresa (com ChevronDown para expandir)
3. 📍 Localização (Cidade + País) ← NOVA, LOGO APÓS EMPRESA
4. 🗺️ Origem (ColumnFilter) ← UNIFICADO: origem geográfica + descoberta
5. 🏭 Setor/Indústria (ColumnFilter)
6. 📊 Score ICP
7. ✅ Status Análise (ColumnFilter)
8. 🔍 SCI (Strategic Commercial Intelligence) ← RENOMEADO de "TOTVS Check"
9. 🌐 Website
10. ⚙️ Ações
```

### **❌ COLUNAS A REMOVER:**

1. **CNPJ** - Não relevante para empresas internacionais
2. **Status CNPJ** - Não relevante para empresas internacionais  
3. **UF** - Apenas Brasil (substituído por "País" na localização)

---

## 🗺️ LOCALIZAÇÃO: COMO EXTRAIR (NOVA LÓGICA INTERNACIONAL)

### **Fonte de Dados (Prioridade):**

```typescript
/**
 * Função Universal: getLocationDisplay(company)
 * Extrai Cidade + País de QUALQUER empresa (Brasil ou Internacional)
 */
function getLocationDisplay(company: any): { city: string; country: string } {
  // 🥇 PRIORIDADE 1: Export Dealers / Apollo Internacional (MAIS PRECISO)
  const city = 
    company.city ||                                    // Campo direto
    company.raw_data?.apollo_organization?.city ||     // Apollo
    company.raw_data?.apollo_organization?.headquarters_city ||
    company.location?.city ||                          // JSONB location
    company.raw_data?.receita_federal?.municipio ||    // Brasil (fallback)
    company.raw_data?.municipio ||
    'N/A';
  
  const country = 
    company.country ||                                 // Campo direto (MAIS PRECISO)
    company.raw_data?.apollo_organization?.country ||  // Apollo
    company.raw_data?.apollo_organization?.headquarters_country ||
    company.location?.country ||                       // JSONB location
    company.raw_data?.receita_federal?.pais ||         // Brasil (fallback)
    'N/A';
  
  return { city, country };
}
```

### **Visual da Coluna "Localização":**

```tsx
<TableCell>
  <div className="flex flex-col gap-1">
    <Badge variant="secondary" className="w-fit">
      {country}
    </Badge>
    {city && city !== 'N/A' && (
      <span className="text-xs text-muted-foreground truncate" title={city}>
        {city}
      </span>
    )}
  </div>
</TableCell>
```

---

## 🔗 ORIGEM: UNIFICANDO CONCEITOS

### **Origem Atual (Duplo Significado):**

1. **Origem Geográfica**: Onde a empresa está (Cidade + País)
2. **Origem da Descoberta**: Onde foi encontrado (ex: "dealer_discovery", "47 fontes", nome da campanha)

### **Recomendação: Manter Campo "Origem" com Duplo Contexto**

#### **Exemplo de Valores:**
```
// Origem Geográfica:
"United States", "China", "Germany", "Brasil"

// Origem da Descoberta:
"dealer_discovery", "apollo_international", "csv_upload", "manual", "47_fontes_serper"

// Origem Combinada (mostrar ambos):
"United States | Dealer Discovery"
"China | Apollo International"
"Brasil | CSV Upload"
```

#### **Sugestão de Implementação:**
```typescript
function getOriginDisplay(company: any): string {
  const geographicOrigin = company.country || 'N/A';
  const discoverySource = company.data_source || 
                         company.raw_data?.source || 
                         company.origem || 
                         'Manual';
  
  // Se descoberta = país, mostrar apenas país
  if (discoverySource === geographicOrigin || !discoverySource) {
    return geographicOrigin;
  }
  
  // Caso contrário, mostrar ambos
  return `${geographicOrigin} | ${discoverySource}`;
}
```

---

## 🔄 RENOMEAÇÃO TOTVS CHECK → SCI

### **Status Atual:**
- ✅ Componente `ProductAnalysisCard` já renomeado para `StrategicIntelligenceCard`
- ✅ Edge Function `strategic-intelligence-check` já existe
- ⏳ Ainda há referências a "TOTVS Check" em algumas tabelas

### **Onde Renomear:**
1. ✅ `CompaniesManagementPage.tsx` - Coluna "TOTVS Check" → "SCI"
2. ✅ `ICPQuarantine.tsx` - Coluna "STC" → "SCI"
3. ✅ Dropdown "Informações Gerais" - Seção "TOTVS Check" → "SCI"
4. ✅ Tooltips e labels

---

## 💾 PRESERVAÇÃO DE DADOS EXISTENTES

### **Estratégia: Não Remover, Apenas Ocultar/Deprecar**

#### **Campos CNPJ (Manter no Banco, Ocultar na UI):**
- ✅ **Manter** `companies.cnpj` no banco (dados existentes preservados)
- ✅ **Ocultar** coluna "CNPJ" nas tabelas (não deletar campo)
- ✅ **Manter** lógica de CNPJ para empresas brasileiras (se necessário)
- ✅ **Adicionar** condição: `if (company.country === 'Brasil' || company.cnpj) { mostrar CNPJ }`

#### **Campos Status CNPJ (Deprecar):**
- ✅ **Manter** no `raw_data` (dados preservados)
- ✅ **Remover** da UI (coluna "Status CNPJ")
- ✅ **Usar** apenas para empresas brasileiras (se necessário)

#### **Campos UF (Substituir por País):**
- ✅ **Manter** `companies.state` no banco
- ✅ **Substituir** coluna "UF" por "País" na localização
- ✅ **Usar** UF apenas para empresas brasileiras internamente

---

## 📐 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Padronização de Colunas (Sem quebrar dados)**

#### **1.1 Adicionar Coluna "Localização" (Cidade + País)**
- ✅ Após "Empresa" em todas as tabelas
- ✅ Função helper `getLocationDisplay()` reutilizável
- ✅ Extração automática de `city` + `country`

#### **1.2 Remover/Ocultar Colunas Não Relevantes**
- ❌ Ocultar "CNPJ" (manter no banco)
- ❌ Ocultar "Status CNPJ" (manter no banco)
- ❌ Ocultar "UF" (substituído por "País" na localização)

#### **1.3 Renomear Colunas**
- ✅ "TOTVS Check" → "SCI"
- ✅ "STC" → "SCI"
- ✅ "Score" → "Score ICP" (se inconsistente)

### **FASE 2: Replicar Dropdown "Informações Gerais"**

#### **2.1 ICPQuarantine**
- ✅ Adicionar estado `expandedRow`
- ✅ Replicar componente dropdown da Base de Empresas
- ✅ Adaptar para `icp_analysis_results` (vs `companies`)

#### **2.2 ApprovedLeads**
- ✅ Opção A: Converter Cards → Tabela (mais trabalho)
- ✅ Opção B: Adicionar dropdown nos Cards (mais rápido)
- ✅ Manter visual de Cards, adicionar expansão

### **FASE 3: Unificar Origem**

#### **3.1 Mostrar Origem Geográfica + Descoberta**
- ✅ Função `getOriginDisplay()` unificada
- ✅ Formato: "País | Fonte Descoberta"
- ✅ Se ambos iguais, mostrar apenas país

#### **3.2 Atualizar Filtros**
- ✅ ColumnFilter "Origem" filtra por país + fonte
- ✅ Suportar ambos os formatos

### **FASE 4: Finalizar Renomeação SCI**

#### **4.1 Atualizar Nomenclatura**
- ✅ "TOTVS Check" → "SCI" em todos os lugares
- ✅ "STC" → "SCI" em todos os lugares
- ✅ Tooltips e descrições atualizados

---

## ⚠️ CUIDADOS E ATENÇÕES

### **1. Não Quebrar Dados Existentes**
- ✅ **NUNCA** deletar campos do banco (apenas ocultar na UI)
- ✅ **NUNCA** remover migrações existentes
- ✅ **SEMPRE** manter retrocompatibilidade

### **2. Preservar Funcionalidade Brasil**
- ✅ Se empresa tem `cnpj`, ainda pode mostrar (opcional)
- ✅ Se empresa tem `country === 'Brasil'`, pode mostrar UF
- ✅ Lógica condicional: Internacional vs Brasil

### **3. Ordem Padronizada**
- ✅ **TODAS** as tabelas devem ter a mesma ordem de colunas
- ✅ **TODAS** devem ter dropdown "Informações Gerais"
- ✅ **TODAS** devem ter coluna "Localização" após "Empresa"

### **4. Performance**
- ✅ Coluna "Localização" lê apenas dados existentes (sem queries extras)
- ✅ Função helper `getLocationDisplay()` deve ser rápida
- ✅ Evitar loops desnecessários

---

## 🎯 ORDEM FINAL PADRONIZADA (TODAS AS TABELAS)

```
1. ☑️ Checkbox
2. 🏢 Empresa (com ChevronDown)
3. 📍 Localização (Cidade + País) ← NOVA
4. 🗺️ Origem (País | Fonte Descoberta)
5. 🏭 Setor/Indústria
6. 📊 Score ICP
7. ✅ Status Análise (%)
8. 🔍 SCI (Strategic Commercial Intelligence)
9. 🌐 Website
10. ⚙️ Ações
```

---

## ✅ RECOMENDAÇÃO FINAL

### **Implementar em 4 Fases (Sem quebrar nada):**

1. **FASE 1** (Rápido): Adicionar coluna "Localização" + Remover colunas CNPJ/UF da UI
2. **FASE 2** (Médio): Replicar dropdown "Informações Gerais" para Quarentena e Leads
3. **FASE 3** (Rápido): Unificar "Origem" (País | Fonte)
4. **FASE 4** (Rápido): Finalizar renomeação SCI

### **Benefícios:**
- ✅ Sistema 100% focado em importação/exportação
- ✅ Dados brasileiros preservados (não deletados)
- ✅ Interface limpa e padronizada
- ✅ Nenhum dado perdido
- ✅ Retrocompatibilidade mantida

---

## 🚀 PRÓXIMO PASSO

**Aguardando sua aprovação para começar a FASE 1!**

Posso começar implementando:
1. Função helper `getLocationDisplay()` 
2. Adicionar coluna "Localização" em todas as tabelas
3. Ocultar colunas CNPJ/UF (sem deletar dados)

Deseja alguma alteração nas recomendações?
