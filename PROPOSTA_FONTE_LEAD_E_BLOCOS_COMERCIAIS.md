# 📊 PROPOSTA COMPLETA: Fonte do Lead + Blocos Comerciais

## 🎯 O QUE ENTENDI

### **Requisitos:**
1. **Coluna "Fonte do Lead"** (ou nome mais comercial/profissional):
   - Identificar de onde veio cada lead (motor de busca)
   - Exemplos: Export Dealers, Panjiva, CSV, Manual, Motor Trade
   
2. **Coluna "Bloco"** (geopolítico/comercial):
   - Identificar automaticamente o bloco baseado no país
   - Permitir filtrar por país, bloco ou cidade
   - Exemplos: MERCOSUL, NAFTA, União Europeia, ASEAN

3. **Garantir que país sempre seja extraído**:
   - Refinar lógica de extração de país
   - Múltiplas fontes: Export Dealers, Panjiva, CSV, etc.

4. **Sistema de registro automático**:
   - Ao salvar leads de qualquer origem, registrar a fonte
   - Padronizar em todos os pontos de entrada do sistema

---

## 📋 NOMENCLATURA: "FONTE DO LEAD"

### **Opções de Nomenclatura:**

#### **Opção 1 (Recomendada): "Lead Source"**
- ✅ **Profissional e Comercial**: Termo padrão em CRM
- ✅ **Internacional**: Usado em Salesforce, HubSpot, Pipedrive
- ✅ **Claro e Direto**: Indica a origem do lead

#### **Opção 2: "Fonte de Descoberta"**
- ✅ **Em Português**: Mais claro para usuários BR
- ⚠️ **Menos Padrão**: Não é termo comum em CRM

#### **Opção 3: "Lead Origin"**
- ✅ **Profissional**: Similar a "Lead Source"
- ⚠️ **Pode confundir** com origem geográfica (país)

### **✅ RECOMENDAÇÃO: "Lead Source"**

**Racional:**
- Termo padrão da indústria
- Compatível com mercado internacional
- Facilita integrações futuras (Salesforce, etc.)
- Tradução simples: "Lead Source" (EN) / "Fonte do Lead" (PT)

---

## 🗺️ BLOCOS COMERCIAIS: MAPEAMENTO COMPLETO

### **Mapeamento País → Bloco (Automático)**

