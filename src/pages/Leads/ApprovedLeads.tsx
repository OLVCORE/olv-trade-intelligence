import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  Rocket, 
  Search,
  Building2,
  TrendingUp,
  Users,
  Zap,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { DealFormDialog } from '@/components/sdr/DealFormDialog';

interface ApprovedLead {
  id: string;
  company_id: string;
  cnpj: string;
  razao_social: string;
  icp_score: number;
  temperatura: 'hot' | 'warm' | 'cold';
  segmento: string;
  status: string;
  created_at: string;
}

export default function ApprovedLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ApprovedLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<ApprovedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<ApprovedLead | null>(null);
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [uniqueSources, setUniqueSources] = useState<string[]>([]);

  useEffect(() => {
    loadApprovedLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, temperatureFilter, sourceFilter, leads]);

  useEffect(() => {
    // Extrair origens únicas dos leads
    const sources = Array.from(new Set(leads.map(l => l.source_name).filter(Boolean)));
    setUniqueSources(sources as string[]);
  }, [leads]);

  const loadApprovedLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'aprovado')
        .order('icp_score', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading approved leads:', error);
      toast.error('Erro ao carregar leads aprovados');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cnpj?.includes(searchTerm)
      );
    }

    if (temperatureFilter !== 'all') {
      filtered = filtered.filter(lead => lead.temperatura === temperatureFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source_name === sourceFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleCreateDeal = (lead: ApprovedLead) => {
    setSelectedLead(lead);
    setDealFormOpen(true);
  };

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'hot': return 'bg-red-600';
      case 'warm': return 'bg-yellow-600';
      case 'cold': return 'bg-blue-600';
      default: return 'bg-slate-600';
    }
  };

  const getTemperatureLabel = (temp: string) => {
    switch (temp) {
      case 'hot': return 'QUENTE';
      case 'warm': return 'MORNO';
      case 'cold': return 'FRIO';
      default: return 'N/A';
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              Leads Aprovados
            </h1>
            <p className="text-muted-foreground mt-2">
              Empresas qualificadas pelo ICP, prontas para criar deals
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/comando')}
            >
              ← Voltar ao Comando
            </Button>
            <Button 
              onClick={() => navigate('/sdr/workspace')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Ir para Pipeline
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Aprovados</p>
                  <p className="text-2xl font-bold">{leads.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads Quentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {leads.filter(l => l.temperatura === 'hot').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Médio</p>
                  <p className="text-2xl font-bold">
                    {leads.length > 0
                      ? Math.round(leads.reduce((sum, l) => sum + (l.icp_score || 0), 0) / leads.length)
                      : 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deals Criados</p>
                  <p className="text-2xl font-bold text-slate-600">0</p>
                </div>
                <Zap className="h-8 w-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={temperatureFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('all')}
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={temperatureFilter === 'hot' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('hot')}
                    size="sm"
                    className={temperatureFilter === 'hot' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Quentes
                  </Button>
                  <Button
                    variant={temperatureFilter === 'warm' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('warm')}
                    size="sm"
                    className={temperatureFilter === 'warm' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  >
                    Mornos
                  </Button>
                  <Button
                    variant={temperatureFilter === 'cold' ? 'default' : 'outline'}
                    onClick={() => setTemperatureFilter('cold')}
                    size="sm"
                    className={temperatureFilter === 'cold' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Frios
                  </Button>
                </div>
                
                {/* FILTRO POR ORIGEM */}
                {uniqueSources.length > 0 && (
                  <div className="flex gap-2 border-l pl-4">
                    <Button
                      variant={sourceFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setSourceFilter('all')}
                      size="sm"
                    >
                      Todas Origens
                    </Button>
                    {uniqueSources.map(source => (
                      <Button
                        key={source}
                        variant={sourceFilter === source ? 'default' : 'outline'}
                        onClick={() => setSourceFilter(source)}
                        size="sm"
                        className={sourceFilter === source ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {source}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Leads */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Carregando leads aprovados...
              </CardContent>
            </Card>
          ) : filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum lead aprovado encontrado
                </p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/leads/icp-quarantine')}
                  className="mt-2"
                >
                  Ir para Quarentena ICP →
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card 
                key={lead.id}
                className="hover:border-primary/50 transition-all cursor-pointer"
                onClick={() => handleCreateDeal(lead)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Building2 className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{lead.razao_social}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            CNPJ: {lead.cnpj} • {lead.segmento || 'Segmento não identificado'}
                          </p>
                          {lead.source_name && (
                            <Badge 
                              variant="secondary" 
                              className="bg-blue-600/10 text-blue-600 border-blue-600/30 text-xs"
                            >
                              {lead.source_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">ICP Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {lead.icp_score || 0}
                        </p>
                      </div>

                      <Badge className={getTemperatureColor(lead.temperatura)}>
                        {getTemperatureLabel(lead.temperatura)}
                      </Badge>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateDeal(lead);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Criar Deal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para criar deal */}
        <DealFormDialog
          open={dealFormOpen}
          onOpenChange={setDealFormOpen}
          mode="icp"
          preSelectedLead={selectedLead}
        />
      </div>
    </AppLayout>
  );
}

