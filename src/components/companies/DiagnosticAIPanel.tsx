import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, Target, Users, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DiagnosticAIPanelProps {
  company: any;
}

interface DiagnosticResult {
  overview: string;
  segment_analysis: string;
  ideal_buyer_persona: string;
  recommended_approach: string;
  totvs_products: string[];
  business_potential: string;
  similar_companies: Array<{
    name: string;
    domain?: string;
    employees?: number;
    location?: string;
    apollo_url?: string;
  }>;
  risks: string[];
  opportunities: string[];
}

export function DiagnosticAIPanel({ company }: DiagnosticAIPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      toast.info("Gerando diagnóstico 360° com IA...");

      const { data, error } = await supabase.functions.invoke('generate-company-diagnostic', {
        body: {
          companyId: company.id,
          companyData: {
            name: company.name,
            cnpj: company.cnpj,
            domain: company.domain || company.website,
            linkedin_url: company.linkedin_url,
            employees_count: company.employees_count,
            sic_codes: company.sic_codes,
            naics_codes: company.naics_codes,
            founded_year: company.founded_year,
            keywords: company.keywords,
            phone: company.phone,
            social_links: company.social_links,
            raw_data: company.raw_data,
            location: company.city && company.state ? `${company.city}, ${company.state}` : null
          }
        }
      });

      if (error) throw error;

      setDiagnostic(data);
      toast.success("Diagnóstico 360° gerado com sucesso!");
    } catch (error: any) {
      console.error('Erro ao gerar diagnóstico:', error);
      toast.error("Erro ao gerar diagnóstico", { description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Diagnóstico 360° por IA
              </CardTitle>
              <CardDescription className="text-xs">
                Análise completa de inteligência, segmentação e oportunidades
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Gerar Diagnóstico
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {diagnostic && (
        <div className="space-y-2">
          {/* Overview */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs whitespace-pre-wrap">
                {diagnostic.overview}
              </p>
            </CardContent>
          </Card>

          {/* Grid Compacto 2 Colunas */}
          <div className="grid md:grid-cols-2 gap-2">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Análise de Segmento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs whitespace-pre-wrap">
                  {diagnostic.segment_analysis}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Perfil Ideal de Decisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs whitespace-pre-wrap">
                  {diagnostic.ideal_buyer_persona}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estratégia */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Estratégia de Abordagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs whitespace-pre-wrap">
                {diagnostic.recommended_approach}
              </p>
            </CardContent>
          </Card>

          {/* TOTVS Products */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Produtos TOTVS Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {diagnostic.totvs_products.map((product, i) => (
                  <Badge key={i} variant="default" className="bg-primary/10 text-primary text-[10px] px-2 py-0.5">
                    {product}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Potential */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Potencial de Negócio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs whitespace-pre-wrap">
                {diagnostic.business_potential}
              </p>
            </CardContent>
          </Card>

          {/* Risks & Opportunities */}
          <div className="grid md:grid-cols-2 gap-2">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Riscos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {diagnostic.risks.map((risk, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-destructive">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">Oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {diagnostic.opportunities.map((opp, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5">
                      <span className="text-green-600">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Similar Companies - Compacto */}
          {diagnostic.similar_companies && diagnostic.similar_companies.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Empresas Similares ({diagnostic.similar_companies.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Empresas da mesma região/segmento com presença no Apollo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {diagnostic.similar_companies.map((sim, i) => (
                    <div key={i} className="p-2 border rounded bg-muted/10 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-xs">{sim.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {sim.location && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {sim.location}
                              </span>
                            )}
                            {sim.employees && <span>• {sim.employees} func.</span>}
                          </div>
                        </div>
                        {sim.apollo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] px-2 py-1 h-auto"
                            onClick={() => window.open(sim.apollo_url, '_blank')}
                          >
                            Apollo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
