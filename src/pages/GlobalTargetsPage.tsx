import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, Globe2, Search, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { runGlobalDiscovery } from "@/services/globalDiscovery";
import { transferGlobalToCompanies } from "@/services/globalToCompanyFlow";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { HSCodeAutocomplete } from "@/components/export/HSCodeAutocomplete";
import { COUNTRIES, getCountriesByRegion, TOP_EXPORT_MARKETS, type Country } from '@/data/countries';
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
import { Label } from '@/components/ui/label';
import { ChevronsUpDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLOCKED_DOMAINS = [
  "alibaba", "globalsources", "made-in-china", "exporthub",
  "aliexpress", "ebay", "dhgate", "tradekey", "ec21", "ecplaza",
  "facebook", "instagram", "tiktok", "youtube", "twitter", "pinterest", "reddit"
];
const BLOCKED_COUNTRIES = ["China", "Hong Kong", "Taiwan"];

// Apenas Motor Trade - B2B Intelligence foi movido para Export Dealers (B2B)

interface GlobalCompanyRow {
  id: string;
  tenant_id?: string;
  company_name: string;
  domain: string | null;
  country: string | null;
  city: string | null;
  industry: string | null;
  company_type: string | null;
  fit_score: number | null;
  status: string | null;
  enrichment_stage: string | null;
  created_at: string;
}

export default function GlobalTargetsPage() {
  const { currentTenant } = useTenant();
  const navigate = useNavigate();
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [tradeHsCodes, setTradeHsCodes] = useState<string[]>([]); // Múltiplos HS Codes para Motor Trade
  const [keywords, setKeywords] = useState("");
  const [tradeCountries, setTradeCountries] = useState<string[]>([]); // Array de códigos de países para Motor Trade
  const [openTradeCountryCombobox, setOpenTradeCountryCombobox] = useState(false);
  const [limit, setLimit] = useState(20);
  // Controle de cancelamento
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    data: companies,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["global-companies", currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];
      const { data, error } = await (supabase as any)
        .from("global_companies")
        .select("*")
        .eq("tenant_id", currentTenant.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as GlobalCompanyRow[];
    },
    enabled: !!currentTenant?.id,
  });

  const tradeDiscoveryMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant?.id) throw new Error("Tenant não carregado");
      
      // Criar AbortController para cancelamento
      const controller = new AbortController();
      setAbortController(controller);
      setIsCancelling(false);
      
      // 🧹 LIMPAR registros antigos da mesma sessão (opcional - comentado para manter histórico)
      // Descomente se quiser limpar antes de cada nova busca:
      // await supabase.from("global_companies").delete().eq("tenant_id", currentTenant.id);
      
      // Usar múltiplos HS Codes do Motor Trade
      if (tradeHsCodes.length === 0) {
        throw new Error("Informe ao menos um HS Code para usar como referência");
      }
      
      const normalizedKeywords = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      
      // Converter códigos de países para nomes (para compatibilidade com a API)
      const normalizedCountries = tradeCountries.length > 0
        ? tradeCountries.map(code => {
            const country = COUNTRIES.find(c => c.code === code);
            return country ? country.nameEn : code;
          })
        : [];

      // ✅ VERIFICAR CANCELAMENTO
      if (controller.signal.aborted || isCancelling) {
        throw new Error("Busca cancelada pelo usuário");
      }

      return runGlobalDiscovery({
        tenantId: currentTenant.id,
        hsCodes: tradeHsCodes,
        keywords: normalizedKeywords,
        countries: normalizedCountries,
        limit,
      });
    },
    onSuccess: async (inserted) => {
      const count = inserted?.length || 0;
      toast.success("Discovery executado", {
        description: `${count} empresas adicionadas à Sala Global.`,
      });
      await refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao executar discovery", {
        description: error?.message || "Erro desconhecido",
      });
    },
  });

  // B2B Discovery removido - usar Export Dealers (B2B) para isso
  
  // Função para cancelar busca (Motor Trade)
  const handleCancelSearch = () => {
    if (abortController) {
      abortController.abort();
      setIsCancelling(true);
      toast.warning("Cancelando busca...", {
        description: "Aguarde alguns segundos para a interrupção completa.",
      });
    }
  };

  // Mutation para transferir empresas
  const transferMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      if (!currentTenant?.id) throw new Error("Tenant não carregado");
      
      const companiesToTransfer = companies?.filter(c => companyIds.includes(c.id)) || [];
      if (companiesToTransfer.length === 0) {
        throw new Error("Nenhuma empresa selecionada");
      }

      // Adicionar tenant_id se não existir
      const companiesWithTenant = companiesToTransfer.map(c => ({
        ...c,
        tenant_id: c.tenant_id || currentTenant.id,
      }));

      return transferGlobalToCompanies(companiesWithTenant, true);
    },
    onSuccess: async (result) => {
      toast.success("Transferência concluída", {
        description: `${result.companiesCreated} empresas criadas · ${result.quarantineCreated} enviadas para Quarentena ICP · ${result.enrichmentStarted} enriquecimentos iniciados`,
        action: result.quarantineCreated > 0 ? {
          label: "Ver Quarentena",
          onClick: () => navigate("/leads/icp-quarantine")
        } : undefined,
      });
      setSelectedCompanies(new Set());
      await refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao transferir empresas", {
        description: error?.message || "Erro desconhecido",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
    toast.info("Atualizando empresas globais...");
  };

  // Helper functions para seleção de países (Motor Trade)
  const toggleTradeCountry = (code: string) => {
    setTradeCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const selectTradeRegion = (region: "Americas" | "Europe" | "Asia" | "Africa" | "Oceania") => {
    const regionCountries = getCountriesByRegion(region).map(c => c.code);
    setTradeCountries(prev => {
      const combined = [...new Set([...prev, ...regionCountries])];
      return combined;
    });
  };

  const clearTradeCountries = () => {
    setTradeCountries([]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Globe2 className="h-8 w-8 text-primary" />
              Sala Global de Alvos
            </h1>
            <p className="text-muted-foreground">
              Plataforma multissetorial: descubra e qualifique dealers internacionais de qualquer produto com base em HS Code, palavras-chave e países alvo.
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar lista
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rodar Discovery</CardTitle>
            <CardDescription>
              <strong>Motor Trade</strong>: Descubra importadores reais usando HS Codes, feiras e dados de trade (ImportGenius, Panjiva, Volza).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Como funciona:</strong> Motor Trade busca importadores reais usando HS Codes, feiras e dados de trade (ImportGenius, Panjiva, Volza).
                Marketplaces ({BLOCKED_DOMAINS.join(", ")}) são ignorados e países bloqueados: {BLOCKED_COUNTRIES.join(", ")}.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    HS Code / NCM (Múltiplos)
                    <span className="text-xs text-muted-foreground font-normal">
                      • Clique no código no dropdown para adicionar
                    </span>
                  </label>
                  <HSCodeAutocomplete
                    value=""
                    onSelect={(code) => {
                      if (!tradeHsCodes.includes(code)) {
                        setTradeHsCodes([...tradeHsCodes, code]);
                      }
                    }}
                    placeholder="Digite código (ex: 1701) ou produto (ex: sugar, furniture, footwear)..."
                  />
                  {tradeHsCodes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tradeHsCodes.map((code) => (
                        <Badge key={code} variant="secondary" className="gap-1">
                          {code}
                          <button
                            type="button"
                            onClick={() => setTradeHsCodes(tradeHsCodes.filter((c) => c !== code))}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Adicione múltiplos HS Codes para buscar vários produtos ao mesmo tempo!
                  </p>
                </div>
                
                {/* PAÍSES-ALVO (Multi-select + Seleção por Região) - Motor Trade */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Países-Alvo (Multi-select)
                  </Label>
                  
                  {/* Botões Seleção Rápida por Região */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => selectTradeRegion('Americas')}>
                      Americas ({getCountriesByRegion('Americas').length})
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => selectTradeRegion('Europe')}>
                      Europe ({getCountriesByRegion('Europe').length})
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => selectTradeRegion('Asia')}>
                      Asia ({getCountriesByRegion('Asia').length})
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => selectTradeRegion('Africa')}>
                      Africa ({getCountriesByRegion('Africa').length})
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => selectTradeRegion('Oceania')}>
                      Oceania ({getCountriesByRegion('Oceania').length})
                    </Button>
                    {tradeCountries.length > 0 && (
                      <Button type="button" variant="destructive" size="sm" onClick={clearTradeCountries}>
                        <X className="h-3 w-3 mr-1" />
                        Limpar ({tradeCountries.length})
                      </Button>
                    )}
                  </div>

                  <Popover open={openTradeCountryCombobox} onOpenChange={setOpenTradeCountryCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openTradeCountryCombobox}
                        className="w-full justify-between"
                      >
                        {tradeCountries.length > 0
                          ? `${tradeCountries.length} ${tradeCountries.length === 1 ? 'país' : 'países'} selecionado${tradeCountries.length > 1 ? 's' : ''}`
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
                        <CommandList className="max-h-[400px] overflow-y-auto">
                          {/* TOP MARKETS */}
                          <CommandGroup heading="Principais Mercados">
                            {COUNTRIES.filter(c => TOP_EXPORT_MARKETS.includes(c.code)).map((c) => (
                              <CommandItem
                                key={c.code}
                                value={`${c.name} ${c.nameEn} ${c.code}`}
                                onSelect={() => toggleTradeCountry(c.code)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tradeCountries.includes(c.code) ? 'opacity-100' : 'opacity-0'
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
                                onSelect={() => toggleTradeCountry(c.code)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tradeCountries.includes(c.code) ? 'opacity-100' : 'opacity-0'
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
                                onSelect={() => toggleTradeCountry(c.code)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tradeCountries.includes(c.code) ? 'opacity-100' : 'opacity-0'
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
                                onSelect={() => toggleTradeCountry(c.code)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tradeCountries.includes(c.code) ? 'opacity-100' : 'opacity-0'
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
                                onSelect={() => toggleTradeCountry(c.code)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tradeCountries.includes(c.code) ? 'opacity-100' : 'opacity-0'
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
                                onSelect={() => toggleTradeCountry(c.code)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    tradeCountries.includes(c.code) ? 'opacity-100' : 'opacity-0'
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

                  {/* Países Selecionados (Badges) */}
                  {tradeCountries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tradeCountries.map((code) => {
                        const country = COUNTRIES.find(c => c.code === code);
                        if (!country) return null;
                        return (
                          <Badge key={code} variant="secondary" className="gap-1">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleTradeCountry(code)}
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Palavras-chave estratégicas</label>
                  <Textarea
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    rows={3}
                    placeholder="Ex: Product Name, Product Type, Industry Keywords..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade máxima</label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    min={5}
                    max={100}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => tradeDiscoveryMutation.mutate()}
                    disabled={tradeDiscoveryMutation.isPending || !currentTenant?.id}
                    className="gap-2"
                  >
                    {tradeDiscoveryMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executando Motor Trade
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Rodar Motor Trade agora
                      </>
                    )}
                  </Button>
                  {tradeDiscoveryMutation.isPending && (
                    <Button
                      type="button"
                      onClick={handleCancelSearch}
                      disabled={isCancelling}
                      className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg animate-pulse"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {isCancelling ? "Cancelando..." : "⛔ ABORTAR BUSCA"}
                    </Button>
                  )}
                </div>
            <div className="mt-6 rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-semibold">Critérios ativos</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Modo: Motor Trade (importadores reais)
                </Badge>
                <Badge variant="secondary">
                  HS Codes: {tradeHsCodes.length > 0 ? tradeHsCodes.join(", ") : "Nenhum"}
                </Badge>
                <Badge variant="secondary">
                  Países: {tradeCountries.length > 0 ? `${tradeCountries.length} selecionados` : "Nenhum"}
                </Badge>
                <Badge variant="outline">Keywords: {keywords || "Nenhuma"}</Badge>
                <Badge variant="outline">Limite: {limit}</Badge>
                <Badge variant="destructive">Marketplaces bloqueados</Badge>
                <Badge variant="destructive">Países bloqueados: {BLOCKED_COUNTRIES.join(", ")}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ajuste os filtros acima para refinar a busca. Após rodar o discovery, avance para qualificação e SDR diretamente nesta Sala.
              </p>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Empresas detectadas</CardTitle>
                <CardDescription>
                  {isLoading ? "Carregando empresas..." : `${companies?.length || 0} registros encontrados`}
                  {selectedCompanies.size > 0 && ` · ${selectedCompanies.size} selecionadas`}
                </CardDescription>
              </div>
              {selectedCompanies.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompanies(new Set())}
                  >
                    Limpar seleção
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => transferMutation.mutate(Array.from(selectedCompanies))}
                    disabled={transferMutation.isPending}
                  >
                    {transferMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transferindo...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Transferir para Base ({selectedCompanies.size})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando lista...
              </div>
            )}
            {!isLoading && (!companies || companies.length === 0) && (
              <p className="text-muted-foreground">Ainda não há empresas globais para este tenant.</p>
            )}
            {companies?.map((company) => {
              const isSelected = selectedCompanies.has(company.id);
              return (
              <div 
                key={company.id} 
                className={`rounded-lg border p-4 flex flex-col gap-2 transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedCompanies);
                      if (checked) {
                        newSelected.add(company.id);
                      } else {
                        newSelected.delete(company.id);
                      }
                      setSelectedCompanies(newSelected);
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{company.company_name}</h3>
                    {company.domain && (
                      <a
                        href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {company.domain}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {company.country && <Badge variant="outline">{company.country}</Badge>}
                    {company.company_type && <Badge variant="secondary">{company.company_type}</Badge>}
                    {company.enrichment_stage && (
                      <Badge variant="default">{company.enrichment_stage.toUpperCase()}</Badge>
                    )}
                    {company.status && company.status !== "pending" && (
                      <Badge variant="outline">{company.status}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex flex-col gap-1">
                  {company.city && <span>📍 {company.city}</span>}
                  {company.industry && <span>🏭 {company.industry}</span>}
                  {company.fit_score !== null && (
                    <span>🎯 Fit Score: {Math.round(company.fit_score ?? 0)}%</span>
                  )}
                  <span className="text-xs">
                    Detectado em {new Date(company.created_at).toLocaleDateString()}
                  </span>
                </div>
                  </div>
                </div>
              </div>
            );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