```typescript
/**
 * MAPEAMENTO DE BLOCOS COMERCIAIS
 * 
 * Identifica automaticamente o bloco comercial baseado no país
 */

export const COMMERCIAL_BLOCKS = {
  // AMÉRICA DO SUL
  MERCOSUL: {
    name: 'MERCOSUL',
    countries: ['Brasil', 'Argentina', 'Paraguai', 'Uruguai', 'Venezuela'],
    continent: 'América do Sul'
  },
  
  // AMÉRICA DO NORTE
  NAFTA: {
    name: 'NAFTA / USMCA',
    countries: ['United States', 'Canada', 'México', 'Mexico'],
    continent: 'América do Norte'
  },
  
  // EUROPA
  EU: {
    name: 'União Europeia',
    countries: [
      'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium',
      'Austria', 'Sweden', 'Poland', 'Denmark', 'Finland', 'Portugal',
      'Greece', 'Ireland', 'Czech Republic', 'Romania', 'Hungary',
      'Slovakia', 'Bulgaria', 'Croatia', 'Lithuania', 'Slovenia',
      'Latvia', 'Estonia', 'Cyprus', 'Malta', 'Luxembourg'
    ],
    continent: 'Europa'
  },
  
  // ÁSIA
  ASEAN: {
    name: 'ASEAN',
    countries: [
      'Indonesia', 'Malaysia', 'Philippines', 'Singapore', 'Thailand',
      'Vietnam', 'Myanmar', 'Cambodia', 'Laos', 'Brunei'
    ],
    continent: 'Ásia'
  },
  
  APEC: {
    name: 'APEC',
    countries: [
      'Australia', 'New Zealand', 'Japan', 'South Korea', 'China',
      'Hong Kong', 'Taiwan', 'Singapore', 'Malaysia', 'Thailand',
      'Indonesia', 'Philippines', 'Vietnam', 'Brunei', 'Papua New Guinea',
      'Chile', 'Mexico', 'Peru', 'Russia', 'United States', 'Canada'
    ],
    continent: 'Ásia-Pacífico'
  },
  
  // OUTROS
  GCC: {
    name: 'GCC (Golfo)',
    countries: ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    continent: 'Oriente Médio'
  },
  
  ALADI: {
    name: 'ALADI',
    countries: [
      'Brasil', 'Argentina', 'Chile', 'Colombia', 'Ecuador', 'México',
      'Paraguai', 'Peru', 'Uruguai', 'Venezuela', 'Bolivia', 'Cuba'
    ],
    continent: 'América Latina'
  },
  
  // BRICS
  BRICS: {
    name: 'BRICS',
    countries: ['Brasil', 'Russia', 'India', 'China', 'South Africa'],
    continent: 'Multi-continental'
  },
  
  // ÁFRICA
  AU: {
    name: 'União Africana',
    countries: [
      'South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ghana', 'Morocco',
      'Ethiopia', 'Tanzania', 'Algeria', 'Tunisia'
      // ... outros países africanos
    ],
    continent: 'África'
  },
  
  // SEM BLOCO ESPECÍFICO (Outros)
  OTHER: {
    name: 'Outros',
    countries: [], // Todos os não listados
    continent: 'Vários'
  }
};

/**
 * Função: getCommercialBlock(country: string): string
 * 
 * Retorna o bloco comercial baseado no país
 */
export function getCommercialBlock(country: string): string {
  if (!country) return 'N/A';
  
  const countryNormalized = country.trim();
  
  // Buscar em todos os blocos
  for (const [blockKey, blockData] of Object.entries(COMMERCIAL_BLOCKS)) {
    if (blockKey === 'OTHER') continue; // Pular "OTHER"
    
    if (blockData.countries.some(c => 
      c.toLowerCase() === countryNormalized.toLowerCase() ||
      countryNormalized.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(countryNormalized.toLowerCase())
    )) {
      return blockData.name;
    }
  }
  
  // Se não encontrou, retornar "Outros"
  return COMMERCIAL_BLOCKS.OTHER.name;
}

/**
 * Função: getContinent(country: string): string
 * 
 * Retorna o continente baseado no país
 */
export function getContinent(country: string): string {
  if (!country) return 'N/A';
  
  const countryNormalized = country.trim();
  
  for (const [blockKey, blockData] of Object.entries(COMMERCIAL_BLOCKS)) {
    if (blockKey === 'OTHER') continue;
    
    if (blockData.countries.some(c => 
      c.toLowerCase() === countryNormalized.toLowerCase() ||
      countryNormalized.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(countryNormalized.toLowerCase())
    )) {
      return blockData.continent;
    }
  }
  
  return 'N/A';
}
```

---

## 🔗 FONTE DO LEAD: SISTEMA DE REGISTRO

### **Fontes Identificadas (Atuais e Futuras):**

