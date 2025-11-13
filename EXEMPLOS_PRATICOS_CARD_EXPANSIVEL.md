# 💡 EXEMPLOS PRÁTICOS - CARD EXPANSÍVEL

> **Casos de uso, personalizações e adaptações do sistema de cards expansíveis**

---

## 📋 ÍNDICE

1. [Exemplos de Personalização](#exemplos-de-personalização)
2. [Integrações com Outras APIs](#integrações-com-outras-apis)
3. [Casos de Uso Avançados](#casos-de-uso-avançados)
4. [Performance e Otimizações](#performance-e-otimizações)
5. [Templates Prontos](#templates-prontos)

---

## 🎨 EXEMPLOS DE PERSONALIZAÇÃO

### 1. Adicionar Nova Seção ao Card

**Cenário:** Adicionar seção "Histórico de Interações" ao card

```typescript
// Na COLUNA ESQUERDA, após "Descrição"

{/* 📅 HISTÓRICO DE INTERAÇÕES */}
<div>
  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
    <Calendar className="h-4 w-4" />
    Histórico de Interações
  </h4>
  <div className="space-y-1 text-xs">
    {(() => {
      const interactions = (company as any).raw_data?.interactions || [];
      if (interactions.length > 0) {
        return interactions.slice(0, 3).map((int: any, idx: number) => (
          <div key={idx} className="flex items-start gap-2 p-2 bg-muted/20 rounded">
            <span className="text-muted-foreground">{new Date(int.date).toLocaleDateString()}</span>
            <span>{int.type}: {int.description}</span>
          </div>
        ));
      }
      return <p className="text-muted-foreground">Nenhuma interação registrada</p>;
    })()}
  </div>
</div>
```

---

### 2. Mudar Cores do Fit Score

**Cenário:** Usar vermelho para fit score < 50

```typescript
<div
  className={`h-full ${
    fitScore >= 80 ? 'bg-green-500' : 
    fitScore >= 60 ? 'bg-yellow-500' : 
    fitScore >= 50 ? 'bg-orange-500' : 
    'bg-red-500' // NOVO: vermelho para < 50
  }`}
  style={{ width: `${fitScore}%` }}
/>

<p className="text-xs text-muted-foreground mt-2">
  {fitScore >= 80 && '🟢 Excelente fit para B2B'}
  {fitScore >= 60 && fitScore < 80 && '🟡 Bom fit para B2B'}
  {fitScore >= 50 && fitScore < 60 && '🟠 Fit moderado'}
  {fitScore < 50 && '🔴 Fit baixo'} {/* NOVO */}
</p>
```

---

### 3. Expandir Múltiplas Linhas Simultaneamente

**Cenário:** Permitir expandir várias empresas ao mesmo tempo

```typescript
// Mudar estado de string para Set
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

const toggleRow = (companyId: string) => {
  setExpandedRows(prev => {
    const newSet = new Set(prev);
    if (newSet.has(companyId)) {
      newSet.delete(companyId); // Fecha
    } else {
      newSet.add(companyId); // Abre
    }
    return newSet;
  });
};

// Verificar se está expandida
{expandedRows.has(company.id) && (
  <TableRow>
    {/* Card expandido */}
  </TableRow>
)}
```

---

### 4. Card com Abas (Tabs)

**Cenário:** Organizar seções em abas dentro do card

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Card className="border-0 shadow-none">
  <CardContent className="p-6">
    <Tabs defaultValue="general">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="location">Localização</TabsTrigger>
        <TabsTrigger value="decisores">Decisores</TabsTrigger>
        <TabsTrigger value="score">Fit Score</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        {/* Informações Gerais */}
      </TabsContent>
      
      <TabsContent value="location">
        {/* Localização */}
      </TabsContent>
      
      <TabsContent value="decisores">
        {/* Decisores */}
      </TabsContent>
      
      <TabsContent value="score">
        {/* Fit Score */}
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

---

## 🔌 INTEGRAÇÕES COM OUTRAS APIs

### 1. LinkedIn Sales Navigator

```typescript
// Edge Function: enrich-linkedin-sales-nav/index.ts

serve(async (req) => {
  const { companyId, linkedinUrl } = await req.json();
  
  // Buscar dados do LinkedIn Sales Navigator
  const linkedinResponse = await fetch('https://api.linkedin.com/v2/organizations', {
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
    },
  });
  
  const linkedinData = await linkedinResponse.json();
  
  // Salvar em raw_data
  await supabase
    .from('companies')
    .update({
      linkedin_url: linkedinUrl,
      raw_data: supabase.raw(`
        COALESCE(raw_data, '{}'::jsonb) || 
        '${JSON.stringify({ linkedin: linkedinData })}'::jsonb
      `),
    })
    .eq('id', companyId);
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

### 2. Clearbit (Enriquecimento de Empresas)

```typescript
// Edge Function: enrich-clearbit/index.ts

serve(async (req) => {
  const { companyId, domain } = await req.json();
  
  // Buscar dados da Clearbit
  const clearbitResponse = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${domain}`, {
    headers: {
      'Authorization': `Bearer ${CLEARBIT_API_KEY}`,
    },
  });
  
  const clearbitData = await clearbitResponse.json();
  
  // Extrair informações
  const companyInfo = {
    description: clearbitData.description,
    employees_count: clearbitData.metrics?.employees,
    industry: clearbitData.category?.industry,
    linkedin_url: clearbitData.linkedin?.handle,
    logo_url: clearbitData.logo,
  };
  
  // Salvar no banco
  await supabase
    .from('companies')
    .update({
      ...companyInfo,
      raw_data: supabase.raw(`
        COALESCE(raw_data, '{}'::jsonb) || 
        '${JSON.stringify({ clearbit: clearbitData })}'::jsonb
      `),
    })
    .eq('id', companyId);
  
  return new Response(JSON.stringify({ success: true, companyInfo }));
});
```

---

### 3. Google Places (Localização)

```typescript
// Edge Function: enrich-google-places/index.ts

serve(async (req) => {
  const { companyId, companyName, city } = await req.json();
  
  // Buscar no Google Places
  const placesResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${companyName}+${city}&inputtype=textquery&fields=formatted_address,geometry,name,photos&key=${GOOGLE_API_KEY}`
  );
  
  const placesData = await placesResponse.json();
  
  if (placesData.candidates?.length > 0) {
    const place = placesData.candidates[0];
    
    await supabase
      .from('companies')
      .update({
        raw_data: supabase.raw(`
          COALESCE(raw_data, '{}'::jsonb) || 
          '${JSON.stringify({ 
            google_place: {
              address: place.formatted_address,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }
          })}'::jsonb
        `),
      })
      .eq('id', companyId);
  }
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

## 🚀 CASOS DE USO AVANÇADOS

### 1. Auto-Enriquecimento em Background

**Cenário:** Enriquecer automaticamente quando empresa é criada

```typescript
// supabase/functions/auto-enrich-on-create/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Trigger do PostgreSQL chama essa Edge Function
serve(async (req) => {
  const { record } = await req.json(); // Empresa recém-criada
  
  console.log('🤖 Auto-enriquecimento iniciado:', record.company_name);
  
  // 1. Buscar no Apollo (se tiver website)
  if (record.website) {
    try {
      const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': APOLLO_API_KEY,
        },
        body: JSON.stringify({ domain: record.website }),
      });
      
      if (apolloResponse.ok) {
        const apolloData = await apolloResponse.json();
        
        // Atualizar empresa
        await supabase
          .from('companies')
          .update({
            apollo_id: apolloData.organization?.id,
            linkedin_url: apolloData.organization?.linkedin_url,
            description: apolloData.organization?.short_description,
          })
          .eq('id', record.id);
        
        console.log('✅ Apollo enriquecido');
      }
    } catch (e) {
      console.error('❌ Erro Apollo:', e);
    }
  }
  
  // 2. Buscar decisores no LinkedIn (se tiver linkedin_url)
  if (record.linkedin_url) {
    // ... lógica de enriquecimento LinkedIn
  }
  
  return new Response(JSON.stringify({ success: true }));
});
```

**Trigger SQL:**

```sql
-- Criar função que chama Edge Function
CREATE OR REPLACE FUNCTION auto_enrich_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar Edge Function via pg_net (Supabase extension)
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/auto-enrich-on-create',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_auto_enrich
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION auto_enrich_company();
```

---

### 2. Busca Inteligente com Ranking

**Cenário:** Buscar empresas e ranquear por relevância

```typescript
// src/pages/CompaniesManagementPage.tsx

const [searchTerm, setSearchTerm] = useState('');

// Função de ranking
const rankCompany = (company: Company, term: string) => {
  let score = 0;
  const termLower = term.toLowerCase();
  
  // Nome da empresa (peso 10)
  if (company.company_name?.toLowerCase().includes(termLower)) {
    score += 10;
  }
  
  // País (peso 5)
  if (company.country?.toLowerCase().includes(termLower)) {
    score += 5;
  }
  
  // Indústria (peso 3)
  if (company.industry?.toLowerCase().includes(termLower)) {
    score += 3;
  }
  
  // Fit Score alto (bônus)
  const fitScore = (company as any).raw_data?.fit_score || 0;
  if (fitScore >= 80) score += 2;
  
  return score;
};

// Filtrar e ordenar
const filteredCompanies = companies
  .map(company => ({
    company,
    score: rankCompany(company, searchTerm),
  }))
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => item.company);

// Renderizar
<Input
  placeholder="Buscar empresas..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

<Table>
  {/* Usar filteredCompanies em vez de companies */}
  {filteredCompanies.map(company => (...))}
</Table>
```

---

### 3. Exportar Card para PDF

**Cenário:** Gerar PDF da empresa com todas as informações

```typescript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const exportToPDF = async (companyId: string) => {
  // Expandir card
  setExpandedRow(companyId);
  
  // Aguardar renderização
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Capturar elemento
  const cardElement = document.querySelector(`[data-company-id="${companyId}"]`);
  
  if (cardElement) {
    const canvas = await html2canvas(cardElement as HTMLElement);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`empresa-${companyId}.pdf`);
  }
};

// Adicionar botão no card
<Button onClick={() => exportToPDF(company.id)}>
  <Download className="h-4 w-4 mr-2" />
  Exportar PDF
</Button>
```

---

## ⚡ PERFORMANCE E OTIMIZAÇÕES

### 1. Virtualização (React Window)

**Cenário:** Renderizar 1000+ empresas sem lag

```typescript
import { FixedSizeList as List } from 'react-window';

const Row = ({ index, style }: any) => {
  const company = companies[index];
  
  return (
    <div style={style}>
      <TableRow>
        {/* Conteúdo da linha */}
      </TableRow>
    </div>
  );
};

<List
  height={600}
  itemCount={companies.length}
  itemSize={50}
  width="100%"
>
  {Row}
</List>
```

---

### 2. Lazy Loading de Decisores

**Cenário:** Carregar decisores apenas quando expandir

```typescript
const [loadedDecisores, setLoadedDecisores] = useState<Record<string, any[]>>({});

const loadDecisores = async (companyId: string) => {
  if (loadedDecisores[companyId]) return; // Já carregado
  
  const { data } = await supabase
    .from('decision_makers')
    .select('*')
    .eq('company_id', companyId)
    .limit(10);
  
  setLoadedDecisores(prev => ({
    ...prev,
    [companyId]: data || [],
  }));
};

// Ao expandir
const toggleRow = (companyId: string) => {
  setExpandedRow(prev => {
    const isExpanding = prev !== companyId;
    if (isExpanding) {
      loadDecisores(companyId); // Carregar decisores
    }
    return isExpanding ? companyId : null;
  });
};
```

---

### 3. Cache de Imagens (Apollo/LinkedIn logos)

```typescript
// Pré-carregar imagens comuns
useEffect(() => {
  const images = [
    'https://www.apollo.io/favicon.ico',
    'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
  ];
  
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}, []);
```

---

## 📦 TEMPLATES PRONTOS

### 1. Card Minimalista (1 Coluna)

```typescript
<Card className="border-0 shadow-none">
  <CardContent className="p-4">
    <div className="space-y-3">
      {/* Nome + Website */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{company.company_name}</h3>
        {company.website && (
          <a href={company.website} target="_blank">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      
      {/* Localização */}
      <p className="text-sm text-muted-foreground">
        {company.city}, {company.country}
      </p>
      
      {/* Decisores */}
      <div className="flex gap-2">
        {decisores.slice(0, 3).map(dm => (
          <Badge key={dm.name}>{dm.title}</Badge>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 2. Card Grid (3 Colunas)

```typescript
<Card className="border-0 shadow-none">
  <CardContent className="p-6">
    <div className="grid grid-cols-3 gap-4">
      {/* Coluna 1: Geral */}
      <div>
        <h4 className="font-semibold mb-2">Geral</h4>
        <p>{company.company_name}</p>
        <p className="text-sm text-muted-foreground">{company.industry}</p>
      </div>
      
      {/* Coluna 2: Localização */}
      <div>
        <h4 className="font-semibold mb-2">Localização</h4>
        <p>{company.city}</p>
        <p className="text-sm text-muted-foreground">{company.country}</p>
      </div>
      
      {/* Coluna 3: Contato */}
      <div>
        <h4 className="font-semibold mb-2">Contato</h4>
        <a href={company.website}>Website</a>
        <a href={company.linkedin_url}>LinkedIn</a>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 3. Card Compacto (Inline)

```typescript
<div className="flex items-center gap-4 p-4 bg-muted/30 rounded">
  {/* Logo */}
  <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
    <Building2 className="h-6 w-6" />
  </div>
  
  {/* Info */}
  <div className="flex-1">
    <h4 className="font-semibold">{company.company_name}</h4>
    <p className="text-sm text-muted-foreground">{company.country}</p>
  </div>
  
  {/* Fit Score */}
  <Badge variant={fitScore >= 80 ? 'default' : 'secondary'}>
    {fitScore}
  </Badge>
  
  {/* Actions */}
  <Button size="sm" variant="outline">
    Ver Detalhes
  </Button>
</div>
```

---

## 🎓 DICAS DE DESIGN

### 1. Cores Semânticas

```typescript
// Usar variáveis CSS do shadcn/ui
const statusColor = {
  active: 'text-green-500',
  pending: 'text-yellow-500',
  inactive: 'text-red-500',
};

<Badge className={statusColor[company.status]}>
  {company.status}
</Badge>
```

---

### 2. Animações Sutis

```typescript
// Adicionar transição suave ao expandir
<TableRow className="transition-all duration-300 ease-in-out">
  {/* ... */}
</TableRow>

// Card com fade-in
<Card className="animate-in fade-in-50 duration-300">
  {/* ... */}
</Card>
```

---

### 3. Responsividade

```typescript
// Card adaptável para mobile
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* 1 coluna no mobile, 2 no desktop */}
</div>

// Ocultar colunas menos importantes no mobile
<TableHead className="hidden md:table-cell">
  Fit Score
</TableHead>
```

---

## ✅ CHECKLIST DE QUALIDADE

```
[ ] Card funciona em mobile (responsivo)
[ ] Todas as imagens têm alt text
[ ] Links abrem em nova aba (_blank)
[ ] Botões têm title/tooltip
[ ] Cores têm contraste adequado (WCAG AA)
[ ] Animações não causam motion sickness
[ ] Performance OK com 100+ empresas
[ ] Testes E2E passando
[ ] TypeScript sem erros
[ ] Build sem warnings
```

---

**✅ FIM DOS EXEMPLOS PRÁTICOS**

**Complementa:** `REPLICAR_CARD_EXPANSIVEL_COMPLETO.md`

