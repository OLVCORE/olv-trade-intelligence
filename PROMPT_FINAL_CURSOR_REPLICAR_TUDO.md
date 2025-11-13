# 🎯 PROMPT PARA CURSOR - REPLICAR CARD EXPANSÍVEL + AUTO-ENRIQUECIMENTO

> **Cole este prompt no Cursor para replicar 100% do sistema**

---

## 📋 TAREFA COMPLETA

Implementar sistema de **CARD EXPANSÍVEL COM AUTO-ENRIQUECIMENTO APOLLO** no projeto.

---

## 🎯 O QUE VOCÊ VAI CRIAR

### 1. **CARD EXPANSÍVEL** (UI)

```
Tabela de empresas com cards que expandem ao clicar:

┌────────────────────────────────────────────┐
│ [▶] WellReformer | USA | 85 | ...         │ ← Linha colapsada
└────────────────────────────────────────────┘

                ⬇️ CLIQUE

┌────────────────────────────────────────────┐
│ [▼] WellReformer | USA | 85 | ...         │
├────────────────────────────────────────────┤
│ ┌───────────────┬───────────────┐         │
│ │ Informações   │ Fit Score     │         │
│ │ Localização   │ Links         │         │
│ │ Descrição     │ Decisores     │         │
│ └───────────────┴───────────────┘         │
└────────────────────────────────────────────┘
```

### 2. **AUTO-ENRIQUECIMENTO APOLLO**

```
Botão "Auto-Enriquecer Todas":
  ↓
Sistema busca no Apollo.io usando:
  - Nome da empresa
  - Cidade
  - País
  - Website (se tiver)
  ↓
Retorna e salva automaticamente:
  - Apollo ID
  - LinkedIn URL
  - Descrição
  - Decisores (CEO, VP, Directors)
  ↓
Card mostra tudo preenchido! ✅
```

### 3. **PROTEÇÃO MANUAL**

```
- Dados "auto" podem ser re-enriquecidos
- Dados "manual" são PROTEGIDOS
- Lápis ✏️ sempre visível para corrigir
- Badge indica: [🤖 AUTO] ou [✅ VALIDADO]
```

---

## 📦 ARQUIVOS QUE VOCÊ TEM

Você já recebeu os arquivos de documentação:
1. `README_CARD_EXPANSIVEL.md` - Visão geral
2. `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` - Código completo do card
3. `DOCUMENTACAO_AUTO_ENRIQUECIMENTO_COMPLETA.md` - Auto-enriquecimento
4. `EXEMPLOS_PRATICOS_CARD_EXPANSIVEL.md` - Casos de uso
5. `CHEATSHEET_CARD_EXPANSIVEL.md` - Referência rápida

---

## 🚀 IMPLEMENTAÇÃO (SIGA ESTE ORDEM)

### **PASSO 1: BANCO DE DADOS (SQL)**

Execute no Supabase SQL Editor:

```sql
-- 1. Adicionar campo raw_data (se não existir)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';

-- 2. Adicionar campos de governança para auto-enriquecimento
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS enrichment_source TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_companies_raw_data 
ON public.companies USING gin(raw_data);

CREATE INDEX IF NOT EXISTS idx_companies_enrichment_source 
ON public.companies(enrichment_source);

-- 4. Criar tabela decision_makers (se não existir)
CREATE TABLE IF NOT EXISTS public.decision_makers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  classification TEXT,
  data_source TEXT DEFAULT 'manual',
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_makers_company 
ON public.decision_makers(company_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_decision_makers_unique 
ON public.decision_makers(company_id, email, name);
```

**✅ Verificar:** Query deve retornar sucesso.

---

### **PASSO 2: TYPESCRIPT TYPES**

Atualizar `src/integrations/supabase/types.ts`:

