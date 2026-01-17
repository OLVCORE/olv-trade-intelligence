import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnFilter } from '@/components/companies/ColumnFilter';
import { QuarantineCNPJStatusBadge } from '@/components/icp/QuarantineCNPJStatusBadge';
import { QuarantineEnrichmentStatusBadge } from '@/components/icp/QuarantineEnrichmentStatusBadge';
import { ICPScoreTooltip } from '@/components/icp/ICPScoreTooltip';
import { QuarantineActionsMenu } from '@/components/icp/QuarantineActionsMenu';
import { STCAgent } from '@/components/intelligence/STCAgent';
import { StrategicIntelligenceDialog } from '@/components/intelligence/SimpleTOTVSCheckDialog';
import { EnrichmentProgressModal, type EnrichmentProgress } from '@/components/companies/EnrichmentProgressModal';
import { getLocationDisplay, getCommercialBlockDisplay, getLeadSource, getRegionDisplay } from '@/lib/utils/leadSourceHelpers';
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
import { WebsiteBadge } from '@/components/shared/WebsiteBadge';
import { syncEnrichmentToAllTables } from '@/lib/utils/enrichmentSync';

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
  // ✅ MODAIS DE PROGRESSO DE ENRIQUECIMENTO
  const [apolloModalOpen, setApolloModalOpen] = useState(false);
  const [apolloProgress, setApolloProgress] = useState<EnrichmentProgress[]>([]);
  const [internationalModalOpen, setInternationalModalOpen] = useState(false);
  const [internationalProgress, setInternationalProgress] = useState<EnrichmentProgress[]>([]);
  const [enrich360ModalOpen, setEnrich360ModalOpen] = useState(false);
  const [enrich360Progress, setEnrich360Progress] = useState<EnrichmentProgress[]>([]);
  const [cancelEnrichment, setCancelEnrichment] = useState(false);
  
  // ✅ COMPATIBILIDADE (deprecated - usar apolloModalOpen)
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<EnrichmentProgress[]>([]);
  
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
  }, [searchTerm, temperatureFilter, sourceFilter, leads, filterCNPJStatus, filterSector, filterUF, filterAnalysisStatus, filterBlock, filterLeadSource, filterOrigin]);

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

  // ✅ HANDLERS PARA AÇÕES EM MASSA (necessários para QuarantineActionsMenu)
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} lead(s)?`)) return;
    
    try {
      // TODO: Implementar exclusão em massa
      toast.info('Exclusão em massa em desenvolvimento');
      setSelectedIds([]);
    } catch (error: any) {
      toast.error('Erro ao excluir leads', { description: error.message });
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um lead para exportar');
      return;
    }
    // TODO: Implementar exportação
    toast.info('Exportação em desenvolvimento');
  };

  const handlePreviewSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um lead para visualizar');
      return;
    }
    // TODO: Implementar preview
    toast.info('Preview em desenvolvimento');
  };

  const handleRefreshSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      toast.info(`Atualizando ${selectedIds.length} lead(s)...`);
      await loadApprovedLeads();
      toast.success('Leads atualizados com sucesso');
      setSelectedIds([]);
    } catch (error: any) {
      toast.error('Erro ao atualizar leads', { description: error.message });
    }
  };

  // ✅ HANDLERS PARA ENRIQUECIMENTO EM MASSA
  const handleBulkEnrichReceita = async () => {
    const selectedLeads = filteredLeads.filter(l => selectedIds.includes(l.id) && l.cnpj);
    if (selectedLeads.length === 0) {
      toast.error('Selecione leads com CNPJ para enriquecer');
      return;
    }
    toast.info(`Enriquecendo Receita Federal para ${selectedLeads.length} lead(s)...`);
    // TODO: Implementar enriquecimento em massa
  };

  const handleBulkEnrichApollo = async () => {
    const selectedLeads = filteredLeads.filter(l => selectedIds.includes(l.id));
    if (selectedLeads.length === 0) {
      toast.error('Selecione pelo menos um lead');
      return;
    }
    
    // Filtrar apenas leads com website/domain
    const leadsWithDomain = selectedLeads.filter(lead => {
      const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
      return (lead as any).website || rawData?.domain || rawData?.website;
    });
    
    if (leadsWithDomain.length === 0) {
      toast.error('Nenhum lead selecionado possui website');
      return;
    }

    // ✅ INICIALIZAR MODAL DE PROGRESSO
    setCancelEnrichment(false);
    const initialProgress: EnrichmentProgress[] = leadsWithDomain.map(lead => ({
      companyId: lead.id,
      companyName: lead.razao_social || '',
      status: 'pending',
    }));
    
    setApolloProgress(initialProgress);
    setApolloModalOpen(true);

    let enriched = 0;
    let errors = 0;

    for (let i = 0; i < leadsWithDomain.length; i++) {
      // ✅ VERIFICAR CANCELAMENTO
      if (cancelEnrichment) {
        toast.info('❌ Processo cancelado pelo usuário');
        break;
      }

      const lead = leadsWithDomain[i];
      
      try {
        // ✅ ATUALIZAR STATUS: PROCESSANDO
        setApolloProgress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'processing', message: 'Buscando decisores no Apollo...' }
            : p
        ));

        await handleEnrichApollo(lead.id);
        
        // ✅ ATUALIZAR STATUS: SUCESSO
        setApolloProgress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'success', message: 'Decisores identificados!' }
            : p
        ));
        
        enriched++;
      } catch (e: any) {
        console.error(`Error enriching ${lead.razao_social}:`, e);
        
        // ✅ ATUALIZAR STATUS: ERRO
        setApolloProgress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'error', message: e.message || 'Erro desconhecido' }
            : p
        ));
        
        errors++;
      }
    }

    if (!cancelEnrichment) {
      toast.success(
        `✅ Enriquecimento Apollo concluído! ${enriched} leads processados`,
        { description: `${errors} erros` }
      );
    }
    
    await loadApprovedLeads();
  };

  const handleBulkEnrich360 = async () => {
    const selectedLeads = filteredLeads.filter(l => selectedIds.includes(l.id));
    if (selectedLeads.length === 0) {
      toast.error('Selecione pelo menos um lead');
      return;
    }

    // ✅ INICIALIZAR MODAL DE PROGRESSO
    setCancelEnrichment(false);
    const initialProgress: EnrichmentProgress[] = selectedLeads.map(lead => ({
      companyId: lead.id,
      companyName: lead.razao_social || '',
      status: 'pending',
    }));
    
    setEnrich360Progress(initialProgress);
    setEnrich360ModalOpen(true);

    let enriched = 0;
    let errors = 0;

    for (let i = 0; i < selectedLeads.length; i++) {
      // ✅ VERIFICAR CANCELAMENTO
      if (cancelEnrichment) {
        toast.info('❌ Processo cancelado pelo usuário');
        break;
      }

      const lead = selectedLeads[i];
      
      try {
        // ✅ ATUALIZAR STATUS: PROCESSANDO
        setEnrich360Progress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'processing', message: 'Executando enriquecimento 360°...' }
            : p
        ));

        await handleEnrich360(lead.id);
        
        // ✅ ATUALIZAR STATUS: SUCESSO
        setEnrich360Progress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'success', message: 'Enriquecimento 360° concluído!' }
            : p
        ));
        
        enriched++;
      } catch (e: any) {
        console.error(`Error enriching ${lead.razao_social}:`, e);
        
        // ✅ ATUALIZAR STATUS: ERRO
        setEnrich360Progress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'error', message: e.message || 'Erro desconhecido' }
            : p
        ));
        
        errors++;
      }
    }

    if (!cancelEnrichment) {
      toast.success(
        `✅ Enriquecimento 360° concluído! ${enriched} leads processados`,
        { description: `${errors} erros` }
      );
    }
    
    await loadApprovedLeads();
  };

  // ✅ Enriquecer Dados Internacionais em Massa
  const handleBulkEnrichInternational = async () => {
    const selectedLeads = filteredLeads.filter(l => selectedIds.includes(l.id));
    if (selectedLeads.length === 0) {
      toast.error('Selecione pelo menos um lead');
      return;
    }
    
    // Filtrar apenas leads com website
    const leadsWithWebsite = selectedLeads.filter(lead => {
      const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
      return (lead as any).website || rawData?.domain || rawData?.website;
    });
    
    if (leadsWithWebsite.length === 0) {
      toast.error('Nenhum lead selecionado possui website');
      return;
    }
    
    // ✅ INICIALIZAR MODAL DE PROGRESSO
    setCancelEnrichment(false);
    const initialProgress: EnrichmentProgress[] = leadsWithWebsite.map(lead => ({
      companyId: lead.id,
      companyName: lead.razao_social || '',
      status: 'pending',
    }));
    
    setInternationalProgress(initialProgress);
    setInternationalModalOpen(true);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < leadsWithWebsite.length; i++) {
      // ✅ VERIFICAR CANCELAMENTO
      if (cancelEnrichment) {
        toast.info('❌ Processo cancelado pelo usuário');
        break;
      }
      
      const lead = leadsWithWebsite[i];
      
      try {
        // ✅ ATUALIZAR STATUS: PROCESSANDO
        setInternationalProgress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'processing', message: 'Extraindo dados internacionais...' }
            : p
        ));
        const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
        const website = (lead as any).website || rawData?.domain || rawData?.website;
        const companyName = lead.razao_social || rawData?.company_name || '';
        
        if (!website) continue;
        
        // ✅ Extrair informações do website COM NOME DA EMPRESA
        const extractResponse = await fetch(`${supabaseUrl}/functions/v1/extract-company-info-from-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            url: website,
            company_name: companyName || undefined,
          }),
        });
        
        if (!extractResponse.ok) {
          const errorData = await extractResponse.json().catch(() => ({}));
          if (extractResponse.status === 403) {
            console.warn(`[BULK-ENRICH] URL bloqueada: ${website} - ${errorData.error || 'Marketplace/Portal não permitido'}`);
            errors++;
            continue;
          }
          throw new Error(`Erro ao extrair dados: ${extractResponse.status}`);
        }
        
        const extractedInfo = await extractResponse.json();
        console.log('[BULK-ENRICH] Dados extraídos:', extractedInfo);
        
        // ✅ SINCRONIZAR ENRIQUECIMENTO EM TODAS AS TABELAS
        const companyId = (lead as any).company_id || null;
        const syncResult = await syncEnrichmentToAllTables(
          companyId,
          {
            ...extractedInfo,
            domain: website || extractedInfo.domain,
            website: website,
            company_name: extractedInfo.company_name || lead.razao_social,
            international_enrichment: {
              ...extractedInfo,
              extracted_at: new Date().toISOString(),
              source: extractedInfo.source || 'extract-company-info-from-url',
            },
          },
          {
            updateCompanies: !!companyId,
            updateICP: true,
            updateLeadsPool: true,
          }
        );
        
        if (syncResult.errors.length > 0) {
          console.warn('[BULK-ENRICH] Avisos na sincronização:', syncResult.errors);
        }
        
        // Atualizar também o registro específico do lead em icp_analysis_results (para garantir)
        const { error: updateError } = await supabase
          .from('icp_analysis_results')
          .update({
            razao_social: extractedInfo.company_name || lead.razao_social,
            country: extractedInfo.country || lead.country,
            city: extractedInfo.city || lead.city,
            state: extractedInfo.state || lead.state,
          })
          .eq('id', lead.id);
        
        if (updateError) {
          console.warn('[BULK-ENRICH] Erro ao atualizar campos diretos:', updateError);
        }
        
        // ✅ ATUALIZAR STATUS: SUCESSO
        setInternationalProgress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'success', message: 'Dados internacionais extraídos!' }
            : p
        ));
        
        success++;
      } catch (error: any) {
        errors++;
        console.error(`[BULK-ENRICH] Erro ao enriquecer ${lead.razao_social}:`, error);
        
        // ✅ ATUALIZAR STATUS: ERRO
        setInternationalProgress(prev => prev.map(p => 
          p.companyId === lead.id 
            ? { ...p, status: 'error', message: error.message || 'Erro desconhecido' }
            : p
        ));
      }
    }
    
    if (!cancelEnrichment) {
      toast.success(
        `✅ Enriquecimento internacional concluído! ${success} leads processados`,
        { description: `${errors} erros` }
      );
    }
    
    // Invalidar cache e recarregar
    queryClient.invalidateQueries({ queryKey: ['approved-leads'] });
    queryClient.invalidateQueries({ queryKey: ['icp-analysis'] });
    await loadApprovedLeads();
  };

  // ✅ HANDLERS INDIVIDUAIS (para ApprovedLeadActions)
  const handleEnrichReceita = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead || !lead.cnpj) {
      toast.error('Lead sem CNPJ');
      return;
    }
    toast.info('Enriquecimento Receita Federal em desenvolvimento');
  };

  const handleEnrichApollo = async (id: string) => {
    try {
      const lead = leads.find(l => l.id === id);
      if (!lead) {
        toast.error('Lead não encontrado');
        return;
      }

      // 🔍 Buscar company_id
      let targetCompanyId = (lead as any).company_id;
      
      if (!targetCompanyId) {
        const { data: icpRecord } = await supabase
          .from('icp_analysis_results')
          .select('company_id')
          .eq('id', id)
          .single();
        
        targetCompanyId = icpRecord?.company_id;
      }

      if (!targetCompanyId) {
        toast.error('company_id não encontrado. Este lead precisa estar vinculado a uma empresa.');
        return;
      }

      // Buscar dados completos do lead
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', id)
        .single();

      if (!analysis) {
        toast.error('Dados do lead não encontrados');
        return;
      }

      const rawData = analysis.raw_data || analysis.raw_analysis || {};
      const receitaData = rawData.receita_federal || {};

      toast.info('🔍 Buscando decisores no Apollo.io...');

      const { error } = await supabase.functions.invoke('enrich-apollo-decisores', {
        body: {
          company_id: targetCompanyId,
          company_name: lead.razao_social || rawData.company_name || analysis.razao_social,
          domain: (lead as any).website || rawData.domain || rawData.website || analysis.website,
          modes: ['people', 'company'],
          city: receitaData?.municipio || rawData.city || analysis.city || analysis.municipio,
          state: receitaData?.uf || rawData.state || analysis.state || analysis.uf,
          cep: receitaData?.cep || rawData.cep || analysis.zip_code,
          fantasia: receitaData?.fantasia || rawData.fantasia || rawData.nome_fantasia || analysis.nome_fantasia,
          industry: analysis.segmento || rawData.setor_amigavel || rawData.atividade_economica
        }
      });

      if (error) {
        console.error('[APPROVED-LEADS] Erro Apollo:', error);
        throw error;
      }

      toast.success('✅ Decisores Apollo encontrados e salvos!');
      await loadApprovedLeads();
    } catch (error: any) {
      console.error('[APPROVED-LEADS] Erro ao enriquecer Apollo:', error);
      toast.error('Erro ao buscar decisores Apollo', {
        description: error.message || 'Verifique os logs para mais detalhes'
      });
    }
  };

  const handleEnrich360 = async (id: string) => {
    try {
      const lead = leads.find(l => l.id === id);
      if (!lead) {
        toast.error('Lead não encontrado');
        return;
      }

      // 🔍 Buscar company_id
      let targetCompanyId = (lead as any).company_id;
      
      if (!targetCompanyId) {
        const { data: icpRecord } = await supabase
          .from('icp_analysis_results')
          .select('company_id')
          .eq('id', id)
          .single();
        
        targetCompanyId = icpRecord?.company_id;
      }

      if (!targetCompanyId) {
        toast.error('company_id não encontrado. Este lead precisa estar vinculado a uma empresa.');
        return;
      }

      toast.info('🔍 Iniciando enriquecimento 360°...');

      const { data, error } = await supabase.functions.invoke('batch-enrich-360', {
        body: {
          company_ids: [targetCompanyId]
        }
      });

      if (error) {
        console.error('[APPROVED-LEADS] Erro 360°:', error);
        throw error;
      }

      // Buscar dados atualizados do lead
      const { data: analysis } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('id', id)
        .single();

      if (analysis) {
        const rawData = analysis.raw_data || analysis.raw_analysis || {};
        const updatedRawData = {
          ...rawData,
          enrichment_360: {
            ...data,
            enriched_at: new Date().toISOString(),
          }
        };

        await supabase
          .from('icp_analysis_results')
          .update({
            raw_data: updatedRawData,
            raw_analysis: updatedRawData, // Fallback
          })
          .eq('id', id);
      }

      toast.success('✅ Enriquecimento 360° concluído!');
      await loadApprovedLeads();
    } catch (error: any) {
      console.error('[APPROVED-LEADS] Erro ao enriquecer 360°:', error);
      toast.error('Erro ao executar enriquecimento 360°', {
        description: error.message || 'Verifique os logs para mais detalhes'
      });
    }
  };

  const handleEnrichCompleto = async (id: string) => {
    toast.info('Enriquecimento completo 360° em desenvolvimento');
  };

  // ✅ FUNÇÃO PARA SANITIZAR DOMÍNIO (igual ICPQuarantine)
  const sanitizeDomain = (value?: string | null): string | null => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v || /\s/.test(v)) return null;
    try {
      const url = v.startsWith('http') ? new URL(v) : new URL(`https://${v}`);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  // ✅ FUNÇÃO PARA SALVAR WEBSITE (igual ICPQuarantine)
  const [editingWebsiteId, setEditingWebsiteId] = useState<string | null>(null);
  const [websiteInput, setWebsiteInput] = useState<string>('');

  const saveWebsite = async (leadId: string, website: string) => {
    const domain = sanitizeDomain(website);
    if (!domain) {
      toast.error('Domínio inválido');
      return;
    }
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const rawData = (lead as any).raw_analysis || (lead as any).raw_data || {};
      const updatedRawData = {
        ...rawData,
        domain: domain,
        website: `https://${domain}`,
      };

      await supabase
        .from('icp_analysis_results')
        .update({ raw_data: updatedRawData })
        .eq('id', leadId);

      if ((lead as any).company_id) {
        await supabase
          .from('companies')
          .update({ website: `https://${domain}`, domain: domain })
          .eq('id', (lead as any).company_id);
      }

      toast.success('Website atualizado com sucesso');
      setEditingWebsiteId(null);
      setWebsiteInput('');
      await loadApprovedLeads();
    } catch (error: any) {
      toast.error('Erro ao salvar website', { description: error.message });
    }
  };

  // ✅ PAGINAÇÃO
  const paginatedLeads = pageSize === 9999 
    ? filteredLeads 
    : filteredLeads.slice(0, pageSize);

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

        {/* ✅ BARRA DE AÇÕES EM MASSA (igual ICPQuarantine) */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* LEFT: Info + Contador */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground">
                    {paginatedLeads.length} de {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
                  </span>
                  {selectedIds.length > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {selectedIds.length} selecionado{selectedIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT: Ações Principais */}
              <div className="flex items-center gap-2">
                {/* Menu de Ações (dropdown) */}
                <QuarantineActionsMenu
                  selectedCount={selectedIds.length}
                  onDeleteSelected={handleDeleteSelected}
                  onExportSelected={handleExportSelected}
                  onPreviewSelected={handlePreviewSelected}
                  onRefreshSelected={handleRefreshSelected}
                  onBulkEnrichReceita={handleBulkEnrichReceita}
                  onBulkEnrichApollo={handleBulkEnrichApollo}
                  onBulkEnrich360={handleBulkEnrich360}
                  onBulkEnrichInternational={handleBulkEnrichInternational}
                  onBulkTotvsCheck={() => toast.info('STC Check em massa em desenvolvimento')}
                  onBulkDiscoverCNPJ={() => toast.info('Descoberta de CNPJ em massa em desenvolvimento')}
                  onBulkApprove={() => toast.info('Aprovação em massa não aplicável em Leads Aprovados')}
                  onRestoreDiscarded={() => toast.info('Restaurar descartados não aplicável em Leads Aprovados')}
                  onReverifyAllV2={() => toast.info('Reverificação em massa em desenvolvimento')}
                  isProcessing={false}
                  isReverifying={false}
                  selectedItems={filteredLeads.filter(l => selectedIds.includes(l.id))}
                  totalCompanies={filteredLeads}
                />
                
                {/* Paginação */}
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-[90px] h-8 text-xs">
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
          </CardContent>
        </Card>

        {/* ✅ TABELA (igual ICPQuarantine) */}
        <Card>
          <CardContent className="p-0">
            <Table className="text-[10px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[180px] max-w-[200px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('empresa')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Empresa</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'empresa' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[140px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('location')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Localização</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'location' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[110px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('region')}
                      className="h-8 flex items-center gap-1 px-2 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold">Região</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'region' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[110px]">
                    <ColumnFilter
                      column="commercial_block"
                      title="Bloco"
                      values={filteredLeads.map(l => getCommercialBlockDisplay(l))}
                      selectedValues={filterBlock}
                      onFilterChange={setFilterBlock}
                      onSort={() => handleSort('commercial_block')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <ColumnFilter
                      column="lead_source"
                      title="Lead Source"
                      values={filteredLeads.map(l => getLeadSource(l))}
                      selectedValues={filterLeadSource}
                      onFilterChange={setFilterLeadSource}
                      onSort={() => handleSort('lead_source')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[120px]">
                    <ColumnFilter
                      column="source_name"
                      title="Origem"
                      values={filteredLeads.map(l => (l as any).source_name || '')}
                      selectedValues={filterOrigin}
                      onFilterChange={setFilterOrigin}
                      onSort={() => handleSort('source_name')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <ColumnFilter
                      column="setor"
                      title="Setor"
                      values={filteredLeads.map(l => {
                        const rawData = (l as any).raw_analysis || (l as any).raw_data || {};
                        return l.segmento || rawData.setor_amigavel || rawData.atividade_economica || rawData.apollo_organization?.industry || 'N/A';
                      })}
                      selectedValues={filterSector}
                      onFilterChange={setFilterSector}
                      onSort={() => handleSort('setor')}
                    />
                  </TableHead>
                  <TableHead className="min-w-[70px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('score')}
                      className="h-8 flex items-center gap-1 px-1 hover:bg-primary/10 transition-colors group"
                    >
                      <span className="font-semibold text-[10px]">Score</span>
                      <ArrowUpDown className={`h-4 w-4 transition-colors ${sortColumn === 'score' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[80px]">
                    <ColumnFilter
                      column="analysis_status"
                      title="Status Análise"
                      values={filteredLeads.map(l => {
                        const rawData = (l as any).raw_analysis || (l as any).raw_data || {};
                        const hasReceitaWS = !!(rawData.receita_federal || rawData.cnpj || l.cnpj);
                        const hasDecisionMakers = !!(rawData.decision_makers?.length || rawData.apollo_decisores_count || (l as any).decision_makers_count || 0);
                        const hasDigitalPresence = !!(rawData.enrichment_360 || rawData.digital_intelligence);
                        const hasLegalData = !!(rawData.stc_verification || rawData.totvs_report);
                        
                        const checks = [hasReceitaWS, hasDecisionMakers, hasDigitalPresence, hasLegalData];
                        const percentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);
                        
                        if (percentage > 75) return '76-100%';
                        if (percentage > 50) return '51-75%';
                        if (percentage > 25) return '26-50%';
                        return '0-25%';
                      })}
                      selectedValues={filterAnalysisStatus}
                      onFilterChange={setFilterAnalysisStatus}
                    />
                  </TableHead>
                  <TableHead className="min-w-[90px]"><span className="font-semibold text-[10px]">Website</span></TableHead>
                  <TableHead className="min-w-[50px]"><span className="font-semibold text-[10px]">SCI</span></TableHead>
                  <TableHead className="w-[40px]"><span className="font-semibold text-[10px]">⚙️</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      Carregando leads aprovados...
                    </TableCell>
                  </TableRow>
                ) : paginatedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Nenhum lead aprovado encontrado
                      </p>
                      <Button 
                        variant="link" 
                        onClick={() => navigate('/leads/icp-quarantine')}
                      >
                        Ir para Quarentena ICP →
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLeads.map((lead) => {
                    // ✅ CORRIGIR: icp_analysis_results usa raw_analysis, não raw_data
                    const rawData = ((lead as any).raw_analysis && typeof (lead as any).raw_analysis === 'object' && !Array.isArray((lead as any).raw_analysis)) 
                      ? (lead as any).raw_analysis as Record<string, any>
                      : ((lead as any).raw_data && typeof (lead as any).raw_data === 'object' && !Array.isArray((lead as any).raw_data))
                        ? (lead as any).raw_data as Record<string, any>
                        : {};
                    
                    return (
                      <React.Fragment key={lead.id}>
                        <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(lead.id)}
                            onCheckedChange={(checked) => 
                              handleSelectOne(lead.id, checked as boolean)
                            }
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(lead.id);
                          }}
                        >
                          {expandedRow === lead.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div 
                        className="flex flex-col cursor-pointer hover:text-primary transition-colors max-w-[250px]"
                        onClick={() => {
                          if (lead.company_id) {
                            navigate(`/company/${lead.company_id}`);
                          } else {
                            toast.error('Lead sem ID vinculado', {
                              description: 'Não foi possível localizar o ID da empresa'
                            });
                          }
                        }}
                      >
                        <span className="font-medium text-sm leading-snug line-clamp-2" title={lead.razao_social}>
                          {lead.razao_social}
                        </span>
                        {rawData?.domain && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {sanitizeDomain(rawData.domain) || rawData.domain}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const location = getLocationDisplay(lead);
                          
                          if (location.country !== 'N/A') {
                            // Mostrar "Cidade, País" se ambos disponíveis
                            if (location.city && location.city !== 'N/A') {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium truncate max-w-[140px]" title={`${location.city}, ${location.country}`}>
                                    {location.city}
                                  </span>
                                  <Badge variant="secondary" className="w-fit text-[10px]">
                                    {location.country}
                                  </Badge>
                                </div>
                              );
                            }
                            // Só país se cidade não disponível
                            return (
                              <Badge variant="secondary" className="w-fit text-[10px]">
                                {location.country}
                              </Badge>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">N/A</span>;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="w-fit text-[10px]">
                        {getRegionDisplay(lead)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="w-fit text-[10px]">
                        {getCommercialBlockDisplay(lead)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="w-fit">
                        {getLeadSource(lead)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {(lead as any).source_name ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-600/10 text-blue-600 border-blue-600/30 hover:bg-blue-600/20 transition-colors cursor-help max-w-[140px] truncate"
                              >
                                {(lead as any).source_name}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                <p><strong>Origem:</strong> {(lead as any).source_name}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Sem origem
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[100px]">
                        {(() => {
                          const sector = lead.segmento || rawData?.setor_amigavel || rawData?.atividade_economica || rawData?.apollo_organization?.industry;
                          return sector ? (
                            <span className="text-sm line-clamp-2 leading-snug" title={sector}>
                              {sector}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Não identificado</span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ICPScoreTooltip
                        score={lead.icp_score || 0}
                        porte={(lead as any).porte}
                        setor={lead.segmento}
                        uf={(lead as any).uf}
                        is_cliente_totvs={(lead as any).is_cliente_totvs}
                        hasReceitaData={!!rawData?.receita_federal || !!lead.cnpj}
                        hasApolloData={!!rawData?.apollo || !!rawData?.enrichment_360}
                        hasWebsite={!!(lead as any).website || !!rawData?.domain}
                        hasContact={!!rawData?.email || !!rawData?.phone}
                      />
                    </TableCell>
                    <TableCell>
                      <QuarantineEnrichmentStatusBadge 
                        rawAnalysis={rawData}
                        companyId={(lead as any).company_id || null}
                        showProgress
                      />
                    </TableCell>
                    <TableCell>
                      {editingWebsiteId === lead.id ? (
                        <div className="flex items-center gap-2 max-w-[110px]">
                          <Input
                            value={websiteInput}
                            onChange={(e) => setWebsiteInput(e.target.value)}
                            placeholder="empresa.com.br"
                            className="h-8 text-xs"
                          />
                          <Button size="sm" variant="secondary" className="h-8 px-2"
                            onClick={() => saveWebsite(lead.id, websiteInput)}
                          >Salvar</Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2"
                            onClick={() => { setEditingWebsiteId(null); setWebsiteInput(''); }}
                          >Cancelar</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <WebsiteBadge
                            websiteUrl={(lead as any).website || rawData?.domain || rawData?.website || null}
                            domain={sanitizeDomain((lead as any).website || rawData?.domain || rawData?.website)}
                            companyName={lead.razao_social || rawData?.company_name || ''}
                            maxWidth="140px"
                          />
                          {!((lead as any).website || rawData?.domain || rawData?.website) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingWebsiteId(lead.id);
                                setWebsiteInput((lead as any).website || rawData?.domain || '');
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <STCAgent
                        companyId={lead.company_id || lead.id}
                        companyName={lead.razao_social}
                        onOpenDialog={() => {
                          setStcLead(lead);
                          setStcDialogOpen(true);
                        }}
                      />
                    </TableCell>
                    <TableCell>
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
                        onEnrichApollo={handleEnrichApollo}
                        onEnrich360={handleEnrich360}
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
                            
                            // ✅ SINCRONIZAR ENRIQUECIMENTO EM TODAS AS TABELAS
                            const companyId = (leadData as any).company_id || null;
                            const syncResult = await syncEnrichmentToAllTables(
                              companyId,
                              {
                                ...extractedInfo,
                                domain: website || extractedInfo.domain,
                                website: website,
                                company_name: extractedInfo.company_name || leadData.razao_social,
                                international_enrichment: {
                                  ...extractedInfo,
                                  extracted_at: new Date().toISOString(),
                                  source: extractedInfo.source || 'extract-company-info-from-url',
                                },
                              },
                              {
                                updateCompanies: !!companyId,
                                updateICP: true,
                                updateLeadsPool: true,
                              }
                            );
                            
                            if (syncResult.errors.length > 0) {
                              console.warn('[ENRICH-INTERNATIONAL] Avisos na sincronização:', syncResult.errors);
                            }
                            
                            console.log('[ENRICH-INTERNATIONAL] ✅ Dados sincronizados:', {
                              companiesUpdated: syncResult.companiesUpdated,
                              icpUpdated: syncResult.icpUpdated,
                              leadsPoolUpdated: syncResult.leadsPoolUpdated,
                            });
                            
                            // Atualizar também campos diretos em icp_analysis_results (para garantir)
                            const { error: updateError } = await supabase
                              .from('icp_analysis_results')
                              .update({
                                razao_social: extractedInfo.company_name || leadData.razao_social,
                                country: extractedInfo.country || leadData.country,
                                city: extractedInfo.city || leadData.city,
                                state: extractedInfo.state || leadData.state,
                              })
                              .eq('id', id);
                            
                            if (updateError) {
                              console.warn('[ENRICH-INTERNATIONAL] Erro ao atualizar campos diretos:', updateError);
                            }
                            
                            console.log('[ENRICH-INTERNATIONAL] ✅ Dados sincronizados em todas as tabelas');
                            
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
                        onCreateDeal={(lead) => handleCreateDeal(lead)}
                      />
                        </TableCell>
                      </TableRow>

                      {/* LINHA EXPANDIDA - CARD DROPDOWN COM TODOS OS DADOS (IDÊNTICO À BASE DE EMPRESAS E QUARENTENA) */}
                      {expandedRow === lead.id && (() => {
                        const rawDataExpanded = rawData;
                        
                        return (
                        <TableRow>
                          <TableCell colSpan={13} className="bg-muted/30 p-0">
                              <Card className="border-0 shadow-none overflow-visible">
                                <CardContent className="p-6 overflow-visible max-h-[80vh] overflow-y-auto">
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
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                      </React.Fragment>
                    );
                  })
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

        {/* Dialog para criar deal */}
        <DealFormDialog
          open={dealFormOpen}
          onOpenChange={setDealFormOpen}
          onSuccess={handleDealSuccess}
          mode="icp"
          preSelectedLead={selectedLead}
        />

        {/* ✅ MODAL DE PROGRESSO APOLLO */}
        <EnrichmentProgressModal
          open={apolloModalOpen}
          onOpenChange={setApolloModalOpen}
          title="Enriquecimento Apollo - Decisores"
          companies={apolloProgress}
          onCancel={() => setCancelEnrichment(true)}
          isCancelling={cancelEnrichment}
        />
        
        {/* ✅ MODAL DE PROGRESSO INTERNACIONAL */}
        <EnrichmentProgressModal
          open={internationalModalOpen}
          onOpenChange={setInternationalModalOpen}
          title="Enriquecimento Internacional"
          companies={internationalProgress}
          onCancel={() => setCancelEnrichment(true)}
          isCancelling={cancelEnrichment}
        />
        
        {/* ✅ MODAL DE PROGRESSO 360° */}
        <EnrichmentProgressModal
          open={enrich360ModalOpen}
          onOpenChange={setEnrich360ModalOpen}
          title="Enriquecimento 360°"
          companies={enrich360Progress}
          onCancel={() => setCancelEnrichment(true)}
          isCancelling={cancelEnrichment}
        />

        {/* ✅ SCI/STC DIALOG */}
        <StrategicIntelligenceDialog
          open={stcDialogOpen}
          onOpenChange={setStcDialogOpen}
          companyId={stcLead?.company_id || stcLead?.id}
          companyName={stcLead?.razao_social}
        />
      </div>
  );
}

