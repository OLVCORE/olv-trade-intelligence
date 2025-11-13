# 📦 CARD EXPANSÍVEL DE EMPRESAS - DOCUMENTAÇÃO COMPLETA

> **Guia completo para replicar o sistema de cards expansíveis com informações detalhadas de empresas**

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Estrutura Visual](#estrutura-visual)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Schema do Banco de Dados](#schema-do-banco-de-dados)
5. [Componentes Frontend](#componentes-frontend)
6. [Edge Functions](#edge-functions)
7. [Implementação Passo a Passo](#implementação-passo-a-passo)
8. [Troubleshooting](#troubleshooting)
9. [Testes](#testes)

---

## 🎯 VISÃO GERAL

### O que é?

Sistema de **cards expansíveis** que exibe informações detalhadas de empresas B2B, incluindo:

- ✅ Informações gerais (nome, indústria, origem)
- ✅ Localização (cidade, estado, país)
- ✅ Descrição enriquecida
- ✅ Fit Score para B2B
- ✅ Links externos (Website, LinkedIn, Apollo.io)
- ✅ Decisores/Decision-makers com classificação automática (CEO, VP, Director)

### Por que usar?

- **Compacto:** Mostra apenas nome na tabela principal
- **Expansível:** Clica no ícone e abre os detalhes
- **Organizado:** Dados divididos em seções (2 colunas)
- **Rápido:** Não precisa abrir página separada
- **Escalável:** Funciona para 100+ empresas

---

## 🎨 ESTRUTURA VISUAL

```
┌────────────────────────────────────────────────────────────────────┐
│ LINHA DA TABELA (COLAPSADA)                                       │
├────────────────────────────────────────────────────────────────────┤
│ [▶] WellReformer | USA | sporting goods | 85 | Verificar | ...    │
└────────────────────────────────────────────────────────────────────┘

                              ⬇️ CLIQUE NO ▶️

┌────────────────────────────────────────────────────────────────────┐
│ [▼] WellReformer | USA | sporting goods | 85 | Verificar | ...    │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┬───────────────────────────────┐  │
│ │ 📋 Informações Gerais        │ 🎯 Fit Score                 │  │
│ │ Nome: WellReformer           │ ██████████████░░ 85          │  │
│ │ Indústria: sporting goods    │ 🟢 Excelente fit para B2B   │  │
│ │ Origem: dealer_discovery     │ [Distributor]                │  │
│ │                              │                               │  │
│ │ 📍 Localização               │ 🌐 Links Externos            │  │
│ │ Los Angeles                  │ 🌐 Website                   │  │
│ │ California                   │ 💼 LinkedIn                  │  │
│ │ United States                │ ⭐ Apollo.io                 │  │
│ │                              │ ou [+ Adicionar Apollo ID]   │  │
│ │ 📝 Descrição                 │                               │  │
│ │ Reformer specialist          │ 👥 Decisores (0)             │  │
│ │ 💡 Pode ser enriquecida via  │ Nenhum decisor cadastrado    │  │
│ │    Apollo/LinkedIn           │ [Buscar Decisores no Apollo] │  │
│ └──────────────────────────────┴───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ARQUITETURA DO SISTEMA

### Fluxo de Dados

```
┌─────────────────┐
│  Supabase DB    │ ← Armazena empresas, decisores, raw_data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useCompanies   │ ← React Hook (React Query)
│  (React Query)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Companies       │ ← Página principal
│ ManagementPage  │   - Estado: expandedRow
│                 │   - Função: toggleRow()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Table          │ ← Renderiza linhas
│  (shadcn/ui)    │   - TableRow (colapsada)
│                 │   - TableRow expandida (Card)
└─────────────────┘
```

### Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18+ | Framework frontend |
| TypeScript | 5+ | Tipagem estática |
| Supabase | - | Backend (DB + Edge Functions) |
| React Query | 4+ | Gerenciamento de estado/cache |
| shadcn/ui | - | Componentes UI (Table, Card, Button) |
| Lucide Icons | - | Ícones (Building2, MapPin, Target, etc.) |

---

## 🗄️ SCHEMA DO BANCO DE DADOS

### Tabela: `companies`

```sql
CREATE TABLE public.companies (
  -- IDs e Referências
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
  
  -- Informações Básicas
  company_name TEXT NOT NULL,
  cnpj TEXT,
  website TEXT,
  industry TEXT,
  description TEXT, -- Descrição enriquecida (Apollo/LinkedIn)
  
  -- Localização
  country TEXT,
  state TEXT,
  city TEXT,
  
  -- Métricas
  employee_count INTEGER,
  employees_count INTEGER, -- Alias
  revenue_usd NUMERIC,
  revenue_range TEXT,
  
  -- Links Externos
  linkedin_url TEXT, -- LinkedIn da empresa
  apollo_id TEXT, -- Apollo Organization ID
  
  -- Metadados
  data_source TEXT DEFAULT 'manual', -- 'dealer_discovery', 'csv', 'manual'
  b2b_type TEXT, -- 'Distributor', 'Manufacturer', etc.
  
  -- Normalizador Universal (JSONB)
  raw_data JSONB DEFAULT '{}'::jsonb, -- Armazena TODOS os dados extras
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_companies_tenant ON public.companies(tenant_id);
CREATE INDEX idx_companies_workspace ON public.companies(workspace_id);
CREATE INDEX idx_companies_data_source ON public.companies(data_source);
CREATE INDEX idx_companies_raw_data ON public.companies USING gin(raw_data);
```

### Estrutura do `raw_data` (JSONB)

```json
{
  "fit_score": 85,
  "type": "Distributor",
  "notes": "Reformer specialist",
  "source": "dealer_discovery",
  "validated": true,
  "linkedin_url": "https://linkedin.com/company/wellreformer",
  "apollo_id": "abc123",
  "apollo_link": "https://app.apollo.io/#/companies/abc123",
  "decision_makers": [
    {
      "name": "John Doe",
      "title": "CEO",
      "email": "john@example.com",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "apollo_link": "https://app.apollo.io/#/people/xyz789",
      "classification": "CEO"
    }
  ]
}
```

### Tabela: `decision_makers`

```sql
CREATE TABLE public.decision_makers (
  -- IDs
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- Informações Pessoais
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  
  -- Links
  linkedin_url TEXT,
  apollo_link TEXT,
  
  -- Classificação Automática
  classification TEXT, -- 'CEO', 'VP', 'Director', 'Manager', 'Other'
  seniority_level TEXT, -- 'C-Level', 'VP-Level', 'Director', 'Manager', 'Entry'
  
  -- Metadados
  data_source TEXT DEFAULT 'manual', -- 'apollo', 'linkedin', 'manual'
  raw_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_decision_makers_company ON public.decision_makers(company_id);
CREATE INDEX idx_decision_makers_tenant ON public.decision_makers(tenant_id);
CREATE UNIQUE INDEX idx_decision_makers_unique ON public.decision_makers(company_id, email, name);
```

---

## 🎨 COMPONENTES FRONTEND

### 1. Hook: `useCompanies.ts`

```typescript
// src/hooks/useCompanies.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Company } from '@/integrations/supabase/types';

export const useCompanies = (workspaceId?: string) => {
  return useQuery({
    queryKey: ['companies', workspaceId],
    queryFn: async () => {
      console.log('🔍 [useCompanies] Buscando empresas...', { workspaceId });

      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useCompanies] Erro:', error);
        throw error;
      }

      console.log('✅ [useCompanies] Empresas encontradas:', data?.length);
      console.log('📊 [useCompanies] Primeira empresa:', data?.[0]);

      return data as Company[];
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
```

### 2. Página: `CompaniesManagementPage.tsx`

#### 2.1 Imports e Estados

```typescript
// src/pages/CompaniesManagementPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanies } from '@/hooks/useCompanies';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Globe,
  Target,
  Users,
  Linkedin,
  ExternalLink,
  Mail,
  Edit,
  Plus,
} from 'lucide-react';

export default function CompaniesManagementPage() {
  const navigate = useNavigate();
  const { data: companies = [], isLoading, refetch } = useCompanies();
  
  // Estado para controlar qual linha está expandida
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Função para expandir/colapsar
  const toggleRow = (companyId: string) => {
    setExpandedRow(prev => prev === companyId ? null : companyId);
  };
  
  // ... resto do código
}
```

#### 2.2 Renderização da Tabela

```typescript
return (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-12"></TableHead> {/* Seta */}
        <TableHead>Nome da Empresa</TableHead>
        <TableHead>Localização</TableHead>
        <TableHead>Indústria</TableHead>
        <TableHead>Fit Score</TableHead>
        {/* ... outros headers */}
      </TableRow>
    </TableHeader>
    
    <TableBody>
      {companies.map((company) => (
        <>
          {/* LINHA PRINCIPAL (sempre visível) */}
          <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation(); // Evita bubbling
                  toggleRow(company.id);
                }}
              >
                {expandedRow === company.id ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
            <TableCell>{company.company_name}</TableCell>
            <TableCell>
              {company.country && (
                <div className="text-sm">
                  {company.city && <div>{company.city}</div>}
                  {company.state && <div className="text-muted-foreground">{company.state}</div>}
                  <div className="font-medium">{company.country}</div>
                </div>
              )}
            </TableCell>
            {/* ... outras células */}
          </TableRow>

          {/* LINHA EXPANDIDA (só aparece se expandedRow === company.id) */}
          {expandedRow === company.id && (
            <TableRow>
              <TableCell colSpan={11} className="bg-muted/30 p-0">
                {/* CARD DETALHADO (próxima seção) */}
              </TableCell>
            </TableRow>
          )}
        </>
      ))}
    </TableBody>
  </Table>
);
```

#### 2.3 Card Expandido (2 Colunas)

```typescript
<TableRow>
  <TableCell colSpan={11} className="bg-muted/30 p-0">
    <Card className="border-0 shadow-none">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6">
          
          {/* ========== COLUNA ESQUERDA ========== */}
          <div className="space-y-4">
            
            {/* 1️⃣ INFORMAÇÕES GERAIS */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informações Gerais
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Nome:</span>
                  <span className="font-medium flex-1">{company.company_name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Indústria:</span>
                  <span className="font-medium flex-1">{company.industry || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Origem:</span>
                  <Badge variant="outline" className="flex-1 justify-start w-fit">
                    {(company as any).data_source || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* 2️⃣ LOCALIZAÇÃO */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </h4>
              <div className="space-y-1 text-sm">
                {company.city && <p className="text-muted-foreground">{company.city}</p>}
                {company.state && <p className="text-muted-foreground">{company.state}</p>}
                {company.country && <p className="font-medium">{company.country}</p>}
              </div>
            </div>
            
            {/* 3️⃣ DESCRIÇÃO */}
            {(company.description || (company as any).raw_data?.notes) && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  Descrição
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/${company.id}`);
                    }}
                    title="Editar descrição"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </h4>
                <p className="text-sm text-muted-foreground">
                  {company.description || (company as any).raw_data?.notes}
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  💡 Esta descrição pode ser enriquecida via Apollo/LinkedIn
                </p>
              </div>
            )}
            
          </div>
          
          {/* ========== COLUNA DIREITA ========== */}
          <div className="space-y-4">
            
            {/* 4️⃣ FIT SCORE */}
            {(() => {
              const fitScore = (company as any).raw_data?.fit_score || 0;
              const b2bType = (company as any).raw_data?.type || (company as any).b2b_type;
              
              if (fitScore > 0) {
                return (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Fit Score
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              fitScore >= 80 ? 'bg-green-500' : 
                              fitScore >= 60 ? 'bg-yellow-500' : 
                              'bg-orange-500'
                            }`}
                            style={{ width: `${fitScore}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-2xl font-bold">{fitScore}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {fitScore >= 80 && '🟢 Excelente fit para B2B'}
                      {fitScore >= 60 && fitScore < 80 && '🟡 Bom fit para B2B'}
                      {fitScore < 60 && '🟠 Fit moderado'}
                    </p>
                    {b2bType && (
                      <Badge variant="default" className="mt-2">{b2bType}</Badge>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* 5️⃣ LINKS EXTERNOS */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Links Externos
              </h4>
              <div className="space-y-2">
                {/* WEBSITE */}
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                
                {/* LINKEDIN */}
                {(() => {
                  const linkedinUrl = company.linkedin_url || (company as any).raw_data?.linkedin_url;
                  if (linkedinUrl) {
                    return (
                      <a 
                        href={linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    );
                  }
                  return null;
                })()}
                
                {/* APOLLO */}
                {(() => {
                  const apolloId = company.apollo_id || (company as any).raw_data?.apollo_id;
                  const apolloLink = (company as any).raw_data?.apollo_link || 
                    (apolloId ? `https://app.apollo.io/#/companies/${apolloId}` : null);
                  
                  if (apolloLink) {
                    return (
                      <div className="flex items-center gap-2">
                        <a 
                          href={apolloLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <img 
                            src="https://www.apollo.io/favicon.ico" 
                            alt="Apollo" 
                            className="h-4 w-4" 
                          />
                          Apollo.io
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/company/${company.id}`);
                          }}
                          title="Editar Apollo ID"
                        >
                          <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Button>
                      </div>
                    );
                  }
                  
                  // Se não tem Apollo ID, mostrar botão
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/company/${company.id}`);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Apollo ID
                    </Button>
                  );
                })()}
              </div>
            </div>
            
            {/* 6️⃣ DECISORES - SEMPRE MOSTRAR */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Decisores ({(company as any).raw_data?.decision_makers?.length || 0})
              </h4>
              {(() => {
                const decisores = (company as any).raw_data?.decision_makers || [];
                
                if (decisores.length > 0) {
                  return (
                    <div className="space-y-2">
                      {decisores.slice(0, 5).map((dm: any, idx: number) => (
                        <div key={idx} className="p-2 bg-muted/30 rounded text-xs border">
                          <div className="font-medium">{dm.name}</div>
                          <div className="text-muted-foreground">{dm.title}</div>
                          <div className="flex gap-3 mt-2">
                            {dm.linkedin_url && (
                              <a 
                                href={dm.linkedin_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Linkedin className="h-3 w-3" />
                                LinkedIn
                              </a>
                            )}
                            {dm.apollo_link && (
                              <a 
                                href={dm.apollo_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <img 
                                  src="https://www.apollo.io/favicon.ico" 
                                  alt="Apollo" 
                                  className="h-3 w-3" 
                                />
                                Apollo
                              </a>
                            )}
                            {dm.email && (
                              <a 
                                href={`mailto:${dm.email}`}
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Mail className="h-3 w-3" />
                                Email
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                
                // Se não tem decisores, mostrar mensagem e botão
                return (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-muted-foreground">Nenhum decisor cadastrado</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/company/${company.id}`);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Buscar Decisores no Apollo
                    </Button>
                  </div>
                );
              })()}
            </div>
            
          </div>
        </div>
      </CardContent>
    </Card>
  </TableCell>
</TableRow>
```

---

## ⚙️ EDGE FUNCTIONS

### 1. `enrich-apollo-decisores` (Buscar Decisores do Apollo)

```typescript
// supabase/functions/enrich-apollo-decisores/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  try {
    const { companyId, apolloOrgUrl } = await req.json();

    console.log('🔍 Buscando decisores Apollo:', { companyId, apolloOrgUrl });

    // Extrair Apollo Org ID da URL
    const apolloIdMatch = apolloOrgUrl.match(/companies\/([a-f0-9\-]+)/i);
    const apolloOrgId = apolloIdMatch ? apolloIdMatch[1] : null;

    if (!apolloOrgId) {
      throw new Error('Apollo Organization ID inválido na URL');
    }

    // Buscar dados da empresa no Apollo.io
    const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/enrich', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY || '',
      },
      body: JSON.stringify({
        id: apolloOrgId,
      }),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('❌ Erro Apollo API:', errorText);
      throw new Error(`Apollo API error: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json();
    console.log('✅ Apollo Data:', JSON.stringify(apolloData, null, 2));

    // Extrair informações da empresa
    const companyInfo = {
      apollo_id: apolloOrgId,
      linkedin_url: apolloData.organization?.linkedin_url || null,
      description: apolloData.organization?.short_description || apolloData.organization?.description || null,
    };

    // Extrair decisores
    const people = apolloData.organization?.people || [];
    
    // Classificar decisores por importância
    const classifyDecisionMaker = (title: string) => {
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('ceo') || titleLower.includes('chief executive') || titleLower.includes('founder')) {
        return { classification: 'CEO', priority: 1 };
      }
      if (titleLower.includes('cfo') || titleLower.includes('chief financial')) {
        return { classification: 'CFO', priority: 2 };
      }
      if (titleLower.includes('cto') || titleLower.includes('chief technology')) {
        return { classification: 'CTO', priority: 3 };
      }
      if (titleLower.includes('coo') || titleLower.includes('chief operating')) {
        return { classification: 'COO', priority: 4 };
      }
      if (titleLower.includes('vp') || titleLower.includes('vice president')) {
        return { classification: 'VP', priority: 5 };
      }
      if (titleLower.includes('director') || titleLower.includes('head of')) {
        return { classification: 'Director', priority: 6 };
      }
      if (titleLower.includes('manager')) {
        return { classification: 'Manager', priority: 7 };
      }
      
      return { classification: 'Other', priority: 99 };
    };

    const decisionMakers = people
      .filter((p: any) => p.title) // Apenas com título
      .map((p: any) => ({
        name: `${p.first_name} ${p.last_name}`.trim(),
        title: p.title,
        email: p.email || null,
        linkedin_url: p.linkedin_url || null,
        apollo_link: p.id ? `https://app.apollo.io/#/people/${p.id}` : null,
        ...classifyDecisionMaker(p.title),
      }))
      .sort((a, b) => a.priority - b.priority) // Ordenar por importância
      .slice(0, 10); // Top 10

    console.log('👥 Decisores classificados:', decisionMakers.length);

    // Conectar Supabase
    const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

    // Atualizar empresa com Apollo ID, LinkedIn, Descrição
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        apollo_id: companyInfo.apollo_id,
        linkedin_url: companyInfo.linkedin_url,
        description: companyInfo.description,
        raw_data: supabase.raw(`
          COALESCE(raw_data, '{}'::jsonb) || 
          '${JSON.stringify({
            apollo_id: companyInfo.apollo_id,
            apollo_link: `https://app.apollo.io/#/companies/${apolloOrgId}`,
            linkedin_url: companyInfo.linkedin_url,
            decision_makers: decisionMakers,
          })}'::jsonb
        `),
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('❌ Erro ao atualizar empresa:', updateError);
      throw updateError;
    }

    // Inserir decisores na tabela decision_makers
    if (decisionMakers.length > 0) {
      const { data: company } = await supabase
        .from('companies')
        .select('tenant_id')
        .eq('id', companyId)
        .single();

      const decisionMakersToInsert = decisionMakers.map((dm) => ({
        company_id: companyId,
        tenant_id: company?.tenant_id,
        name: dm.name,
        title: dm.title,
        email: dm.email,
        linkedin_url: dm.linkedin_url,
        classification: dm.classification,
        data_source: 'apollo',
        raw_data: { apollo_link: dm.apollo_link },
      }));

      const { error: insertError } = await supabase
        .from('decision_makers')
        .upsert(decisionMakersToInsert, {
          onConflict: 'company_id, email, name',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('❌ Erro ao inserir decisores:', insertError);
      } else {
        console.log('✅ Decisores inseridos:', decisionMakersToInsert.length);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        companyInfo,
        decisionMakers,
        message: `✅ ${decisionMakers.length} decisores encontrados e salvos!`,
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});
```

---

## 🚀 IMPLEMENTAÇÃO PASSO A PASSO

### **PASSO 1: Configurar Banco de Dados**

1. Abra o **Supabase SQL Editor**
2. Execute os scripts de criação das tabelas (seção [Schema](#schema-do-banco-de-dados))
3. Verifique se as tabelas foram criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('companies', 'decision_makers');
```

---

### **PASSO 2: Adicionar Campos às Tabelas Existentes**

Se você já tem tabelas `companies`, adicione os campos novos:

```sql
-- Adicionar campos novos à tabela companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Criar índice GIN para raw_data
CREATE INDEX IF NOT EXISTS idx_companies_raw_data 
ON public.companies USING gin(raw_data);
```

---

### **PASSO 3: Criar Edge Function**

1. **Criar arquivo local:**

```bash
mkdir -p supabase/functions/enrich-apollo-decisores
touch supabase/functions/enrich-apollo-decisores/index.ts
```

2. **Copiar código** da seção [Edge Functions](#edge-functions)

3. **Deploy:**

```bash
supabase functions deploy enrich-apollo-decisores --no-verify-jwt
```

4. **Configurar secrets:**

```bash
supabase secrets set APOLLO_API_KEY=your_apollo_key_here
```

---

### **PASSO 4: Atualizar TypeScript Types**

```typescript
// src/integrations/supabase/types.ts
export interface Company {
  id: string;
  tenant_id: string;
  workspace_id: string;
  company_name: string;
  cnpj?: string;
  website?: string;
  industry?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  employee_count?: number;
  employees_count?: number;
  revenue_usd?: number;
  revenue_range?: string;
  linkedin_url?: string;
  apollo_id?: string;
  data_source?: string;
  b2b_type?: string;
  raw_data?: {
    fit_score?: number;
    type?: string;
    notes?: string;
    linkedin_url?: string;
    apollo_id?: string;
    apollo_link?: string;
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

### **PASSO 5: Criar Hook React Query**

Copiar código da seção [Componentes Frontend → useCompanies](#1-hook-usecompaniests)

---

### **PASSO 6: Criar/Atualizar Página de Empresas**

1. **Criar arquivo:**

```bash
touch src/pages/CompaniesManagementPage.tsx
```

2. **Copiar código** completo da seção [Componentes Frontend → CompaniesManagementPage](#2-página-companiesmanagementpagetsx)

---

### **PASSO 7: Adicionar Rota**

```typescript
// src/App.tsx ou routes.tsx
import CompaniesManagementPage from '@/pages/CompaniesManagementPage';

// ...

<Route path="/companies" element={<CompaniesManagementPage />} />
```

---

### **PASSO 8: Testar**

1. **Inserir empresa de teste:**

```sql
INSERT INTO public.companies (
  tenant_id,
  workspace_id,
  company_name,
  website,
  country,
  state,
  city,
  industry,
  data_source,
  raw_data
) VALUES (
  'seu-tenant-id',
  'seu-workspace-id',
  'Test Company Inc',
  'https://example.com',
  'United States',
  'California',
  'San Francisco',
  'technology',
  'manual',
  '{"fit_score": 85, "type": "Distributor", "notes": "Test company"}'::jsonb
);
```

2. **Acessar página:** `http://localhost:5173/companies`

3. **Clicar na seta** para expandir

4. **Verificar:**
   - ✅ Card aparece com 2 colunas
   - ✅ Informações gerais aparecem
   - ✅ Campo "Decisores (0)" aparece
   - ✅ Botão "Buscar Decisores no Apollo" aparece

---

## 🔧 TROUBLESHOOTING

### Problema 1: "Companies não aparecem"

**Causa:** Filtro de `workspace_id` incorreto

**Solução:**

```typescript
// Verificar workspace_id no console
const { data: companies } = useCompanies();
console.log('Workspace atual:', workspaceId);
console.log('Empresas encontradas:', companies);
```

---

### Problema 2: "Card não expande"

**Causa:** Estado `expandedRow` não está funcionando

**Solução:**

```typescript
// Adicionar console.log
const toggleRow = (companyId: string) => {
  console.log('Toggling row:', companyId);
  setExpandedRow(prev => {
    console.log('Previous:', prev, 'New:', prev === companyId ? null : companyId);
    return prev === companyId ? null : companyId;
  });
};
```

---

### Problema 3: "Decisores não aparecem após Apollo"

**Causa:** Edge Function não salvou em `raw_data`

**Solução:**

```sql
-- Verificar raw_data
SELECT 
  company_name,
  apollo_id,
  linkedin_url,
  raw_data->'decision_makers' as decisores
FROM public.companies
WHERE apollo_id IS NOT NULL
LIMIT 5;
```

---

### Problema 4: "CORS Error ao chamar Edge Function"

**Causa:** Edge Function não tem headers CORS

**Solução:**

```typescript
// Adicionar no início da Edge Function
if (req.method === 'OPTIONS') {
  return new Response('ok', { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    } 
  });
}

// E em TODOS os returns
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }
});
```

---

### Problema 5: "Build falha com erro de JSX"

**Causa:** Tags não fechadas ou sintaxe incorreta

**Solução:**

```bash
npm run build
# Procurar erro de sintaxe no output
# Verificar se todos os <div>, <Card>, etc. estão fechados
```

---

## ✅ TESTES

### Teste 1: Expansão Básica

```typescript
// Teste manual
1. Acessar /companies
2. Clicar na seta (▶️) de uma empresa
3. Verificar se o card aparece
4. Clicar novamente na seta (▼)
5. Verificar se o card fecha
```

### Teste 2: Dados do Card

```typescript
// Verificar se todos os campos aparecem
✅ Nome da empresa
✅ Indústria
✅ Origem (data_source)
✅ Localização (cidade, estado, país)
✅ Descrição (se houver)
✅ Fit Score (se houver)
✅ Links (Website, LinkedIn, Apollo)
✅ Decisores (0 ou lista)
```

### Teste 3: Apollo Enrichment

```typescript
// Teste de enriquecimento
1. Expandir empresa sem Apollo ID
2. Clicar em "Adicionar Apollo ID"
3. Na página individual, usar "Adicionar Apollo ID"
4. Colar URL do Apollo (ex: https://app.apollo.io/#/companies/abc123)
5. Aguardar processamento
6. Voltar para /companies
7. Expandir empresa
8. Verificar:
   ✅ Link Apollo.io aparece
   ✅ Decisores aparecem (5-10)
   ✅ LinkedIn da empresa aparece
   ✅ Descrição atualizada
```

---

## 📚 CHECKLIST FINAL

```
[ ] Tabelas `companies` e `decision_makers` criadas
[ ] Campos `linkedin_url`, `apollo_id`, `raw_data` adicionados
[ ] Edge Function `enrich-apollo-decisores` deployada
[ ] Secret `APOLLO_API_KEY` configurado
[ ] Types TypeScript atualizados
[ ] Hook `useCompanies` criado
[ ] Página `CompaniesManagementPage` criada
[ ] Rota `/companies` adicionada
[ ] Teste de expansão funcionando
[ ] Teste de Apollo enrichment funcionando
[ ] Build sem erros (`npm run build`)
[ ] Deploy em produção
```

---

## 🎓 CONCEITOS IMPORTANTES

### 1. **Normalizador Universal (`raw_data`)**

O campo `raw_data` (JSONB) funciona como um **"saco de dados"** que armazena TODAS as informações extras:

- ✅ Flexível: Aceita qualquer estrutura JSON
- ✅ Indexável: Pode buscar dentro do JSON com índices GIN
- ✅ Evolutivo: Adicione campos sem ALTER TABLE
- ✅ Preserva original: Mantém dados de APIs externas

**Exemplo:**

```sql
-- Buscar empresas com fit_score > 80
SELECT company_name, raw_data->>'fit_score' as fit_score
FROM companies
WHERE (raw_data->>'fit_score')::integer > 80;
```

---

### 2. **Estado Local para Expansão**

```typescript
const [expandedRow, setExpandedRow] = useState<string | null>(null);
```

- **Por que `string | null`?** Armazena o ID da empresa expandida, ou `null` se nenhuma.
- **Por que não `boolean`?** Permite expandir APENAS UMA empresa por vez.

---

### 3. **Event Bubbling (`e.stopPropagation()`)**

```typescript
<Button onClick={(e) => {
  e.stopPropagation(); // IMPORTANTE!
  toggleRow(companyId);
}}>
```

Sem `stopPropagation()`, o clique no botão também acionaria o clique na `TableRow` inteira!

---

### 4. **IIFE (Immediately Invoked Function Expression)**

```typescript
{(() => {
  const decisores = company.raw_data?.decision_makers || [];
  if (decisores.length > 0) {
    return <div>...</div>;
  }
  return <p>Nenhum decisor</p>;
})()}
```

Permite usar lógica complexa dentro do JSX sem criar funções separadas.

---

## 🚀 PRÓXIMOS PASSOS

1. **Paginação:** Implementar paginação para 100+ empresas
2. **Busca:** Adicionar campo de busca por nome/país
3. **Filtros:** Filtrar por Fit Score, País, Indústria
4. **Batch Operations:** Selecionar múltiplas empresas e enriquecer em lote
5. **Exportação:** Exportar empresas + decisores para CSV/Excel

---

## 📞 SUPORTE

Se tiver dúvidas durante a implementação:

1. Verificar seção [Troubleshooting](#troubleshooting)
2. Consultar logs do console (F12)
3. Verificar SQL Editor no Supabase
4. Checar logs da Edge Function

---

**✅ FIM DA DOCUMENTAÇÃO**

**Criado em:** 2025
**Versão:** 1.0.0
**Projeto:** OLV Trade Intelligence

