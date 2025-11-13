# 🎯 PROMPT COMPLETO PARA CURSOR - SISTEMA CARD EXPANSÍVEL 100% AUTOMATIZADO

> **Cole este prompt no Cursor para replicar o sistema completo em outro projeto (Prospect-V2)**

---

## 📋 OBJETIVO

Implementar sistema de **CARD EXPANSÍVEL** + **AUTO-ENRIQUECIMENTO APOLLO** com:

✅ Card expansível (2 colunas) com todos os dados da empresa  
✅ Auto-enriquecimento ao salvar (Export Dealers/CSV)  
✅ Botão "Auto-Enriquecer Todas" (lote)  
✅ Lápis ✏️ em TODOS os campos editáveis  
✅ Merge inteligente (NUNCA perde dados)  
✅ Proteção manual > auto  
✅ Reload automático após enriquecimento  

---

## 🚀 IMPLEMENTAÇÃO COMPLETA (SIGA ESTA ORDEM)

### **PASSO 1: BANCO DE DADOS (SQL)**

Execute no Supabase SQL Editor:

```sql
-- 1. Adicionar campos novos
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_companies_raw_data 
ON public.companies USING gin(raw_data);

CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
ON public.companies(enrichment_source);

-- 3. Criar tabela decision_makers (se não existir)
CREATE TABLE IF NOT EXISTS public.decision_makers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  classification TEXT, -- CEO, VP, Director, Manager, Other
  seniority_level TEXT,
  data_source TEXT DEFAULT 'manual', -- apollo_auto, apollo_manual, manual
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_makers_company 
ON public.decision_makers(company_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_decision_makers_unique 
ON public.decision_makers(company_id, email, name);
```

---

### **PASSO 2: TYPESCRIPT TYPES**

Atualizar `src/integrations/supabase/types.ts`:

```typescript
export interface Company {
  id: string;
  tenant_id: string;
  workspace_id: string;
  company_name: string;
  website?: string;
  industry?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  linkedin_url?: string;
  apollo_id?: string;
  data_source?: string;
  enrichment_source?: 'auto' | 'manual' | null;
  enriched_at?: string;
  raw_data?: {
    fit_score?: number;
    type?: string;
    notes?: string;
    linkedin_url?: string;
    apollo_id?: string;
    apollo_link?: string;
    auto_enrich_method?: 'DOMAIN' | 'NAME_LOCATION';
    decision_makers?: Array<{
      name: string;
      title: string;
      email?: string;
      linkedin_url?: string;
      apollo_link?: string;
      classification?: string;
    }>;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}
```

---

### **PASSO 3: EDGE FUNCTION (Auto-Enriquecimento)**

Criar `supabase/functions/auto-enrich-apollo/index.ts`:

**⚠️ CÓDIGO COMPLETO:** Ver arquivo `supabase/functions/auto-enrich-apollo/index.ts` no repositório Trade Intelligence.

**Resumo da lógica:**
```typescript
serve(async (req) => {
  // 1. Receber: companyId, companyName, city, state, country, website
  
  // 2. Escolher estratégia:
  if (website) {
    // Busca por DOMAIN (95%+ precisão)
    apolloQuery = { domain: "example.com" };
  } else {
    // Busca por NOME + LOCALIZAÇÃO (85%+ precisão)
    apolloQuery = {
      q_organization_name: companyName,
      organization_locations: [`${city}, ${state}, ${country}`]
    };
  }
  
  // 3. Chamar Apollo Search API
  const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_companies/search', ...);
  
  // 4. Buscar decisores da empresa
  const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', ...);
  
  // 5. Classificar decisores (CEO, VP, Director...)
  const decisores = people.map(classifyDecisionMaker).sort().slice(0, 10);
  
  // 6. MERGE INTELIGENTE (preserva dados existentes)
  const existingCompany = await supabase.from('companies').select('*').eq('id', companyId).single();
  
  const updateData = {
    apollo_id: existingCompany.apollo_id || org.id, // Só adiciona se vazio
    linkedin_url: existingCompany.linkedin_url || org.linkedin_url,
    description: existingCompany.description || org.description,
    enrichment_source: 'auto',
    raw_data: { ...existingRawData, ...newData }, // Merge profundo
  };
  
  // 7. Salvar e retornar
  await supabase.from('companies').update(updateData).eq('id', companyId);
  
  return { success: true, decisores: decisores.length };
});
```

**Deploy:**
```bash
supabase functions deploy auto-enrich-apollo --no-verify-jwt
supabase secrets set APOLLO_API_KEY=your_key
```

---

### **PASSO 4: HOOK REACT QUERY**

Criar `src/hooks/useCompanies.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Company } from '@/integrations/supabase/types';

export const useCompanies = (workspaceId?: string) => {
  return useQuery({
    queryKey: ['companies', workspaceId],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as Company[];
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
};
```

---

### **PASSO 5: PÁGINA PRINCIPAL (Card Expansível)**

Criar `src/pages/CompaniesManagementPage.tsx`:

