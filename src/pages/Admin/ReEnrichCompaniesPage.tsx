/**
 * PÁGINA ADMIN: Re-enriquecer Empresas Existentes
 * 
 * Interface para executar re-enriquecimento de empresas com dados incorretos
 */

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReEnrichResult {
  processed: number;
  updated: number;
  errors: number;
  details: Array<{
    id: string;
    company_name: string;
    changes: string[];
    status: 'updated' | 'no_changes' | 'error';
    error?: string;
  }>;
}

export default function ReEnrichCompaniesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReEnrichResult | null>(null);
  const [limit, setLimit] = useState(50);
  const [force, setForce] = useState(false);
  const [hasWebsite, setHasWebsite] = useState(true);
  const [suspiciousCountry, setSuspiciousCountry] = useState(true);
  const [suspiciousName, setSuspiciousName] = useState(true);

  const handleReEnrich = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('re-enrich-companies', {
        body: {
          limit,
          force,
          filters: {
            has_website,
            suspicious_country: suspiciousCountry,
            suspicious_name: suspiciousName,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao re-enriquecer empresas');
      }

      setResult(data);
      
      if (data.updated > 0) {
        toast.success(`✅ ${data.updated} empresa(s) atualizada(s)!`, {
          description: `${data.processed} processadas, ${data.errors} erros`,
          duration: 5000,
        });
      } else {
        toast.info('Nenhuma empresa foi atualizada', {
          description: 'Todas as empresas já possuem dados corretos ou não foram encontradas empresas para processar',
        });
      }

    } catch (error: any) {
      console.error('[RE-ENRICH] Erro:', error);
      toast.error('Erro ao re-enriquecer empresas', {
        description: error.message || 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Re-enriquecer Empresas</h1>
            <p className="text-muted-foreground mt-2">
              Corrige dados incorretos (país, nome, localização) via scraping de websites
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Configurações de Re-enriquecimento
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para identificar e corrigir empresas com dados incorretos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="limit">Quantidade de Empresas</Label>
                <Input
                  id="limit"
                  type="number"
                  min={1}
                  max={500}
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número máximo de empresas a processar por execução
                </p>
              </div>

              <div className="space-y-3">
                <Label>Filtros</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasWebsite"
                    checked={hasWebsite}
                    onCheckedChange={(checked) => setHasWebsite(checked === true)}
                  />
                  <Label htmlFor="hasWebsite" className="cursor-pointer">
                    Apenas empresas com website (recomendado)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suspiciousCountry"
                    checked={suspiciousCountry}
                    onCheckedChange={(checked) => setSuspiciousCountry(checked === true)}
                  />
                  <Label htmlFor="suspiciousCountry" className="cursor-pointer">
                    Apenas empresas com país suspeito (ex: Colombia mas nome tem "Guangzhou")
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suspiciousName"
                    checked={suspiciousName}
                    onCheckedChange={(checked) => setSuspiciousName(checked === true)}
                  />
                  <Label htmlFor="suspiciousName" className="cursor-pointer">
                    Apenas empresas com nome suspeito (ex: "Wholesale Pilates Reformer" ao invés de nome real)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="force"
                    checked={force}
                    onCheckedChange={(checked) => setForce(checked === true)}
                  />
                  <Label htmlFor="force" className="cursor-pointer">
                    Forçar re-enriquecimento mesmo se já tiver dados (desmarque para ser mais seletivo)
                  </Label>
                </div>
              </div>
            </div>

            <Button
              onClick={handleReEnrich}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Iniciar Re-enriquecimento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{result.processed}</div>
                  <div className="text-sm text-muted-foreground">Processadas</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.updated}</div>
                  <div className="text-sm text-muted-foreground">Atualizadas</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                  <div className="text-sm text-muted-foreground">Erros</div>
                </div>
              </div>

              {result.details.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold">Detalhes</h3>
                  {result.details.slice(0, 20).map((detail) => (
                    <Alert
                      key={detail.id}
                      variant={detail.status === 'updated' ? 'default' : detail.status === 'error' ? 'destructive' : 'default'}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span className="truncate">{detail.company_name}</span>
                        <Badge variant={detail.status === 'updated' ? 'default' : 'outline'}>
                          {detail.status}
                        </Badge>
                      </AlertTitle>
                      {detail.changes.length > 0 && (
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1 mt-2">
                            {detail.changes.map((change, idx) => (
                              <li key={idx} className="text-sm">{change}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      )}
                      {detail.error && (
                        <AlertDescription className="text-red-600 mt-2">
                          Erro: {detail.error}
                        </AlertDescription>
                      )}
                    </Alert>
                  ))}
                  {result.details.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... e mais {result.details.length - 20} empresas
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Este processo pode levar alguns minutos dependendo da quantidade de empresas.
            Recomenda-se processar em lotes menores (50-100 empresas) para evitar timeouts.
            O sistema faz scraping dos websites das empresas para extrair informações reais.
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}
