import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ICP_QUARANTINE_QUERY_KEY = ['icp-quarantine'];

// Hook para salvar resultados na quarentena
export function useSaveToQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (results: any[]) => {
      const records = results.map(r => ({
        company_id: r.company_id,
        cnpj: r.cnpj,
        razao_social: r.name,
        icp_score: r.icp_score || 0,
        temperatura: r.temperatura || 'cold',
        status: r.encontrou_totvs ? 'descartada' : 'pendente',
        motivo_descarte: r.encontrou_totvs ? 'Cliente TOTVS detectado' : null,
        evidencias_totvs: r.evidencias || [],
        breakdown: r.breakdown || {},
        motivos: r.motivos || [],
        raw_analysis: r,
      }));

      const { error } = await supabase
        .from('icp_analysis_results')
        .insert(records);

      if (error) throw error;
      return records;
    },
    onSuccess: (data) => {
      const aprovadas = data.filter(d => d.status === 'pendente').length;
      const descartadas = data.filter(d => d.status === 'descartada').length;
      
      toast.success('Análise salva na quarentena', {
        description: `${aprovadas} pendentes | ${descartadas} descartadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['icp-stats'] });
    },
    onError: (error: any) => {
      const message = String(error?.message || '');
      const code = (error as any)?.code;
      if (code === '23505' || /duplicate key value/i.test(message)) {
        toast.error('CNPJ duplicado', {
          description: 'Este CNPJ já existe na quarentena. O registro foi ignorado.',
        });
      } else {
        toast.error('Erro ao salvar na quarentena', {
          description: message,
        });
      }
    },
  });
}

// Hook para buscar empresas na quarentena
export function useQuarantineCompanies(filters?: {
  status?: string;
  temperatura?: string;
  minScore?: number;
}) {
  return useQuery({
    queryKey: [...ICP_QUARANTINE_QUERY_KEY, filters],
    queryFn: async () => {
      // ✅ Obter usuário autenticado para logs
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[QUARENTENA] Erro ao obter usuário:', userError);
        throw userError;
      }

      if (!user) {
        console.warn('[QUARENTENA] Usuário não autenticado');
        return [];
      }

      console.log('[QUARENTENA] 🔍 Buscando empresas para user_id:', user.id);

      // 🔍 DIAGNÓSTICO: Verificar se há registros órfãos (sem user_id) no banco
      // Isso ajuda a identificar falsos positivos no "already exists"
      const { data: orphanCheck } = await supabase
        .from('icp_analysis_results')
        .select('id, razao_social, user_id, tenant_id, workspace_id')
        .is('user_id', null)
        .limit(5);
      
      if (orphanCheck && orphanCheck.length > 0) {
        console.warn('[QUARENTENA] ⚠️ ATENÇÃO: Encontrados registros órfãos (sem user_id) no banco:', orphanCheck.length);
        console.warn('[QUARENTENA] ⚠️ Estes registros podem causar falsos positivos no "already exists"');
        console.warn('[QUARENTENA] ⚠️ Execute a migration 20260116000002_cleanup_quarantine_orphans.sql para limpar');
      }

      // ✅ FILTRO PADRÃO: Apenas empresas pendentes (não aprovadas, não descartadas)
      // Isso garante que empresas aprovadas/descartadas não apareçam mais na quarentena
      let query = supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'pendente') // ✅ PADRÃO: Apenas pendentes na quarentena
        .order('icp_score', { ascending: false });

      // Se filtro específico de status for passado, substituir o padrão
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.temperatura) {
        query = query.eq('temperatura', filters.temperatura);
      }
      if (filters?.minScore) {
        query = query.gte('icp_score', filters.minScore);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[QUARENTENA] ❌ Erro na query:', error);
        console.error('[QUARENTENA] ❌ Código do erro:', error.code);
        console.error('[QUARENTENA] ❌ Mensagem completa:', error.message);
        throw error;
      }

      console.log('[QUARENTENA] ✅ Query executada. Total retornado:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('[QUARENTENA] 📊 Primeiros registros:', data.slice(0, 3).map(r => ({
          id: r.id,
          razao_social: r.razao_social,
          user_id: r.user_id,
          tenant_id: r.tenant_id,
          workspace_id: r.workspace_id,
          cnpj: r.cnpj ? 'SIM' : 'NÃO (internacional)',
          status: r.status
        })));
      } else {
        console.warn('[QUARENTENA] ⚠️ NENHUM REGISTRO RETORNADO');
        console.warn('[QUARENTENA] ⚠️ Possíveis causas:');
        console.warn('[QUARENTENA] ⚠️ 1. RLS bloqueando (user_id não corresponde a auth.uid())');
        console.warn('[QUARENTENA] ⚠️ 2. Registros foram inseridos sem user_id (órfãos)');
        console.warn('[QUARENTENA] ⚠️ 3. Filtros muito restritivos');
        console.warn('[QUARENTENA] ⚠️ SOLUÇÃO: Execute a migration 20260116000002_cleanup_quarantine_orphans.sql');
      }

      // Retornar dados diretamente (sem JOIN com companies)
      return data || [];
    },
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
  });
}

// Hook para aprovar empresas em batch
export function useApproveQuarantineBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisIds: string[]) => {
      const ids = (analysisIds || []).filter((id): id is string => Boolean(id));
      if (ids.length === 0) throw new Error('Nenhuma empresa selecionada');

      // 1. Buscar dados das empresas por ID da análise
      const { data: quarantineData, error: fetchError } = await supabase
        .from('icp_analysis_results')
        .select('*')
        .in('id', ids);

      if (fetchError) throw fetchError;
      if (!quarantineData || quarantineData.length === 0) throw new Error('Nenhuma empresa encontrada');

      // 2. Validar dados obrigatórios e separar empresas válidas
      // ⚠️ EMPRESAS INTERNACIONAIS: CNPJ não é obrigatório (só para Brasil)
      // Razão Social é obrigatória para todas as empresas
      const validCompanies = quarantineData.filter(q => 
        q.razao_social && 
        q.razao_social.trim() !== ''
      );

      const invalidCompanies = quarantineData.filter(q => 
        !q.razao_social || 
        q.razao_social.trim() === ''
      );

      if (validCompanies.length === 0) {
        throw new Error('Nenhuma empresa possui dados válidos (Razão Social é obrigatória)');
      }

      // 2a. Buscar tenant_id do usuário autenticado (OBRIGATÓRIO para RLS)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData?.tenant_id) throw new Error('Usuário sem tenant associado');

      // 3. Inserir no leads_pool apenas empresas válidas
      // ⚠️ CNPJ pode ser NULL para empresas internacionais
      // ✅ tenant_id é OBRIGATÓRIO para RLS multi-tenant
      // ✅ PRESERVAR TODOS OS DADOS: website, linkedin, apollo, etc.
      const leadsToInsert = validCompanies.map(q => {
        // ✅ Preservar TODOS os dados do raw_analysis, incluindo website, linkedin, apollo
        const rawData = q.raw_analysis || {};
        
        // ✅ Garantir que dados críticos estejam preservados
        const preservedRawData = {
          ...rawData,
          // Preservar links externos se existirem
          domain: rawData.domain || rawData.website || q.website || null,
          website: rawData.website || rawData.domain || q.website || null,
          linkedin_url: rawData.linkedin_url || rawData.linkedIn_url || rawData.linkedin || null,
          apollo_id: rawData.apollo_id || rawData.apolloId || null,
          apollo_link: rawData.apollo_link || rawData.apolloLink || null,
          apollo_organization: rawData.apollo_organization || rawData.apolloOrganization || null,
          // Preservar dados de localização
          country: rawData.country || q.country || null,
          city: rawData.city || q.city || null,
          state: rawData.state || q.state || null,
          // Preservar outros dados importantes
          decision_makers: rawData.decision_makers || rawData.decisores || [],
          apollo_decisores_count: rawData.apollo_decisores_count || rawData.apolloDecisoresCount || 0,
        };
        
        return {
          tenant_id: userData.tenant_id, // ✅ OBRIGATÓRIO para RLS
          company_id: q.company_id || null,
          cnpj: q.cnpj || null, // ✅ Permite NULL para empresas internacionais
          razao_social: q.razao_social!,
          icp_score: q.icp_score || 0,
          temperatura: q.temperatura || 'cold',
          status: 'pool',
          source: 'icp_batch_analysis',
          origem: 'icp_massa',
          raw_data: preservedRawData, // ✅ DADOS COMPLETOS PRESERVADOS
        };
      });

      // 🔍 LOG DETALHADO para debug
      console.log('[APPROVE-BATCH] 📋 Inserindo leads no pool:', {
        count: leadsToInsert.length,
        sample: leadsToInsert.slice(0, 2).map(l => ({
          razao_social: l.razao_social,
          cnpj: l.cnpj ? 'SIM' : 'NULL (internacional)',
          status: l.status,
          origem: l.origem,
          icp_score: l.icp_score,
          temperatura: l.temperatura,
        })),
      });

      const { data: insertedData, error: insertError } = await supabase
        .from('leads_pool')
        .insert(leadsToInsert)
        .select('id, razao_social, cnpj, status');

      if (insertError) {
        console.error('[APPROVE-BATCH] ❌ Erro ao inserir no leads_pool:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          samplePayload: leadsToInsert[0],
          fullError: JSON.stringify(insertError, null, 2),
        });
        
        // ✅ EXPANDIR MENSAGEM DE ERRO PARA AJUDAR NO DEBUG
        const errorMessage = `
Erro ao inserir no leads_pool:
- Código: ${insertError.code}
- Mensagem: ${insertError.message}
- Detalhes: ${insertError.details || 'N/A'}
- Hint: ${insertError.hint || 'N/A'}

⚠️ POSSÍVEL CAUSA: Migration não aplicada ou constraint violada.
✅ SOLUÇÃO: Aplique a migration 20260117000000_fix_leads_pool_approval.sql no Supabase.
        `.trim();
        
        throw new Error(errorMessage);
      }

      console.log('[APPROVE-BATCH] ✅ Leads inseridos com sucesso:', {
        count: insertedData?.length || 0,
        insertedIds: insertedData?.map(d => d.id) || [],
      });

      // 4. Atualizar status na quarentena para empresas válidas (EM MASSA)
      // ✅ CORRIGIDO: Atualização em massa funciona melhor que loop individual
      const validIds = validCompanies.map(q => q.id);
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', validIds);

      if (updateError) {
        console.error('[APPROVE-BATCH] ❌ Erro ao atualizar status para aprovada:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          validIds: validIds,
        });
        throw updateError;
      }

      console.log('[APPROVE-BATCH] ✅ Status atualizado para aprovada:', {
        count: validIds.length,
        ids: validIds,
      });

      // 5. Marcar empresas inválidas como "dados_incompletos"
      if (invalidCompanies.length > 0) {
        const invalidIds = invalidCompanies.map(q => q.id);
        await supabase
          .from('icp_analysis_results')
          .update({ 
            status: 'pendente',
            motivo_descarte: 'Dados incompletos (Razão Social ausente)'
          })
          .in('id', invalidIds);
      }

      // 6. Para hot leads (score >= 75), criar deals automaticamente
      const hotLeads = validCompanies.filter(q => (q.icp_score || 0) >= 75);
      
      if (hotLeads.length > 0) {
        const dealsToCreate = hotLeads.map(lead => ({
          company_id: lead.company_id || null,
          deal_title: `Oportunidade - ${lead.razao_social}`,
          deal_stage: 'discovery',
          priority: 'high',
          deal_value: (lead.icp_score || 0) >= 85 ? 100000 : 50000,
          probability: Math.round((lead.icp_score || 0) * 0.8),
          source: 'icp_hot_lead_auto',
          lead_score: lead.icp_score || 0,
        }));

        const { error: dealsError } = await supabase
          .from('sdr_deals')
          .insert(dealsToCreate);

        if (dealsError) console.error('Erro ao criar deals:', dealsError);
      }

      return {
        approved: validCompanies.length,
        hotLeads: hotLeads.length,
        invalid: invalidCompanies.length,
        invalidNames: invalidCompanies.map(c => c.razao_social || 'Sem nome').slice(0, 5)
      };
    },
    onSuccess: (data) => {
      const mainMessage = data.hotLeads > 0 
        ? `${data.approved} aprovadas | ${data.hotLeads} hot leads com deals criados`
        : `${data.approved} empresas movidas para o pool de leads`;
      
      const warningMessage = data.invalid > 0
        ? ` | ⚠️ ${data.invalid} empresas com dados incompletos (não aprovadas)`
        : '';

      toast.success('Empresas aprovadas com sucesso!', {
        description: mainMessage + warningMessage,
        duration: 5000,
      });

      if (data.invalid > 0 && data.invalidNames.length > 0) {
        toast.warning('Empresas não aprovadas:', {
          description: `${data.invalidNames.join(', ')}${data.invalid > 5 ? ' e outras...' : ''} - Dados incompletos`,
          duration: 7000,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['sdr-deals'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao aprovar empresas', {
        description: error.message,
      });
    },
  });
}

// Hook para descartar empresa
export function useRejectQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ analysisId, motivo }: { analysisId: string; motivo: string }) => {
      // Atualiza o registro da análise por ID
      const { error } = await supabase
        .from('icp_analysis_results')
        .update({ 
          status: 'descartada',
          motivo_descarte: motivo,
        })
        .eq('id', analysisId);

      if (error) throw error;

      // Buscar company_id (se existir) para marcar empresa como desqualificada
      const { data: record } = await supabase
        .from('icp_analysis_results')
        .select('company_id')
        .eq('id', analysisId)
        .single();

      if (record?.company_id) {
        await supabase
          .from('companies')
          .update({
            is_disqualified: true,
            disqualification_reason: motivo,
          })
          .eq('id', record.company_id);
      }
    },
    onSuccess: () => {
      toast.success('Empresa descartada');
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error('Erro ao descartar', {
        description: error.message,
      });
    },
  });
}

// Hook para aprovação automática baseada em regras
export function useAutoApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: {
      minScore?: number;
      temperatura?: 'hot' | 'warm' | 'cold';
      autoCreateDeals?: boolean;
    }) => {
      let query = supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'pendente');

      if (rules.minScore) {
        query = query.gte('icp_score', rules.minScore);
      }
      if (rules.temperatura) {
        query = query.eq('temperatura', rules.temperatura);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        return { approved: 0, deals: 0 };
      }

      const analysisIds = data.map(d => d.id);

      // Aprovar usando o batch (usando origem válida do constraint)
      // ⚠️ CNPJ pode ser NULL para empresas internacionais
      const leadsToInsert = data.map(q => ({
        company_id: q.company_id,
        cnpj: q.cnpj || null, // ✅ Permite NULL para empresas internacionais
        razao_social: q.razao_social,
        icp_score: q.icp_score,
        temperatura: q.temperatura,
        status: 'pool',
        source: 'icp_auto_approval',
        origem: 'icp_massa', // Valor válido do constraint
        raw_data: q.raw_analysis,
      }));

      await supabase.from('leads_pool').insert(leadsToInsert);
      await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', analysisIds);

      let dealsCreated = 0;
      if (rules.autoCreateDeals) {
        const dealsToCreate = data.map(lead => ({
          company_id: lead.company_id,
          deal_title: `Auto - ${lead.razao_social}`,
          deal_stage: 'discovery',
          priority: lead.icp_score >= 75 ? 'high' : 'medium',
          deal_value: lead.icp_score >= 85 ? 100000 : 50000,
          probability: Math.round(lead.icp_score * 0.8),
          source: 'icp_auto_approval',
          lead_score: lead.icp_score,
        }));

        const { data: dealsData } = await supabase
          .from('sdr_deals')
          .insert(dealsToCreate)
          .select('id');

        dealsCreated = dealsData?.length || 0;
      }

      return { approved: data.length, deals: dealsCreated };
    },
    onSuccess: (data) => {
      toast.success('Aprovação automática concluída', {
        description: data.deals > 0
          ? `${data.approved} aprovadas | ${data.deals} deals criados`
          : `${data.approved} empresas aprovadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['sdr-deals'] });
    },
  });
}
