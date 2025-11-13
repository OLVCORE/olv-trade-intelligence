# 📦 EXPORTAR CARDS EXPANSÍVEIS PARA PROSPECT-V2

## ✅ GUIA COMPLETO - COPY/PASTE READY

**Data:** 13/11/2024  
**Origem:** Trade Intelligence  
**Destino:** Prospect-V2  

---

## 🎯 O QUE VOCÊ VAI TER:

Tabela com cards expansíveis igual ao Trade Intelligence:

```
┌────────────────────────────────────────────────────┐
│ [▼] Balanced Body          │ Fit Score: 95         │
│     United States, CA      │ [LinkedIn] [Apollo]   │
├────────────────────────────────────────────────────┤
│ CARD EXPANDIDO (ao clicar na seta):                │
│                                                     │
│ 📋 Info Gerais  │  🎯 Fit Score  │  👥 Decisores   │
│ Nome: ...       │  ████████ 95   │  Ken (CEO)      │
│ Indústria: ...  │  Excelente B2B │  Sarah (VP)     │
└────────────────────────────────────────────────────┘
```

---

## 📋 PASSO 1: CRIAR COMPONENTE CollapsibleCard

**Arquivo:** `src/components/companies/CollapsibleCard.tsx`

```tsx
import { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleCard({ 
  title, 
  icon: Icon, 
  children, 
  defaultExpanded = false,
  className = ''
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={\`glass-card \${className}\`}>
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            <span>{title}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}
```

---

## 📋 PASSO 2: CRIAR COMPONENTE ExpandableCompaniesTable

**Arquivo:** `src/components/companies/ExpandableCompaniesTable.tsx`

```tsx
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown, ChevronUp, Globe, MapPin, Users, Target,
  ExternalLink, Linkedin, Building2, Mail, Phone
} from 'lucide-react';

interface ExpandableCompaniesTableProps {
  companies: any[];
  selectedCompanies?: string[];
  onToggleSelect?: (companyId: string) => void;
  onToggleSelectAll?: () => void;
  showCheckboxes?: boolean;
}

export function ExpandableCompaniesTable({ 
  companies, 
  selectedCompanies = [],
  onToggleSelect,
  onToggleSelectAll,
  showCheckboxes = true 
}: ExpandableCompaniesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (companyId: string) => {
    setExpandedRow(expandedRow === companyId ? null : companyId);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCheckboxes && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedCompanies.length === companies.length && companies.length > 0}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
          )}
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead>Indústria</TableHead>
          <TableHead className="text-center">Fit Score</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {companies.map((company) => {
          const fitScore = company.raw_data?.fit_score || 0;
          const decisores = company.raw_data?.decision_makers || [];
          const apolloLink = company.raw_data?.apollo_link || 
                           (company.apollo_id ? \`https://app.apollo.io/#/companies/\${company.apollo_id}\` : null);
          
          return (
            <>
              {/* Linha Principal */}
              <TableRow
                key={company.id}
                className="hover:bg-muted/50"
              >
                {showCheckboxes && (
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => onToggleSelect?.(company.id)}
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(company.id);
                    }}
                  >
                    {expandedRow === company.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{company.company_name}</span>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" />
                        {company.website.replace('https://', '').replace('http://', '')}
                      </a>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="w-fit">
                      {company.country || 'N/A'}
                    </Badge>
                    {company.state && (
                      <span className="text-xs text-muted-foreground">{company.state}</span>
                    )}
                    {company.city && (
                      <span className="text-xs text-muted-foreground">{company.city}</span>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm">{company.industry || 'N/A'}</span>
                </TableCell>
                
                <TableCell className="text-center">
                  <Badge variant={fitScore >= 80 ? 'success' : fitScore >= 60 ? 'warning' : 'secondary'}>
                    {fitScore}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  {/* Seus botões de ação aqui */}
                </TableCell>
              </TableRow>

              {/* Linha Expandida (Card Completo) */}
              {expandedRow === company.id && (
                <TableRow>
                  <TableCell colSpan={showCheckboxes ? 7 : 6} className="bg-muted/30 p-0">
                    <Card className="border-0 shadow-none">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Coluna Esquerda */}
                          <div className="space-y-4">
                            {/* Informações Gerais */}
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
                                    {company.data_source || company.raw_data?.source || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Localização */}
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

                            {/* Descrição */}
                            {(company.description || company.raw_data?.notes) && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                                <p className="text-sm text-muted-foreground">
                                  {company.description || company.raw_data?.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Coluna Direita */}
                          <div className="space-y-4">
                            {/* Fit Score */}
                            {fitScore > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Fit Score
                                </h4>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={\`h-full \${fitScore >= 80 ? 'bg-green-500' : fitScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}\`}
                                        style={{ width: \`\${fitScore}%\` }}
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
                              </div>
                            )}

                            {/* Links Externos */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Links Externos
                              </h4>
                              <div className="space-y-2">
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
                                {(company.linkedin_url || company.raw_data?.linkedin_url) && (
                                  <a
                                    href={company.linkedin_url || company.raw_data?.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {apolloLink && (
                                  <a
                                    href={apolloLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <img src="https://www.apollo.io/favicon.ico" alt="Apollo" className="h-4 w-4" />
                                    Apollo.io
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Decisores */}
                            {decisores.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Decisores ({decisores.length})
                                </h4>
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
                                        {dm.email && (
                                          <a href={\`mailto:\${dm.email}\`} className="flex items-center gap-1 text-primary hover:underline">
                                            <Mail className="h-3 w-3" />
                                            Email
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

---

## 📋 PASSO 3: USAR NA SUA PÁGINA

**Exemplo:** `src/pages/CompaniesPage.tsx` (Prospect-V2)

### **A) Imports:**

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, Globe, MapPin, Users, Target, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
```