```typescript
/**
 * LEAD SOURCES - Fontes de Leads
 * 
 * Identifica de onde veio cada lead (motor de busca/ferramenta)
 */

export const LEAD_SOURCES = {
  // MOTORES DE BUSCA
  EXPORT_DEALERS: {
    code: 'export_dealers',
    name: 'Export Dealers (B2B)',
    description: 'Busca via Export Dealers (Apollo + Serper)',
    category: 'Motor de Busca'
  },
  
  PANJIVA: {
    code: 'panjiva',
    name: 'Panjiva',
    description: 'Busca via API Panjiva (Trade Data)',
    category: 'API Externa'
  },
  
  MOTOR_TRADE: {
    code: 'motor_trade',
    name: 'Motor Trade',
    description: 'Busca via Motor Trade (Sala Global)',
    category: 'Motor de Busca'
  },
  
  SALA_GLOBAL_B2B: {
    code: 'sala_global_b2b',
    name: 'Sala Global B2B',
    description: 'Busca via Sala Global - Inteligência B2B',
    category: 'Motor de Busca'
  },
  
  // IMPORTAÇÃO
  CSV_UPLOAD: {
    code: 'csv_upload',
    name: 'Importação CSV/XLS',
    description: 'Importado via planilha CSV/XLS',
    category: 'Importação'
  },
  
  // MANUAL
  MANUAL: {
    code: 'manual',
    name: 'Cadastro Manual',
    description: 'Cadastrado manualmente pelo usuário',
    category: 'Manual'
  },
  
  // OUTROS (Futuros)
  IMPORTGENIUS: {
    code: 'importgenius',
    name: 'ImportGenius',
    description: 'Busca via ImportGenius API',
    category: 'API Externa'
  },
  
  VOLZA: {
    code: 'volza',
    name: 'Volza',
    description: 'Busca via Volza API',
    category: 'API Externa'
  },
  
  APOLLO_DIRECT: {
    code: 'apollo_direct',
    name: 'Apollo.io Direto',
    description: 'Busca direta via Apollo.io (sem Export Dealers)',
    category: 'API Externa'
  }
};
```

---

## 💾 IMPLEMENTAÇÃO: Registro Automático

### **1. Função Helper: `getLeadSource(company: any): string`**

```typescript
/**
 * Função: getLeadSource(company: any): string
 * 
 * Extrai e normaliza a fonte do lead de QUALQUER empresa
 * 
 * Prioridade:
 * 1. company.lead_source (campo direto)
 * 2. company.data_source (campo existente)
 * 3. company.raw_data.source (JSONB)
 * 4. company.raw_data.lead_source (JSONB)
 * 5. Inferir de outros campos (apollo_id → 'apollo_direct', etc.)
 */

export function getLeadSource(company: any): string {
  // 1️⃣ CAMPO DIRETO (prioridade máxima)
  if (company.lead_source) {
    return normalizeLeadSource(company.lead_source);
  }
  
  // 2️⃣ DATA_SOURCE (campo existente)
  if (company.data_source) {
    return normalizeLeadSource(company.data_source);
  }
  
  // 3️⃣ RAW_DATA.SOURCE (JSONB)
  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data))
    ? company.raw_data as Record<string, any>
    : {};
  
  if (rawData.lead_source) {
    return normalizeLeadSource(rawData.lead_source);
  }
  
  if (rawData.source) {
    return normalizeLeadSource(rawData.source);
  }
  
  // 4️⃣ INFERIR DE OUTROS CAMPOS
  if (rawData.apollo_id && !rawData.dealer_discovery) {
    return 'Apollo.io Direto';
  }
  
  if (rawData.dealer_discovery || rawData.dealer_discovery_realtime) {
    return 'Export Dealers (B2B)';
  }
  
  if (rawData.panjiva_id || rawData.panjiva_data) {
    return 'Panjiva';
  }
  
  if (rawData.imported_at || rawData.csv_import) {
    return 'Importação CSV/XLS';
  }
  
  // 5️⃣ FALLBACK
  return 'Cadastro Manual';
}

/**
 * Normaliza códigos de fonte para nomes comerciais
 */
function normalizeLeadSource(source: string): string {
  const sourceLower = source.toLowerCase().trim();
  
  const mapping: Record<string, string> = {
    'dealer_discovery': 'Export Dealers (B2B)',
    'dealer_discovery_realtime': 'Export Dealers (B2B)',
    'export_dealers': 'Export Dealers (B2B)',
    'panjiva': 'Panjiva',
    'motor_trade': 'Motor Trade',
    'sala_global_b2b': 'Sala Global B2B',
    'sala_global': 'Sala Global B2B',
    'csv_upload': 'Importação CSV/XLS',
    'csv': 'Importação CSV/XLS',
    'xls': 'Importação CSV/XLS',
    'manual': 'Cadastro Manual',
    'importgenius': 'ImportGenius',
    'volza': 'Volza',
    'apollo_direct': 'Apollo.io Direto',
    'apollo': 'Apollo.io Direto'
  };
  
  return mapping[sourceLower] || source; // Se não mapeado, retornar original
}
```

