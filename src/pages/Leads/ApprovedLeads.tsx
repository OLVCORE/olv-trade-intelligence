import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { QuarantineActionsMenu } from '@/components/icp/QuarantineActionsMenu';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { StrategicIntelligenceDialog } from '@/components/intelligence/SimpleTOTVSCheckDialog';
import { EnrichmentProgressModal, type EnrichmentProgress } from '@/components/companies/EnrichmentProgressModal';
import { getLocationDisplay, getCommercialBlockDisplay, getLeadSource } from '@/lib/utils/leadSourceHelpers';
import { 
  CheckCircle2, 
  Rocket, 
  Search,
  Building2,
  TrendingUp,
  Users,
  Zap,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Target,
  ExternalLink,
  Linkedin,
  Mail,
  Phone,
  Edit,
  Plus,
  Globe,
  ArrowUpDown,
  Loader2,
  Eye,
  FileText,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DealFormDialog } from '@/components/sdr/DealFormDialog';
import { ApprovedLeadActions } from '@/components/leads/ApprovedLeadActions';
import { useQueryClient } from '@tanstack/react-query';

interface ApprovedLead {
  id: string;
  company_id: string;
  cnpj: string;
  razao_social: string;
  icp_score: number;
  temperatura: 'hot' | 'warm' | 'cold';
  segmento: string;
  status: string;
  created_at: string;
}

