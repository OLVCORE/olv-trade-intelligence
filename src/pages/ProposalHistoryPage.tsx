import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Eye,
  Mail,
  Download,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// STATUS BADGES
// ============================================================================

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Enviada', icon: Send, color: 'bg-blue-100 text-blue-800' },
  viewed: { label: 'Visualizada', icon: Eye, color: 'bg-purple-100 text-purple-800' },
  negotiating: { label: 'Em Negociação', icon: AlertCircle, color: 'bg-amber-100 text-amber-800' },
  accepted: { label: 'Aceita', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejeitada', icon: XCircle, color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirada', icon: Clock, color: 'bg-gray-100 text-gray-800' },
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProposalHistoryPage() {
  const { currentTenant, currentWorkspace } = useTenant();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ============================================================================
  // FETCH PROPOSALS
  // ============================================================================

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['commercial-proposals', currentWorkspace?.id, statusFilter],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      let query = supabase
        .from('commercial_proposals')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleDownloadPDF = (pdfUrl: string, filename: string) => {
    window.open(pdfUrl, '_blank');
    toast.success('PDF aberto em nova aba');
  };

  const handleCopyProposal = (proposalId: string) => {
    toast.info('Duplicar proposta', {
      description: 'Funcionalidade em desenvolvimento',
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Histórico de Propostas
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe todas as propostas comerciais enviadas aos dealers
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por status:</span>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === 'sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('sent')}
            >
              Enviadas
            </Button>
            <Button
              variant={statusFilter === 'negotiating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('negotiating')}
            >
              Em Negociação
            </Button>
            <Button
              variant={statusFilter === 'accepted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('accepted')}
            >
              Aceitas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PROPOSALS TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Propostas ({proposals?.length || 0})</CardTitle>
          <CardDescription>Histórico completo de propostas enviadas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando propostas...</p>
            </div>
          )}

          {!isLoading && (!proposals || proposals.length === 0) && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">Nenhuma proposta ainda</h3>
              <p className="text-sm text-muted-foreground">
                Propostas geradas para dealers aparecerão aqui
              </p>
            </div>
          )}

          {proposals && proposals.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proposta</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Incoterm</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal: any) => {
                    const statusConfig = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {proposal.proposal_number}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{proposal.dealer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {proposal.dealer_city}, {proposal.dealer_country}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {Array.isArray(proposal.products) ? proposal.products.length : 0} produto(s)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Array.isArray(proposal.products) 
                              ? proposal.products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)
                              : 0} unidades
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {proposal.incoterm}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold">
                            USD {proposal.total_value_usd?.toLocaleString() || 0}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs">
                            {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          {proposal.sent_at && (
                            <p className="text-xs text-muted-foreground">
                              Enviada: {new Date(proposal.sent_at).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadPDF(proposal.pdf_url, proposal.pdf_filename)
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyProposal(proposal.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