**⚠️ CÓDIGO COMPLETO:** Ver arquivo do repositório Trade Intelligence.

**Estrutura resumida:**

```typescript
export default function CompaniesManagementPage() {
  const { data: companies = [], refetch } = useCompanies();
  const navigate = useNavigate();
  
  // Estado de expansão
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);
  
  // Estado de auto-enriquecimento
  const [isAutoEnriching, setIsAutoEnriching] = useState(false);
  
  // Função de auto-enriquecimento em lote
  const handleAutoEnrichAll = async () => {
    const toEnrich = companies.filter(c => !c.apollo_id || c.enrichment_source === 'auto');
    
    for (const company of toEnrich) {
      await supabase.functions.invoke('auto-enrich-apollo', {
        body: {
          companyId: company.id,
          companyName: company.company_name,
          city: company.city,
          state: company.state,
          country: company.country,
          website: company.website,
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay
    }
    
    await refetch();
  };
  
  return (
    <div>
      {/* Botão de auto-enriquecimento */}
      <Button onClick={handleAutoEnrichAll} disabled={isAutoEnriching}>
        <Sparkles /> Auto-Enriquecer Todas
      </Button>
      
      {/* Tabela com cards expansíveis */}
      <Table>
        <TableBody>
          {companies.map((company) => (
            <>
              {/* Linha principal */}
              <TableRow>
                <TableCell>
                  <Button onClick={() => toggleRow(company.id)}>
                    {expandedRow === company.id ? <ChevronDown /> : <ChevronRight />}
                  </Button>
                </TableCell>
                <TableCell>{company.company_name}</TableCell>
              </TableRow>
              
              {/* Linha expandida (card) */}
              {expandedRow === company.id && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          
                          {/* COLUNA ESQUERDA */}
                          <div>
                            {/* Informações Gerais */}
                            {/* Localização */}
                            {/* Descrição (com lápis ✏️) */}
                          </div>
                          
                          {/* COLUNA DIREITA */}
                          <div>
                            {/* Fit Score */}
                            {/* Links Externos (Website ✏️, LinkedIn ✏️, Apollo ✏️) */}
                            {/* Decisores (sempre visível) */}
                          </div>
                          
                        </div>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**⚠️ IMPORTANTE:** Código completo está em `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` → Seção 5.

---

### **PASSO 6: AUTO-ENRIQUECIMENTO AO SALVAR**

Atualizar `src/services/dealerToCompanyFlow.ts`:

Após inserir empresas, adicionar:

```typescript
// ETAPA 2.5: Auto-enriquecimento automático
if (companies && companies.length > 0) {
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const dealer = dealers[i];
    
    await supabase.functions.invoke('auto-enrich-apollo', {
      body: {
        companyId: company.id,
        companyName: company.company_name,
        city: dealer.city,
        state: dealer.state,
        country: dealer.country,
        website: dealer.website,
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

---

### **PASSO 7: PÁGINA INDIVIDUAL (CompanyDetailPage)**

Atualizar `handleEnrichApollo`:

```typescript
const handleEnrichApollo = async (apolloOrgId?: string) => {
  try {
    // Chamar Edge Function
    const { data, error } = await supabase.functions.invoke('enrich-apollo-decisores', {
      body: {
        company_id: id,
        companyId: id,
        company_name: company?.company_name || company?.name,
        companyName: company?.company_name || company?.name,
        apollo_org_id: apolloOrgId,
        modes: ['people', 'company'],
      }
    });
    
    if (error) throw error;
    
    // Marcar como manual (protege)
    await supabase
      .from('companies')
      .update({ 
        enrichment_source: 'manual',
        enriched_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    // Invalidar + Refetch
    await queryClient.invalidateQueries({ queryKey: ['company-detail', id] });
    await queryClient.invalidateQueries({ queryKey: ['decision_makers', id] });
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
    
    await queryClient.refetchQueries({ queryKey: ['company-detail', id] });
    await queryClient.refetchQueries({ queryKey: ['decision_makers', id] });
    
    toast.success('Decisores enriquecidos! Recarregando...');
    
    // Reload automático
    setTimeout(() => window.location.reload(), 1500);
    
  } catch (e) {
    toast.error('Erro ao enriquecer');
  }
};
```

---

## ✅ FEATURES IMPLEMENTADAS

### **1. Card Expansível (UI)**

```
[▶] Empresa | País | Indústria | Fit Score
                ↓ CLIQUE
[▼] Empresa | País | Indústria | Fit Score
┌────────────────────────────────────────┐
│ COLUNA ESQUERDA    │ COLUNA DIREITA    │
│ Informações        │ Fit Score         │
│ Localização        │ Links (✏️ todos)  │
│ Descrição ✏️       │ Decisores         │
└────────────────────────────────────────┘
```

---

### **2. Lápis ✏️ em Todos os Campos**

```
✏️ Website    → Editar URL
✏️ LinkedIn   → Editar URL
✏️ Apollo     → Editar ID
✏️ Descrição  → Editar texto

Todos levam para página individual (/company/:id)
```

---

### **3. Auto-Enriquecimento (3 formas)**

```
A) AO SALVAR (Export Dealers/CSV):
   Salvar → Auto-enriquece automaticamente

B) BOTÃO EM LOTE (/companies):
   Clicar "Auto-Enriquecer Todas" → Processa 100%

C) MANUAL (Página individual):
   Lápis ✏️ → Cola Apollo URL → Enriquece
```

---

### **4. Badges e Indicadores**

```
[🤖 AUTO]     → Auto-enriquecido (pode refinar)
[✅ VALIDADO] → Validado manualmente (protegido)
Sem badge     → Não enriquecido ainda
```

---

### **5. Merge Inteligente**

```
✅ SÓ adiciona campos VAZIOS
✅ NUNCA sobrescreve dados existentes
✅ Preserva raw_data completo
✅ Protege dados "manual"
```

---

## 🔧 TROUBLESHOOTING

### Problema: Decisores não aparecem após enriquecer

**Solução:**
1. Verificar console (F12) → Deve ter logs:
   ```
   [CompanyDetail] ✅ Apollo retornou: {...}
   [CompanyDetail] 📊 Decisores encontrados: 7
   [CompanyDetail] 💾 Decisores salvos: 7
   [CompanyDetail] 🔄 Invalidando cache...
   [CompanyDetail] ⚡ Fazendo refetch forçado...
   [CompanyDetail] 🎉 Refetch concluído!
   ```

2. Se não aparecer, fazer hard refresh: Ctrl+Shift+R

3. Se ainda não aparecer, verificar SQL:
   ```sql
   SELECT 
     company_name,
     apollo_id,
     linkedin_url,
     enrichment_source,
     raw_data->'decision_makers' as decisores
   FROM companies
   WHERE id = 'company-id-here';
   ```

---

### Problema: "Card não expande"

**Solução:**
```typescript
// Verificar stopPropagation no botão:
<Button onClick={(e) => {
  e.stopPropagation(); // IMPORTANTE!
  toggleRow(company.id);
}}>
```

---

### Problema: "CORS Error"

**Solução:**
```typescript
// Em TODAS as Edge Functions, adicionar:
if (req.method === 'OPTIONS') {
  return new Response('ok', { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } 
  });
}
```

---

## ✅ CHECKLIST FINAL

```
[ ] SQL executado (raw_data, enrichment_source, etc.)
[ ] Tabela decision_makers criada
[ ] TypeScript types atualizados
[ ] Edge Function auto-enrich-apollo deployada
[ ] Apollo API Key configurada (supabase secrets)
[ ] Hook useCompanies criado
[ ] CompaniesManagementPage criada
[ ] dealerToCompanyFlow.ts atualizado (auto-enrich ao salvar)
[ ] CompanyDetailPage.tsx atualizado (handleEnrichApollo com reload)
[ ] Lápis ✏️ em Website
[ ] Lápis ✏️ em LinkedIn
[ ] Lápis ✏️ em Apollo
[ ] Lápis ✏️ em Descrição
[ ] Badge [AUTO] / [VALIDADO]
[ ] Teste: Expansão funciona
[ ] Teste: Auto-enriquecimento funciona
[ ] Teste: Reload automático funciona
[ ] Teste: Decisores aparecem após enriquecer
[ ] npm run build → SEM ERROS
[ ] Deploy em produção
```

---

## 📚 ARQUIVOS DE REFERÊNCIA

| Arquivo | Conteúdo |
|---------|----------|
| `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` | Código completo do card (15+ páginas) |
| `DOCUMENTACAO_AUTO_ENRIQUECIMENTO_COMPLETA.md` | Edge Function + Auto-enriquecimento |
| `SISTEMA_100_AUTOMATIZADO_COMPLETO_FINAL.md` | Resumo final do sistema |
| `CHEATSHEET_CARD_EXPANSIVEL.md` | Referência rápida |

---

## 🎯 RESULTADO FINAL

Após implementação, você terá:

```
✅ Export Dealers B2B → Salvar → AUTO-ENRIQUECE (LinkedIn + Apollo + Decisores)
✅ CSV Upload → Salvar → AUTO-ENRIQUECE
✅ Botão "Auto-Enriquecer Todas" → Processa 100+ empresas em lote
✅ Lápis ✏️ em todos os campos → Edita individualmente
✅ Badge [AUTO] / [VALIDADO] → Indica origem
✅ Merge inteligente → NUNCA perde dados
✅ Proteção manual → Dados validados são protegidos
✅ Reload automático → Decisores aparecem imediatamente
```

---

**🚀 TEMPO DE IMPLEMENTAÇÃO:**

- **Iniciante:** 3-4 horas
- **Intermediário:** 1-2 horas
- **Avançado:** 30 minutos - 1 hora

---

**⚡ COLE ESTE PROMPT NO CURSOR E COMECE!**

**Versão:** 3.0 Final - 100% Automatizado  
**Data:** 2025-11-13  
**Projeto:** OLV Trade Intelligence