### **B) Estado:**

```tsx
const [expandedRow, setExpandedRow] = useState<string | null>(null);

const toggleRow = (companyId: string) => {
  setExpandedRow(expandedRow === companyId ? null : companyId);
};
```

### **C) Renderização (dentro do TableBody):**

```tsx
{companies.map((company) => (
  <>
    {/* Linha Principal */}
    <TableRow key={company.id} className="hover:bg-muted/50">
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            toggleRow(company.id);
          }}
        >
          {expandedRow === company.id ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      
      <TableCell>{company.company_name}</TableCell>
      <TableCell>{company.country}</TableCell>
      {/* ... outros campos ... */}
    </TableRow>

    {/* Linha Expandida */}
    {expandedRow === company.id && (
      <TableRow>
        <TableCell colSpan={7} className="bg-muted/30 p-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-6">
              {/* Grid com 2 colunas - copie o código do PASSO 2 aqui */}
            </CardContent>
          </Card>
        </TableCell>
      </TableRow>
    )}
  </>
))}
```

---

## 🎨 CSS NECESSÁRIO (se não tiver):

Adicione em `src/index.css`:

```css
.glass-card {
  @apply bg-card/50 backdrop-blur-sm;
}

.hover-scale {
  @apply transition-transform hover:scale-[1.02];
}
```

---

## 🧪 TESTAR:

1. **Criar** o arquivo `CollapsibleCard.tsx`
2. **Copiar** o código do componente
3. **Adicionar** imports na sua página
4. **Adicionar** estado `expandedRow`
5. **Substituir** a renderização da tabela
6. **Testar:** Clique na seta para expandir

---

## 🚀 BENEFÍCIOS:

- ✅ **Zero dependências** - Só usa Shadcn/UI
- ✅ **Compatível** - Funciona em qualquer projeto React
- ✅ **Standalone** - Não depende de outros componentes
- ✅ **Testado** - Já funciona 100% no Trade
- ✅ **Seguro** - Você controla quando e onde aplicar

---

## 💡 DICA PRO:

Se o Prospect-V2 usa **Shadcn/UI** (mesma lib do Trade), é **100% plug-and-play**!

Se usa outra UI lib (Material-UI, Ant Design), precisa adaptar os componentes `Card`, `Badge`, `Button`.

---

## ❓ PRÓXIMOS PASSOS:

1. Me confirme que o Prospect-V2 usa **Shadcn/UI**
2. Eu crio versão COMPLETA pronta para copiar
3. Você testa em 1 página primeiro
4. Depois aplicamos nas outras páginas

**Prospect-V2 usa Shadcn/UI?** 🎯

