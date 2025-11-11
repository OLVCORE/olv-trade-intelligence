import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Loader2,
  Info,
  DollarSign,
  Weight,
  Ruler,
  Globe,
  TrendingDown,
  Calculator,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateAllIncoterms, type IncotermCalculationParams, type IncotermResult } from '@/lib/incotermsCalculator';
import { INCOTERMS, TOP_INCOTERMS } from '@/data/incoterms';
import { TRANSPORT_MODES } from '@/lib/shippingCalculator';

// ============================================================================
// TYPES
// ============================================================================

interface PricingCalculatorProps {
  productValue: number; // Subtotal dos produtos selecionados (USD)
  destinationCountry: string; // País do dealer
  destinationPort?: string; // Porto de destino (opcional)
  onIncotermSelected: (incoterm: string, result: IncotermResult) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PricingCalculator({
  productValue,
  destinationCountry,
  destinationPort,
  onIncotermSelected,
}: PricingCalculatorProps) {
  // Estados (TODOS vazios até usuário preencher!)
  const [weight, setWeight] = useState<number | ''>('');
  const [volume, setVolume] = useState<number | ''>('');
  const [transportMode, setTransportMode] = useState<'ocean' | 'air' | 'road' | 'rail'>('ocean');
  const [selectedPort, setSelectedPort] = useState(destinationPort || '');
  
  // Incentivos fiscais Brasil (checkboxes)
  const [hasDrawback, setHasDrawback] = useState(false);
  const [hasReintegra, setHasReintegra] = useState(true); // Padrão: SIM (MetaLife elegível)
  
  // Resultados
  const [results, setResults] = useState<Record<string, IncotermResult> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedIncoterm, setSelectedIncoterm] = useState<string>('CIF'); // Padrão: CIF (2º mais usado)

  // ============================================================================
  // CALCULATE ALL INCOTERMS
  // ============================================================================