export default function ApprovedLeads() {
  console.log('[APPROVED-LEADS] 🚀 Componente montado!');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [leads, setLeads] = useState<ApprovedLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<ApprovedLead[]>([]);
  const [loading, setLoading] = useState(true);
  
  console.log('[APPROVED-LEADS] 📊 Estado inicial:', { 
    leadsCount: leads.length, 
    filteredCount: filteredLeads.length,
    loading 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<ApprovedLead | null>(null);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [uniqueSources, setUniqueSources] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(50); // 🔢 Paginação configurável
  
  // ✅ EXPANSÃO DE LINHAS (card dropdown)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const toggleRow = (leadId: string) => {
    setExpandedRow(expandedRow === leadId ? null : leadId);
  };
  
  // ✅ SELEÇÃO EM MASSA (checkboxes)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredLeads.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectOne = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, leadId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== leadId));
    }
  };
  
  // ✅ SCI/STC (Strategic Intelligence Check)
  const [stcDialogOpen, setStcDialogOpen] = useState(false);
  const [stcLead, setStcLead] = useState<any | null>(null);
  
  // ✅ BARRA DE PROGRESSO (enriquecimento)
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress[]>([]);
  const [cancelEnrichment, setCancelEnrichment] = useState(false);
  
  // ✅ ORDENAÇÃO
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // 🔍 FILTROS INTELIGENTES POR COLUNA
  const [filterCNPJStatus, setFilterCNPJStatus] = useState<string[]>([]);
  const [filterSector, setFilterSector] = useState<string[]>([]);
  const [filterUF, setFilterUF] = useState<string[]>([]);
  const [filterAnalysisStatus, setFilterAnalysisStatus] = useState<string[]>([]);
  const [filterBlock, setFilterBlock] = useState<string[]>([]);
  const [filterLeadSource, setFilterLeadSource] = useState<string[]>([]);
  const [filterOrigin, setFilterOrigin] = useState<string[]>([]);

  useEffect(() => {
    console.log('[APPROVED-LEADS] 🔄 useEffect disparado - carregando leads...');
    loadApprovedLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, temperatureFilter, sourceFilter, leads]);

  useEffect(() => {
    // Extrair origens únicas dos leads
    const sources = Array.from(new Set(leads.map(l => l.source_name).filter(Boolean)));
    setUniqueSources(sources as string[]);
  }, [leads]);

  const loadApprovedLeads = async () => {
    try {
      console.log('[APPROVED-LEADS] 🔍 Iniciando busca de leads aprovados...');
      setLoading(true);
      
      // ✅ BUSCAR DE AMBAS AS FONTES: icp_analysis_results (status='aprovada') E leads_pool
      // Isso garante que leads aprovados anteriormente e recentemente sejam mostrados
      console.log('[APPROVED-LEADS] 📤 Executando queries...');
      const [analysisResults, leadsPool] = await Promise.all([
        supabase
          .from('icp_analysis_results')
          .select('*')
          .eq('status', 'aprovada')
          .order('icp_score', { ascending: false }),
        supabase
          .from('leads_pool')
          .select('*')
          .order('icp_score', { ascending: false })
      ]);

      console.log('[APPROVED-LEADS] 📥 Queries concluídas:', {
        analysisResultsCount: analysisResults.data?.length || 0,
        leadsPoolCount: leadsPool.data?.length || 0,
        analysisError: analysisResults.error?.message,
        leadsPoolError: leadsPool.error?.message
      });

      if (analysisResults.error) {
        console.error('[APPROVED-LEADS] ❌ Erro ao buscar icp_analysis_results:', analysisResults.error);
      }
      if (leadsPool.error) {
        console.error('[APPROVED-LEADS] ❌ Erro ao buscar leads_pool:', leadsPool.error);
      }

      // Combinar e remover duplicatas (por company_id ou razao_social)
      const allLeads = [
        ...(analysisResults.data || []),
        ...(leadsPool.data || [])
      ];

      // Remover duplicatas baseado em ID ou razao_social
      const uniqueLeads = allLeads.reduce((acc, lead) => {
        const key = lead.id || lead.razao_social;
        if (!acc.find(l => (l.id === lead.id) || (l.razao_social === lead.razao_social && l.razao_social))) {
          acc.push(lead);
        }
        return acc;
      }, [] as any[]);

      console.log('[APPROVED-LEADS] ✅ Leads carregados:', {
        fromAnalysis: analysisResults.data?.length || 0,
        fromPool: leadsPool.data?.length || 0,
        total: uniqueLeads.length
      });

      setLeads(uniqueLeads);
    } catch (error) {
      console.error('[APPROVED-LEADS] ❌ Erro ao carregar leads aprovados:', error);
      toast.error('Erro ao carregar leads aprovados');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cnpj?.includes(searchTerm)
      );
    }

    // Filtro de temperatura (mantido)
    if (temperatureFilter !== 'all') {
      filtered = filtered.filter(lead => lead.temperatura === temperatureFilter);
    }

    // Filtro de origem (mantido)
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source_name === sourceFilter);
    }

    // 🔍 FILTROS INTELIGENTES ADICIONAIS
    
    // Filtro por Status CNPJ
    if (filterCNPJStatus.length > 0) {
      filtered = filtered.filter(lead => {
        // ✅ CORRIGIR: icp_analysis_results usa raw_analysis, não raw_data
        const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
        const receitaData = rawData.receita_federal || {};
        let status = 'PENDENTE';
        
        if (receitaData.situacao || receitaData.status || rawData.situacao || rawData.status) {
          status = receitaData.situacao || receitaData.status || rawData.situacao || rawData.status;
          
          if (status.toUpperCase().includes('ATIVA') || status === '02') status = 'ATIVA';
          else if (status.toUpperCase().includes('SUSPENSA') || status === '03') status = 'SUSPENSA';
          else if (status.toUpperCase().includes('INAPTA') || status === '04') status = 'INAPTA';
          else if (status.toUpperCase().includes('BAIXADA') || status === '08') status = 'BAIXADA';
          else if (status.toUpperCase().includes('NULA') || status === '01') status = 'NULA';
        }
        
        return filterCNPJStatus.includes(status);
      });
    }
    
    // Filtro por Setor
    if (filterSector.length > 0) {
      filtered = filtered.filter(lead => {
        // ✅ CORRIGIR: icp_analysis_results usa raw_analysis, não raw_data
        const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
        const sector = lead.segmento || rawData.setor_amigavel || rawData.atividade_economica || rawData.apollo_organization?.industry || 'N/A';
        return filterSector.includes(sector);
      });
    }
    
    // Filtro por UF
    if (filterUF.length > 0) {
      filtered = filtered.filter(lead => {
        const uf = (lead as any).uf || (lead as any).raw_data?.uf || '';
        return filterUF.includes(uf);
      });
    }
    
    // Filtro por Status Análise
    if (filterAnalysisStatus.length > 0) {
      filtered = filtered.filter(lead => {
        // ✅ CORRIGIR: icp_analysis_results usa raw_analysis, não raw_data
        const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj || lead.cnpj);
        const hasDecisionMakers = !!(rawData.decision_makers?.length || rawData.apollo_decisores_count || (lead as any).decision_makers_count || 0);
        const hasDigitalPresence = !!(rawData.enrichment_360 || rawData.digital_intelligence);
        const hasLegalData = !!(rawData.stc_verification || rawData.totvs_report);
        
        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
        
        let statusLabel = '0-25%';
        if (percentage > 75) statusLabel = '76-100%';
        else if (percentage > 50) statusLabel = '51-75%';
        else if (percentage > 25) statusLabel = '26-50%';
        
        return filterAnalysisStatus.includes(statusLabel);
      });
    }

    setFilteredLeads(filtered);
  };

  const handleCreateDeal = (lead: ApprovedLead) => {
    setSelectedLead(lead);
    setDealFormOpen(true);
  };

  const handleDealSuccess = () => {
    // ✅ INVALIDAR CACHE DO SALES WORKSPACE
    queryClient.invalidateQueries({ queryKey: ['sales_deals'] });
    queryClient.invalidateQueries({ queryKey: ['sdr_deals'] });
    queryClient.invalidateQueries({ queryKey: ['sales_deals'] });
    
    toast.success('✅ Deal criado com sucesso!', {
      description: 'O deal foi adicionado ao Sales Workspace. Clique para ir ao pipeline.',
      action: {
        label: 'Ir ao Pipeline',
        onClick: () => navigate('/sdr/workspace'),
      },
      duration: 5000,
    });
    
    setDealFormOpen(false);
    setSelectedLead(null);
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'bg-red-600';
      case 'warm': return 'bg-yellow-600';
      case 'cold': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  const getTemperatureLabel = (temp: string) => {
    switch (temp) {
      case 'hot': return 'QUENTE';
      case 'warm': return 'MORNO';
      case 'cold': return 'FRIO';
      default: return 'N/A';
    }
  };

  return (
    <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              Leads Aprovados
            </h1>
            <p className="text-muted-foreground mt-2">
              Empresas qualificadas pelo ICP, prontas para criar deals
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/comando')}
            >
              ← Voltar ao Comando
            </Button>
            <Button 
              onClick={() => navigate('/sdr/workspace')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Ir para Pipeline
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Aprovados</p>
                  <p className="text-2xl font-bold">{leads.length}</p>
                  {filteredLeads.length !== leads.length && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {filteredLeads.length} filtrados
                    </p>
                  )}
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Quentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {leads.filter(l => l.temperatura === 'hot').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Médio</p>
                  <p className="text-2xl font-bold">
                    {leads.length > 0
                      ? Math.round(leads.reduce((sum, l) => sum + (l.icp_score || 0), 0) / leads.length)
                      : 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deals Criados</p>
                  <p className="text-2xl font-bold text-slate-600">0</p>
                </div>
                <Zap className="h-8 w-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              
              {/* 🔢 DROPDOWN DE PAGINAÇÃO */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar por página:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                    <SelectItem value="9999">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={temperatureFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('all')}
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={temperatureFilter === 'hot' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('hot')}
                    size="sm"
                    className={temperatureFilter === 'hot' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Quentes
                  </Button>
                  <Button
                    variant={temperatureFilter === 'warm' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('warm')}
                    size="sm"
                    className={temperatureFilter === 'warm' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    Mornos
                  </Button>
                  <Button
                    variant={temperatureFilter === 'cold' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('cold')}
                    size="sm"
                    className={temperatureFilter === 'cold' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Frios
                  </Button>
                </div>
                
                {/* FILTRO POR ORIGEM */}
                {uniqueSources.length > 0 && (
                  <div className="flex gap-2 border-l pl-4">
                    <Button
                      variant={sourceFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setSourceFilter('all')}
                      size="sm"
                    >
                      Todas Origens
                    </Button>
                    {uniqueSources.map(source => (
                      <Button
                        key={source}
                        variant={sourceFilter === source ? 'default' : 'outline'}
                        onClick={() => setSourceFilter(source)}
                        size="sm"
                        className={sourceFilter === source ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {source}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leads */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Carregando leads aprovados...
              </CardContent>
            </Card>
          ) : filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum lead aprovado encontrado
                </p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/leads/icp-quarantine')}
                  className="mt-2"
                >
                  Ir para Quarentena ICP →
                </Button>
              </CardContent>
            </Card>
          ) : (
            (pageSize === 9999 ? filteredLeads : filteredLeads.slice(0, pageSize)).map((lead) => {
              // ✅ CORRIGIR: icp_analysis_results usa raw_analysis, não raw_data
              const rawDataExpanded = ((lead as any).raw_analysis && typeof (lead as any).raw_analysis === 'object' && !Array.isArray((lead as any).raw_analysis)) 
                ? (lead as any).raw_analysis as Record<string, any>
                : ((lead as any).raw_data && typeof (lead as any).raw_data === 'object' && !Array.isArray((lead as any).raw_data))
                  ? (lead as any).raw_data as Record<string, any>
                  : {};
              
              return (
              <div key={lead.id} className="space-y-0">
              <Card 
                className="hover:border-primary/50 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Building2 className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                          {/* ✅ BOTÃO TOGGLE DROPDOWN */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(lead.id);
                            }}
                            title={expandedRow === lead.id ? 'Recolher Informações Gerais' : 'Expandir Informações Gerais'}
                          >
                            {expandedRow === lead.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {/* ✅ LOCALIZAÇÃO (Cidade + País) */}
                          {(() => {
                            const location = getLocationDisplay(lead);
                            if (location.country !== 'N/A') {
                              return (
                                <Badge variant="secondary" className="text-xs">
                                  {location.city && location.city !== 'N/A' ? `${location.city}, ${location.country}` : location.country}
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* ✅ BLOCO */}
                          <Badge variant="outline" className="text-xs">
                            {getCommercialBlockDisplay(lead)}
                          </Badge>
                          
                          {/* ✅ LEAD SOURCE */}
                          <Badge variant="secondary" className="bg-purple-600/10 text-purple-600 border-purple-600/30 text-xs">
                            {getLeadSource(lead)}
                          </Badge>
                          
                          {/* ✅ BADGE STATUS ANÁLISE (IDÊNTICO QUARENTENA) */}
                          <QuarantineEnrichmentStatusBadge 
                            rawAnalysis={(lead as any).raw_analysis || (lead as any).raw_data || {}}
                            showProgress={true}
                          />
                          
                          {lead.source_name && (
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs"
                            >
                              {lead.source_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {lead.segmento || rawDataExpanded?.apollo_organization?.industry || rawDataExpanded?.receita_federal?.atividade_principal?.[0]?.text || 'Segmento não identificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">ICP Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {lead.icp_score || 0}
                        </p>
                      </div>

                      <Badge className={getTemperatureColor(lead.temperatura)}>
                        {getTemperatureLabel(lead.temperatura)}
                      </Badge>

                      {/* ✅ MENU DE AÇÕES (ENGRENAGEM) */}
                      <ApprovedLeadActions
                        lead={lead}
                        onPreview={(lead) => {
                          // TODO: Implementar modal de preview se necessário
                          toast.info('Modal de preview em desenvolvimento');
                        }}
                        onCreateDeal={(lead) => handleCreateDeal(lead)}
                        onRefresh={async (id) => {
                          await loadApprovedLeads();
                          toast.success('Lead atualizado com sucesso');
                        }}
                        onEnrichReceita={async (id) => {
                          // Implementar enriquecimento Receita Federal
                          toast.info('Enriquecimento Receita Federal em desenvolvimento');
                        }}
                        onEnrichApollo={async (id) => {
                          // Implementar enriquecimento Apollo
                          toast.info('Enriquecimento Apollo em desenvolvimento');
                        }}
                        onEnrich360={async (id) => {
                          // Implementar enriquecimento 360
                          toast.info('Enriquecimento 360° em desenvolvimento');
                        }}
                        onEnrichInternational={async (id) => {
                          // ✅ CORRIGIDO: Enriquecimento internacional com salvamento no banco
                          const leadData = leads.find(l => l.id === id);
                          if (!leadData) return;
                          
                          const website = (leadData as any).website || (leadData as any).raw_analysis?.domain || (leadData as any).raw_analysis?.website || (leadData as any).raw_data?.domain;
                          
                          // ✅ PRIORIDADE: raw_data.company_name (pode ter nome completo) → razao_social (pode estar truncado)
                          const companyName = (leadData as any).raw_analysis?.company_name || 
                                            (leadData as any).raw_data?.company_name || 
                                            leadData.razao_social || 
                                            (leadData as any).company_name || '';
                          
                          console.log('[ENRICH-INTERNATIONAL] 🔍 Nome da empresa para busca:', {
                            razao_social: leadData.razao_social,
                            raw_analysis_company_name: (leadData as any).raw_analysis?.company_name,
                            raw_data_company_name: (leadData as any).raw_data?.company_name,
                            final_company_name: companyName,
                          });
                          
                          if (!website) {
                            toast.error('Lead sem website');
                            return;
                          }
                          
                          try {
                            toast.info('🔍 Extraindo dados internacionais...');
                            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                            
                            console.log('[ENRICH-INTERNATIONAL] 📤 Enviando para Edge Function:', { url: website, company_name: companyName });
                            
                            // ✅ Chamar Edge Function COM NOME DA EMPRESA COMPLETO
                            const extractResponse = await fetch(`${supabaseUrl}/functions/v1/extract-company-info-from-url`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                              },
                              body: JSON.stringify({ 
                                url: website,
                                company_name: companyName || undefined, // ✅ Enviar nome completo se disponível
                              }),
                            });
                            
                            if (!extractResponse.ok) {
                              const errorText = await extractResponse.text();
                              throw new Error(`Erro ao extrair dados: ${extractResponse.status} - ${errorText}`);
                            }
                            
                            const extractedInfo = await extractResponse.json();
                            console.log('[ENRICH-INTERNATIONAL] 🔍 Dados extraídos da Edge Function:', extractedInfo);
                            console.log('[ENRICH-INTERNATIONAL] 🔍 País extraído:', extractedInfo.country);
                            console.log('[ENRICH-INTERNATIONAL] 🔍 Nome extraído:', extractedInfo.company_name);
                            
                            // ✅ SALVAR DADOS EXTRAÍDOS NO BANCO (raw_data - mesmo padrão da Quarentena)
                            const currentRawData = (leadData as any).raw_analysis || (leadData as any).raw_data || {};
                            const updatedRawData = {
                              ...currentRawData,
                              // Preservar dados existentes
                              domain: website || currentRawData.domain,
                              website: website,
                              // ✅ ATUALIZAR COM DADOS EXTRAÍDOS (PRIORIDADE MÁXIMA)
                              company_name: extractedInfo.company_name || currentRawData.company_name || leadData.razao_social,
                              country: extractedInfo.country || currentRawData.country, // ✅ PAÍS EXTRAÍDO TEM PRIORIDADE
                              city: extractedInfo.city || currentRawData.city,
                              state: extractedInfo.state || currentRawData.state,
                              address: extractedInfo.address || currentRawData.address,
                              phone: extractedInfo.phone || currentRawData.phone,
                              email: extractedInfo.email || currentRawData.email,
                              international_enrichment: {
                                ...extractedInfo,
                                extracted_at: new Date().toISOString(),
                                source: extractedInfo.source || 'extract-company-info-from-url',
                              },
                            };
                            
                            console.log('[ENRICH-INTERNATIONAL] 💾 Salvando no banco:', {
                              id,
                              country: updatedRawData.country,
                              company_name: updatedRawData.company_name,
                            });
                            
                            // ✅ ATUALIZAR raw_data (mesmo padrão da Quarentena)
                            const { error: updateError, data: updateData } = await supabase
                              .from('icp_analysis_results')
                              .update({
                                raw_data: updatedRawData,
                              })
                              .eq('id', id)
                              .select('raw_data');
                            
                            console.log('[ENRICH-INTERNATIONAL] 💾 Dados salvos no banco:', updateData);
                            
                            if (updateError) {
                              console.error('[ENRICH-INTERNATIONAL] Erro ao atualizar:', updateError);
                              throw updateError;
                            }
                            
                            console.log('[ENRICH-INTERNATIONAL] ✅ Dados atualizados em icp_analysis_results');
                            
                            // ✅ Se tiver company_id, atualizar também a tabela companies (CRÍTICO)
                            const companyId = (leadData as any).company_id;
                            if (companyId) {
                              const companyUpdateData: any = {};
                              if (extractedInfo.company_name && extractedInfo.company_name.length > 3) {
                                companyUpdateData.company_name = extractedInfo.company_name;
                              }
                              // ✅ PAÍS É CRÍTICO - SEMPRE ATUALIZAR SE EXTRAÍDO
                              if (extractedInfo.country && extractedInfo.country !== 'N/A' && extractedInfo.country !== 'United Kingdom') {
                                companyUpdateData.country = extractedInfo.country;
                                console.log('[ENRICH-INTERNATIONAL] ✅ Atualizando país na tabela companies:', extractedInfo.country);
                              }
                              if (extractedInfo.city) companyUpdateData.city = extractedInfo.city;
                              if (extractedInfo.state) companyUpdateData.state = extractedInfo.state;
                              
                              // ✅ ATUALIZAR raw_data da companies também
                              const { data: currentCompany } = await supabase
                                .from('companies')
                                .select('raw_data')
                                .eq('id', companyId)
                                .single();
                              
                              const companyRawData = currentCompany?.raw_data || {};
                              companyUpdateData.raw_data = {
                                ...companyRawData,
                                country: extractedInfo.country || companyRawData.country,
                                international_enrichment: {
                                  ...extractedInfo,
                                  extracted_at: new Date().toISOString(),
                                },
                              };
                              
                              const { error: companyUpdateError, data: companyUpdateResult } = await supabase
                                .from('companies')
                                .update(companyUpdateData)
                                .eq('id', companyId)
                                .select('country, raw_data');
                              
                              if (companyUpdateError) {
                                console.error('[ENRICH-INTERNATIONAL] ❌ Erro ao atualizar companies:', companyUpdateError);
                              } else {
                                console.log('[ENRICH-INTERNATIONAL] ✅ Dados atualizados na tabela companies:', companyUpdateResult);
                              }
                            }
                            
                            console.log('[ENRICH-INTERNATIONAL] ✅ Dados salvos. Extraído:', extractedInfo);
                            
                            toast.success(`✅ Dados internacionais atualizados!`, {
                              description: `Nome: ${extractedInfo.company_name || leadData.razao_social}, País: ${extractedInfo.country || 'N/A'}`,
                            });
                            
                            // ✅ FORÇAR INVALIDAÇÃO DO CACHE E RECARREGAR
                            await queryClient.invalidateQueries({ queryKey: ['approved-leads'] });
                            await queryClient.invalidateQueries({ queryKey: ['icp-analysis'] });
                            
                            // Aguardar 1s para garantir que o banco processou
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Recarregar dados FORÇADAMENTE (sem cache)
                            await loadApprovedLeads();
                            
                            // Forçar atualização do estado
                            setLeads([]);
                            await loadApprovedLeads();
                          } catch (error: any) {
                            console.error('[ENRICH-INTERNATIONAL] Erro:', error);
                            toast.error('Erro ao enriquecer dados internacionais', { 
                              description: error.message || 'Erro desconhecido' 
                            });
                          }
                        }}
                        onEnrichCompleto={async (id) => {
                          // Implementar enriquecimento completo
                          toast.info('Enriquecimento completo 360° em desenvolvimento');
                        }}
                      />

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 🎯 ABRIR MODAL DE DEAL (mantido)
                          handleCreateDeal(lead);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Criar Deal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* ✅ CARD EXPANDIDO - DROPDOWN INFORMAÇÕES GERAIS (IDÊNTICO À BASE DE EMPRESAS E QUARENTENA) */}
              {expandedRow === lead.id && (
                <Card className="border-t-0 rounded-t-none mt-0 bg-muted/30">
                  <CardContent className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                      {/* COLUNA ESQUERDA */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Informações Gerais
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[100px]">Nome:</span>
                              <span className="font-medium flex-1">{lead.razao_social || lead.company_name}</span>
                            </div>
                            {lead.cnpj && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground min-w-[100px]">CNPJ:</span>
                                <span className="font-mono text-xs flex-1">{lead.cnpj}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[100px]">Indústria:</span>
                              <span className="font-medium flex-1">{lead.segmento || rawDataExpanded?.setor_amigavel || rawDataExpanded?.atividade_economica || rawDataExpanded?.apollo_organization?.industry || 'N/A'}</span>
                            </div>
                            {(rawDataExpanded?.apollo_organization?.employee_count || rawDataExpanded?.employee_count) && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground min-w-[100px]">Funcionários:</span>
                                <Badge variant="secondary" className="flex-1 justify-start w-fit">
                                  {rawDataExpanded?.apollo_organization?.employee_count || rawDataExpanded?.employee_count}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[100px]">Origem:</span>
                              <Badge variant="outline" className="flex-1 justify-start w-fit">
                                {getLeadSource(lead)}
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[100px]">Bloco:</span>
                              <Badge variant="outline" className="flex-1 justify-start w-fit">
                                {getCommercialBlockDisplay(lead)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Localização
                          </h4>
                          <div className="space-y-1 text-sm">
                            {(() => {
                              const location = getLocationDisplay(lead);
                              return (
                                <>
                                  {location.city && location.city !== 'N/A' && <p className="text-muted-foreground">{location.city}</p>}
                                  {(lead as any).state && <p className="text-muted-foreground">{(lead as any).state}</p>}
                                  {location.country && location.country !== 'N/A' && <p className="font-medium">{location.country}</p>}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {(rawDataExpanded?.notes || rawDataExpanded?.apollo_organization?.description) && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              Descrição
                              {lead.company_id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/company/${lead.company_id}`);
                                  }}
                                  title="Editar descrição na página da empresa"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {rawDataExpanded?.notes || rawDataExpanded?.apollo_organization?.description}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* COLUNA DIREITA */}
                      <div className="space-y-4">
                        {/* FIT SCORE */}
                        {(() => {
                          const fitScore = rawDataExpanded?.fit_score || 0;
                          const b2bType = rawDataExpanded?.type || (lead as any).b2b_type;
                          
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
                                        className={`h-full ${fitScore >= 80 ? 'bg-green-500' : fitScore >= 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
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
                        
                        {/* LINKS EXTERNOS */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Links Externos
                          </h4>
                          <div className="space-y-2">
                            {/* WEBSITE */}
                            {(rawDataExpanded?.domain || rawDataExpanded?.apollo_organization?.website_url) ? (
                              <div className="flex items-center gap-2">
                                <a href={rawDataExpanded?.domain || rawDataExpanded?.apollo_organization?.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                  <Globe className="h-4 w-4" />
                                  Website
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                {lead.company_id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/company/${lead.company_id}`);
                                    }}
                                    title="Editar website na página da empresa"
                                  >
                                    <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              lead.company_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/company/${lead.company_id}`);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar Website
                                </Button>
                              )
                            )}
                            
                            {/* LINKEDIN */}
                            {(() => {
                              const linkedinUrl = rawDataExpanded?.linkedin_url || rawDataExpanded?.apollo_organization?.linkedin_url;
                              if (linkedinUrl) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                      <Linkedin className="h-4 w-4" />
                                      LinkedIn
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                    {lead.company_id && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/company/${lead.company_id}`);
                                        }}
                                        title="Editar LinkedIn na página da empresa"
                                      >
                                        <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              }
                              return lead.company_id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/company/${lead.company_id}`);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar LinkedIn
                                </Button>
                              ) : null;
                            })()}
                            
                            {/* APOLLO */}
                            {(() => {
                              const apolloId = rawDataExpanded?.apollo_id || rawDataExpanded?.apollo_organization?.id;
                              const apolloLink = rawDataExpanded?.apollo_link || (apolloId ? `https://app.apollo.io/#/companies/${apolloId}` : null);
                              if (apolloLink) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <a href={apolloLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                      <img src="https://www.apollo.io/favicon.ico" alt="Apollo" className="h-4 w-4" />
                                      Apollo.io
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                    {lead.company_id && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/company/${lead.company_id}`);
                                        }}
                                        title="Editar Apollo ID na página da empresa"
                                      >
                                        <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              }
                              return lead.company_id ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/company/${lead.company_id}`);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar Apollo ID
                                </Button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        
                        {/* DECISORES */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Decisores ({(rawDataExpanded?.decision_makers?.length || rawDataExpanded?.apollo_decisores_count || 0)})
                          </h4>
                          {(() => {
                            const decisores = rawDataExpanded?.decision_makers || [];
                            if (decisores.length > 0) {
                              return (
                                <div className="space-y-2">
                                  {decisores.slice(0, 5).map((dm: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-muted/30 rounded text-xs border">
                                      <div className="font-medium">{dm.name || dm.first_name + ' ' + dm.last_name}</div>
                                      <div className="text-muted-foreground">{dm.title || dm.job_title}</div>
                                      <div className="flex gap-3 mt-2">
                                        {dm.linkedin_url && (
                                          <a href={dm.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                            <Linkedin className="h-3 w-3" />
                                            LinkedIn
                                          </a>
                                        )}
                                        {dm.email && (
                                          <a href={`mailto:${dm.email}`} className="text-primary hover:underline flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            Email
                                          </a>
                                        )}
                                        {dm.phone_number && (
                                          <span className="text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {dm.phone_number}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {decisores.length > 5 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      + {decisores.length - 5} decisor(es) adicional(is)
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <p className="text-xs text-muted-foreground italic">
                                Nenhum decisor encontrado ainda. Use o enriquecimento Apollo para buscar decisores.
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              </div>
            );
          })
          )}
        </div>

        {/* Dialog para criar deal */}
        <DealFormDialog
          open={dealFormOpen}
          onOpenChange={setDealFormOpen}
          onSuccess={handleDealSuccess}
          mode="icp"
          preSelectedLead={selectedLead}
        />
      </div>
  );
}

