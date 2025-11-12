# 🔧 CORREÇÕES URGENTES - OLV TRADE INTELLIGENCE

## 🎯 **PROBLEMAS CRÍTICOS IDENTIFICADOS:**

1. ❌ **SaveBar não alerta** ao sair sem salvar
2. ❌ **Dealers não salvam** na tabela companies
3. ❌ **Dados perdem** ao trocar tab/sidebar
4. ❌ **Busca Apollo traz B2C** (studios, blogs)
5. ❌ **Company Detail Page** só aceita dados Receita Federal
6. ❌ **Fluxo quebrado:** Dealers → Companies → Quarentena

---

## ✅ **CORREÇÕES A APLICAR (EM ORDEM):**

---

### **CORREÇÃO 1: Hook useUnsavedChanges (CRÍTICO!)** ⚠️

**Criar arquivo:** `src/hooks/useUnsavedChanges.ts`

```typescript
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook para proteger contra perda de dados não salvos
 * 
 * USO:
 * const [hasChanges, setHasChanges] = useState(false);
 * useUnsavedChanges(hasChanges);
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  // Block React Router navigation
  const blocker = useBlocker(hasUnsavedChanges);
  
  // Block browser navigation (refresh, close tab)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
  
  // Show modal when React Router blocks
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        '⚠️ ATENÇÃO!\n\nVocê tem resultados de busca NÃO SALVOS.\n\n' +
        'Se sair agora, vai PERDER os dados E os créditos Apollo gastos!\n\n' +
        'Deseja realmente sair SEM SALVAR?'
      );
      
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}
```

---

### **CORREÇÃO 2: Aplicar useUnsavedChanges em DealerDiscoveryPage**

**Modificar:** `src/pages/ExportDealersPage.tsx` (ou nome correto)

**Adicionar:**

```typescript
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

export default function ExportDealersPage() {
  const [dealers, setDealers] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // PROTEÇÃO CONTRA PERDA DE DADOS
  useUnsavedChanges(hasUnsavedChanges);
  
  const handleSearch = async (filters: any) => {
    // Buscar dealers
    const results = await searchDealers(filters);
    setDealers(results);
    
    // MARCAR COMO NÃO SALVO
    setHasUnsavedChanges(true);
    
    // AVISAR USUÁRIO
    toast({
      title: '⚠️ Resultados carregados',
      description: `${results.length} dealers encontrados. SALVE antes de sair para não perder os créditos Apollo!`,
      duration: 10000, // 10 segundos visível
    });
  };
  
  const handleSave = async () => {
    // Salvar dealers → companies
    await saveDealersToCompanies(dealers);
    
    // MARCAR COMO SALVO
    setHasUnsavedChanges(false);
    
    toast({
      title: '✅ Dealers salvos!',
      description: `${dealers.length} empresas salvas em Companies`,
    });
  };
  
  return (
    // ... resto do componente
    
    // Botão SALVAR sempre visível
    {dealers.length > 0 && (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleSave}
          size="lg"
          className="bg-green-600 hover:bg-green-700 shadow-lg"
        >
          💾 Salvar {dealers.length} Dealers ({hasUnsavedChanges ? 'NÃO SALVO!' : 'Salvo'})
        </Button>
      </div>
    )}
  );
}
```

---

### **CORREÇÃO 3: Função saveDealersToCompanies (FLUXO CORRETO)**