### **2. Função Helper: `getCountryWithFallback(company: any): string`**

```typescript
/**
 * Função: getCountryWithFallback(company: any): string
 * 
 * Extrai país com MÚLTIPLOS FALLBACKS para garantir que sempre retorne algo
 * 
 * Prioridade:
 * 1. company.country (campo direto) ← PRINCIPAL
 * 2. company.raw_data.apollo_organization.country (Apollo)
 * 3. company.raw_data.apollo_organization.headquarters_country
 * 4. company.location.country (JSONB)
 * 5. company.raw_data.receita_federal.pais (Brasil apenas)
 * 6. Inferir de website (.br → Brasil, .us → United States, etc.)
 * 7. 'N/A' (último recurso)
 */

export function getCountryWithFallback(company: any): string {
  // 1️⃣ CAMPO DIRETO (prioridade máxima)
  if (company.country && company.country !== 'N/A') {
    return company.country.trim();
  }
  
  // 2️⃣ RAW_DATA.APOLLO_ORGANIZATION
  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data))
    ? company.raw_data as Record<string, any>
    : {};
  
  if (rawData.apollo_organization?.country) {
    return rawData.apollo_organization.country.trim();
  }
  
  if (rawData.apollo_organization?.headquarters_country) {
    return rawData.apollo_organization.headquarters_country.trim();
  }
  
  // 3️⃣ LOCATION JSONB
  if (company.location?.country && company.location.country !== 'N/A') {
    return company.location.country.trim();
  }
  
  // 4️⃣ RECEITA FEDERAL (Brasil apenas)
  if (rawData.receita_federal?.pais) {
    return rawData.receita_federal.pais.trim();
  }
  
  // 5️⃣ INFERIR DE WEBSITE (fallback inteligente)
  const website = company.website || company.domain || rawData.domain || '';
  if (website) {
    const inferred = inferCountryFromDomain(website);
    if (inferred) return inferred;
  }
  
  // 6️⃣ ÚLTIMO RECURSO
  return 'N/A';
}

/**
 * Infere país baseado no domínio (.br, .us, .cn, etc.)
 */
function inferCountryFromDomain(domain: string): string | null {
  const domainLower = domain.toLowerCase();
  
  const domainMapping: Record<string, string> = {
    '.br': 'Brasil',
    '.us': 'United States',
    '.uk': 'United Kingdom',
    '.ca': 'Canada',
    '.mx': 'Mexico',
    '.ar': 'Argentina',
    '.cl': 'Chile',
    '.co': 'Colombia',
    '.pe': 'Peru',
    '.cn': 'China',
    '.jp': 'Japan',
    '.kr': 'South Korea',
    '.au': 'Australia',
    '.nz': 'New Zealand',
    '.de': 'Germany',
    '.fr': 'France',
    '.it': 'Italy',
    '.es': 'Spain',
    '.nl': 'Netherlands'
    // ... adicionar mais conforme necessário
  };
  
  for (const [ext, country] of Object.entries(domainMapping)) {
    if (domainLower.includes(ext)) {
      return country;
    }
  }
  
  return null;
}
```

---

## 📐 ORDEM FINAL PADRONIZADA (TODAS AS TABELAS)

### **Colunas Padronizadas:**

```
1. ☑️ Checkbox
2. 🏢 Empresa (com ChevronDown)
3. 📍 Localização (Cidade + País) ← NOVA
4. 🌍 Bloco ← NOVA
5. 📊 Lead Source ← NOVA (antes era "Origem")
6. 🏭 Setor/Indústria
7. 📊 Score ICP
8. ✅ Status Análise (%)
9. 🔍 SCI (Strategic Commercial Intelligence)
10. 🌐 Website
11. ⚙️ Ações
```

---

## 🔄 PONTOS DE ENTRADA: Registro de Lead Source

### **1. Export Dealers (`dealerToCompanyFlow.ts`)**

