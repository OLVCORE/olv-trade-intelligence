import { Settings, Eye, Edit, Target, Search, Building2, Sparkles, Zap, ExternalLink, Loader2, FileText, Globe, Rocket, Linkedin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apolloIcon from '@/assets/logos/apollo-icon.ico';
import { QuarantineReportModal } from '@/components/icp/QuarantineReportModal';

interface ApprovedLeadActionsProps {
  lead: any;
  onPreview?: (lead: any) => void;
  onCreateDeal?: (lead: any) => void;
  onRefresh?: (id: string) => void;
  onEnrichReceita?: (id: string) => Promise<void>;
  onEnrichApollo?: (id: string) => Promise<void>;
  onEnrich360?: (id: string) => Promise<void>;
  onEnrichInternational?: (id: string) => Promise<void>;
  onEnrichCompleto?: (id: string) => Promise<void>;
  onOpenExecutiveReport?: () => void;
}

export function ApprovedLeadActions({
  lead,
  onPreview,
  onCreateDeal,
  onRefresh,
  onEnrichReceita,
  onEnrichApollo,
  onEnrich360,
  onEnrichInternational,
  onEnrichCompleto,
  onOpenExecutiveReport,
}: ApprovedLeadActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichingAction, setEnrichingAction] = useState<string | null>(null);
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();

  const rawData = (lead.raw_data && typeof lead.raw_data === 'object' && !Array.isArray(lead.raw_data))
    ? lead.raw_data as Record<string, any>
    : {};

  const handlePreview = () => {
    if (onPreview) {
      onPreview(lead);
    } else {
      setShowReport(true);
    }
    setIsOpen(false);
  };

  const handleCreateDeal = () => {
    if (onCreateDeal) {
      onCreateDeal(lead);
    }
    setIsOpen(false);
  };

  const handleEnrich = async (action: string, fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    try {
      setIsEnriching(true);
      setEnrichingAction(action);
      setEnrichmentProgress(0);
      
      // Simular progress para "Análise Completa" (3 etapas)
      if (action === 'Análise Completa 360°') {
        setTimeout(() => setEnrichmentProgress(33), 500);
        setTimeout(() => setEnrichmentProgress(67), 3000);
      } else {
        setTimeout(() => setEnrichmentProgress(50), 500);
        setTimeout(() => setEnrichmentProgress(90), 2000);
      }
      
      await fn(lead.id);
      setEnrichmentProgress(100);
    } catch (error) {
      toast.error(`Erro ao executar ${action}`);
    } finally {
      setTimeout(() => {
        setIsEnriching(false);
        setEnrichingAction(null);
        setEnrichmentProgress(0);
      }, 500);
    }
  };

  const isDisabled = (action: string) => {
    if (action === 'receita' && !lead.cnpj) return true;
    return false;
  };

  const getTooltip = (action: string) => {
    if (action === 'receita' && !lead.cnpj) return 'Requer CNPJ';
    return '';
  };

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            data-testid="approved-lead-actions"
            aria-label="Ações do lead aprovado"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          side="bottom"
          sideOffset={5}
          alignOffset={0}
          className="w-72 bg-popover z-[100] max-h-[80vh] overflow-y-auto"
        >
          <DropdownMenuLabel>Ações do Lead</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Criar Deal - DESTAQUE */}
          {onCreateDeal && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={handleCreateDeal}
                  className="bg-gradient-to-r from-green-600/20 via-green-500/10 to-green-600/20 hover:from-green-600/30 hover:via-green-500/20 hover:to-green-600/30 border-l-4 border-green-600 font-bold cursor-pointer transition-all"
                >
                  <Rocket className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">🎯 Criar Deal no Pipeline</span>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs bg-green-600 text-white">
                <p className="font-semibold text-sm">Criar Deal no Sales Pipeline</p>
                <p className="text-xs mt-1">Abre modal para criar deal com todos os dados do lead já preenchidos. O deal será adicionado ao Sales Workspace automaticamente.</p>
              </TooltipContent>
            </Tooltip>
          )}

          <DropdownMenuSeparator />

          {/* Ver Detalhes */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={handlePreview}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Visualizar Análise Completa</p>
              <p className="text-xs text-muted-foreground mt-1">Abre modal com todos os dados ICP, scores, temperatura e análise detalhada da empresa</p>
            </TooltipContent>
          </Tooltip>

          {/* Editar/Salvar Dados */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (lead.company_id) {
                    navigate(`/search?companyId=${lead.company_id}`);
                  } else {
                    toast.info('Empresa ainda não vinculada - complete o enriquecimento primeiro');
                  }
                  setIsOpen(false);
                }}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar/Salvar Dados
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Editar Cadastro da Empresa</p>
              <p className="text-xs text-muted-foreground mt-1">Abre tela de busca/edição para atualizar manualmente dados cadastrais, contatos e informações complementares</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenuSeparator />

          {/* SCI - Strategic Intelligence */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  setShowReport(true);
                  setIsOpen(false);
                  toast.info('Use o botão "Reverificar" dentro do relatório para executar o check (com cooldown).');
                }}
                disabled={isEnriching}
                className="relative animate-pulse bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 hover:from-primary/30 hover:via-primary/20 hover:to-primary/30 border-l-4 border-primary font-semibold cursor-pointer transition-all dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 dark:hover:from-primary/40 dark:hover:via-primary/30 dark:hover:to-primary/40"
              >
                <Target className="h-4 w-4 mr-2 text-primary" />
                <span className="text-primary">SCI - Strategic Intelligence</span>
                <Sparkles className="h-3 w-3 ml-auto text-primary animate-pulse" />
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs bg-primary text-primary-foreground">
              <p className="font-semibold text-sm">⭐ SCI - Strategic Commercial Intelligence (Prioritário)</p>
              <p className="text-xs mt-1">Análise estratégica comercial em <strong>47 fontes globais premium</strong>: Job portals (LinkedIn, Indeed, Glassdoor), Fontes oficiais (SEC, Companies House), Notícias (Bloomberg, Reuters, FT, WSJ), Tech (CIO, ZDNet, CRN), Business Intelligence (D&B, Crunchbase, PitchBook). Análise de fit estratégico, sinais de expansão e oportunidade comercial internacional</p>
            </TooltipContent>
          </Tooltip>

          {/* Ver Relatório Completo */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (onOpenExecutiveReport) {
                    onOpenExecutiveReport();
                  }
                  setIsOpen(false);
                }}
                className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">Relatório Executivo ICP</p>
              <p className="text-xs text-muted-foreground mt-1">Exibe análise completa consolidada: ICP score, temperatura, fit estratégico, maturidade digital, diagnóstico 360° e recomendações de abordagem</p>
            </TooltipContent>
          </Tooltip>

          {/* Atualizar relatório */}
          {onRefresh && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem 
                  onClick={() => {
                    onRefresh(lead.id);
                  }}
                  className="hover:bg-accent hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Atualizar relatório
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Refresh Análise ICP</p>
                <p className="text-xs text-muted-foreground mt-1">Re-executa análise ICP completa com dados atualizados da empresa para refletir mudanças recentes no score e temperatura</p>
              </TooltipContent>
            </Tooltip>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-primary font-bold">⚡ Enriquecimento Final</DropdownMenuLabel>

          {/* Análise Completa 360° */}
          {onEnrichCompleto && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="px-2 py-1.5">
                  <DropdownMenuItem
                    onClick={() => handleEnrich('Análise Completa 360°', onEnrichCompleto)}
                    disabled={isEnriching || !lead.cnpj}
                    className="relative bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 hover:from-primary/40 hover:via-primary/30 hover:to-primary/40 border-l-4 border-primary font-bold cursor-pointer transition-all animate-pulse"
                  >
                    {enrichingAction === 'Análise Completa 360°' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2 text-primary" />
                    )}
                    <span className="text-primary">Análise Completa 360°</span>
                    <Sparkles className="h-3 w-3 ml-auto text-primary animate-pulse" />
                  </DropdownMenuItem>
                  {/* PROGRESS BAR VISUAL */}
                  {enrichingAction === 'Análise Completa 360°' && isEnriching && (
                    <div className="mt-2 space-y-1">
                      <Progress value={enrichmentProgress} className="h-2" />
                      <p className="text-xs text-center text-primary font-medium">
                        {enrichmentProgress === 33 && '1/3: Receita Federal...'}
                        {enrichmentProgress === 67 && '2/3: Intelligence 360°...'}
                        {enrichmentProgress === 100 && '3/3: Concluído!'}
                      </p>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm bg-primary text-primary-foreground">
                <p className="font-bold text-sm">⚡ SUPER ENRIQUECIMENTO - TUDO EM 1 CLIQUE!</p>
                <p className="text-xs mt-2">Executa automaticamente:</p>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                  <li>✅ Receita Federal (dados oficiais)</li>
                  <li>✅ Apollo Decisores (C-Level + contatos)</li>
                  <li>✅ Intelligence 360° (IA completa)</li>
                </ul>
                <p className="text-xs mt-2 italic">Economia: 3 cliques → 1 clique! 🚀</p>
              </TooltipContent>
            </Tooltip>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Enriquecimentos Individuais</DropdownMenuLabel>
          
          {/* Enriquecer Dados Internacionais */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                onClick={async () => {
                  const website = lead.website || rawData?.domain || rawData?.website;
                  if (!website) {
                    toast.error('Lead sem website - não é possível enriquecer dados internacionais');
                    setIsOpen(false);
                    return;
                  }
                  
                  if (onEnrichInternational) {
                    await handleEnrich('Enriquecer Dados Internacionais', onEnrichInternational);
                    setIsOpen(false);
                  } else {
                    try {
                      setIsEnriching(true);
                      setEnrichingAction('Enriquecer Dados Internacionais');
                      setIsOpen(false);
                      
                      const companyName = lead.razao_social || rawData?.company_name || lead.company_name || '';
                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                      
                      toast.info('🔍 Extraindo dados internacionais do website...');
                      
                      // ✅ Chamar Edge Function COM NOME DA EMPRESA
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
                        throw new Error(`Erro ao extrair dados: ${extractResponse.status}`);
                      }
                      
                      const extractedInfo = await extractResponse.json();
                      
                      toast.success(`✅ Dados internacionais extraídos!`, {
                        description: `Nome: ${extractedInfo.company_name || 'N/A'}, País: ${extractedInfo.country || 'N/A'}`,
                      });
                      
                      if (onRefresh) {
                        setTimeout(() => onRefresh(lead.id), 1000);
                      }
                    } catch (error: any) {
                      console.error('[ENRICH-INTERNATIONAL] Erro:', error);
                      toast.error('Erro ao enriquecer dados internacionais', {
                        description: error.message || 'Erro desconhecido',
                      });
                    } finally {
                      setIsEnriching(false);
                      setEnrichingAction(null);
                    }
                  }
                }}
                disabled={isEnriching || (!lead.website && !rawData?.domain && !rawData?.website)}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                {enrichingAction === 'Enriquecer Dados Internacionais' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Enriquecer Dados Internacionais
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">🌍 Enriquecer Dados Internacionais</p>
              <p className="text-xs text-muted-foreground mt-1">Extrai nome real da empresa, país correto (via código postal/endereço), cidade e estado do website/Facebook/LinkedIn. Corrige dados incorretos como país hardcoded.</p>
            </TooltipContent>
          </Tooltip>

          {/* Receita Federal */}
          {onEnrichReceita && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={() => handleEnrich('Receita Federal', onEnrichReceita)}
                  disabled={isDisabled('receita') || isEnriching}
                  className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                >
                  {enrichingAction === 'Receita Federal' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4 mr-2" />
                  )}
                  Receita Federal
                  {getTooltip('receita') && <span className="ml-auto text-xs text-muted-foreground">{getTooltip('receita')}</span>}
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Consulta Receita Federal</p>
                <p className="text-xs text-muted-foreground mt-1">Busca dados oficiais da empresa: situação cadastral, atividade econômica (CNAE), porte, endereço completo e sócios diretamente da base da Receita Federal (requer CNPJ)</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Apollo */}
          {onEnrichApollo && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={() => handleEnrich('Apollo', onEnrichApollo)}
                  disabled={isEnriching}
                  className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                >
                  {enrichingAction === 'Apollo' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <img src={apolloIcon} alt="Apollo" className="h-4 w-4 mr-2" />
                  )}
                  Apollo (Decisores)
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Apollo.io - Pessoas Decisoras</p>
                <p className="text-xs text-muted-foreground mt-1">Identifica contatos C-Level, diretores e decisores com nome, cargo, e-mail, telefone e perfil LinkedIn usando base Apollo.io</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* 360° Completo */}
          {onEnrich360 && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={() => handleEnrich('360° Completo', onEnrich360)}
                  disabled={isEnriching}
                  className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
                >
                  {enrichingAction === '360° Completo' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  360° Completo
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-semibold text-sm">Análise 360° Completa</p>
                <p className="text-xs text-muted-foreground mt-1">Combina dados Receita Federal, Apollo decisores, LinkedIn e análise de maturidade digital para uma visão 360° da empresa</p>
              </TooltipContent>
            </Tooltip>
          )}

          <DropdownMenuSeparator />

          {/* Criar Estratégia */}
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuItem 
                onClick={() => {
                  if (lead.company_id) {
                    navigate(`/account-strategy?company=${lead.company_id}`);
                  } else {
                    toast.info('Aprove a empresa primeiro para criar estratégia');
                  }
                  setIsOpen(false);
                }}
                disabled={!lead.company_id}
                className="hover:bg-primary/10 hover:border-l-4 hover:border-primary transition-all cursor-pointer"
              >
                <Target className="h-4 w-4 mr-2" />
                {lead.company_id ? 'Criar Estratégia' : 'Criar Estratégia (requer empresa vinculada)'}
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="font-semibold text-sm">ROI-Labs: Estratégia de Conta</p>
              <p className="text-xs text-muted-foreground mt-1">Abre central estratégica com ROI Calculator, CPQ, análise de cenários best/expected/worst, propostas visuais e value realization</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de Relatório SCI */}
      {showReport && (
        <QuarantineReportModal
          open={showReport}
          onOpenChange={setShowReport}
          analysisId={lead.id}
          companyName={lead.razao_social}
          cnpj={lead.cnpj}
          domain={lead.website || rawData?.domain}
          companyId={lead.company_id}
        />
      )}
    </TooltipProvider>
  );
}