**Criar:** `src/services/dealerToCompanyFlow.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface Dealer {
  name: string;
  website?: string;
  country: string;
  employeeCount?: number;
  revenue?: string;
  industry?: string;
  description?: string;
  linkedinUrl?: string;
  apolloId?: string;
  b2bType?: 'distributor' | 'wholesaler' | 'importer' | 'retailer';
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * FLUXO COMPLETO: Dealers → Companies → Quarentena
 */
export async function saveDealersToCompanies(dealers: Dealer[]) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  console.log(`💾 Salvando ${dealers.length} dealers...`);
  
  // ETAPA 1: Inserir em COMPANIES
  const companiesToInsert = dealers.map(dealer => ({
    // Campos obrigatórios
    razao_social: dealer.name,
    nome_fantasia: dealer.name,
    
    // CNPJ null para internacionais
    cnpj: null,
    
    // Dados internacionais
    country: dealer.country,
    website: dealer.website,
    description: dealer.description,
    
    // Tamanho e receita
    employees_count: dealer.employeeCount,
    revenue_range: dealer.revenue,
    
    // Classificação
    industry: dealer.industry,
    b2b_type: dealer.b2bType,
    
    // Source tracking
    source: 'dealer_discovery',
    origem: 'apollo_international',
    
    // Raw data
    raw_data: {
      apollo_id: dealer.apolloId,
      linkedin_url: dealer.linkedinUrl,
      search_date: new Date().toISOString(),
      b2b_validated: true,
    },
    
    // Metadata
    created_by: user.id,
  }));
  
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .upsert(companiesToInsert, {
      onConflict: 'website', // Evita duplicatas por website
      ignoreDuplicates: false
    })
    .select('id, razao_social, country');
  
  if (companyError) {
    console.error('❌ Erro ao salvar companies:', companyError);
    throw companyError;
  }
  
  console.log(`✅ ${companies.length} companies salvas`);
  
  // ETAPA 2: Enviar para QUARENTENA (ICP Analysis)
  const quarantineEntries = companies.map(company => ({
    company_id: company.id,
    cnpj: null,
    razao_social: company.razao_social,
    status: 'pendente',
    temperatura: 'warm', // Dealers já são pré-qualificados
    icp_score: 65, // Score inicial para dealers internacionais
    source: 'dealer_discovery',
    raw_analysis: {
      auto_validated: true,
      b2b_confirmed: true,
      origin: 'international_dealer',
      country: company.country,
      needs_enrichment: true,
    }
  }));
  
  const { error: quarentenaError } = await supabase
    .from('icp_analysis_results')
    .insert(quarantineEntries);
  
  if (quarentenaError) {
    console.error('⚠️ Erro ao enviar para quarentena:', quarentenaError);
    // Não throw - companies já foram salvos
  }
  
  console.log(`✅ ${companies.length} empresas enviadas para Quarentena`);
  
  // ETAPA 3: Criar contatos (se tiver email/phone)
  const contactsToInsert = dealers
    .filter(d => d.contactEmail || d.contactPhone)
    .map((dealer, index) => {
      const companyId = companies[index]?.id;
      return {
        company_id: companyId,
        company_name: dealer.name,
        email: dealer.contactEmail,
        phone: dealer.contactPhone,
        source: 'dealer_discovery',
        created_by: user.id,
      };
    });
  
  if (contactsToInsert.length > 0) {
    await supabase
      .from('contacts')
      .insert(contactsToInsert);
    
    console.log(`✅ ${contactsToInsert.length} contatos salvos`);
  }
  
  return {
    companiesCreated: companies.length,
    quarantineCreated: companies.length,
    contactsCreated: contactsToInsert.length,
  };
}
```

---

### **CORREÇÃO 4: Apollo Filters ULTRA-REFINADOS**

**Modificar:** `src/components/export/DealerDiscoveryForm.tsx`

**Substituir filtros por:**

```typescript
const APOLLO_B2B_FILTERS = {
  // INDUSTRIES (B2B apenas - NÃO usar "Pilates" ou "Fitness Center")
  organization_industry_tag_ids: [
    '5567cd4773696439b10b0000', // Wholesale
    '5567cd4c7369643fc5730100', // Import/Export
    '5567cd4e7369643dafe70d00', // International Trade
    '5567cd4e73696439f11c0000', // Sporting Goods
    '5567cd4f7369643a18df0000', // Sporting Goods Manufacturing
  ],
  
  // KEYWORDS INCLUIR (focar em DISTRIBUIDOR, não produto final)
  q_organization_keyword_tags: [
    // Distribuidores
    'fitness equipment distributor',
    'sporting goods distributor',
    'gym equipment distributor',
    'wellness equipment distributor',
    
    // Importadores
    'fitness equipment importer',
    'sporting goods importer',
    
    // Wholesalers
    'fitness equipment wholesale',
    'sporting goods wholesaler',
    'gym equipment wholesale',
    
    // B2B explícito
    'B2B fitness equipment',
    'bulk fitness equipment',
  ],
  
  // KEYWORDS EXCLUIR (eliminar TODO B2C)
  q_organization_not_keyword_tags: [
    // Studios e academias
    'pilates studio',
    'yoga studio',
    'fitness studio',
    'gym franchise',
    'fitness center',
    'wellness center',
    
    // Profissionais individuais
    'instructor',
    'teacher',
    'trainer',
    'coach',
    'therapist',
    
    // Conteúdo
    'blog',
    'magazine',
    'news',
    'media',
    'publication',
    
    // Educação
    'certification',
    'course',
    'training center',
    'school',
    'academy',
    
    // Varejo final
    'retail store',
    'shop',
    'boutique',
  ],
  
  // TAMANHO (B2B real - eliminar muito pequenos)
  organization_num_employees_ranges: [
    '51,200',    // Small B2B
    '201,500',   // Medium B2B
    '501,1000',  // Large B2B
    '1001,5000', // Enterprise
    '5001,10000' // Large Enterprise
  ],
  
  // RECEITA (eliminar micro-empresas)
  revenue_range: [
    '5000000,10000000',   // $5M-$10M
    '10000000,50000000',  // $10M-$50M
    '50000000,100000000', // $50M-$100M
    '100000000,500000000' // $100M-$500M
  ],
  
  // PAÍSES (TIER 1 - maior potencial)
  organization_locations: [
    'United States',
    'United Kingdom',
    'Germany',
    'Canada',
    'Australia',
    'France',
    'Spain',
    'Italy',
    'Netherlands',
    'Belgium'
  ],
};
```