```typescript
// ✅ JÁ TEM: data_source: 'dealer_discovery'
// ✅ ADICIONAR: lead_source: 'Export Dealers (B2B)'

const companiesToInsert = dealers.map(dealer => ({
  // ... campos existentes ...
  data_source: 'dealer_discovery', // Manter (retrocompatibilidade)
  lead_source: 'Export Dealers (B2B)', // ← NOVO
  raw_data: {
    // ... dados existentes ...
    source: 'dealer_discovery_realtime',
    lead_source: 'Export Dealers (B2B)', // ← NOVO
  }
}));
```

### **2. Panjiva (Futuro - quando integrar)**

```typescript
// ✅ ADICIONAR quando implementar Panjiva
const companiesToInsert = panjivaCompanies.map(company => ({
  // ... campos ...
  data_source: 'panjiva',
  lead_source: 'Panjiva', // ← NOVO
  raw_data: {
    panjiva_id: company.id,
    lead_source: 'Panjiva', // ← NOVO
  }
}));
```

### **3. CSV Upload (`bulk-upload-companies`)**

```typescript
// ✅ JÁ TEM: source_name, source_type
// ✅ ADICIONAR: lead_source: 'Importação CSV/XLS'

const companyData = {
  // ... campos existentes ...
  source_name: metadata?.source_name || 'CSV Upload',
  source_type: 'csv',
  lead_source: 'Importação CSV/XLS', // ← NOVO
  raw_data: {
    imported_at: new Date().toISOString(),
    csv_import: true,
    lead_source: 'Importação CSV/XLS', // ← NOVO
  }
};
```

### **4. Motor Trade (`globalToCompanyFlow.ts`)**

```typescript
// ✅ ADICIONAR quando transferir de global_companies
const companiesToInsert = globalCompanies.map(global => ({
  // ... campos ...
  data_source: global.source || 'motor_trade',
  lead_source: getLeadSourceFromGlobal(global), // ← NOVO
  raw_data: {
    // ... dados ...
    lead_source: getLeadSourceFromGlobal(global), // ← NOVO
  }
}));

function getLeadSourceFromGlobal(global: GlobalCompany): string {
  if (global.sources?.includes('panjiva')) return 'Panjiva';
  if (global.sources?.includes('trade')) return 'Motor Trade';
  if (global.sources?.includes('b2b')) return 'Sala Global B2B';
  return 'Motor Trade'; // Default
}
```

### **5. Cadastro Manual**

```typescript
// ✅ ADICIONAR em DealFormDialog, CompanyForm, etc.
const companyData = {
  // ... campos ...
  lead_source: 'Cadastro Manual', // ← NOVO
  raw_data: {
    manual_entry: true,
    lead_source: 'Cadastro Manual', // ← NOVO
  }
};
```

---

## 🎯 IMPLEMENTAÇÃO: FUNÇÕES HELPERS UNIFICADAS

### **Arquivo: `src/lib/utils/leadSourceHelpers.ts`**

```typescript
/**
 * HELPERS UNIFICADOS: Lead Source + Bloco + Localização
 * 
 * Funções reutilizáveis para todas as tabelas
 */

import { LEAD_SOURCES, COMMERCIAL_BLOCKS, getCommercialBlock, getContinent } from '@/data/leadSources';

/**
 * Extrai Lead Source de qualquer empresa
 */
export function getLeadSource(company: any): string {
  // ... implementação acima ...
}

/**
 * Extrai País com múltiplos fallbacks
 */
export function getCountryWithFallback(company: any): string {
  // ... implementação acima ...
}

/**
 * Extrai Cidade com múltiplos fallbacks
 */
export function getCityWithFallback(company: any): string {
  // ... similar ao getCountryWithFallback ...
}

/**
 * Extrai Localização completa (Cidade + País)
 */
export function getLocationDisplay(company: any): { city: string; country: string } {
  return {
    city: getCityWithFallback(company),
    country: getCountryWithFallback(company)
  };
}

/**
 * Extrai Bloco Comercial baseado no país
 */
export function getCommercialBlockDisplay(company: any): string {
  const country = getCountryWithFallback(company);
  return getCommercialBlock(country);
}

/**
 * Extrai Continente baseado no país
 */
export function getContinentDisplay(company: any): string {
  const country = getCountryWithFallback(company);
  return getContinent(country);
}
```

