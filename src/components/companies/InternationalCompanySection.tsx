import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Package, 
  TrendingUp, 
  Building2, 
  Users,
  Mail,
  Phone,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface InternationalCompanyData {
  country?: string;
  country_code?: string;
  industry?: string;
  employees?: number;
  revenue?: number;
  b2b_type?: string;
  import_history?: {
    hs_codes?: string[];
    annual_volume?: number;
    main_suppliers?: string[];
  };
  certifications?: string[];
  export_fit_score?: number;
  decision_makers?: Array<{
    name: string;
    title: string;
    email?: string;
    phone?: string;
  }>;
}

interface InternationalCompanySectionProps {
  data: InternationalCompanyData;
  onEnrich?: () => void;
}

export function InternationalCompanySection({ data, onEnrich }: InternationalCompanySectionProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Dados Internacionais Não Disponíveis</CardTitle>
          </div>
          <CardDescription>
            Esta empresa ainda não possui dados de inteligência internacional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onEnrich && (
            <Button onClick={onEnrich} variant="outline" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              Enriquecer com Dados Internacionais
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* COUNTRY & INDUSTRY */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Localização & Indústria</CardTitle>
            </div>
            {data.country_code && (
              <span className="text-3xl">{data.country_code}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">País</p>
              <p className="font-semibold">{data.country || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Indústria</p>
              <p className="font-semibold">{data.industry || 'N/A'}</p>
            </div>
            {data.b2b_type && (
              <div>
                <p className="text-sm text-muted-foreground">Tipo B2B</p>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {data.b2b_type}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* COMPANY SIZE */}
      {(data.employees || data.revenue) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Porte da Empresa</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {data.employees && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Funcionários
                  </p>
                  <p className="font-semibold text-lg">{data.employees.toLocaleString()}</p>
                </div>
              )}
              {data.revenue && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Receita Anual
                  </p>
                  <p className="font-semibold text-lg">
                    ${(data.revenue / 1_000_000).toFixed(1)}M
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IMPORT HISTORY */}
      {data.import_history && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Histórico de Importação</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.import_history.hs_codes && data.import_history.hs_codes.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">HS Codes Importados</p>
                <div className="flex flex-wrap gap-2">
                  {data.import_history.hs_codes.map((code) => (
                    <Badge key={code} variant="outline">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.import_history.annual_volume && (
              <div>
                <p className="text-sm text-muted-foreground">Volume Anual Estimado</p>
                <p className="font-semibold">
                  ${(data.import_history.annual_volume / 1_000_000).toFixed(1)}M
                </p>
              </div>
            )}

            {data.import_history.main_suppliers && data.import_history.main_suppliers.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Principais Fornecedores</p>
                <ul className="space-y-1">
                  {data.import_history.main_suppliers.map((supplier, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {supplier}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CERTIFICATIONS */}
      {data.certifications && data.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Certificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.certifications.map((cert) => (
                <Badge key={cert} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {cert}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* EXPORT FIT SCORE */}
      {data.export_fit_score !== undefined && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Export Fit Score</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-emerald-600">
                {data.export_fit_score}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: `${data.export_fit_score}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {data.export_fit_score >= 80 && '🔥 Excelente fit para exportação'}
                  {data.export_fit_score >= 60 && data.export_fit_score < 80 && '✅ Bom potencial de exportação'}
                  {data.export_fit_score >= 40 && data.export_fit_score < 60 && '⚠️ Potencial moderado'}
                  {data.export_fit_score < 40 && '❌ Baixo potencial de exportação'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DECISION MAKERS */}
      {data.decision_makers && data.decision_makers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Decisores Identificados</CardTitle>
            </div>
            <CardDescription>
              Contatos chave para negociações de exportação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.decision_makers.map((dm, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div>
                    <p className="font-semibold">{dm.name}</p>
                    <p className="text-sm text-muted-foreground">{dm.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dm.email && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`mailto:${dm.email}`, '_blank')}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    )}
                    {dm.phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`tel:${dm.phone}`, '_blank')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Ligar
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
  );
}