---

### **CORREÇÃO 5: Company Detail Page - Suportar Internacional**

**Modificar:** `src/pages/CompanyDetailPage.tsx`

**Adicionar lógica:**

```typescript
// Detectar se é empresa brasileira ou internacional
const isBrazilian = company.cnpj && company.cnpj.length > 0;
const isInternational = !isBrazilian;

// Renderizar diferente por tipo
{isBrazilian ? (
  // Dados Receita Federal (já existe)
  <ReceitaFederalSection company={company} />
) : (
  // Dados Internacionais (NOVO!)
  <InternationalCompanySection company={company} />
)}
```

**Criar componente:**

```typescript
// components/companies/InternationalCompanySection.tsx

export function InternationalCompanySection({ company }) {
  return (
    <div className="space-y-4">
      <h3>Informações Internacionais</h3>
      
      {/* Country */}
      <div>
        <Label>País</Label>
        <p>{company.country} {getFlagEmoji(company.country)}</p>
      </div>
      
      {/* Employee Count */}
      <div>
        <Label>Colaboradores</Label>
        <p>{company.employees_count || 'Não informado'}</p>
      </div>
      
      {/* Revenue */}
      <div>
        <Label>Receita</Label>
        <p>{company.revenue_range || 'Não informado'}</p>
      </div>
      
      {/* B2B Type */}
      <div>
        <Label>Tipo B2B</Label>
        <Badge>{company.b2b_type || 'N/A'}</Badge>
      </div>
      
      {/* Industry */}
      <div>
        <Label>Indústria</Label>
        <p>{company.industry || 'Não informado'}</p>
      </div>
      
      {/* Website */}
      {company.website && (
        <div>
          <Label>Website</Label>
          <a href={company.website} target="_blank" className="text-blue-400">
            {company.website}
          </a>
        </div>
      )}
      
      {/* LinkedIn */}
      {company.raw_data?.linkedin_url && (
        <div>
          <Label>LinkedIn</Label>
          <a href={company.raw_data.linkedin_url} target="_blank" className="text-blue-400">
            Ver perfil LinkedIn
          </a>
        </div>
      )}
    </div>
  );
}
```

---

### **CORREÇÃO 6: Migration para Empresas Internacionais**

**Criar:** `supabase/migrations/20251112000000_international_companies.sql`

```sql
-- Adicionar colunas para empresas internacionais
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS employees_count INTEGER,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS b2b_type TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS hunter_domain_data JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- CNPJ deve ser nullable (empresas internacionais)
ALTER TABLE public.companies
  ALTER COLUMN cnpj DROP NOT NULL;

-- Index para buscas
CREATE INDEX IF NOT EXISTS idx_companies_country ON public.companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_b2b_type ON public.companies(b2b_type);
CREATE INDEX IF NOT EXISTS idx_companies_apollo_id ON public.companies(apollo_id);

-- Constraint: Pelo menos um identificador (CNPJ OU website OU apollo_id)
ALTER TABLE public.companies
  ADD CONSTRAINT companies_has_identifier 
  CHECK (
    cnpj IS NOT NULL OR 
    website IS NOT NULL OR 
    apollo_id IS NOT NULL
  );

COMMENT ON COLUMN public.companies.country IS 'País da empresa (código ISO ou nome)';
COMMENT ON COLUMN public.companies.b2b_type IS 'distributor, wholesaler, importer, manufacturer, retailer';
COMMENT ON COLUMN public.companies.employees_count IS 'Número de colaboradores (LinkedIn/Apollo)';
COMMENT ON COLUMN public.companies.revenue_range IS 'Faixa de receita anual (ex: $10M-$50M)';
```

