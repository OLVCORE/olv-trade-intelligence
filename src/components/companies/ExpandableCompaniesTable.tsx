import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  ExternalLink,
  Linkedin,
  Building2,
  Mail,
  Phone,
  Target,
} from 'lucide-react';
import { CompanyRowActions } from './CompanyRowActions';

// ============================================================================
// TYPES
// ============================================================================

interface ExpandableCompaniesTableProps {
  companies: any[];
  selectedCompanies?: string[];
  onToggleSelect?: (companyId: string) => void;
  onToggleSelectAll?: () => void;
  onRefresh?: () => void;
  showCheckboxes?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ExpandableCompaniesTable({ 
  companies, 
  selectedCompanies = [],
  onToggleSelect,
  onToggleSelectAll,
  onRefresh,
  showCheckboxes = true 
}: ExpandableCompaniesTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (companyId: string) => {
    setExpandedRow(expandedRow === companyId ? null : companyId);
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getFitScore = (company: any): number => {
    const rawData = company.raw_data || {};
    return rawData.fit_score || company.fit_score || 0;
  };

  const getB2BType = (company: any): string => {
    const rawData = company.raw_data || {};
    return rawData.type || company.b2b_type || 'N/A';
  };

  const getDecisionMakers = (company: any): any[] => {
    const rawData = company.raw_data || {};
    return rawData.decision_makers || company.decision_makers || [];
  };

  const getApolloLink = (company: any): string | null => {
    const rawData = company.raw_data || {};
    if (rawData.apollo_link) return rawData.apollo_link;
    if (company.apollo_id) return `https://app.apollo.io/#/companies/${company.apollo_id}`;
    return null;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedCompanies.length === companies.length && companies.length > 0}
                  onCheckedChange={onToggleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>País / UF</TableHead>
            <TableHead>Indústria</TableHead>
            <TableHead>Funcionários</TableHead>
            <TableHead className="text-center">Fit Score</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const fitScore = getFitScore(company);
            const decisores = getDecisionMakers(company);
            const apolloLink = getApolloLink(company);
            
            return (
              <>
                {/* Linha Principal */}
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRow(company.id)}
                >
                  {showCheckboxes && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => onToggleSelect?.(company.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {expandedRow === company.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{company.company_name}</span>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3" />
                          {company.website.replace('https://', '').replace('http://', '')}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {company.country && (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <MapPin className="h-3 w-3" />
                          {company.country}
                        </Badge>
                      )}
                      {company.state && !company.country && (
                        <span className="text-xs text-muted-foreground">{company.state}</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{company.industry || 'N/A'}</span>
                  </TableCell>
                  
                  <TableCell>
                    {(company.employee_count || company.employees_count) ? (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Users className="h-3 w-3" />
                        {company.employee_count || company.employees_count}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {fitScore > 0 ? (
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`h-2 w-16 rounded-full ${getFitScoreColor(fitScore)}`}
                        >
                          <div
                            className="h-full rounded-full bg-white/30"
                            style={{ width: `${fitScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{fitScore}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div onClick={(e) => e.stopPropagation()}>
                      <CompanyRowActions company={company} onRefresh={onRefresh} />
                    </div>
                  </TableCell>
                </TableRow>

                {/* Linha Expandida (Card Completo) */}
                {expandedRow === company.id && (
                  <TableRow>
                    <TableCell colSpan={showCheckboxes ? 8 : 7} className="bg-muted/30 p-0">
                      <Card className="border-0 shadow-none">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Coluna Esquerda */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Informações Gerais
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nome:</span>
                                    <span className="font-medium">{company.company_name}</span>
                                  </div>
                                  {company.cnpj && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">CNPJ:</span>
                                      <span className="font-mono text-xs">{company.cnpj}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Indústria:</span>
                                    <span className="font-medium">{company.industry || 'N/A'}</span>
                                  </div>
                                  {(company.employee_count || company.employees_count) && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Funcionários:</span>
                                      <Badge variant="secondary">
                                        {company.employee_count || company.employees_count}
                                      </Badge>
                                    </div>
                                  )}
                                  {company.data_source && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Origem:</span>
                                      <Badge variant="outline">{company.data_source}</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Localização
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <div>
                                      {company.city && <p className="text-muted-foreground">{company.city}</p>}
                                      {company.state && <p className="text-muted-foreground">{company.state}</p>}
                                      {company.country && <p className="font-medium">{company.country}</p>}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {(company.description || company.raw_data?.notes) && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {company.description || company.raw_data?.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Coluna Direita */}
                            <div className="space-y-4">
                              {fitScore > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Fit Score
                                  </h4>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${getFitScoreColor(fitScore)}`}
                                          style={{ width: `${fitScore}%` }}
                                        />
                                      </div>
                                    </div>
                                    <span className="text-2xl font-bold">{fitScore}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {fitScore >= 80 && '🟢 Excelente fit para B2B'}
                                    {fitScore >= 60 && fitScore < 80 && '🟡 Bom fit para B2B'}
                                    {fitScore < 60 && '🟠 Fit moderado'}
                                  </p>
                                  {getB2BType(company) !== 'N/A' && (
                                    <Badge variant="default" className="mt-2">
                                      {getB2BType(company)}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  Links Externos
                                </h4>
                                <div className="space-y-2">
                                  {company.website && (
                                    <a
                                      href={company.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                      <Globe className="h-4 w-4" />
                                      Website
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                  {company.linkedin_url && (
                                    <a
                                      href={company.linkedin_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                      <Linkedin className="h-4 w-4" />
                                      LinkedIn
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                  {apolloLink && (
                                    <a
                                      href={apolloLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                      <img src="https://www.apollo.io/favicon.ico" alt="Apollo" className="h-4 w-4" />
                                      Apollo.io
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* DECISORES (se disponível) */}
                              {decisores.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Decisores ({decisores.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {decisores.slice(0, 5).map((dm: any, idx: number) => (
                                      <div key={idx} className="p-2 bg-muted/30 rounded text-xs border">
                                        <div className="font-medium">{dm.name}</div>
                                        <div className="text-muted-foreground">{dm.title}</div>
                                        <div className="flex gap-3 mt-2">
                                          {dm.linkedin_url && (
                                            <a
                                              href={dm.linkedin_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-primary hover:underline"
                                            >
                                              <Linkedin className="h-3 w-3" />
                                              LinkedIn
                                            </a>
                                          )}
                                          {dm.apollo_link && (
                                            <a
                                              href={dm.apollo_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-primary hover:underline"
                                            >
                                              <img src="https://www.apollo.io/favicon.ico" alt="Apollo" className="h-3 w-3" />
                                              Apollo
                                            </a>
                                          )}
                                          {dm.email && (
                                            <a
                                              href={`mailto:${dm.email}`}
                                              className="flex items-center gap-1 text-primary hover:underline"
                                            >
                                              <Mail className="h-3 w-3" />
                                              Email
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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

      {companies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma empresa encontrada</p>
        </div>
      )}
    </div>
  );
}

