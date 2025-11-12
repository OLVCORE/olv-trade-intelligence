import { useState } from 'react';
import { Dealer } from './DealerCard';
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
import {
  ChevronDown,
  ChevronUp,
  Globe,
  MapPin,
  Users,
  TrendingUp,
  ExternalLink,
  Linkedin,
} from 'lucide-react';

interface DealersTableProps {
  dealers: Dealer[];
}

export function DealersTable({ dealers }: DealersTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (dealerId: string) => {
    setExpandedRow(expandedRow === dealerId ? null : dealerId);
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Indústria</TableHead>
            <TableHead>Funcionários</TableHead>
            <TableHead className="text-center">Fit Score</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dealers.map((dealer) => (
            <>
              {/* Linha Principal */}
              <TableRow
                key={dealer.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleRow(dealer.id)}
              >
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {expandedRow === dealer.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{dealer.name}</span>
                    {dealer.website && (
                      <a
                        href={dealer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" />
                        {dealer.website.replace('https://', '').replace('http://', '')}
                      </a>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <MapPin className="h-3 w-3" />
                    {dealer.country}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm text-muted-foreground">{dealer.industry || 'N/A'}</span>
                </TableCell>
                
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Users className="h-3 w-3" />
                    {dealer.employeeCount || 'N/A'}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={`h-2 w-16 rounded-full ${getFitScoreColor(dealer.fitScore || 0)}`}
                    >
                      <div
                        className="h-full rounded-full bg-white/30"
                        style={{ width: `${dealer.fitScore || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{dealer.fitScore || 0}</span>
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  {dealer.linkedinUrl && (
                    <a
                      href={dealer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </TableCell>
              </TableRow>

              {/* Linha Expandida (Card Completo) */}
              {expandedRow === dealer.id && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-muted/30 p-0">
                    <Card className="border-0 shadow-none">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Coluna Esquerda */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Informações Gerais</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Nome:</span>
                                  <span className="font-medium">{dealer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Indústria:</span>
                                  <span className="font-medium">{dealer.industry || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Funcionários:</span>
                                  <Badge variant="secondary">
                                    {dealer.employeeCount || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2">Localização</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    {dealer.city && <p>{dealer.city}</p>}
                                    {dealer.state && <p>{dealer.state}</p>}
                                    <p className="font-medium">{dealer.country}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {dealer.description && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                                <p className="text-sm text-muted-foreground">{dealer.description}</p>
                              </div>
                            )}
                          </div>

                          {/* Coluna Direita */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Fit Score</h4>
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${getFitScoreColor(dealer.fitScore || 0)}`}
                                      style={{ width: `${dealer.fitScore || 0}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-2xl font-bold">{dealer.fitScore || 0}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {dealer.fitScore >= 80 && 'Excelente fit para B2B'}
                                {dealer.fitScore >= 60 && dealer.fitScore < 80 && 'Bom fit para B2B'}
                                {dealer.fitScore < 60 && 'Fit moderado'}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2">Links Externos</h4>
                              <div className="space-y-2">
                                {dealer.website && (
                                  <a
                                    href={dealer.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <Globe className="h-4 w-4" />
                                    Website
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {dealer.linkedinUrl && (
                                  <a
                                    href={dealer.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {dealer.apollo_link && (
                                  <a
                                    href={dealer.apollo_link}
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
                            {dealer.decision_makers && dealer.decision_makers.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Decisores ({dealer.decision_makers.length})</h4>
                                <div className="space-y-2">
                                  {dealer.decision_makers.slice(0, 5).map((dm: any, idx: number) => (
                                    <div key={idx} className="p-2 bg-muted/30 rounded text-xs">
                                      <div className="font-medium">{dm.name}</div>
                                      <div className="text-muted-foreground">{dm.title}</div>
                                      <div className="flex gap-2 mt-1">
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
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {dealer.b2bType && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Tipo B2B</h4>
                                <Badge variant="default">{dealer.b2bType}</Badge>
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
          ))}
        </TableBody>
      </Table>

      {dealers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum dealer encontrado
        </div>
      )}
    </div>
  );
}