---

### **CORREÇÃO 7: Auto-Save a cada 10 dealers**

**Adicionar em DealerDiscoveryPage:**

```typescript
const [dealers, setDealers] = useState([]);
const [savedCount, setSavedCount] = useState(0);
const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

// Auto-save trigger
useEffect(() => {
  if (!autoSaveEnabled) return;
  
  const unsavedCount = dealers.length - savedCount;
  
  // Auto-save a cada 10 dealers
  if (unsavedCount >= 10) {
    handleAutoSave();
  }
}, [dealers.length, savedCount, autoSaveEnabled]);

const handleAutoSave = async () => {
  const unsaved = dealers.slice(savedCount);
  
  if (unsaved.length === 0) return;
  
  try {
    await saveDealersToCompanies(unsaved);
    setSavedCount(dealers.length);
    
    toast({
      title: '💾 Auto-save',
      description: `${unsaved.length} dealers salvos automaticamente`,
      duration: 3000,
    });
    
  } catch (error) {
    console.error('Auto-save falhou:', error);
    toast({
      title: '⚠️ Auto-save falhou',
      description: 'Salve manualmente para não perder dados',
      variant: 'destructive',
    });
  }
};
```

---

### **CORREÇÃO 8: Company Table Migration (executar no Supabase)**

**APLICAR NO SQL EDITOR:**

```sql
-- URL: https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/sql/new

-- 1. Tornar CNPJ nullable
ALTER TABLE public.companies
  ALTER COLUMN cnpj DROP NOT NULL;

-- 2. Adicionar colunas internacionais
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS employees_count INTEGER,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS b2b_type TEXT CHECK (b2b_type IN ('distributor', 'wholesaler', 'importer', 'manufacturer', 'retailer')),
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Criar index único para apollo_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_apollo_id_unique 
  ON public.companies(apollo_id) 
  WHERE apollo_id IS NOT NULL;

-- 4. Index para country
CREATE INDEX IF NOT EXISTS idx_companies_country 
  ON public.companies(country) 
  WHERE country IS NOT NULL;

-- 5. Index para b2b_type
CREATE INDEX IF NOT EXISTS idx_companies_b2b_type 
  ON public.companies(b2b_type) 
  WHERE b2b_type IS NOT NULL;

-- 6. Constraint: Ao menos um identificador
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_has_identifier;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_has_identifier 
  CHECK (
    (cnpj IS NOT NULL AND cnpj != '') OR 
    (website IS NOT NULL AND website != '') OR 
    (apollo_id IS NOT NULL AND apollo_id != '')
  );

-- Success!
SELECT 'Migration concluida com sucesso!' AS status;
```

---

## 📋 **ORDEM DE EXECUÇÃO:**

### **1. Aplicar Migration SQL** (2 min)
Copie correção 8 → SQL Editor → Run

### **2. Criar Hook useUnsavedChanges** (1 min)
Criar arquivo correção 1

### **3. Criar dealerToCompanyFlow** (2 min)
Criar arquivo correção 3

### **4. Atualizar DealerDiscoveryPage** (5 min)
Aplicar correções 2 e 7

### **5. Criar InternationalCompanySection** (3 min)
Criar componente correção 5

### **6. Atualizar CompanyDetailPage** (2 min)
Aplicar correção 5

### **7. Atualizar Apollo Filters** (2 min)
Aplicar correção 4

### **8. Testar fluxo completo** (5 min)
Buscar → Salvar → Verificar em Companies → Verificar em Quarentena

---

## ⏱️ **TEMPO TOTAL: 20 minutos**

---

## 🎯 **POSSO COMEÇAR?**

Vou aplicar TODAS as 8 correções agora, de forma sistemática e completa!

**Confirma?** 🚀
