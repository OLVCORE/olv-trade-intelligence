# ⚡ CHEATSHEET - CARD EXPANSÍVEL

> **Referência rápida para implementação e troubleshooting**

---

## 🚀 SETUP RÁPIDO (5 MINUTOS)

### 1. SQL (Copiar e colar no Supabase)

```sql
-- Adicionar campos necessários
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS apollo_id TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_companies_raw_data 
ON public.companies USING gin(raw_data);
```

### 2. TypeScript Types

```typescript
// src/integrations/supabase/types.ts
export interface Company {
  id: string;
  company_name: string;
  linkedin_url?: string;
  apollo_id?: string;
  data_source?: string;
  raw_data?: {
    fit_score?: number;
    decision_makers?: Array<{
      name: string;
      title: string;
      email?: string;
      linkedin_url?: string;
    }>;
  };
  // ... outros campos
}
```

### 3. Hook React Query

```typescript
// src/hooks/useCompanies.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      return data;
    },
  });
};
```

### 4. Componente Básico

```typescript
// src/pages/CompaniesPage.tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CompaniesPage() {
  const { data: companies = [] } = useCompanies();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };
  
  return (
    <Table>
      <TableBody>
        {companies.map((company) => (
          <>
            <TableRow key={company.id}>
              <TableCell>
                <Button variant="ghost" onClick={() => toggleRow(company.id)}>
                  {expandedRow === company.id ? <ChevronDown /> : <ChevronRight />}
                </Button>
              </TableCell>
              <TableCell>{company.company_name}</TableCell>
            </TableRow>
            
            {expandedRow === company.id && (
              <TableRow>
                <TableCell colSpan={10}>
                  {/* CARD DETALHADO AQUI */}
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 📦 COMPONENTES PRONTOS (COPY-PASTE)

### Card 2 Colunas (Completo)

```typescript
<Card className="border-0 shadow-none">
  <CardContent className="p-6">
    <div className="grid grid-cols-2 gap-6">
      
      {/* COLUNA ESQUERDA */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Informações Gerais</h4>
          <p>{company.company_name}</p>
          <p className="text-sm text-muted-foreground">{company.industry}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-2">Localização</h4>
          <p>{company.city}, {company.country}</p>
        </div>
      </div>
      
      {/* COLUNA DIREITA */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Links Externos</h4>
          {company.website && <a href={company.website}>Website</a>}
          {company.linkedin_url && <a href={company.linkedin_url}>LinkedIn</a>}
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-2">Decisores</h4>
          {(company.raw_data?.decision_makers || []).map(dm => (
            <div key={dm.name}>{dm.name} - {dm.title}</div>
          ))}
        </div>
      </div>
      
    </div>
  </CardContent>
</Card>
```

---

## 🎯 PATTERNS COMUNS

### 1. Leitura de `raw_data`

```typescript
// ✅ CORRETO: Com fallback
const fitScore = (company as any).raw_data?.fit_score || 0;
const decisores = (company as any).raw_data?.decision_makers || [];

// ❌ ERRADO: Sem fallback (pode quebrar)
const fitScore = company.raw_data.fit_score;
```

---

### 2. Renderização Condicional com IIFE

```typescript
{(() => {
  const decisores = company.raw_data?.decision_makers || [];
  
  if (decisores.length > 0) {
    return <div>Lista de decisores</div>;
  }
  
  return <p>Nenhum decisor</p>;
})()}
```

---

### 3. Stopear Event Bubbling

```typescript
<Button onClick={(e) => {
  e.stopPropagation(); // IMPORTANTE!
  handleAction();
}}>
  Clique aqui
</Button>
```

---

### 4. Links Externos Seguros

```typescript
<a 
  href={url} 
  target="_blank" 
  rel="noopener noreferrer" // IMPORTANTE para segurança
>
  Link
</a>
```

---

## 🔧 TROUBLESHOOTING RÁPIDO

### Problema: "Empresas não aparecem"

```typescript
// Debug no console
console.log('Companies:', companies);
console.log('Length:', companies?.length);
console.log('First:', companies?.[0]);
```

**Soluções:**
1. Verificar `workspace_id` no filtro
2. Verificar RLS (Row Level Security) do Supabase
3. Verificar se `data_source` está correto

---

### Problema: "Card não expande"

```typescript
// Debug toggleRow
const toggleRow = (id: string) => {
  console.log('Toggle:', id);
  console.log('Current:', expandedRow);
  setExpandedRow(prev => prev === id ? null : id);
};
```

**Soluções:**
1. Verificar se `onClick` tem `e.stopPropagation()`
2. Verificar se `expandedRow === company.id`
3. Verificar se `key` está correto no map

---

### Problema: "raw_data vazio"

```sql
-- Verificar no Supabase
SELECT 
  company_name,
  raw_data,
  jsonb_typeof(raw_data) as tipo
FROM companies
LIMIT 5;
```

**Soluções:**
1. Inicializar com `'{}'::jsonb`
2. Atualizar com `COALESCE(raw_data, '{}'::jsonb)`
3. Verificar se Edge Function está salvando corretamente

---

### Problema: "CORS Error"

**Solução:**

```typescript
// Em TODAS as Edge Functions, adicionar headers CORS
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }
});

