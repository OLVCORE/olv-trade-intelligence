import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Info, 
  Globe, 
  DollarSign, 
  Target,
  Package,
  AlertCircle,
  Loader2,
  Check,
  X,
  ChevronsUpDown,
  Users
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { COUNTRIES, getCountriesByRegion, TOP_EXPORT_MARKETS, type Country } from '@/data/countries';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { HSCodeAutocomplete } from './HSCodeAutocomplete';

// ============================================================================
// TYPES
// ============================================================================

interface DealerDiscoveryFormProps {
  onSearch: (params: DealerSearchParams) => void;
  isSearching: boolean;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export interface DealerSearchParams {
  hsCode?: string; // LEGACY (deprecated, usar hsCodes)
  hsCodes?: string[]; // NOVO: Múltiplos HS Codes
  countries: string[];
  minVolume?: number;
  minVolumeUSD?: string;
  keywords?: string[];
  includeKeywords?: string[]; // Keywords B2B para incluir
  excludeKeywords?: string[]; // Keywords B2C para excluir
  // ✅ NOVO: Contexto de uso final (CAMADA CRÍTICA)
  usageContext?: {
    include: string[]; // Termos que DEFINEM o uso final (obrigatório)
    exclude: string[]; // Termos que INVALIDAM o uso (bloqueio)
  };
}

// ============================================================================
// (REMOVIDO - Agora usa src/data/countries.ts com 195+ países)
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

// Keywords B2B disponíveis
const B2B_INCLUDE_KEYWORDS = [
  'Distributor',
  'Wholesaler',
  'Dealer',
  'Importer',
  'Trading Company',
  'Supplier',
  'Reseller',
  'Agent',
];

const B2C_EXCLUDE_KEYWORDS = [
  'Fitness Studio',
  'Gym / Fitness Center',
  'Wellness Center',
  'Personal Training',
  'Yoga Studio',
  'Spa',
  'Rehabilitation Center',
  'Physiotherapy',
];

export function DealerDiscoveryForm({ onSearch, isSearching, onCancel, isCancelling }: DealerDiscoveryFormProps) {
  const [hsCodes, setHsCodes] = useState<string[]>([]); // MÚLTIPLOS HS Codes
  const [hsCodeInput, setHsCodeInput] = useState(''); // Input temporário
  const [countries, setCountries] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState('');
  const [openCountryCombobox, setOpenCountryCombobox] = useState(false);
  
  // Keywords selecionadas (todas marcadas por padrão)
  const [includeKeywords, setIncludeKeywords] = useState<string[]>(B2B_INCLUDE_KEYWORDS);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>(B2C_EXCLUDE_KEYWORDS);
  
  // Keywords customizadas (termos locais, dialetos, nomes específicos)
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [customKeywordBulkInput, setCustomKeywordBulkInput] = useState(''); // ✅ NOVO: Input em massa
  
  // ✅ NOVO: Contexto de uso final (CAMADA CRÍTICA)
  const [usageContextInclude, setUsageContextInclude] = useState<string[]>([]);
  const [usageContextExclude, setUsageContextExclude] = useState<string[]>([]);
  const [usageContextIncludeInput, setUsageContextIncludeInput] = useState('');
  const [usageContextExcludeInput, setUsageContextExcludeInput] = useState('');
  const [usageContextIncludeBulkInput, setUsageContextIncludeBulkInput] = useState('');
  const [usageContextExcludeBulkInput, setUsageContextExcludeBulkInput] = useState('');
  
  // ✅ Funções para parsear e processar uso final em massa
  const parseBulkUsageContext = (input: string): string[] => {
    if (!input || !input.trim()) return [];
    return input
      .split(/[,\n\r\t]+/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
  };
  
  const handleProcessBulkUsageInclude = () => {
    const parsed = parseBulkUsageContext(usageContextIncludeBulkInput);
    if (parsed.length === 0) {
      toast.warning('Nenhum termo de uso final encontrado');
      return;
    }
    const newTerms = [...new Set([...usageContextInclude, ...parsed])];
    setUsageContextInclude(newTerms);
    setUsageContextIncludeBulkInput('');
    toast.success(`${parsed.length} termo(s) adicionado(s)!`);
  };
  
  const handleProcessBulkUsageExclude = () => {
    const parsed = parseBulkUsageContext(usageContextExcludeBulkInput);
    if (parsed.length === 0) {
      toast.warning('Nenhum termo de exclusão encontrado');
      return;
    }
    const newTerms = [...new Set([...usageContextExclude, ...parsed])];
    setUsageContextExclude(newTerms);
    setUsageContextExcludeBulkInput('');
    toast.success(`${parsed.length} termo(s) adicionado(s)!`);
  };
  
  const handleAddUsageInclude = (term: string) => {
    const trimmed = term.trim();
    if (trimmed && !usageContextInclude.includes(trimmed)) {
      setUsageContextInclude([...usageContextInclude, trimmed]);
      setUsageContextIncludeInput('');
    }
  };
  
  const handleAddUsageExclude = (term: string) => {
    const trimmed = term.trim();
    if (trimmed && !usageContextExclude.includes(trimmed)) {
      setUsageContextExclude([...usageContextExclude, trimmed]);
      setUsageContextExcludeInput('');
    }
  };
  
  const handleRemoveUsageInclude = (term: string) => {
    setUsageContextInclude(usageContextInclude.filter(t => t !== term));
  };
  
  const handleRemoveUsageExclude = (term: string) => {
    setUsageContextExclude(usageContextExclude.filter(t => t !== term));
  };

  // ✅ NOVA: Função para parsear keywords em massa (vírgula, linha, etc.)
  const parseBulkKeywords = (input: string): string[] => {
    if (!input || !input.trim()) return [];
    
    // Dividir por vírgula e quebra de linha
    const parts = input
      .split(/[,\n\r\t]+/) // Quebra por vírgula, nova linha, tab
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    // Remover duplicatas
    return [...new Set(parts)];
  };

  // ✅ NOVA: Processar keywords em massa (Enter ou botão)
  const handleProcessBulkKeywords = () => {
    const parsed = parseBulkKeywords(customKeywordBulkInput);
    if (parsed.length === 0) {
      toast.warning('Nenhuma keyword válida encontrada');
      return;
    }
    
    // Adicionar todas as keywords (remover duplicatas)
    const newKeywords = [...new Set([...customKeywords, ...parsed])];
    setCustomKeywords(newKeywords);
    setCustomKeywordBulkInput('');
    
    toast.success(`${parsed.length} keyword(s) adicionada(s)!`);
  };

  // Adicionar custom keyword (Tab ou Enter) - individual
  const handleAddCustomKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !customKeywords.includes(trimmed)) {
      setCustomKeywords([...customKeywords, trimmed]);
      setCustomKeywordInput('');
    }
  };

