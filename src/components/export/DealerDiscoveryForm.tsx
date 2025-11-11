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
  ChevronsUpDown
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { COUNTRIES, getCountriesByRegion, TOP_EXPORT_MARKETS, type Country } from '@/data/countries';
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
  country: string;
  minVolumeUSD: string;
  keywords?: string[];
}

// ============================================================================
// (REMOVIDO - Agora usa src/data/countries.ts com 195+ países)
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

export function DealerDiscoveryForm({ onSearch, isSearching }: DealerDiscoveryFormProps) {
  const [hsCode, setHsCode] = useState('');
  const [country, setCountry] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [openCountryCombobox, setOpenCountryCombobox] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hsCode || !country) {
      return;
    }

    onSearch({
      hsCode,
      country,
      minVolumeUSD: minVolume,
      keywords: ['pilates', 'fitness equipment', 'gym equipment'], // Default keywords
    });
  };

  const canSearch = hsCode && country;

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

          {/* HS CODE */}
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
                      <strong>Exemplos:</strong><br />
                      • 9506.91.00 (Pilates Equipment)<br />
                      • 9506.99.00 (Sports Accessories)<br />
                      • 9403.60.00 (Furniture)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              placeholder="Ex: 9506.91.00 (Pilates Equipment)"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Informe o HS Code principal do produto que deseja exportar
            </p>
          </div>

          {/* PAÍS-ALVO (Combobox com 195+ países) */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4" />
              País-Alvo
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
            <Popover open={openCountryCombobox} onOpenChange={setOpenCountryCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCountryCombobox}
                  className="w-full justify-between"
                >
                  {country ? (
                    <>
                      {COUNTRIES.find((c) => c.code === country)?.flag}{' '}
                      {COUNTRIES.find((c) => c.code === country)?.name}
                    </>
                  ) : (
                    'Selecione o país...'
                  )}
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
                        onSelect={() => {
                          setCountry(c.code);
                          setOpenCountryCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            country === c.code ? 'opacity-100' : 'opacity-0'
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
                        onSelect={() => {
                          setCountry(c.code);
                          setOpenCountryCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            country === c.code ? 'opacity-100' : 'opacity-0'
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
                        onSelect={() => {
                          setCountry(c.code);
                          setOpenCountryCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            country === c.code ? 'opacity-100' : 'opacity-0'
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
                        onSelect={() => {
                          setCountry(c.code);
                          setOpenCountryCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            country === c.code ? 'opacity-100' : 'opacity-0'
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
                        onSelect={() => {
                          setCountry(c.code);
                          setOpenCountryCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            country === c.code ? 'opacity-100' : 'opacity-0'
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
                        onSelect={() => {
                          setCountry(c.code);
                          setOpenCountryCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            country === c.code ? 'opacity-100' : 'opacity-0'
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