```typescript
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
  linkedin_url?: string;
  apollo_id?: string;
  data_source?: string;
  enrichment_source?: 'auto' | 'manual' | null; // ⭐ NOVO
  enriched_at?: string; // ⭐ NOVO
  raw_data?: {
    fit_score?: number;
    type?: string;
    notes?: string;
    linkedin_url?: string;
    apollo_id?: string;
    apollo_link?: string;
    auto_enrich_method?: 'DOMAIN' | 'NAME_LOCATION'; // ⭐ NOVO
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

### **PASSO 3: EDGE FUNCTION (Apollo Auto-Enrich)**

Criar arquivo: `supabase/functions/auto-enrich-apollo/index.ts`

**Copiar código completo de:** `DOCUMENTACAO_AUTO_ENRIQUECIMENTO_COMPLETA.md` → Seção "Componentes"

Ou você pode me pedir o código completo (é muito grande para colar aqui).

**Deploy:**
```bash
supabase functions deploy auto-enrich-apollo --no-verify-jwt
```

**Configurar Apollo API Key:**
```bash
supabase secrets set APOLLO_API_KEY=your_apollo_key_here
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
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
```

---

### **PASSO 5: PÁGINA DE EMPRESAS (Card Expansível)**

Criar `src/pages/CompaniesManagementPage.tsx`:

**Código completo está em:** `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` → Seção 5.2

**Estrutura resumida:**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanies } from '@/hooks/useCompanies';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CompaniesManagementPage() {
  const { data: companies = [], isLoading, refetch } = useCompanies();
  const navigate = useNavigate();
  
  // Estado de expansão
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };
  
  // Estado de auto-enriquecimento
  const [isAutoEnriching, setIsAutoEnriching] = useState(false);
  
  // Função de auto-enriquecimento
  const handleAutoEnrichAll = async () => {
    try {
      setIsAutoEnriching(true);
      
      const toEnrich = companies.filter(c => 
        !c.apollo_id || c.enrichment_source === 'auto'
      );
      
      if (toEnrich.length === 0) {
        toast.info('Todas as empresas já estão enriquecidas!');
        return;
      }
      
      toast.info(`Enriquecendo ${toEnrich.length} empresas...`);
      
      let enriched = 0, skipped = 0, errors = 0;
      
      for (const company of toEnrich) {
        try {
          const { data, error } = await supabase.functions.invoke('auto-enrich-apollo', {
            body: {
              companyId: company.id,
              companyName: company.company_name,
              city: company.city,
              state: company.state,
              country: company.country,
              website: company.website,
            }
          });
          
          if (error) {
            errors++;
            continue;
          }
          
          if (data?.success) {
            enriched++;
          } else {
            skipped++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (e) {
          errors++;
        }
      }
      
      await refetch();
      toast.success(`✅ ${enriched} enriquecidas | ${skipped} puladas | ${errors} erros`);
      
    } catch (error) {
      toast.error('Erro ao executar auto-enriquecimento');
    } finally {
      setIsAutoEnriching(false);
    }
  };
  
  return (
    <div>
      {/* Botão de auto-enriquecimento */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAutoEnrichAll}
        disabled={isAutoEnriching}
      >
        {isAutoEnriching ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Enriquecendo...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Auto-Enriquecer Todas
          </>
        )}
      </Button>
      
      {/* Tabela com cards expansíveis */}
      <Table>
        <TableBody>
          {companies.map((company) => (
            <>
              {/* LINHA PRINCIPAL */}
              <TableRow key={company.id}>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => toggleRow(company.id)}
                  >
                    {expandedRow === company.id ? <ChevronDown /> : <ChevronRight />}
                  </Button>
                </TableCell>
                <TableCell>{company.company_name}</TableCell>
                {/* ... outras células */}
              </TableRow>
              
              {/* LINHA EXPANDIDA (CARD) */}
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
                            {/* Descrição */}
                          </div>
                          
                          {/* COLUNA DIREITA */}
                          <div>
                            {/* Fit Score */}
                            {/* Links Externos (Website, LinkedIn, Apollo) */}
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

**⚠️ IMPORTANTE:**  
O código completo do card (2 colunas) está em `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` → Seção 5.2.3

---

### **PASSO 6: BADGE DE INDICAÇÃO**

No card expandido, onde mostra o Apollo link:

```typescript
{/* Apollo.io */}
{apolloLink ? (
  <div className="flex items-center gap-2">
    <a href={apolloLink} target="_blank">
      Apollo.io
    </a>
    
    {/* Badge indicador */}
    {company.enrichment_source === 'auto' && (
      <Badge variant="outline" className="text-xs">
        🤖 AUTO
      </Badge>
    )}
    {company.enrichment_source === 'manual' && (
      <Badge variant="default" className="text-xs">
        ✅ VALIDADO
      </Badge>
    )}
    
    {/* Lápis sempre visível */}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(`/company/${company.id}`)}
    >
      <Edit className="h-3 w-3" />
    </Button>
  </div>
) : (
  <Button onClick={() => navigate(`/company/${company.id}`)}>
    + Adicionar Apollo ID
  </Button>
)}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Marque cada item conforme completa:

