import { useState } from 'react';
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
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DealersTableProps {
  dealers: Dealer[];
  onSaveIndividual?: (dealer: Dealer) => Promise<void>;
  savingDealerId?: string | null;
}

// ✅ ETAPA 3: Interface estendida para incluir campos necessários para badges
interface ExtendedDealer extends Dealer {
  fitScore?: number;
  b2bType?: string;
  employeeCount?: number;
  website?: string;
}

export function DealersTable({ dealers, onSaveIndividual, savingDealerId }: DealersTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (dealerId: string) => {
    setExpandedRow(expandedRow === dealerId ? null : dealerId);
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ✅ ETAPA 3: Função para determinar badges de qualidade
  const getQualityBadges = (dealer: ExtendedDealer) => {
    const badges: Array<{ label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; tooltip: string }> = [];
    const fitScore = dealer.fitScore || 0;
    
    // Badge: Alta aderência ao uso final
    if (fitScore >= 70) {
      badges.push({
        label: 'Alta aderência',
        variant: 'default',
        icon: CheckCircle2,
        tooltip: 'Alta aderência ao contexto de uso final especificado',
      });
    }
    
    // Badge: Penalizado (genérico ou uso incorreto)
    if (fitScore >= 40 && fitScore < 60) {
      badges.push({
        label: 'Penalizado',
        variant: 'secondary',
        icon: AlertTriangle,
        tooltip: 'Penalizado: pode conter termos genéricos ou uso final incorreto',
      });
    }
    
    // Badge: Fit baixo (não recomendado)
    if (fitScore < 40) {
      badges.push({
        label: 'Fit baixo',
        variant: 'destructive',
        icon: XCircle,
        tooltip: 'Fit score baixo: possível marketplace, datasource ou uso final inválido',
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
        });
      }
    }
    
    return badges;
  };

  return (
    <div className="rounded-md border overflow-hidden flex flex-col">
      {/* ✅ ScrollArea Otimizado: Header fixo + Body scrollável com scroll vertical E horizontal */}
      <div className="flex flex-col h-[calc(100vh-450px)] min-h-[500px] max-h-[900px] w-full">
        {/* Header Fixo (sticky) com scroll horizontal */}
        <div className="flex-shrink-0 border-b bg-muted/30">
          <ScrollArea className="w-full" orientation="horizontal">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="min-w-[200px]">Empresa</TableHead>
                    <TableHead className="min-w-[120px]">País</TableHead>
                    <TableHead className="min-w-[150px]">Indústria</TableHead>
                    <TableHead className="min-w-[130px]">Funcionários</TableHead>
                    <TableHead className="text-center min-w-[120px]">Fit Score</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          </ScrollArea>
        </div>
        
        {/* Body Scrollável - ScrollArea otimizado com scroll vertical E horizontal */}
        <ScrollArea className="flex-1 w-full" orientation="vertical">
          <ScrollArea className="w-full" orientation="horizontal">
            <div className="min-w-[800px] pr-4">
              <Table>
                <TableBody>
          {dealers.map((dealer, idx) => {
            const dealerId = (dealer as any).id || `dealer-${idx}`;
            const extendedDealer = dealer as ExtendedDealer;
            return (
              <>
              {/* Linha Principal */}
              <TableRow
                key={dealerId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleRow(dealerId)}
              >
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
                      {/* ✅ ETAPA 3: Badges de qualidade */}
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          {getQualityBadges(dealer).map((badge, idx) => {
                            const Icon = badge.icon;
                            return (
                              <Tooltip key={idx}>
                                <TooltipTrigger>
                                  <Badge variant={badge.variant} className="h-4 px-1.5 text-[10px] flex items-center gap-0.5">
                                    <Icon className="h-2.5 w-2.5" />
                                    {badge.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="text-xs max-w-xs">
                                  <p>{badge.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TooltipProvider>
                    </div>
                    {dealer.website && (
                      <a
                        href={dealer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" />
                        {dealer.website.replace('https://', '').replace('http://', '')}
                      </a>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <MapPin className="h-3 w-3" />
                    {dealer.country}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-muted-foreground">{dealer.industry || 'N/A'}</span>
                </TableCell>
                
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Users className="h-3 w-3" />
                    {dealer.employeeCount || 'N/A'}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`h-2 w-16 rounded-full ${getFitScoreColor(dealer.fitScore || 0)}`}
                    >
                      <div
                        className="h-full rounded-full bg-white/30"
                        style={{ width: `${dealer.fitScore || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{dealer.fitScore || 0}</span>
                  </div>
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
                        disabled={savingDealerId === dealerId}
                        title="Salvar empresa individualmente"
                      >
                        {savingDealerId === dealerId ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
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
                  <TableCell colSpan={7} className="bg-muted/30 p-0">
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
            </>
          );
          })}
                </TableBody>
              </Table>
              
              {dealers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground min-w-[800px]">
                  Nenhum dealer encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        </ScrollArea>
      </div>
    </div>
  );
}