---

## 📊 VISUALIZAÇÃO: COLUNAS NAS TABELAS

### **Coluna "Lead Source"**

```tsx
<TableHead>
  <ColumnFilter
    column="lead_source"
    title="Lead Source"
    values={companies.map(c => getLeadSource(c))}
    selectedValues={filterLeadSource}
    onFilterChange={setFilterLeadSource}
    onSort={() => handleSort('lead_source')}
  />
</TableHead>

<TableCell>
  <Badge variant="secondary" className="w-fit">
    {getLeadSource(company)}
  </Badge>
</TableCell>
```

### **Coluna "Bloco"**

```tsx
<TableHead>
  <ColumnFilter
    column="commercial_block"
    title="Bloco"
    values={companies.map(c => getCommercialBlockDisplay(c))}
    selectedValues={filterBlock}
    onFilterChange={setFilterBlock}
    onSort={() => handleSort('commercial_block')}
  />
</TableHead>

<TableCell>
  <Badge variant="outline" className="w-fit">
    {getCommercialBlockDisplay(company)}
  </Badge>
</TableCell>
```

---

## ✅ PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Estrutura Base (2 dias)**
1. ✅ Criar arquivo `src/data/leadSources.ts` (LEAD_SOURCES + COMMERCIAL_BLOCKS)
2. ✅ Criar arquivo `src/lib/utils/leadSourceHelpers.ts` (funções helpers)
3. ✅ Função `getCountryWithFallback()` (garantir país sempre)
4. ✅ Função `getLeadSource()` (extrair fonte)
5. ✅ Função `getCommercialBlock()` (identificar bloco)

### **FASE 2: Registro de Lead Source (2 dias)**
1. ✅ Atualizar `dealerToCompanyFlow.ts` (Export Dealers)
2. ✅ Atualizar `bulk-upload-companies` (CSV)
3. ✅ Atualizar `globalToCompanyFlow.ts` (Motor Trade)
4. ✅ Atualizar formulários manuais (DealFormDialog, etc.)
5. ✅ Preparar estrutura para Panjiva (quando integrar)

### **FASE 3: Adicionar Colunas nas Tabelas (1 dia)**
1. ✅ Adicionar coluna "Lead Source" após "Localização"
2. ✅ Adicionar coluna "Bloco" após "Localização"
3. ✅ Atualizar filtros (ColumnFilter)
4. ✅ Atualizar ordenação

### **FASE 4: Testes e Validação (1 dia)**
1. ✅ Testar extração de país (múltiplos cenários)
2. ✅ Testar identificação de bloco (todos os países)
3. ✅ Testar filtros por Lead Source e Bloco
4. ✅ Validar dados existentes (retrocompatibilidade)

---

## 🎯 BENEFÍCIOS

### **Para o Usuário:**
- ✅ **Rastreabilidade Completa**: Sempre saber de onde veio cada lead
- ✅ **Filtragem Avançada**: Filtrar por país, bloco ou fonte
- ✅ **Análise Geopolítica**: Trabalhar por blocos comerciais
- ✅ **Dados Consistentes**: País sempre preenchido

### **Para o Sistema:**
- ✅ **Padronização**: Todas as tabelas com mesmas colunas
- ✅ **Escalabilidade**: Fácil adicionar novas fontes
- ✅ **Integração**: Preparado para Panjiva e outras APIs
- ✅ **Retrocompatibilidade**: Dados existentes preservados

---

## 🚀 PRÓXIMO PASSO

**Aguardando sua aprovação para começar a FASE 1!**

Posso começar implementando:
1. Estrutura de dados (LEAD_SOURCES + COMMERCIAL_BLOCKS)
2. Funções helpers unificadas
3. Garantir extração de país sempre

Deseja alguma alteração nas recomendações?
