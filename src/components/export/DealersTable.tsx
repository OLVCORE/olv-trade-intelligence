import { useState, Fragment, useRef, useEffect } from 'react';
import { Dealer } from './DealerCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  ExternalLink,
  Linkedin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Save,
  Loader2,
  CheckCircle,
  Search,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { extractDomain } from '@/lib/utils/urlHelpers';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { Input } from '@/components/ui/input';

interface DealersTableProps {
  dealers: Dealer[];
  onSaveIndividual?: (dealer: Dealer) => Promise<void>;
  savingDealerId?: string | null;
  onSaveSelected?: (dealers: Dealer[]) => Promise<void>;
  savedCompanyIds?: Set<string>; // IDs das empresas já salvas no banco
}

// ✅ ETAPA 3: Interface estendida para incluir campos necessários para badges
interface ExtendedDealer extends Dealer {
  fitScore?: number;
  b2bType?: string;
  employeeCount?: number;
  website?: string;
}

export function DealersTable({ dealers, onSaveIndividual, savingDealerId, onSaveSelected, savedCompanyIds = new Set() }: DealersTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedDealers, setSelectedDealers] = useState<Set<string>>(new Set());
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollbarRef = useRef<HTMLDivElement>(null);
  const verticalScrollRef = useRef<HTMLDivElement>(null);
  const horizontalScrollContentRef = useRef<HTMLDivElement>(null);
  
  // ✅ Sincronizar scrollbars horizontalmente
  useEffect(() => {
    const mainScroll = horizontalScrollRef.current;
    const bottomScroll = bottomScrollbarRef.current;
    
    if (mainScroll && bottomScroll) {
      const syncFromMain = () => {
        if (bottomScroll) {
          bottomScroll.scrollLeft = mainScroll.scrollLeft;
        }
      };
      
      const syncFromBottom = () => {
        if (mainScroll) {
          mainScroll.scrollLeft = bottomScroll.scrollLeft;
        }
      };
      
      mainScroll.addEventListener('scroll', syncFromMain);
      bottomScroll.addEventListener('scroll', syncFromBottom);
      
      return () => {
        mainScroll.removeEventListener('scroll', syncFromMain);
        bottomScroll.removeEventListener('scroll', syncFromBottom);
      };
    }
  }, [dealers.length]); // Re-executar quando dealers mudarem
  
  // ✅ Busca global (busca em todas as colunas)
  const [globalSearch, setGlobalSearch] = useState<string>('');
  
  // ✅ Filtros por coluna (tipo Excel)
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [filterQuality, setFilterQuality] = useState<string[]>([]); // ✅ NOVO: Filtro por qualidade/aderência
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterIndustry, setFilterIndustry] = useState<string[]>([]);
  const [filterEmployees, setFilterEmployees] = useState<string[]>([]);
  const [filterFitScore, setFilterFitScore] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const toggleRow = (dealerId: string) => {
    setExpandedRow(expandedRow === dealerId ? null : dealerId);
  };

  const toggleSelectDealer = (dealerId: string) => {
    setSelectedDealers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealerId)) {
        newSet.delete(dealerId);
      } else {
        newSet.add(dealerId);
      }
      return newSet;
    });
  };

  // ✅ ETAPA 3: Função para determinar badges de qualidade (MOVIDA PARA ANTES DO USO)
  // ✅ MICROCICLO 3 + 6: Badges inteligentes com categorias detalhadas
  const getQualityBadges = (dealer: ExtendedDealer) => {
    const badges: Array<{ label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; tooltip: string; category?: 'ALTO_MATCH' | 'MEDIO_OPORTUNIDADE' | 'MEDIO' | 'BAIXO' }> = [];
    const fitScore = dealer.fitScore || 0;
    const rawData = (dealer as any).raw_data || {};
    const fitCategory = rawData.fit_category || null; // ✅ Categoria do Fit Score (vem da Edge Function)
    const hasVolumeHigh = rawData.has_volume_high || false;
    
    // ✅ MICROCICLO 6: Badge ALTO_MATCH com tooltip explicativo
    if (fitCategory === 'ALTO_MATCH' || fitScore >= 70) {
      badges.push({
        label: 'Alta aderência',
        variant: 'default',
        icon: CheckCircle2,
        tooltip: 'Alta aderência ao contexto de uso final especificado. Empresa tem produtos específicos de Pilates/uso final requerido.',
        category: 'ALTO_MATCH',
      });
    }
    
    // ✅ MICROCICLO 6: Badge MEDIO_OPORTUNIDADE com tooltip explicativo estratégico
    if (fitCategory === 'MEDIO_OPORTUNIDADE' || (fitScore >= 50 && fitScore < 70 && hasVolumeHigh)) {
      badges.push({
        label: 'Oportunidade',
        variant: 'secondary',
        icon: TrendingUp,
        tooltip: 'Empresa relevante por HS Code e volume de compra, mas sem produtos de Pilates identificados ainda. Oportunidade comercial para apresentação do produto.',
        category: 'MEDIO_OPORTUNIDADE',
      });
    }
    
    // Badge: Penalizado (genérico ou uso incorreto) - apenas se não for oportunidade
    if (fitScore >= 40 && fitScore < 60 && fitCategory !== 'MEDIO_OPORTUNIDADE' && !hasVolumeHigh) {
      badges.push({
        label: 'Penalizado',
        variant: 'secondary',
        icon: AlertTriangle,
        tooltip: 'Penalizado: pode conter termos genéricos ou uso final incorreto',
        category: 'MEDIO',
      });
    }
    
    // ✅ MICROCICLO 6: Badge Fit baixo com tooltip explicativo melhorado
    if (fitScore < 40) {
      badges.push({
        label: 'Fit baixo',
        variant: 'destructive',
        icon: XCircle,
        tooltip: 'Fit score baixo: possível marketplace, datasource ou uso final inválido. Empresa não recomendada para prospecção direta.',
        category: 'BAIXO',
      });
    }
    
    // Badge: Marketplace/datasource (se detectado)
    if (dealer.website) {
      const blockedPatterns = ['alibaba', 'falabella', 'compumarket', 'importgenius', 'panjiva', 'mercadolivre', 'mercadolibre', 'product/', '/shop/', '/store/', 'sitemap'];
      const websiteLower = dealer.website.toLowerCase();
      if (blockedPatterns.some(pattern => websiteLower.includes(pattern))) {
        badges.push({
          label: 'Bloqueado',
          variant: 'destructive',
          icon: XCircle,
          tooltip: 'Bloqueado: marketplace, datasource ou e-commerce detectado',
          category: 'BAIXO',
        });
      }
    }
    
    return badges;
  };

  // ✅ Filtrar dealers com base nos filtros aplicados
  // ✅ MICROCICLO 2: Busca global dinâmica (em tempo real)
  const filteredDealers = dealers.filter((dealer, idx) => {
    const dealerId = (dealer as any).id || `dealer-${idx}`;
    const extendedDealer = dealer as ExtendedDealer;
    
    // ✅ Busca global dinâmica (filtro em tempo real enquanto digita)
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase();
      const searchableText = [
        dealer.name || '',
        dealer.country || '',
        dealer.city || '',
        dealer.state || '',
        dealer.industry || '',
        dealer.description || '',
        dealer.website || '',
        dealer.linkedinUrl || '',
        (dealer as any).apolloId || '',
        (dealer.decision_makers || []).map(dm => `${dm.name} ${dm.title}`).join(' '),
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }
    
    // Filtro por empresa (nome)
    if (filterCompany.length > 0) {
      const companyName = (dealer.name || '').toLowerCase();
      if (!filterCompany.some(f => companyName.includes(f.toLowerCase()))) {
        return false;
      }
    }
    
    // ✅ Filtro por qualidade/aderência
    if (filterQuality.length > 0) {
      const qualityBadges = getQualityBadges(extendedDealer);
      const badgeLabels = qualityBadges.map(b => b.label);
      // Se não tem badges e filtro inclui "Sem classificação", passar
      if (badgeLabels.length === 0 && filterQuality.includes('Sem classificação')) {
        // OK - passar
      } else if (badgeLabels.length === 0) {
        // Não tem badges e filtro não inclui "Sem classificação" - rejeitar
        return false;
      } else {
        // Tem badges - verificar se algum badge está no filtro
        const hasQuality = filterQuality.some(q => badgeLabels.includes(q));
        if (!hasQuality) {
          return false;
        }
      }
    }
    
    // Filtro por país
    if (filterCountry.length > 0) {
      const country = (dealer.country || '').toLowerCase();
      if (!filterCountry.some(f => country.includes(f.toLowerCase()))) {
        return false;
      }
    }
    
    // Filtro por indústria
    if (filterIndustry.length > 0) {
      const industry = (dealer.industry || 'N/A').toLowerCase();
      if (!filterIndustry.some(f => industry.includes(f.toLowerCase()) || (industry === 'n/a' && f.toLowerCase() === 'n/a'))) {
        return false;
      }
    }
    
    // Filtro por funcionários (ranges)
    if (filterEmployees.length > 0) {
      const count = extendedDealer.employeeCount;
      const range = 
        !count ? 'N/A' :
        count < 10 ? '1-10' :
        count < 50 ? '11-50' :
        count < 200 ? '51-200' :
        count < 500 ? '201-500' :
        '500+';
      if (!filterEmployees.includes(range)) {
        return false;
      }
    }
    
    // Filtro por Fit Score (ranges)
    if (filterFitScore.length > 0) {
      const fitScore = extendedDealer.fitScore || 0;
      const scoreRange = 
        fitScore >= 80 ? '80-100' :
        fitScore >= 60 ? '60-79' :
        fitScore >= 40 ? '40-59' :
        '0-39';
      if (!filterFitScore.includes(scoreRange)) {
        return false;
      }
    }
    
    // Filtro por status (Salva/Não salva)
    if (filterStatus.length > 0) {
      const isSaved = savedCompanyIds.has(dealerId);
      const status = isSaved ? 'Salva' : 'Não salva';
      if (!filterStatus.includes(status)) {
        return false;
      }
    }
    
    return true;
  });
  
  // ✅ Ordenar dealers
  const sortedDealers = [...filteredDealers].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aIdx = dealers.indexOf(a);
    const bIdx = dealers.indexOf(b);
    const aId = (a as any).id || `dealer-${aIdx}`;
    const bId = (b as any).id || `dealer-${bIdx}`;
    const extA = a as ExtendedDealer;
    const extB = b as ExtendedDealer;
    
    let comparison = 0;
    switch (sortColumn) {
      case 'company':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'country':
        comparison = (a.country || '').localeCompare(b.country || '');
        break;
      case 'industry':
        comparison = (a.industry || 'N/A').localeCompare(b.industry || 'N/A');
        break;
      case 'employees':
        comparison = (extA.employeeCount || 0) - (extB.employeeCount || 0);
        break;
      case 'fitScore':
        comparison = (extA.fitScore || 0) - (extB.fitScore || 0);
        break;
      case 'status':
        const aSaved = savedCompanyIds.has(aId);
        const bSaved = savedCompanyIds.has(bId);
        comparison = aSaved === bSaved ? 0 : aSaved ? 1 : -1;
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };
  
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDealers(new Set());
    } else {
      setSelectedDealers(new Set(sortedDealers.map((d, idx) => {
        const originalIdx = dealers.indexOf(d);
        return (d as any).id || `dealer-${originalIdx}`;
      })));
    }
  };
  
  const allSelected = sortedDealers.length > 0 && selectedDealers.size === sortedDealers.length;
  const someSelected = selectedDealers.size > 0 && selectedDealers.size < sortedDealers.length;

  const handleSaveSelected = async () => {
    if (selectedDealers.size === 0 || !onSaveSelected) return;
    const selected = sortedDealers.filter((d, idx) => {
      const originalIdx = dealers.indexOf(d);
      const dealerId = (d as any).id || `dealer-${originalIdx}`;
      return selectedDealers.has(dealerId);
    });
    await onSaveSelected(selected);
    setSelectedDealers(new Set());
  };

  const isDealerSaved = (dealer: Dealer, dealerId: string) => {
    // Verificar se empresa já está salva no banco
    return savedCompanyIds.has(dealerId);
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ✅ Contar filtros ativos
  const activeFiltersCount = 
    (globalSearch.trim() ? 1 : 0) +
    filterCompany.length + 
    filterQuality.length + 
    filterCountry.length + 
    filterIndustry.length + 
    filterEmployees.length + 
    filterFitScore.length + 
    filterStatus.length;

  return (
    <div className="rounded-md border overflow-hidden flex flex-col">
      {/* ✅ Campo de Busca Global */}
      <div className="p-3 border-b bg-muted/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar em todas as colunas (empresa, país, indústria, descrição, site, etc.)..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10 pr-4 h-10"
          />
          {globalSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGlobalSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* ✅ Indicador de Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="p-2 border-b bg-muted/30 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {sortedDealers.length} de {dealers.length} resultado(s) exibido(s) 
            <span className="ml-2 font-medium text-foreground">({activeFiltersCount} filtro(s) ativo(s))</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setGlobalSearch('');
              setFilterCompany([]);
              setFilterQuality([]);
              setFilterCountry([]);
              setFilterIndustry([]);
              setFilterEmployees([]);
              setFilterFitScore([]);
              setFilterStatus([]);
            }}
            className="h-7 text-xs"
          >
            Limpar Todos os Filtros
          </Button>
        </div>
      )}
      
      {/* ✅ Botão Salvar Selecionados */}
      {selectedDealers.size > 0 && onSaveSelected && (
        <div className="p-3 border-b bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-between">
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {selectedDealers.size} empresa(s) selecionada(s)
          </span>
          <Button
            size="sm"
            onClick={handleSaveSelected}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Selecionadas ({selectedDealers.size})
          </Button>
        </div>
      )}

      {/* ✅ ScrollArea Otimizado: Header fixo e scrollbar horizontal sempre visível */}
      <div className="flex flex-col h-[calc(100vh-500px)] min-h-[500px] max-h-[900px] w-full overflow-hidden relative">
        {/* ✅ Container externo: scroll horizontal sempre visível na parte inferior */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Container interno: scroll vertical + header fixo */}
          <div 
            ref={verticalScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden relative" 
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--border)) hsl(var(--muted))',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <style>{`
              /* Scrollbar vertical - lado direito - SEMPRE VISÍVEL */
              div[class*="overflow-y-auto"]::-webkit-scrollbar {
                width: 12px;
              }
              div[class*="overflow-y-auto"]::-webkit-scrollbar-track {
                background: hsl(var(--muted));
              }
              div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb {
                background: hsl(var(--border));
                border-radius: 6px;
              }
              div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
                background: hsl(var(--muted-foreground) / 0.5);
              }
            `}</style>
            {/* Container com scroll horizontal - conteúdo largo */}
            <div 
              ref={horizontalScrollRef}
              className="overflow-x-auto relative scrollbar-hide" 
              onScroll={(e) => {
                // Sincronizar scroll horizontal com a barra inferior
                if (bottomScrollbarRef.current) {
                  bottomScrollbarRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
              style={{ scrollbarWidth: 'none', scrollbarColor: 'transparent transparent' }}
            >
              <div ref={horizontalScrollContentRef}>
              <style>{`
                /* Ocultar scrollbar horizontal aqui - será mostrado na parte inferior */
                .scrollbar-hide::-webkit-scrollbar {
                  height: 0px;
                  display: none;
                }
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              <div className="min-w-[1600px]">
                <Table className="min-w-[1600px] w-full">
                  <TableHeader 
                    className="sticky top-0 z-[100] bg-background border-b-2 shadow-lg" 
                    style={{ 
                      position: 'sticky', 
                      top: 0, 
                      backgroundColor: 'hsl(var(--background))',
                      zIndex: 100,
                      backdropFilter: 'blur(8px)',
                      width: '100%',
                      display: 'table-header-group',
                    }}
                  >
                    {/* ✅ MICROCICLO 1: Header fixo definitivo - não se move em scroll vertical nem horizontal */}
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected ? true : undefined}
                      onCheckedChange={toggleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableHead>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="min-w-[250px]">
                    <ColumnFilter
                      column="company"
                      title="Empresa"
                      values={dealers.map(d => d.name || 'N/A')}
                      selectedValues={filterCompany}
                      onFilterChange={setFilterCompany}
                      onSort={() => handleSort('company')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    <ColumnFilter
                      column="quality"
                      title="Qualidade/Aderência"
                      values={(() => {
                        // ✅ Extrair todos os badges individuais de todos os dealers
                        const allBadges = new Set<string>();
                        dealers.forEach(d => {
                          const badges = getQualityBadges(d as ExtendedDealer);
                          badges.forEach(b => allBadges.add(b.label));
                        });
                        if (allBadges.size === 0) {
                          allBadges.add('Sem classificação');
                        }
                        return Array.from(allBadges);
                      })()}
                      selectedValues={filterQuality}
                      onFilterChange={setFilterQuality}
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <ColumnFilter
                      column="country"
                      title="País"
                      values={dealers.map(d => d.country || 'N/A')}
                      selectedValues={filterCountry}
                      onFilterChange={setFilterCountry}
                      onSort={() => handleSort('country')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <ColumnFilter
                      column="industry"
                      title="Indústria"
                      values={dealers.map(d => d.industry || 'N/A')}
                      selectedValues={filterIndustry}
                      onFilterChange={setFilterIndustry}
                      onSort={() => handleSort('industry')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[130px]">
                    <ColumnFilter
                      column="employees"
                      title="Funcionários"
                      values={dealers.map(d => {
                        const count = d.employeeCount;
                        if (!count) return 'N/A';
                        if (count < 10) return '1-10';
                        if (count < 50) return '11-50';
                        if (count < 200) return '51-200';
                        if (count < 500) return '201-500';
                        return '500+';
                      })}
                      selectedValues={filterEmployees}
                      onFilterChange={setFilterEmployees}
                      onSort={() => handleSort('employees')}
                    />
                  </TableHead>
                  <TableHead className="text-center min-w-[120px]">
                    <ColumnFilter
                      column="fitScore"
                      title="Fit Score"
                      values={dealers.map(d => {
                        const score = (d as ExtendedDealer).fitScore || 0;
                        if (score >= 80) return '80-100';
                        if (score >= 60) return '60-79';
                        if (score >= 40) return '40-59';
                        return '0-39';
                      })}
                      selectedValues={filterFitScore}
                      onFilterChange={setFilterFitScore}
                      onSort={() => handleSort('fitScore')}
                    />
                  </TableHead>
                  <TableHead className="text-right min-w-[120px]">
                    <ColumnFilter
                      column="status"
                      title="Status"
                      values={dealers.map((d, idx) => {
                        const dealerId = (d as any).id || `dealer-${idx}`;
                        return savedCompanyIds.has(dealerId) ? 'Salva' : 'Não salva';
                      })}
                      selectedValues={filterStatus}
                      onFilterChange={setFilterStatus}
                      onSort={() => handleSort('status')}
                    />
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
          {sortedDealers.map((dealer, idx) => {
            // ✅ CRÍTICO: Usar o MESMO formato de dealerId em toda a aplicação (consistente com salvamento)
            const dealerId = (dealer as any).id || dealer.name || `dealer-${idx}`;
            const extendedDealer = dealer as ExtendedDealer;
            const isSelected = selectedDealers.has(dealerId);
            // ✅ Verificar status salvo diretamente (sem função intermediária para garantir atualização)
            const isSaved = savedCompanyIds.has(dealerId);
            const rowNumber = idx + 1;
            
            return (
              <Fragment key={dealerId}>
              {/* Linha Principal */}
              <TableRow
                className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''} ${isSaved ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
                onClick={() => toggleRow(dealerId)}
              >
                {/* ✅ Checkbox de seleção */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectDealer(dealerId)}
                  />
                </TableCell>
                
                {/* ✅ Numeração */}
                <TableCell className="text-center text-sm text-muted-foreground font-medium">
                  {rowNumber}
                </TableCell>
                
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {expandedRow === dealerId ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span>{dealer.name}</span>
                    </div>
                    {dealer.website && (() => {
                      const domain = extractDomain(dealer.website) || dealer.website.replace(/^https?:\/\//, '').split('/')[0];
                      const fullUrl = dealer.website.startsWith('http') ? dealer.website : `https://${dealer.website}`;
                      
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Badge 
                                  variant="outline" 
                                  className="flex items-center gap-1.5 px-2.5 py-1 h-6 text-xs font-medium hover:bg-primary/10 hover:border-primary/50 cursor-pointer transition-colors max-w-[200px] shadow-sm"
                                >
                                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate leading-tight">{domain}</span>
                                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                                </Badge>
                              </a>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="top" 
                              className="max-w-[500px] break-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-xs font-mono">{fullUrl}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </div>
                </TableCell>
                
                {/* ✅ NOVA COLUNA: Qualidade/Aderência */}
                <TableCell>
                  <TooltipProvider>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getQualityBadges(extendedDealer).length > 0 ? (
                        getQualityBadges(extendedDealer).map((badge, idx) => {
                          const Icon = badge.icon;
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={badge.variant} 
                                  className="h-6 px-2.5 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                                >
                                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="leading-tight">{badge.label}</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs max-w-xs">
                                <p>{badge.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="h-6 px-2.5 text-xs font-medium text-muted-foreground"
                        >
                          Sem classificação
                        </Badge>
                      )}
                    </div>
                  </TooltipProvider>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-1.5 px-2.5 py-1 h-6 text-xs font-medium whitespace-nowrap shadow-sm"
                  >
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="leading-tight">{dealer.country}</span>
                  </Badge>
                </TableCell>
                
                <TableCell>
                  {dealer.industry ? (
                    <Badge 
                      variant="outline" 
                      className="px-2.5 py-1 h-6 text-xs font-medium whitespace-nowrap shadow-sm bg-muted/50"
                    >
                      <span className="leading-tight">{dealer.industry}</span>
                    </Badge>
                  ) : (
                    <Badge 
                      variant="ghost" 
                      className="text-muted-foreground px-2.5 py-1 h-6 text-xs font-medium whitespace-nowrap"
                    >
                      <span className="leading-tight">N/A</span>
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className="flex items-center gap-1.5 px-2.5 py-1 h-6 text-xs font-medium whitespace-nowrap shadow-sm"
                  >
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="leading-tight">{dealer.employeeCount || 'N/A'}</span>
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`h-3 w-20 rounded-full ${getFitScoreColor(dealer.fitScore || 0)} shadow-sm`}
                    >
                      <div
                        className="h-full rounded-full bg-white/30 transition-all duration-300"
                        style={{ width: `${dealer.fitScore || 0}%` }}
                      />
                    </div>
                    <Badge 
                      variant="outline" 
                      className="px-2.5 py-1 h-6 text-xs font-semibold whitespace-nowrap min-w-[2.5rem] justify-center shadow-sm"
                    >
                      <span className="leading-tight">{dealer.fitScore || 0}</span>
                    </Badge>
                  </div>
                </TableCell>
                
                {/* ✅ Status (Salva ou não) */}
                <TableCell className="text-right">
                  {isSaved ? (
                    <Badge 
                      variant="outline" 
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 flex items-center gap-1.5 px-2.5 py-1 h-6 text-xs font-medium whitespace-nowrap shadow-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="leading-tight">Salva</span>
                    </Badge>
                  ) : (
                    <Badge 
                      variant="ghost" 
                      className="text-muted-foreground flex items-center gap-1.5 px-2.5 py-1 h-6 text-xs font-medium whitespace-nowrap"
                    >
                      <span className="leading-tight">Não salva</span>
                    </Badge>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* ✅ Botão Salvar Individual */}
                    {onSaveIndividual && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (onSaveIndividual) {
                            await onSaveIndividual(dealer);
                          }
                        }}
                        disabled={savingDealerId === dealerId || isSaved}
                        title={isSaved ? "Empresa já salva" : "Salvar empresa individualmente"}
                      >
                        {savingDealerId === dealerId ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        ) : isSaved ? (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Save className="h-4 w-4 text-emerald-600" />
                        )}
                      </Button>
                    )}
                    {dealer.linkedinUrl && (
                      <a
                        href={dealer.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {/* Linha Expandida (Card Completo) */}
              {expandedRow === dealerId && (
                <TableRow>
                  <TableCell colSpan={11} className="bg-muted/30 p-0">
                    <Card className="border-0 shadow-none">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Coluna Esquerda */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Informações Gerais</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Nome:</span>
                                  <span className="font-medium">{dealer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Indústria:</span>
                                  <span className="font-medium">{dealer.industry || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Funcionários:</span>
                                  <Badge variant="secondary">
                                    {dealer.employeeCount || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2">Localização</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    {dealer.city && <p>{dealer.city}</p>}
                                    {dealer.state && <p>{dealer.state}</p>}
                                    <p className="font-medium">{dealer.country}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {dealer.description && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                                <p className="text-sm text-muted-foreground">{dealer.description}</p>
                              </div>
                            )}
                          </div>

                          {/* Coluna Direita */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Fit Score</h4>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${getFitScoreColor(dealer.fitScore || 0)}`}
                                      style={{ width: `${dealer.fitScore || 0}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-2xl font-bold">{dealer.fitScore || 0}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {dealer.fitScore >= 80 && '✅ Excelente fit para B2B - Alta aderência ao uso final'}
                                {dealer.fitScore >= 60 && dealer.fitScore < 80 && '✅ Bom fit para B2B'}
                                {dealer.fitScore >= 40 && dealer.fitScore < 60 && '⚠️ Fit moderado - Verificar uso final'}
                                {dealer.fitScore < 40 && '🚫 Fit baixo - Possível marketplace ou uso inválido'}
                              </p>
                              
                              {/* ✅ ETAPA 3: Badges de qualidade no card expandido */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <TooltipProvider>
                                  {getQualityBadges(extendedDealer).map((badge, badgeIdx) => {
                                    const Icon = badge.icon;
                                    return (
                                      <Tooltip key={badgeIdx}>
                                        <TooltipTrigger>
                                          <Badge variant={badge.variant} className="text-xs flex items-center gap-1">
                                            <Icon className="h-3 w-3" />
                                            {badge.label}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="text-xs max-w-xs">
                                          <p>{badge.tooltip}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
          })}
              
              {sortedDealers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    {dealers.length === 0 
                      ? 'Nenhum dealer encontrado'
                      : `Nenhum dealer corresponde aos filtros aplicados (${dealers.length} total). Limpe os filtros para ver todos os resultados.`}
                  </TableCell>
                </TableRow>
              )}
                  </TableBody>
                </Table>
              </div>
              </div>
            </div>
          </div>
          {/* ✅ Scrollbar horizontal SEMPRE VISÍVEL na parte inferior */}
          <div 
            ref={bottomScrollbarRef}
            className="h-4 w-full bg-muted/30 border-t overflow-x-auto flex-shrink-0 scrollbar-visible" 
            onScroll={(e) => {
              // Sincronizar scroll horizontal com o container principal
              if (horizontalScrollRef.current) {
                horizontalScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--border)) hsl(var(--muted))',
              minHeight: '16px'
            }}
          >
            <style>{`
              /* Scrollbar horizontal - SEMPRE VISÍVEL */
              .scrollbar-visible::-webkit-scrollbar {
                height: 12px !important;
                display: block !important;
              }
              .scrollbar-visible::-webkit-scrollbar-track {
                background: hsl(var(--muted)) !important;
                border-radius: 6px;
              }
              .scrollbar-visible::-webkit-scrollbar-thumb {
                background: hsl(var(--border)) !important;
                border-radius: 6px;
              }
              .scrollbar-visible::-webkit-scrollbar-thumb:hover {
                background: hsl(var(--muted-foreground) / 0.5) !important;
              }
            `}</style>
            <div className="min-w-[1600px] h-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