  const handleCalculate = async () => {
    // Validações
    if (!weight || weight <= 0) {
      toast.error('Peso obrigatório', {
        description: 'Informe o peso total da carga em kg',
      });
      return;
    }

    if (!volume || volume <= 0) {
      toast.error('Volume obrigatório', {
        description: 'Informe o volume total da carga em m³',
      });
      return;
    }

    if (!selectedPort) {
      toast.error('Porto de destino obrigatório', {
        description: 'Selecione o porto de destino',
      });
      return;
    }

    setIsCalculating(true);

    try {
      const params: IncotermCalculationParams = {
        productValue,
        weight: Number(weight),
        volume: Number(volume),
        originPort: 'BRSSZ', // Santos, Brasil (fixo por enquanto)
        destinationPort: selectedPort,
        transportMode,
        hasDrawback,
        hasReintegra,
        icmsRate: 0.18, // 18% SP (configurável por estado)
        ipiRate: 0.10, // 10% (configurável por produto)
        insuranceRate: 0.01, // 1%
        customDutyRate: 0.05, // 5% (estimativa - configurável por país)
      };

      console.log('[PRICING] 🧮 Calculando todos os Incoterms...', params);

      const incotermResults = await calculateAllIncoterms(params);

      setResults(incotermResults);

      toast.success('Preços calculados!', {
        description: `11 Incoterms disponíveis (EXW → DDP)`,
        duration: 5000,
      });

      console.log('[PRICING] Incoterms calculados:', incotermResults);
    } catch (error: any) {
      console.error('[PRICING] Erro ao calcular:', error);
      toast.error('Erro ao calcular preços', {
        description: error.message || 'Verifique os dados informados',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // ============================================================================
  // SELECT INCOTERM
  // ============================================================================

  const handleSelectIncoterm = () => {
    if (!results || !selectedIncoterm) return;

    const result = results[selectedIncoterm];
    onIncotermSelected(selectedIncoterm, result);
    
    toast.success(`Incoterm selecionado: ${selectedIncoterm}`, {
      description: `Valor total: USD ${result.value.toLocaleString()}`,
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const canCalculate = weight && volume && selectedPort;

  return (
    <div className="space-y-6">
      {/* FORM DE ENTRADA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Preços Export
          </CardTitle>
          <CardDescription>
            Informe dados logísticos para calcular preços em todos os 11 Incoterms oficiais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. DADOS LOGÍSTICOS */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              1. Dados Logísticos
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  Peso Total (kg)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Peso TOTAL da carga (soma de todos os produtos).<br />
                        <strong>Exemplo:</strong> 50 Reformers × 85kg = 4,250kg
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ex: 4250 (vazio até preencher)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : '')}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Volume Total (m³)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Volume TOTAL ocupado pela carga.<br />
                        <strong>Cálculo:</strong> Comprimento × Largura × Altura (em metros)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 12.5 (vazio até preencher)"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value ? parseFloat(e.target.value) : '')}
                />
              </div>
            </div>

            <div>
              <Label>Modal de Transporte</Label>
              <Select value={transportMode} onValueChange={(v: any) => setTransportMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_MODES.map((mode) => (
                    <SelectItem key={mode.code} value={mode.code}>
                      {mode.icon} {mode.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Porto de Destino
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Principal porto do país de destino.<br />
                      <strong>Exemplos:</strong> USLAX (Los Angeles), DEHAM (Hamburg)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                placeholder="Ex: USLAX (Los Angeles, USA)"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código UN/LOCODE do porto (5 caracteres)
              </p>
            </div>
          </div>

          {/* 2. INCENTIVOS FISCAIS BRASIL */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              2. Incentivos Fiscais Brasil
            </h4>
            <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg space-y-3">
              <p className="text-xs text-muted-foreground">
                <strong>Sempre aplicáveis:</strong> ICMS 0% (18%), IPI Suspenso (10%), PIS/COFINS 0% (9.65%)
              </p>

              <div className="flex items-center gap-2">
                <Checkbox checked={hasDrawback} onCheckedChange={(c) => setHasDrawback(!!c)} />
                <Label className="cursor-pointer flex items-center gap-2">
                  Drawback Integrado (-25%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Suspensão de tributos na importação de insumos.<br />
                          Aplicável se sua empresa importa matéria-prima.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox checked={hasReintegra} onCheckedChange={(c) => setHasReintegra(!!c)} />
                <Label className="cursor-pointer flex items-center gap-2">
                  REINTEGRA (-2%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Crédito de tributos residuais (0.1% a 3%).<br />
                          Aplicável para produtos manufaturados (HS 9506).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>

              <div className="pt-2 border-t text-xs text-green-700 dark:text-green-300">
                <strong>Economia estimada:</strong>{' '}
                {hasDrawback && hasReintegra
                  ? '64.65%'
                  : hasDrawback
                  ? '62.65%'
                  : hasReintegra
                  ? '39.65%'
                  : '37.65%'}{' '}
                do custo base
              </div>
            </div>
          </div>

          {/* BOTÃO CALCULAR */}
          <Button
            onClick={handleCalculate}
            disabled={!canCalculate || isCalculating}
            className="w-full"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Calculando 11 Incoterms...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 mr-2" />
                Calcular Todos os Incoterms
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* RESULTADOS (11 Incoterms) */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados (11 Incoterms ICC 2020)</CardTitle>
            <CardDescription>
              Preços calculados considerando incentivos fiscais Brasil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GRUPOS DE INCOTERMS */}
            
            {/* GRUPO E: Partida */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Grupo E - Partida (Mínima Obrigação Vendedor)
              </h4>
              <div className="space-y-2">
                {renderIncotermOption('EXW', results.EXW)}
              </div>
            </div>

            {/* GRUPO F: Transporte principal não pago */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Grupo F - Transporte Principal Não Pago
              </h4>
              <div className="space-y-2">
                {renderIncotermOption('FCA', results.FCA)}
                {renderIncotermOption('FAS', results.FAS)}
                {renderIncotermOption('FOB', results.FOB, true)} {/* Mais usado */}
              </div>
            </div>

            {/* GRUPO C: Transporte principal pago */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Grupo C - Transporte Principal Pago
              </h4>
              <div className="space-y-2">
                {renderIncotermOption('CFR', results.CFR)}
                {renderIncotermOption('CIF', results.CIF, true)} {/* 2º mais usado */}
                {renderIncotermOption('CPT', results.CPT)}
                {renderIncotermOption('CIP', results.CIP)}
              </div>
            </div>

            {/* GRUPO D: Chegada */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Grupo D - Chegada (Máxima Obrigação Vendedor)
              </h4>
              <div className="space-y-2">
                {renderIncotermOption('DAP', results.DAP)}
                {renderIncotermOption('DPU', results.DPU)}
                {renderIncotermOption('DDP', results.DDP)}
              </div>
            </div>

            {/* ECONOMIA COM INCENTIVOS */}
            <div className="mt-6 p-4 bg-green-50/50 dark:bg-green-950/20 rounded-lg border-2 border-green-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Economia (Incentivos Brasil)</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  -USD {results.FOB.savings.exportIncentives.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {hasDrawback && hasReintegra && 'ICMS + IPI + PIS/COFINS + Drawback + REINTEGRA'}
                {hasDrawback && !hasReintegra && 'ICMS + IPI + PIS/COFINS + Drawback'}
                {!hasDrawback && hasReintegra && 'ICMS + IPI + PIS/COFINS + REINTEGRA'}
                {!hasDrawback && !hasReintegra && 'ICMS + IPI + PIS/COFINS (sempre aplicáveis)'}
              </p>
            </div>

            {/* SELECIONAR INCOTERM PARA PROPOSTA */}
            <Button
              onClick={handleSelectIncoterm}
              disabled={!selectedIncoterm}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Usar {selectedIncoterm} na Proposta (USD {results[selectedIncoterm]?.value.toLocaleString()})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ============================================================================
  // RENDER INCOTERM OPTION (Helper)
  // ============================================================================

  function renderIncotermOption(code: string, result: IncotermResult, highlight?: boolean) {
    const incoterm = INCOTERMS.find(i => i.code === code);
    if (!incoterm || !result) return null;

    const isSelected = selectedIncoterm === code;
    const isTopUsed = TOP_INCOTERMS.includes(code);

    return (
      <div
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-primary bg-primary/5'
            : highlight
            ? 'border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/20'
            : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setSelectedIncoterm(code)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold">{code}</h4>
              <span className="text-sm text-muted-foreground">- {incoterm.namePt}</span>
              {isTopUsed && <Badge variant="secondary" className="text-xs flex items-center gap-1"><Star className="h-3 w-3" /> Popular</Badge>}
              {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{incoterm.description}</p>
            <div className="text-xs text-muted-foreground">
              <strong>Uso:</strong> {incoterm.useCase}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">
              USD {result.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {result.metadata.estimatedDays} dias
            </div>
          </div>
        </div>

        {/* Breakdown (expandido se selecionado) */}
        {isSelected && (
          <div className="mt-3 pt-3 border-t space-y-1">
            {result.breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className={item.isNegative ? 'text-green-600' : 'text-muted-foreground'}>
                  {item.label}:
                </span>
                <span className={`font-mono ${item.isNegative ? 'text-green-600' : ''}`}>
                  {item.isNegative && '-'}USD {Math.abs(item.value).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

