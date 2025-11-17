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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, Globe2, Search, Brain, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { runGlobalDiscovery } from "@/services/globalDiscovery";
import { transferGlobalToCompanies } from "@/services/globalToCompanyFlow";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

const BLOCKED_DOMAINS = ["alibaba", "globalsources", "made-in-china", "exporthub"];
const BLOCKED_COUNTRIES = ["China", "Hong Kong", "Taiwan"];

type DiscoveryMode = "b2b" | "trade";

interface GlobalCompanyRow {
  id: string;
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
  const [mode, setMode] = useState<DiscoveryMode>("b2b");
  const [hsCodes, setHsCodes] = useState("");
  const [keywords, setKeywords] = useState("");
  const [countries, setCountries] = useState("United States, Canada, Germany");
  const [limit, setLimit] = useState(20);
  const [b2bParams, setB2bParams] = useState({
    includeTypes: "distributor, dealer, importer, wholesaler",
    excludeTypes: "",
    includeRoles: "Procurement Manager, Purchasing Director, Import Manager, Buyer",
    intelligenceKeywords: "",
    volumeMin: "100000",
  });

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
      
      // 🧹 LIMPAR registros antigos da mesma sessão (opcional - comentado para manter histórico)
      // Descomente se quiser limpar antes de cada nova busca:
      // await supabase.from("global_companies").delete().eq("tenant_id", currentTenant.id);
      const normalizedHs = hsCodes
        .split(",")
        .map((code) => code.trim())
        .filter(Boolean);
      const normalizedKeywords = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const normalizedCountries = countries
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      return runGlobalDiscovery({
        tenantId: currentTenant.id,
        hsCodes: normalizedHs,
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

  const b2bDiscoveryMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant?.id) throw new Error("Tenant não carregado");
      const normalizedCountries = countries
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .filter((c) => !BLOCKED_COUNTRIES.includes(c));

      const hsCode = hsCodes.split(",")[0]?.trim();
      if (!hsCode) {
        throw new Error("Informe ao menos um HS Code para usar como referência");
      }

      const keywordsSet = new Set(
        b2bParams.intelligenceKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      );
      const dealers: any[] = [];

      for (const country of normalizedCountries) {
        const { data, error } = await supabase.functions.invoke("discover-dealers-realtime", {
          body: {
            hsCode,
            country,
            keywords: Array.from(keywordsSet),
            minVolume: Number(b2bParams.volumeMin) || null,
            // Parâmetros B2B específicos
            includeTypes: b2bParams.includeTypes
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            excludeTypes: b2bParams.excludeTypes
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            includeRoles: b2bParams.includeRoles
              .split(",")
              .map((r) => r.trim())
              .filter(Boolean),
          },
        });

        if (error) {
          console.error("[GLOBAL-APOLLO] Erro em", country, error);
          continue;
        }

        if (data?.dealers) {
          dealers.push(
            ...data.dealers.filter((d: any) => {
              const domain = (d.domain || d.website || "").toLowerCase();
              // Bloquear domínios de redes sociais e marketplaces
              const blocked = [
                ...BLOCKED_DOMAINS,
                'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com',
                'twitter.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
                'faire.com', 'etsy.com', 'amazon.com', 'ebay.com',
              ];
              if (blocked.some((b) => domain.includes(b))) return false;
              // Bloquear URLs com paths de posts/videos
              if (domain.includes('/posts/') || domain.includes('/videos/') || 
                  domain.includes('/groups/') || domain.includes('/people/') ||
                  domain.includes('/p/') || domain.includes('/product/')) {
                return false;
              }
              return true;
            })
          );
        }
      }

      if (dealers.length === 0) return [];

      const payload = dealers.map((dealer: any) => {
        // Normalizar domínio (extrair apenas o domínio de URLs completas)
        let domain = dealer.domain || dealer.website || null;
        if (domain) {
          try {
            // Se for uma URL completa, extrair apenas o domínio
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
              const url = new URL(domain);
              domain = url.hostname.replace(/^www\./, '');
            } else if (domain.includes('/')) {
              // Se tiver path mas não protocolo, tentar extrair
              const match = domain.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
              domain = match ? match[1] : domain.split('/')[0];
            }
          } catch {
            // Se falhar, usar como está
          }
        }

        // Normalizar nome da empresa (remover prefixos como "Title:", etc.)
        let companyName = dealer.company_name || dealer.name || "Dealer sem nome";
        companyName = companyName
          .replace(/^Title:\s*/i, '')
          .replace(/^About[-\s]us[-\s]–\s*/i, '')
          .replace(/^HOME[-\s]–\s*/i, '')
          .replace(/^Shop\s+/i, '')
          .replace(/^Products?\s*$/i, '')
          .replace(/^Global\s+Distributors?\s*$/i, '')
          .replace(/^Germany\s*$/i, '')
          .replace(/^Wholesale\s+/i, '')
          .replace(/\s*–\s*.*$/i, '') // Remove tudo após "–"
          .replace(/\s*-\s*.*$/i, '') // Remove tudo após "-" (se for título)
          .replace(/\s*\|.*$/i, '') // Remove tudo após "|"
          .replace(/\s*\.\.\.\s*$/i, '') // Remove "..."
          .trim();
        
        // Se o nome ainda for muito genérico, tentar extrair do domínio
        if (companyName.length < 3 || 
            ['Germany', 'Products', 'Shop All', 'Global Distributors', 'About-us'].includes(companyName)) {
          if (domain) {
            const domainParts = domain.split('.');
            if (domainParts.length >= 2) {
              companyName = domainParts[domainParts.length - 2]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase());
            }
          }
        }

        return {
          tenant_id: currentTenant.id,
          company_name: companyName,
          domain: domain,
          country: dealer.country || dealer.location_country || null,
          city: dealer.city || dealer.location_city || null,
          industry: dealer.industry || null,
          company_type: dealer.b2b_type || "dealer",
          fit_score: dealer.fitScore || null,
          sources: {
            discovery: {
              source: "b2b-intelligence",
              snippet: dealer.description || dealer.notes || null,
              engine: "inteligencia-b2b", // Identificar motor usado
            },
          },
          enrichment_stage: "discovery",
          status: "pending",
        };
      });

      // Deduplicação em memória (domain_key será gerado pelo banco)
      const dedupedPayload = Object.values(
        payload.reduce((acc: Record<string, any>, item: any) => {
          // Calcular domain_key exatamente como o banco faz
          const domainKey = 
            (item.domain?.trim() && item.domain.trim() !== '') 
              ? item.domain.trim()
              : `${item.company_name || "Unknown"}|${item.country || ""}`;
          if (!acc[domainKey]) {
            acc[domainKey] = item;
          }
          return acc;
        }, {} as Record<string, any>)
      );

      // Estratégia: verificar existência usando colunas reais (domain_key é gerado, não pode filtrar diretamente)
      const inserted: any[] = [];
      for (const item of dedupedPayload) {
        try {
          // Buscar por domain OU por company_name+country (as colunas reais)
          let query = (supabase as any)
            .from("global_companies")
            .select("id")
            .eq("tenant_id", currentTenant.id);
          
          if (item.domain?.trim()) {
            query = query.eq("domain", item.domain.trim());
          } else {
            // Se não tem domain, buscar por nome+país
            query = query
              .eq("company_name", item.company_name)
              .eq("country", item.country || "");
          }
          
          const { data: existing } = await query.maybeSingle();
          
          if (existing) {
            // Já existe, pular
            continue;
          }
          
          // Inserir novo registro (sem onConflict - o índice único vai prevenir duplicatas)
          const { data, error } = await (supabase as any)
            .from("global_companies")
            .insert(item)
            .select()
            .single();
          
          if (!error && data) {
            inserted.push(data);
          } else if (error) {
            // Ignorar apenas erros de duplicata (23505 = unique violation, 409 = conflict, 23503 = foreign key)
            if (error.code !== '23505' && error.code !== '23503' && error.status !== 409) {
              console.warn("[GLOBAL-B2B] Erro ao inserir empresa:", error);
            } else if (error.code === '23503') {
              console.error("[GLOBAL-B2B] Erro de foreign key - tenant_id inválido:", error.details);
            }
          }
        } catch (err: any) {
          // Ignorar erros de duplicata e foreign key silenciosamente
          if (err?.code !== '23505' && err?.code !== '23503' && err?.status !== 409) {
            console.warn("[GLOBAL-B2B] Erro ao inserir empresa:", err);
          } else if (err?.code === '23503') {
            console.error("[GLOBAL-B2B] Erro de foreign key - tenant_id inválido:", err?.details);
          }
        }
      }

      const data = inserted;
      const error = null;

      const rows = (data as any[]) || [];

      if (rows.length > 0) {
        const logEntries = rows.map((row) => ({
          company_id: row.id,
          stage: "discovery",
          status: "success",
          source: "b2b-intelligence",
          payload: row.sources,
          finished_at: new Date().toISOString(),
        }));
        await (supabase as any).from("global_enrichment_logs").insert(logEntries);
      }

      return rows;
    },
    onSuccess: async (inserted) => {
      toast.success("Inteligência B2B executada", {
        description: `${inserted?.length || 0} empresas adicionadas via motor B2B.`,
      });
      await refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao executar Inteligência B2B", {
        description: error?.message || "Erro desconhecido",
      });
    },
  });

  // Mutation para transferir empresas
  const transferMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      if (!currentTenant?.id) throw new Error("Tenant não carregado");
      
      const companiesToTransfer = companies?.filter(c => companyIds.includes(c.id)) || [];
      if (companiesToTransfer.length === 0) {
        throw new Error("Nenhuma empresa selecionada");
      }

      return transferGlobalToCompanies(companiesToTransfer, true);
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
              Descubra e qualifique dealers internacionais com base em HS Code, palavras-chave e países alvo.
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
              Escolha o motor: <strong>Inteligência B2B</strong> (decisores) ou <strong>Motor Trade</strong> (importadores reais sem marketplace).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                <strong>Como funciona:</strong> Inteligência B2B retorna empresas com decisores (múltiplas fontes). Motor Trade busca importadores reais usando HS Codes, feiras e dados de trade.
                Marketplaces ({BLOCKED_DOMAINS.join(", ")}) são ignorados e países bloqueados: {BLOCKED_COUNTRIES.join(", ")}.
              </AlertDescription>
            </Alert>
            <Tabs value={mode} onValueChange={(value) => setMode(value as DiscoveryMode)}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="b2b" className="gap-2">
                  <Brain className="h-4 w-4" /> Inteligência B2B
                </TabsTrigger>
                <TabsTrigger value="trade" className="gap-2">
                  <Globe2 className="h-4 w-4" /> Motor Trade
                </TabsTrigger>
              </TabsList>

              <TabsContent value="b2b" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipos B2B (inclui)</label>
                    <Textarea
                      rows={2}
                      value={b2bParams.includeTypes}
                      onChange={(e) => setB2bParams((prev) => ({ ...prev, includeTypes: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipos B2C (excluir)</label>
                    <Textarea
                      rows={2}
                      value={b2bParams.excludeTypes}
                      onChange={(e) => setB2bParams((prev) => ({ ...prev, excludeTypes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cargos alvo</label>
                  <Textarea
                    rows={2}
                    value={b2bParams.includeRoles}
                    onChange={(e) => setB2bParams((prev) => ({ ...prev, includeRoles: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Palavras-chave B2B</label>
                  <Textarea
                    rows={3}
                    value={b2bParams.intelligenceKeywords}
                    onChange={(e) => setB2bParams((prev) => ({ ...prev, intelligenceKeywords: e.target.value }))}
                    placeholder="Ex: Product Name, Product Type, Industry Keywords..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume mínimo anual (USD)</label>
                  <Input
                    value={b2bParams.volumeMin}
                    onChange={(e) => setB2bParams((prev) => ({ ...prev, volumeMin: e.target.value }))}
                  />
                </div>
                <Button
                  variant="default"
                  className="w-full md:w-auto gap-2"
                  onClick={() => b2bDiscoveryMutation.mutate()}
                  disabled={b2bDiscoveryMutation.isPending || !currentTenant?.id}
                >
                  {b2bDiscoveryMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando Inteligência B2B
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Rodar Inteligência B2B agora
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="trade" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">HS Codes (separados por vírgula)</label>
                    <Input value={hsCodes} onChange={(e) => setHsCodes(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Países (separados por vírgula)</label>
                    <Input value={countries} onChange={(e) => setCountries(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Palavras-chave estratégicas</label>
                  <Textarea
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    rows={3}
                    placeholder="Pilates Reformer, Pilates Studio Supplier..."
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
                <Button
                  onClick={() => tradeDiscoveryMutation.mutate()}
                  disabled={tradeDiscoveryMutation.isPending || !currentTenant?.id}
                  className="w-full md:w-auto"
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
              </TabsContent>
            </Tabs>
            <div className="mt-6 rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="text-sm font-semibold">Critérios ativos</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Modo: {mode === "b2b" ? "Inteligência B2B (decisores)" : "Motor Trade (importadores)"}
                </Badge>
                {mode === "b2b" ? (
                  <>
                    <Badge variant="secondary">Tipos: {b2bParams.includeTypes}</Badge>
                    <Badge variant="secondary">Exclui: {b2bParams.excludeTypes}</Badge>
                    <Badge variant="outline">Cargos: {b2bParams.includeRoles}</Badge>
                    <Badge variant="outline">Volume ≥ ${b2bParams.volumeMin}</Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">HS: {hsCodes}</Badge>
                    <Badge variant="secondary">Países: {countries}</Badge>
                    <Badge variant="outline">Keywords: {keywords}</Badge>
                    <Badge variant="outline">Limite: {limit}</Badge>
                  </>
                )}
                <Badge variant="destructive">Marketplaces bloqueados</Badge>
                <Badge variant="destructive">Países bloqueados: {BLOCKED_COUNTRIES.join(", ")}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Ajuste os filtros acima para refinar a busca. Após rodar o discovery, avance para qualificação e SDR diretamente nesta Sala.
              </p>
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


