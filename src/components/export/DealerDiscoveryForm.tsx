import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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
import { searchHSCodes, getHSCode, type HSCode } from '@/data/hsCodes';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface DealerDiscoveryFormProps {
  onSearch: (params: DealerSearchParams) => void;
  isSearching: boolean;
}

export interface DealerSearchParams {
  hsCode: string;
  countries: string[];
  minVolume?: number;
  minVolumeUSD?: string;
  keywords?: string[];
  includeKeywords?: string[]; // Keywords B2B para incluir
  excludeKeywords?: string[]; // Keywords B2C para excluir
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
  'Pilates Studio',
  'Gym / Fitness Center',
  'Wellness Center',
  'Personal Training',
  'Yoga Studio',
  'Spa',
  'Rehabilitation Center',
  'Physiotherapy',
];

export function DealerDiscoveryForm({ onSearch, isSearching }: DealerDiscoveryFormProps) {
  const [hsCode, setHsCode] = useState('');
  const [hsCodeSearch, setHsCodeSearch] = useState('');
  const [openHSCombobox, setOpenHSCombobox] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState('');
  const [openCountryCombobox, setOpenCountryCombobox] = useState(false);
  
  // Keywords selecionadas (todas marcadas por padrão)
  const [includeKeywords, setIncludeKeywords] = useState<string[]>(B2B_INCLUDE_KEYWORDS);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>(B2C_EXCLUDE_KEYWORDS);
  
  // Keywords customizadas (termos locais, dialetos, nomes específicos)
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [customKeywordInput, setCustomKeywordInput] = useState('');

  // Adicionar custom keyword (Tab ou Enter)
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

    if (!hsCode || countries.length === 0) {
      toast.error('Preencha HS Code e selecione pelo menos 1 país');
      return;
    }

    onSearch({
      hsCode,
      countries,
      minVolume: minVolume ? parseInt(minVolume) : undefined,
      minVolumeUSD: minVolume,
      includeKeywords, // Keywords B2B selecionadas
      excludeKeywords, // Keywords B2C selecionadas
      keywords: customKeywords.length > 0 
        ? customKeywords // Se tem custom, usar elas
        : ['pilates', 'fitness equipment', 'gym equipment'], // Senão, padrão
    });
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

  const canSearch = hsCode && countries.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Descobrir Dealers & Distribuidores B2B
        </CardTitle>
        <CardDescription>
          Encontre distribuidores, wholesalers e importadores internacionais de equipamentos de pilates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AVISO B2B */}
          <Alert className="border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/20">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>Foco B2B:</strong> Buscamos apenas <strong>Dealers, Distribuidores e Wholesalers</strong>.
              Studios individuais e gyms (B2C) são automaticamente excluídos.
            </AlertDescription>
          </Alert>

          {/* FILTROS B2B CLICÁVEIS (VISÍVEL NO TOPO!) */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-green-600" />
              Filtros B2B Personalizados (Apollo.io)
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* INCLUIR (checkboxes) */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded border">
                <span className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-1 mb-3 text-sm">
                  <Check className="h-4 w-4" /> INCLUIR (B2B):
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
                <span className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-3 text-sm">
                  <X className="h-4 w-4" /> EXCLUIR (B2C):
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

            <div className="pt-3 border-t mt-3 border-green-200 dark:border-green-800">
              <span className="text-xs font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                <strong>Decisores Alvo:</strong> Procurement Manager, Purchasing Director, Import Manager, Buyer
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                {includeKeywords.length} keywords incluídas | {excludeKeywords.length} keywords excluídas
              </p>
            </div>
          </div>

          {/* HS CODE (com autocomplete) */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              HS Code / NCM
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Código NCM/HS do produto que você exporta.<br />
                      <strong>Autocomplete ativo:</strong> Digite e veja sugestões!<br />
                      Fonte: WCO Harmonized System Database
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            
            <Popover open={openHSCombobox} onOpenChange={setOpenHSCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openHSCombobox}
                  className="w-full justify-between font-mono"
                >
                  {hsCode ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {hsCode}
                      {getHSCode(hsCode) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          - {getHSCode(hsCode)?.description}
                        </span>
                      )}
                    </span>
                  ) : (
                    'Digite ou selecione HS Code...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Digite HS Code ou produto (ex: pilates, fitness, furniture)..." 
                    value={hsCodeSearch}
                    onValueChange={setHsCodeSearch}
                  />
                  <CommandEmpty>
                    Nenhum HS Code encontrado.
                    <div className="text-xs text-muted-foreground mt-2">
                      Digite manualmente ou busque por: "pilates", "fitness", "footwear", "telecom", etc.
                    </div>
                  </CommandEmpty>
                  
                  <CommandGroup heading="Códigos HS Disponíveis">
                    {searchHSCodes(hsCodeSearch || 'pilates').map((hs) => (
                      <CommandItem
                        key={hs.code}
                        value={`${hs.code} ${hs.description} ${hs.keywords.join(' ')}`}
                        onSelect={() => {
                          setHsCode(hs.code);
                          setOpenHSCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            hsCode === hs.code ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-mono font-semibold">{hs.code}</div>
                          <div className="text-xs text-muted-foreground">{hs.description}</div>
                          <div className="flex gap-1 mt-1">
                            {hs.keywords.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">{hs.category}</Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            <p className="text-xs text-muted-foreground mt-1">
              💡 Digite para buscar: "pilates", "fitness", "furniture", "footwear", etc.
            </p>
          </div>

          {/* PAÍSES-ALVO (Multi-select + Seleção por Região) */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4" />
              Países-Alvo (Multi-select)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Selecione o país onde deseja encontrar importadores e distribuidores.<br />
                      <strong>195+ países disponíveis</strong> agrupados por região.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

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
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar país..." />
                  <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
                  
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
                </Command>
              </PopoverContent>
            </Popover>

            {/* Países Selecionados (Badges) */}
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {countries.map((code) => {
                  const country = COUNTRIES.find((c) => c.code === code);
                  return (
                    <Badge key={code} variant="secondary" className="gap-1">
                      {country?.flag} {country?.name}
                      <button
                        onClick={() => toggleCountry(code)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* VOLUME MÍNIMO */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              Volume Mínimo Anual (USD)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
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
            />
            <p className="text-xs text-muted-foreground mt-1">
              Campo opcional - deixe vazio para ver todos os dealers
            </p>
          </div>

          {/* KEYWORDS CUSTOMIZADAS (Dialetos, termos locais) */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4" />
              Keywords Customizadas
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Adicione termos locais!</strong><br />
                      • Dialetos (ex: "gimnasio" para México)<br />
                      • Nomes específicos de produtos<br />
                      • Marcas ou termos regionais<br /><br />
                      <strong>Como usar:</strong> Digite e aperte <kbd className="px-1 py-0.5 bg-muted rounded">TAB</kbd> ou <kbd className="px-1 py-0.5 bg-muted rounded">ENTER</kbd>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            
            <div className="space-y-2">
              <Input
                value={customKeywordInput}
                onChange={(e) => setCustomKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' || e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomKeyword(customKeywordInput);
                  }
                }}
                placeholder="Digite keyword e aperte TAB (ex: gimnasio, équipement, turnhalle)..."
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
              
              {/* Keywords adicionadas */}
              {customKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded">
                  {customKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomKeyword(keyword)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              💡 Útil para: Dialetos regionais, nomes locais, marcas específicas do país
            </p>
          </div>

          {/* FILTROS AUTOMÁTICOS (Info) */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Filtros Automáticos B2B
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> INCLUIR:
                </span>
                <div className="mt-1 space-y-1 text-muted-foreground">
                  <div>• Distributor</div>
                  <div>• Wholesaler</div>
                  <div>• Dealer</div>
                  <div>• Importer</div>
                  <div>• Trading Company</div>
                </div>
              </div>
              <div>
                <span className="font-medium text-red-600 flex items-center gap-1">
                  <X className="h-3 w-3" /> EXCLUIR:
                </span>
                <div className="mt-1 space-y-1 text-muted-foreground">
                  <div>• Pilates Studio</div>
                  <div>• Gym / Fitness Center</div>
                  <div>• Wellness Center</div>
                  <div>• Personal Training</div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t mt-3">
              <span className="text-xs text-muted-foreground">
                <strong>Decisores:</strong> Procurement Manager, Purchasing Director, Buyer, Import Manager
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={!canSearch || isSearching}
            className="w-full gap-2"
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

