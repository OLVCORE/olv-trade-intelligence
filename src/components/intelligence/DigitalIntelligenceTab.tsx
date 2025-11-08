import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  Snowflake,
  ThermometerSun,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DigitalIntelligenceTabProps {
  companyId?: string;
  companyName: string;
  cnpj?: string;
  domain?: string;
  sector?: string;
  onDataChange?: (data: any) => void;
}

interface AnalyzedURL {
  url: string;
  title: string;
  snippet: string;
  date?: string;
  source_type: 'website' | 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'news' | 'review' | 'other';
  ai_analysis: {
    content_type: string;
    buying_signal: boolean;
    temperature: 'hot' | 'warm' | 'cold';
    pain_point?: string;
    event?: string;
    sales_relevance: number;
    insight: string;
    script_suggestion: string;
  };
}

interface DigitalIntelligenceData {
  temperature: 'hot' | 'warm' | 'cold';
  temperature_score: number;
  sales_readiness_score: number;
  closing_probability: number;
  digital_presence: {
    website?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  buying_signals: Array<{
    signal: string;
    source: string;
    url: string;
    relevance: 'critical' | 'high' | 'medium';
  }>;
  pain_points: Array<{
    pain: string;
    severity: 'critical' | 'high' | 'medium';
    source: string;
    url: string;
    totvs_solution: string;
  }>;
  timeline: Array<{
    date: string;
    days_ago: number;
    event: string;
    source: string;
    url: string;
    ai_insight: string;
  }>;
  ai_diagnosis: string;
  sales_script: string;
  approach_timing: string;
  analyzed_urls: AnalyzedURL[];
  generated_at: string;
}

export default function DigitalIntelligenceTab({
  companyId,
  companyName,
  cnpj,
  domain,
  sector,
  onDataChange
}: DigitalIntelligenceTabProps) {
  const [isUrlsExpanded, setIsUrlsExpanded] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['digital-intelligence', companyId, companyName],
    queryFn: async (): Promise<DigitalIntelligenceData> => {
      console.log('[DIGITAL-INTEL] 🚀 Iniciando análise de inteligência digital...');
      
      // TODO: Implementar chamada à API
      // Por enquanto, retorna dados mockados
      return {
        temperature: 'hot',
        temperature_score: 95,
        sales_readiness_score: 85,
        closing_probability: 80,
        digital_presence: {
          website: 'https://vianaoffshore.com.br',
          linkedin: 'https://linkedin.com/company/viana-offshore',
          instagram: 'https://instagram.com/vianaoffshore',
          facebook: 'https://facebook.com/vianaoffshore',
          youtube: null,
          twitter: null,
        },
        buying_signals: [],
        pain_points: [],
        timeline: [],
        ai_diagnosis: '',
        sales_script: '',
        approach_timing: '',
        analyzed_urls: [],
        generated_at: new Date().toISOString(),
      };
    },
    enabled: false, // ✅ Desabilitado por padrão (aba opcional)
    staleTime: 5 * 60 * 1000,
  });

  const getTemperatureIcon = (temp: string) => {
    if (temp === 'hot') return <Flame className="w-6 h-6 text-red-500" />;
    if (temp === 'warm') return <ThermometerSun className="w-6 h-6 text-orange-500" />;
    return <Snowflake className="w-6 h-6 text-blue-500" />;
  };

  const getTemperatureColor = (temp: string) => {
    if (temp === 'hot') return 'bg-red-500/10 border-red-500/30 text-red-500';
    if (temp === 'warm') return 'bg-orange-500/10 border-orange-500/30 text-orange-500';
    return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'destructive';
    if (severity === 'high') return 'default';
    return 'secondary';
  };

  const groupUrlsBySource = (urls: AnalyzedURL[]) => {
    const grouped: Record<string, AnalyzedURL[]> = {
      website: [],
      linkedin: [],
      instagram: [],
      facebook: [],
      twitter: [],
      youtube: [],
      news: [],
      review: [],
      other: [],
    };

    urls.forEach(url => {
      grouped[url.source_type].push(url);
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Analisando presença digital com IA...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Erro ao carregar análise de inteligência digital. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Target className="w-16 h-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Análise de Inteligência Digital</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Clique no botão abaixo para iniciar uma análise profunda da presença digital 
              desta empresa usando IA. Serão analisadas 50-100 fontes de dados.
            </p>
            <Button onClick={() => refetch()} size="lg" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Gerar Análise com IA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedUrls = groupUrlsBySource(data.analyzed_urls);

  return (
    <div className="space-y-6">
      {/* 🌐 PRESENÇA DIGITAL - ACESSO RÁPIDO */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Presença Digital - Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.digital_presence.website && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                asChild
              >
                <a href={data.digital_presence.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-6 h-6 text-blue-500" />
                  <span className="text-xs">Website</span>
                </a>
              </Button>
            )}
            {data.digital_presence.linkedin && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                asChild
              >
                <a href={data.digital_presence.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">LinkedIn</span>
                </a>
              </Button>
            )}
            {data.digital_presence.instagram && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                asChild
              >
                <a href={data.digital_presence.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-6 h-6 text-pink-500" />
                  <span className="text-xs">Instagram</span>
                </a>
              </Button>
            )}
            {data.digital_presence.facebook && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                asChild
              >
                <a href={data.digital_presence.facebook} target="_blank" rel="noopener noreferrer">
                  <Facebook className="w-6 h-6 text-blue-700" />
                  <span className="text-xs">Facebook</span>
                </a>
              </Button>
            )}
            {data.digital_presence.youtube && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                asChild
              >
                <a href={data.digital_presence.youtube} target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-6 h-6 text-red-600" />
                  <span className="text-xs">YouTube</span>
                </a>
              </Button>
            )}
            {data.digital_presence.twitter && (
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-4"
                asChild
              >
                <a href={data.digital_presence.twitter} target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-6 h-6 text-sky-500" />
                  <span className="text-xs">Twitter/X</span>
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 🌡️ TEMPERATURA DE VENDAS */}
      <Card className={`border-2 ${getTemperatureColor(data.temperature)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getTemperatureIcon(data.temperature)}
            TEMPERATURA: {data.temperature.toUpperCase()} ({data.temperature_score}°C)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sales Readiness</p>
                <p className="text-3xl font-bold">{data.sales_readiness_score}/10</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Prob. Fechamento</p>
                <p className="text-3xl font-bold">{data.closing_probability}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">URLs Analisadas</p>
                <p className="text-3xl font-bold">{data.analyzed_urls.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📋 TODAS AS URLs ANALISADAS (COLLAPSIBLE) */}
      <Collapsible open={isUrlsExpanded} onOpenChange={setIsUrlsExpanded}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between hover:bg-accent">
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Todas as URLs Analisadas ({data.analyzed_urls.length})
                </CardTitle>
                {isUrlsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {Object.entries(groupedUrls).map(([sourceType, urls]) => {
                if (urls.length === 0) return null;
                
                const sourceLabels: Record<string, string> = {
                  website: '🌐 Website & Blog',
                  linkedin: '💼 LinkedIn',
                  instagram: '📸 Instagram',
                  facebook: '📘 Facebook',
                  twitter: '🐦 Twitter/X',
                  youtube: '▶️ YouTube',
                  news: '📰 Notícias',
                  review: '💬 Avaliações',
                  other: '🔍 Outros',
                };

                return (
                  <div key={sourceType} className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      {sourceLabels[sourceType]} ({urls.length})
                    </h4>
                    <div className="space-y-1 pl-4">
                      {urls.map((urlData, idx) => (
                        <a
                          key={idx}
                          href={urlData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {urlData.title || urlData.url}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