  // Remover custom keyword
  const handleRemoveCustomKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== keyword));
  };

  // Adicionar HS Code (Tab ou Enter)
  const handleAddHSCode = (code: string) => {
    const trimmed = code.trim();
    if (trimmed && !hsCodes.includes(trimmed)) {
      setHsCodes([...hsCodes, trimmed]);
      setHsCodeInput('');
    }
  };

  // Remover HS Code
  const handleRemoveHSCode = (code: string) => {
    setHsCodes(hsCodes.filter(c => c !== code));
  };

  // Sugestões baseadas no país selecionado
  const getLocalizedSuggestions = (): string[] => {
    if (countries.length === 0) return [];
    
    const suggestions: Record<string, string[]> = {
      // Espanhol (México, Espanha, LATAM)
      'Mexico': ['gimnasio', 'equipamiento deportivo', 'distribuidor', 'mayorista'],
      'Spain': ['gimnasio', 'equipamiento', 'distribuidor', 'proveedor'],
      'Chile': ['gimnasio', 'equipamiento', 'distribuidor'],
      'Colombia': ['gimnasio', 'equipamiento', 'distribuidor'],
      
      // Alemão
      'Germany': ['turnhalle', 'fitnessgeräte', 'vertrieb', 'großhändler'],
      
      // Francês
      'France': ['équipement', 'gymnastique', 'distributeur', 'grossiste'],
      
      // Italiano
      'Italy': ['palestra', 'attrezzature', 'distributore', 'grossista'],
      
      // Japonês
      'Japan': ['フィットネス', 'ピラティス', 'ディストリビューター'],
      
      // Português (Portugal)
      'Portugal': ['equipamento', 'ginásio', 'distribuidor', 'grossista'],
    };
    
    // Retornar sugestões do primeiro país selecionado
    const firstCountry = COUNTRIES.find(c => c.code === countries[0])?.nameEn || '';
    return suggestions[firstCountry] || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hsCodes.length === 0 || countries.length === 0) {
      toast.error('Adicione pelo menos 1 HS Code e 1 país');
      return;
    }

    // ✅ VALIDAÇÃO OBRIGATÓRIA: Uso final deve ser especificado
    if (usageContextInclude.length === 0) {
      toast.error('⚠️ USO FINAL OBRIGATÓRIO: Defina pelo menos 1 termo que descreve PARA QUE o produto será usado (ex: "equipamento pilates", "máquina construção", "componente aviação")');
      return;
    }

    // Buscar para TODOS os HS Codes
    onSearch({
      hsCodes: hsCodes, // ✅ Array completo de HS Codes
      countries,
      minVolume: minVolume ? parseInt(minVolume) : undefined,
      minVolumeUSD: minVolume,
      includeKeywords, // Keywords B2B selecionadas
      excludeKeywords, // Keywords B2C selecionadas
      keywords: customKeywords.length > 0 
        ? customKeywords // Se tem custom, usar elas
        : [], // Sem padrão - usuário deve fornecer keywords
      // ✅ NOVO: Contexto de uso final (CAMADA CRÍTICA)
      usageContext: {
        include: usageContextInclude, // Termos que DEFINEM o uso final
        exclude: usageContextExclude, // Termos que INVALIDAM o uso
      },
    });
  };

  // ✅ NOVO: Input em massa para países
  const [countryBulkInput, setCountryBulkInput] = useState('');

  // ✅ NOVA: Função para normalizar nome de país e buscar código
  const normalizeCountryName = (input: string): string | null => {
    const normalized = input.trim();
    if (!normalized) return null;
    
    // Buscar por nome em português, inglês, código ISO
    const lowerInput = normalized.toLowerCase();
    
    // Buscar em COUNTRIES
    const found = COUNTRIES.find(c => 
      c.name.toLowerCase() === lowerInput ||
      c.nameEn.toLowerCase() === lowerInput ||
      c.code.toLowerCase() === lowerInput ||
      c.name.toLowerCase().includes(lowerInput) ||
      c.nameEn.toLowerCase().includes(lowerInput)
    );
    
    return found?.code || null;
  };

  // ✅ NOVA: Função para parsear países em massa (vírgula, linha, etc.)
  const parseBulkCountries = (input: string): string[] => {
    if (!input || !input.trim()) return [];
    
    // Dividir por vírgula e quebra de linha
    const parts = input
      .split(/[,\n\r\t]+/) // Quebra por vírgula, nova linha, tab
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    // Normalizar cada país e buscar código
    const countryCodes: string[] = [];
    const notFound: string[] = [];
    
    for (const part of parts) {
      const code = normalizeCountryName(part);
      if (code && !countryCodes.includes(code)) {
        countryCodes.push(code);
      } else if (!code) {
        notFound.push(part);
      }
    }
    
    // Avisar sobre países não encontrados
    if (notFound.length > 0) {
      toast.warning(`País(es) não encontrado(s): ${notFound.slice(0, 5).join(', ')}${notFound.length > 5 ? '...' : ''}`);
    }
    
    return countryCodes;
  };

  // ✅ NOVA: Processar países em massa (Enter ou botão)
  const handleProcessBulkCountries = () => {
    const parsed = parseBulkCountries(countryBulkInput);
    if (parsed.length === 0) {
      toast.warning('Nenhum país válido encontrado');
      return;
    }
    
    // Adicionar todos os países (remover duplicatas)
    const newCountries = [...new Set([...countries, ...parsed])];
    setCountries(newCountries);
    setCountryBulkInput('');
    
    toast.success(`${parsed.length} país(es) adicionado(s)!`);
  };

  const toggleCountry = (countryCode: string) => {
    setCountries((prev) =>
      prev.includes(countryCode) ? prev.filter((c) => c !== countryCode) : [...prev, countryCode]
    );
  };

  const selectRegion = (region: string) => {
    const regionCountries = getCountriesByRegion(region as any).map((c) => c.code);
    setCountries((prev) => {
      const newCountries = [...prev];
      regionCountries.forEach((code) => {
        if (!newCountries.includes(code)) newCountries.push(code);
      });
      return newCountries;
    });
    toast.success(`${regionCountries.length} países da região ${region} adicionados!`);
  };

  const clearCountries = () => setCountries([]);

  const canSearch = hsCodes.length > 0 && countries.length > 0;

  return (
    <Card className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-950/30 dark:hover:to-sky-900/20 transition-all duration-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-800 dark:text-sky-100 font-semibold">
          <Search className="h-5 w-5 text-sky-700 dark:text-sky-500" />
          Descobrir Dealers & Distribuidores B2B
        </CardTitle>
        <CardDescription className="text-slate-700 dark:text-slate-300">
          Encontre distribuidores, wholesalers e importadores internacionais de qualquer produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AVISO B2B */}
          <Alert className="border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-sky-50/50 to-sky-100/30 dark:from-sky-900/40 dark:to-sky-800/20">
            <AlertCircle className="h-4 w-4 text-sky-700 dark:text-sky-500" />
            <AlertDescription className="text-sm text-sky-800 dark:text-sky-200">
              <strong>Foco B2B:</strong> Buscamos apenas <strong>Dealers, Distribuidores e Wholesalers</strong>.
              Studios individuais e gyms (B2C) são automaticamente excluídos.
            </AlertDescription>
          </Alert>

          {/* FILTROS B2B CLICÁVEIS (VISÍVEL NO TOPO!) */}
          <div className="border-l-4 border-l-emerald-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-emerald-50/60 hover:to-emerald-100/40 dark:hover:from-emerald-950/30 dark:hover:to-emerald-900/20 transition-all duration-200 p-4 rounded-lg">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-emerald-800 dark:text-emerald-100">
              <Package className="h-4 w-4 text-emerald-700 dark:text-emerald-500" />
              Filtros B2B Personalizados (Apollo.io)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* INCLUIR (checkboxes) */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded border">
                <span className="font-semibold text-emerald-800 dark:text-emerald-100 flex items-center gap-1 mb-3 text-sm">
                  <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-500" /> INCLUIR (B2B):
                </span>
                <div className="space-y-2">
                  {B2B_INCLUDE_KEYWORDS.map((keyword) => (
                    <div key={keyword} className="flex items-center gap-2">
                      <Checkbox
                        id={`include-${keyword}`}
                        checked={includeKeywords.includes(keyword)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIncludeKeywords([...includeKeywords, keyword]);
                          } else {
                            setIncludeKeywords(includeKeywords.filter((k) => k !== keyword));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`include-${keyword}`}
                        className="text-xs cursor-pointer font-normal"
                      >
                        {keyword}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXCLUIR (checkboxes) */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded border">
                <span className="font-semibold text-rose-800 dark:text-rose-100 flex items-center gap-1 mb-3 text-sm">
                  <X className="h-4 w-4 text-rose-700 dark:text-rose-500" /> EXCLUIR (B2C):
                </span>
                <div className="space-y-2">
                  {B2C_EXCLUDE_KEYWORDS.map((keyword) => (
                    <div key={keyword} className="flex items-center gap-2">
                      <Checkbox
                        id={`exclude-${keyword}`}
                        checked={excludeKeywords.includes(keyword)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExcludeKeywords([...excludeKeywords, keyword]);
                          } else {
                            setExcludeKeywords(excludeKeywords.filter((k) => k !== keyword));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`exclude-${keyword}`}
                        className="text-xs cursor-pointer font-normal"
                      >
                        {keyword}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t mt-3 border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <Users className="h-3 w-3" />
                <strong>Decisores Alvo:</strong> Procurement Manager, Purchasing Director, Import Manager, Buyer
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                {includeKeywords.length} keywords incluídas | {excludeKeywords.length} keywords excluídas
              </p>
            </div>
          </div>

          {/* HS CODE / NCM (Múltiplos - com TAB) */}
          <div className="p-4 rounded-lg border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-950/30 dark:hover:to-indigo-900/20 transition-all duration-200">
            <Label className="flex items-center gap-2 mb-2 text-indigo-800 dark:text-indigo-100 font-semibold">
              <Target className="h-4 w-4 text-indigo-700 dark:text-indigo-500" />
              HS Code / NCM (Múltiplos)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Adicione múltiplos códigos HS!</strong><br />
                      • Digite código (ex: 9506.91) → Aperte <kbd className="px-1 py-0.5 bg-muted rounded">TAB</kbd><br />
                      • Adicione quantos quiser (2, 5, 10 códigos)<br />
                      • Sistema busca dealers para TODOS os códigos<br />
                      • Útil para: Múltiplos produtos simultaneamente (ex: 1701 + 9403.60)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            
            <div className="space-y-2">
              {/* AUTOCOMPLETE EM TEMPO REAL - WCO DATABASE */}
              <HSCodeAutocomplete
                value={hsCodeInput}
                onSelect={(code) => handleAddHSCode(code)} // Adiciona automaticamente ao clicar
                placeholder="🔍 Digite código (ex: 1701) ou produto (ex: sugar, furniture, footwear)..."
              />
              
              {/* HS Codes adicionados */}
              {hsCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 shadow-md bg-gradient-to-r from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10">
                  {hsCodes.map((code) => (
                    <Badge key={code} variant="secondary" className="gap-1 font-mono text-sm py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100 border border-indigo-300/50 dark:border-indigo-700/50 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 hover:shadow-md transition-all duration-200">
                      {code}
                      <button
                        type="button"
                        onClick={() => handleRemoveHSCode(code)}
                        className="ml-1 hover:bg-indigo-600/20 dark:hover:bg-indigo-600/30 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              💡 <strong>Clique no código</strong> no dropdown para adicionar. Adicione múltiplos HS Codes para buscar vários produtos ao mesmo tempo!
            </p>
          </div>

          {/* PAÍSES-ALVO (Multi-select + Seleção por Região + Input em Massa) */}
          <div className="p-4 rounded-lg border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-950/30 dark:hover:to-sky-900/20 transition-all duration-200">
            <Label className="flex items-center gap-2 mb-2 text-sky-800 dark:text-sky-100 font-semibold">
              <Globe className="h-4 w-4 text-sky-700 dark:text-sky-500" />
              Países-Alvo (Multi-select)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>✅ Input em Massa + Autocomplete!</strong><br />
                      • Use o autocomplete abaixo para seleção individual<br />
                      • OU cole múltiplos países no textarea (vírgula ou linha)<br />
                      • Pressione <kbd className="px-1 py-0.5 bg-muted rounded">ENTER</kbd> no textarea para processar<br />
                      • Países selecionados aparecem em badges abaixo<br /><br />
                      <strong>195+ países disponíveis</strong> agrupados por região.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

            {/* ✅ NOVO: Textarea para input em massa de países (OPCIONAL - acima do autocomplete) */}
            <div className="space-y-2 mb-3 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/20">
              <Label className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                💡 Input em Massa (Opcional):
              </Label>
              <Textarea
                value={countryBulkInput}
                onChange={(e) => setCountryBulkInput(e.target.value)}
                onKeyDown={(e) => {
                  // ENTER para processar em massa (sem CTRL)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleProcessBulkCountries();
                  }
                }}
                placeholder="Cole múltiplos países (vírgula ou linha) e pressione ENTER:&#10;Brasil, Estados Unidos, México&#10;Germany&#10;France, Italy&#10;&#10;Pressione ENTER para processar"
                rows={3}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleProcessBulkCountries}
                  disabled={!countryBulkInput.trim()}
                  className="flex-1"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Processar ({parseBulkCountries(countryBulkInput).length} encontrados)
                </Button>
                {countryBulkInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCountryBulkInput('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Botões Seleção Rápida por Região */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Button type="button" variant="outline" size="sm" onClick={() => selectRegion('Americas')}>
                Americas ({getCountriesByRegion('Americas').length})
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => selectRegion('Europe')}>
                Europe ({getCountriesByRegion('Europe').length})
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => selectRegion('Asia')}>
                Asia ({getCountriesByRegion('Asia').length})
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => selectRegion('Africa')}>
                Africa ({getCountriesByRegion('Africa').length})
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => selectRegion('Oceania')}>
                Oceania ({getCountriesByRegion('Oceania').length})
              </Button>
              {countries.length > 0 && (
                <Button type="button" variant="destructive" size="sm" onClick={clearCountries}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar ({countries.length})
                </Button>
              )}
            </div>

            <Popover open={openCountryCombobox} onOpenChange={setOpenCountryCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCountryCombobox}
                  className="w-full justify-between"
                >
                  {countries.length > 0
                    ? `${countries.length} ${countries.length === 1 ? 'país' : 'países'} selecionado${countries.length > 1 ? 's' : ''}`
                    : 'Selecione países...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command className="max-h-[500px]">
                  <div className="sticky top-0 bg-background z-10 border-b">
                    <CommandInput placeholder="🔍 Buscar país..." className="h-12" />
                  </div>
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum país encontrado.
                    </div>
                  </CommandEmpty>
                  <CommandList className="max-h-[400px] overflow-y-auto">{/*Scrollbar fixa*/}
                  
                  {/* TOP MARKETS (Pré-selecionados) */}
                  <CommandGroup heading="Principais Mercados">
                    {COUNTRIES.filter(c => TOP_EXPORT_MARKETS.includes(c.code)).map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.nameEn} ${c.code}`}
                        onSelect={() => toggleCountry(c.code)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countries.includes(c.code) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{c.nameEn}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* AMERICAS */}
                  <CommandGroup heading="🌎 Americas">
                    {getCountriesByRegion('Americas').map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.nameEn} ${c.code}`}
                        onSelect={() => toggleCountry(c.code)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countries.includes(c.code) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* EUROPE */}
                  <CommandGroup heading="Europe">
                    {getCountriesByRegion('Europe').map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.nameEn} ${c.code}`}
                        onSelect={() => toggleCountry(c.code)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countries.includes(c.code) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* ASIA */}
                  <CommandGroup heading="🌏 Asia">
                    {getCountriesByRegion('Asia').map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.nameEn} ${c.code}`}
                        onSelect={() => toggleCountry(c.code)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countries.includes(c.code) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* OCEANIA */}
                  <CommandGroup heading="🌏 Oceania">
                    {getCountriesByRegion('Oceania').map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.nameEn} ${c.code}`}
                        onSelect={() => toggleCountry(c.code)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countries.includes(c.code) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {/* AFRICA */}
                  <CommandGroup heading="Africa">
                    {getCountriesByRegion('Africa').map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.nameEn} ${c.code}`}
                        onSelect={() => toggleCountry(c.code)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            countries.includes(c.code) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="mr-2">{c.flag}</span>
                        <span>{c.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Países Selecionados (Badges) - COM DESTAQUE VISUAL CORPORATIVO */}
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-lg border border-sky-200/50 dark:border-sky-800/50 shadow-md bg-gradient-to-r from-sky-50/50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10">
                <div className="w-full mb-2">
                  <span className="text-xs font-semibold text-sky-800 dark:text-sky-200 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-sky-700 dark:text-sky-500" />
                    Países Selecionados ({countries.length}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {countries.map((code) => {
                    const country = COUNTRIES.find((c) => c.code === code);
                    return (
                      <Badge 
                        key={code} 
                        variant="secondary" 
                        className="gap-1 px-3 py-1.5 text-sm font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-100 border border-sky-300/50 dark:border-sky-700/50 hover:bg-sky-200 dark:hover:bg-sky-900/60 hover:shadow-md transition-all duration-200 cursor-default"
                      >
                        <span className="text-lg">{country?.flag}</span>
                        <span>{country?.name}</span>
                        <button
                          onClick={() => toggleCountry(code)}
                          className="ml-1 hover:bg-sky-600/20 dark:hover:bg-sky-600/30 rounded-full p-0.5 transition-colors duration-150"
                          title="Remover"
                        >
                          <X className="h-3 w-3 text-sky-700 dark:text-sky-400" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* VOLUME MÍNIMO */}
          <div className="p-4 rounded-lg border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-orange-50/60 hover:to-orange-100/40 dark:hover:from-orange-950/30 dark:hover:to-orange-900/20 transition-all duration-200">
            <Label className="flex items-center gap-2 mb-2 text-orange-800 dark:text-orange-100 font-semibold">
              <DollarSign className="h-4 w-4 text-orange-700 dark:text-orange-500" />
              Volume Mínimo Anual (USD)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Opcional:</strong> Filtrar dealers por volume mínimo de importação anual.<br />
                      Deixe vazio para ver todos os dealers.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              step="10000"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              placeholder="Ex: 100000 (USD 100K+) - Opcional"
              className="border-slate-300 dark:border-slate-700 focus:border-orange-500 dark:focus:border-orange-500"
            />
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              Campo opcional - deixe vazio para ver todos os dealers
            </p>
          </div>

          {/* KEYWORDS CUSTOMIZADAS (Dialetos, termos locais) - COM INPUT EM MASSA */}
          <div className="p-4 rounded-lg border-l-4 border-l-sky-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-sky-50/60 hover:to-sky-100/40 dark:hover:from-sky-950/30 dark:hover:to-sky-900/20 transition-all duration-200">
            <Label className="flex items-center gap-2 mb-2 text-sky-800 dark:text-sky-100 font-semibold">
              <Package className="h-4 w-4 text-sky-700 dark:text-sky-500" />
              Keywords Customizadas
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>✅ Input em Massa + Individual!</strong><br />
                      • Use o input individual e aperte TAB/ENTER<br />
                      • OU cole múltiplas keywords no textarea (vírgula ou linha)<br />
                      • Pressione <kbd className="px-1 py-0.5 bg-muted rounded">ENTER</kbd> no textarea para processar<br />
                      • Keywords selecionadas aparecem em badges abaixo
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            
            <div className="space-y-2">
              {/* ✅ NOVO: Textarea para input em massa (OPCIONAL - acima do input individual) */}
              <div className="space-y-2 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/20">
                <Label className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                  💡 Input em Massa (Opcional):
                </Label>
                <Textarea
                  value={customKeywordBulkInput}
                  onChange={(e) => setCustomKeywordBulkInput(e.target.value)}
                  onKeyDown={(e) => {
                    // ENTER para processar em massa (sem CTRL)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleProcessBulkKeywords();
                    }
                  }}
                  placeholder="Cole múltiplas keywords (vírgula ou linha) e pressione ENTER:&#10;gimnasio, équipement, turnhalle&#10;fitness equipment&#10;&#10;Pressione ENTER para processar"
                  rows={3}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleProcessBulkKeywords}
                    disabled={!customKeywordBulkInput.trim()}
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Processar ({parseBulkKeywords(customKeywordBulkInput).length} encontradas)
                  </Button>
                  {customKeywordBulkInput && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomKeywordBulkInput('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Input individual (ORIGINAL - mantido) */}
              <Input
                value={customKeywordInput}
                onChange={(e) => setCustomKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomKeyword(customKeywordInput);
                  }
                }}
                placeholder="Digite keyword individual e aperte TAB ou ENTER (ex: gimnasio)..."
              />
              
              {/* Sugestões baseadas no país */}
              {countries.length > 0 && getLocalizedSuggestions().length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">Sugestões para {COUNTRIES.find(c => c.code === countries[0])?.name}:</span>
                  {getLocalizedSuggestions().map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => handleAddCustomKeyword(suggestion)}
                    >
                      + {suggestion}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Keywords adicionadas - COM DESTAQUE VISUAL CORPORATIVO */}
              {customKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-sky-200/50 dark:border-sky-800/50 shadow-md bg-gradient-to-r from-sky-50/50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10">
                  <div className="w-full mb-2">
                    <span className="text-xs font-semibold text-sky-800 dark:text-sky-200 flex items-center gap-1">
                      <Package className="h-3 w-3 text-sky-700 dark:text-sky-500" />
                      Keywords Selecionadas ({customKeywords.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customKeywords.map((keyword) => (
                      <Badge 
                        key={keyword} 
                        variant="secondary" 
                        className="gap-1 px-3 py-1.5 text-sm font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-100 border border-sky-300/50 dark:border-sky-700/50 shadow-sm hover:shadow-md hover:bg-sky-200 dark:hover:bg-sky-900/60 transition-all duration-200 cursor-default"
                      >
                        <span className="font-semibold">{keyword}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomKeyword(keyword)}
                          className="ml-1 hover:bg-sky-600/20 dark:hover:bg-sky-600/30 rounded-full p-0.5 transition-colors duration-150"
                          title="Remover"
                        >
                          <X className="h-3 w-3 text-sky-700 dark:text-sky-400" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
              💡 <strong>Como usar:</strong> Digite individual (TAB/ENTER) OU cole em massa no textarea acima (ENTER).<br />
              Útil para: Dialetos regionais, nomes locais, marcas específicas do país
            </p>
          </div>

          {/* ✅ NOVO: CONTEXTO DE USO FINAL (CAMADA CRÍTICA) */}
          <Card className="border-l-4 border-l-indigo-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-950/30 dark:hover:to-indigo-900/20 transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-100 font-semibold">
                <Target className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
                Contexto de Uso Final (OBRIGATÓRIO)
              </CardTitle>
              <CardDescription className="text-slate-700 dark:text-slate-300">
                🚨 CAMADA CRÍTICA: Define PARA QUE o produto será usado e EM QUE cadeia produtiva ele entra.
                <br />
                <strong>Exemplos:</strong> "equipamento pilates", "máquina construção", "componente aviação", "equipamento agrícola"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* INCLUIR - Uso Final Obrigatório */}
              <div className="space-y-2 p-4 rounded-lg border-l-4 border-l-emerald-600/90 bg-gradient-to-r from-slate-50/30 to-slate-100/20 dark:from-slate-900/30 dark:to-slate-800/15">
                <Label htmlFor="usage-include" className="text-sm font-semibold text-emerald-800 dark:text-emerald-100 flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-500" />
                  INCLUIR - Termos que DEFINEM o uso final (obrigatório - pelo menos 1)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 inline ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Termos que DESCREVEM o uso final do produto.
                        Ex: "equipamento pilates" (para estúdios), "máquina construção" (para obras), "componente aviação" (para aeronaves).
                        A busca APENAS retornará empresas que mencionem ESTES termos.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Input em massa */}
                <Textarea
                  placeholder="Cole múltiplos termos (vírgula ou linha) e pressione ENTER: equipamento pilates, máquina pilates, aparelho pilates"
                  value={usageContextIncludeBulkInput}
                  onChange={(e) => setUsageContextIncludeBulkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleProcessBulkUsageInclude();
                    }
                  }}
                  className="min-h-[60px] border-slate-300 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleProcessBulkUsageInclude}
                  className="w-full border-slate-300 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  Processar ({parseBulkUsageContext(usageContextIncludeBulkInput).length} encontrados)
                </Button>
                
                {/* Input individual */}
                <Input
                  id="usage-include"
                  placeholder="Digite termo individual e aperte TAB ou ENTER (ex: equipamento pilates)"
                  value={usageContextIncludeInput}
                  onChange={(e) => setUsageContextIncludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      if (usageContextIncludeInput.trim()) {
                        handleAddUsageInclude(usageContextIncludeInput);
                      }
                    }
                  }}
                  className="border-slate-300 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500"
                />
                
                {/* Badges dos termos incluídos */}
                {usageContextInclude.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 shadow-md bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10">
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 w-full mb-1">
                      Termos Incluídos ({usageContextInclude.length}):
                    </span>
                    {usageContextInclude.map((term) => (
                      <Badge 
                        key={term} 
                        variant="secondary" 
                        className="gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border border-emerald-300/50 dark:border-emerald-700/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 hover:shadow-md transition-all duration-200"
                      >
                        {term}
                        <button
                          type="button"
                          onClick={() => handleRemoveUsageInclude(term)}
                          className="ml-1 hover:bg-emerald-600/20 dark:hover:bg-emerald-600/30 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* EXCLUIR - Uso Final Bloqueado */}
              <div className="space-y-2 p-4 rounded-lg border-l-4 border-l-rose-600/90 bg-gradient-to-r from-slate-50/30 to-slate-100/20 dark:from-slate-900/30 dark:to-slate-800/15">
                <Label htmlFor="usage-exclude" className="text-sm font-semibold text-rose-800 dark:text-rose-100 flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-700 dark:text-rose-500" />
                  EXCLUIR - Termos que INVALIDAM o uso (bloqueio automático)
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-rose-600 dark:text-rose-400 inline ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Termos que INDICAM uso INCORRETO do produto.
                        Ex: "uso doméstico", "hobby", "varejo", "consumidor final".
                        Empresas que mencionarem ESTES termos serão BLOQUEADAS mesmo sendo B2B.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Input em massa */}
                <Textarea
                  placeholder="Cole múltiplos termos (vírgula ou linha) e pressione ENTER: uso doméstico, hobby, varejo, consumidor final"
                  value={usageContextExcludeBulkInput}
                  onChange={(e) => setUsageContextExcludeBulkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleProcessBulkUsageExclude();
                    }
                  }}
                  className="min-h-[60px] border-slate-300 dark:border-slate-700 focus:border-rose-500 dark:focus:border-rose-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleProcessBulkUsageExclude}
                  className="w-full border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Processar ({parseBulkUsageContext(usageContextExcludeBulkInput).length} encontrados)
                </Button>
                
                {/* Input individual */}
                <Input
                  id="usage-exclude"
                  placeholder="Digite termo individual e aperte TAB ou ENTER (ex: uso doméstico)"
                  value={usageContextExcludeInput}
                  onChange={(e) => setUsageContextExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      if (usageContextExcludeInput.trim()) {
                        handleAddUsageExclude(usageContextExcludeInput);
                      }
                    }
                  }}
                  className="border-slate-300 dark:border-slate-700 focus:border-rose-500 dark:focus:border-rose-500"
                />
                
                {/* Badges dos termos excluídos */}
                {usageContextExclude.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-rose-200/50 dark:border-rose-800/50 shadow-md bg-gradient-to-r from-rose-50/50 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10">
                    <span className="text-sm font-semibold text-rose-800 dark:text-rose-200 w-full mb-1">
                      Termos Excluídos ({usageContextExclude.length}):
                    </span>
                    {usageContextExclude.map((term) => (
                      <Badge 
                        key={term} 
                        variant="secondary" 
                        className="gap-1 bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 border border-rose-300/50 dark:border-rose-700/50 hover:bg-rose-200 dark:hover:bg-rose-900/60 hover:shadow-md transition-all duration-200"
                      >
                        {term}
                        <button
                          type="button"
                          onClick={() => handleRemoveUsageExclude(term)}
                          className="ml-1 hover:bg-rose-600/20 dark:hover:bg-rose-600/30 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Alerta se não houver uso final */}
              {usageContextInclude.length === 0 && (
                <Alert className="border-l-4 border-l-orange-600/90 shadow-md bg-gradient-to-r from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10">
                  <AlertCircle className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                  <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>⚠️ ATENÇÃO:</strong> Você deve definir pelo menos 1 termo de uso final para continuar.
                    Exemplos: "equipamento pilates", "máquina construção", "componente aviação"
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* FILTROS AUTOMÁTICOS (Info) */}
          <div className="border-l-4 border-l-slate-600/90 shadow-md bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-slate-50/60 hover:to-slate-100/40 dark:hover:from-slate-950/30 dark:hover:to-slate-900/20 transition-all duration-200 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Package className="h-4 w-4 text-slate-700 dark:text-slate-500" />
              Filtros Automáticos B2B
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-500" /> INCLUIR:
                </span>
                <div className="mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                  <div>• Distributor</div>
                  <div>• Wholesaler</div>
                  <div>• Dealer</div>
                  <div>• Importer</div>
                  <div>• Trading Company</div>
                </div>
              </div>
              <div>
                <span className="font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <X className="h-3 w-3 text-rose-600 dark:text-rose-500" /> EXCLUIR:
                </span>
                <div className="mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                  <div>• Fitness Studio</div>
                  <div>• Gym / Fitness Center</div>
                  <div>• Wellness Center</div>
                  <div>• Personal Training</div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t mt-3 border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                <strong>Decisores:</strong> Procurement Manager, Purchasing Director, Buyer, Import Manager
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="submit"
              disabled={!canSearch || isSearching}
              className="flex-1 gap-2"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Buscando Dealers B2B...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Buscar Dealers & Distribuidores
                </>
              )}
            </Button>
            {isSearching && onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                disabled={isCancelling}
                className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg animate-pulse"
                size="lg"
              >
                <X className="h-5 w-5" />
                {isCancelling ? "Cancelando..." : "⛔ ABORTAR"}
              </Button>
            )}
          </div>

          {isSearching && (
            <p className="text-xs text-center text-muted-foreground">
              Buscando via Apollo.io... Aguarde 10-20 segundos
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