```
[ ] PASSO 1: SQL executado no Supabase ✅
[ ] PASSO 2: TypeScript types atualizados ✅
[ ] PASSO 3: Edge Function deployada ✅
[ ] PASSO 4: Hook useCompanies criado ✅
[ ] PASSO 5: Página CompaniesManagementPage criada ✅
[ ] PASSO 6: Badge indicador adicionado ✅
[ ] Teste: Expansão de card funcionando ✅
[ ] Teste: Auto-enriquecimento funcionando ✅
[ ] Teste: Badge [AUTO] / [VALIDADO] aparecendo ✅
[ ] Teste: Lápis sempre visível ✅
[ ] npm run build → SEM ERROS ✅
[ ] Deploy em produção ✅
```

---

## 🧪 TESTES OBRIGATÓRIOS

### Teste 1: Expansão Básica

```
1. Ir para /companies
2. Clicar na seta ▶️ de uma empresa
3. Verificar: Card expande mostrando 2 colunas
4. Clicar novamente na seta ▼
5. Verificar: Card fecha
```

### Teste 2: Auto-Enriquecimento

```
1. Ter 5 empresas sem Apollo ID
2. Clicar em "Auto-Enriquecer Todas"
3. Aguardar processamento (~30 segundos)
4. Verificar toast: "✅ 5 enriquecidas | 0 puladas | 0 erros"
5. Expandir cards:
   ✅ Apollo link aparece
   ✅ Badge [🤖 AUTO] aparece
   ✅ Decisores aparecem
   ✅ LinkedIn aparece
```

### Teste 3: Proteção Manual

```
1. Auto-enriquecer empresa X (badge [AUTO])
2. Clicar no lápis ✏️ e corrigir manualmente
3. Badge muda para [VALIDADO]
4. Clicar em "Auto-Enriquecer Todas"
5. Verificar: Empresa X é pulada (protegida)
```

---

## 🔧 TROUBLESHOOTING

### Problema: "Empresas não aparecem"

**Solução:**
```typescript
// Adicionar console.log no hook:
console.log('Companies:', data);
console.log('Count:', data?.length);
```

Verificar:
- RLS (Row Level Security) no Supabase
- `workspace_id` correto
- Filtros na query

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

### Problema: "Auto-enriquecimento não funciona"

**Solução:**
1. Verificar Edge Function deployada:
   ```bash
   supabase functions list
   ```

2. Verificar Apollo API Key configurada:
   ```bash
   supabase secrets list
   ```

3. Ver logs da Edge Function:
   - Dashboard → Edge Functions → auto-enrich-apollo → Logs

---

### Problema: "CORS Error"

**Solução:**  
Adicionar headers CORS na Edge Function:

```typescript
// No início da função
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

## 📚 ARQUIVOS DE REFERÊNCIA

| Arquivo | Quando Consultar |
|---------|------------------|
| `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` | Código completo do card (2 colunas) |
| `DOCUMENTACAO_AUTO_ENRIQUECIMENTO_COMPLETA.md` | Edge Function completa + lógica |
| `CHEATSHEET_CARD_EXPANSIVEL.md` | Consulta rápida durante dev |
| `EXEMPLOS_PRATICOS_CARD_EXPANSIVEL.md` | Personalizações avançadas |

---

## 🎯 RESULTADO FINAL

Após implementação, você terá:

✅ **Card expansível elegante** (2 colunas)  
✅ **Auto-enriquecimento inteligente** (nome + cidade + país + website)  
✅ **Proteção contra sobrescrita** (manual > auto)  
✅ **Badges de indicação** ([AUTO] / [VALIDADO])  
✅ **Lápis sempre visível** (permitir correção)  
✅ **Performance otimizada** (100+ empresas)  
✅ **Mobile-friendly** (responsivo)  

---

## 💡 DICAS IMPORTANTES

1. **Não pule o SQL** - É a base de tudo
2. **Deploy Edge Function antes de testar** - Senão terá CORS error
3. **Use console.log para debug** - Edge Functions têm logs no Dashboard
4. **Teste com poucas empresas primeiro** - 5-10 empresas para validar
5. **Apollo API Key é obrigatória** - Senão auto-enriquecimento não funciona

---

## 📞 SE TRAVAR

1. Consultar: `CHEATSHEET_CARD_EXPANSIVEL.md` → Seção "Troubleshooting"
2. Ver logs: Dashboard Supabase → Edge Functions → Logs
3. Testar manualmente: Chamar Edge Function via Postman/curl
4. Perguntar ao desenvolvedor original com erro exato + logs

---

**🚀 BOA IMPLEMENTAÇÃO!**

**Tempo estimado:** 1-2 horas (intermediário) | 2-3 horas (iniciante)

---

**Versão:** 2.0 - Card + Auto-Enriquecimento  
**Data:** 2025-11-13  
**Projeto:** OLV Trade Intelligence