// E no início da função
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

## 💾 SQL ÚTEIS

### Buscar empresa com decisores

```sql
SELECT 
  c.company_name,
  c.linkedin_url,
  c.apollo_id,
  c.raw_data->'decision_makers' as decisores,
  COUNT(dm.id) as decisores_count
FROM companies c
LEFT JOIN decision_makers dm ON dm.company_id = c.id
GROUP BY c.id
LIMIT 10;
```

---

### Atualizar `raw_data` (merge)

```sql
UPDATE companies
SET raw_data = COALESCE(raw_data, '{}'::jsonb) || '{"new_field": "value"}'::jsonb
WHERE id = 'company-id';
```

---

### Limpar campo específico do `raw_data`

```sql
UPDATE companies
SET raw_data = raw_data - 'decision_makers'
WHERE data_source = 'dealer_discovery';
```

---

### Buscar decisores de uma empresa

```sql
SELECT 
  name,
  title,
  email,
  classification
FROM decision_makers
WHERE company_id = 'company-id'
ORDER BY 
  CASE classification
    WHEN 'CEO' THEN 1
    WHEN 'VP' THEN 2
    WHEN 'Director' THEN 3
    ELSE 99
  END;
```

---

## 🎨 CLASSES TAILWIND ÚTEIS

### Layout 2 Colunas

```typescript
<div className="grid grid-cols-2 gap-6">
```

### Espaçamento Vertical

```typescript
<div className="space-y-4">
```

### Background Sutil

```typescript
<div className="bg-muted/30">
```

### Hover Suave

```typescript
<TableRow className="cursor-pointer hover:bg-muted/50">
```

### Texto Muted

```typescript
<span className="text-muted-foreground">
```

---

## 🧪 TESTES RÁPIDOS

### 1. Teste de Expansão

```
1. Abrir /companies
2. Clicar na seta (▶️)
3. Verificar se card aparece
4. Clicar na seta (▼)
5. Verificar se card fecha
```

---

### 2. Teste de Dados

```
1. Expandir empresa
2. Verificar:
   ✅ Nome aparece
   ✅ País aparece
   ✅ Fit Score (se houver)
   ✅ Links (Website, LinkedIn, Apollo)
   ✅ Decisores (0 ou lista)
```

---

### 3. Teste de Performance

```
1. Inserir 100 empresas
2. Abrir /companies
3. Verificar:
   ✅ Página carrega em < 2s
   ✅ Scroll suave
   ✅ Expandir não trava
```

---

## 📚 IMPORTS NECESSÁRIOS

```typescript
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
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

```
[ ] SQL executado (campos adicionados)
[ ] Types TypeScript atualizados
[ ] Hook useCompanies criado
[ ] Componente da página criado
[ ] Estado expandedRow funcionando
[ ] Card com 2 colunas renderizando
[ ] Links externos abrindo em nova aba
[ ] Campo Decisores sempre visível
[ ] Build sem erros (npm run build)
[ ] Testado em mobile
[ ] Deploy em produção
```

---

## 🔗 LINKS RÁPIDOS

| Arquivo | Descrição |
|---------|-----------|
| `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md` | Documentação completa (15+ páginas) |
| `EXEMPLOS_PRATICOS_CARD_EXPANSIVEL.md` | Casos de uso avançados |
| `CHEATSHEET_CARD_EXPANSIVEL.md` | Esta referência rápida |

---

## ⚡ COMANDOS ÚTEIS

### Build & Deploy

```bash
# Verificar erros
npm run build

# Deployar Edge Function
supabase functions deploy enrich-apollo-decisores --no-verify-jwt

# Configurar secret
supabase secrets set APOLLO_API_KEY=your_key
```

---

### Git

```bash
# Commitar
git add .
git commit -m "feat: adicionar card expansível"
git push

# Ver diff
git diff src/pages/CompaniesManagementPage.tsx
```

---

**✅ FIM DO CHEATSHEET**

**Use este arquivo para consultas rápidas durante implementação!**

