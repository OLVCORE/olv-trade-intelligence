import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import type { DealerSearchParams } from '@/components/export/DealerDiscoveryForm';

export interface SavedDealerSearch {
  id: string;
  tenant_id: string;
  workspace_id: string | null;
  name: string;
  search_params: DealerSearchParams;
  results_count: number;
  search_results?: any[]; // ✅ NOVO: Array de dealers encontrados (resultados da busca)
  last_run_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SaveSearchData {
  name: string;
  search_params: DealerSearchParams;
  results_count: number;
  search_results?: any[]; // ✅ NOVO: Array de dealers encontrados (resultados da busca)
}

/**
 * ✅ Salvar busca de dealers
 */
export async function saveDealerSearch(
  tenantId: string,
  workspaceId: string | null,
  data: SaveSearchData
): Promise<SavedDealerSearch> {
  try {
    // ✅ Obter usuário atual para created_by
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    // ✅ VALIDAÇÃO: Verificar se nome já existe ANTES de salvar
    const nameExists = await checkNameExists(tenantId, data.name);
    if (nameExists) {
      throw new Error(`Já existe uma busca salva com o nome "${data.name}". Por favor, escolha outro nome ou edite a busca existente.`);
    }

    // ✅ Preparar dados para inserção
    const insertData: any = {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      name: data.name.trim(),
      search_params: data.search_params as any,
      results_count: data.results_count,
      search_results: data.search_results || [], // ✅ CRÍTICO: Salvar os dealers encontrados (resultados da busca)
      last_run_at: new Date().toISOString(),
      created_by: user.id,
    };

    console.log('[SAVED-SEARCHES] 💾 Salvando busca:', {
      tenant_id: tenantId,
      workspace_id: workspaceId,
      name: data.name,
      results_count: data.results_count,
      search_results_count: Array.isArray(data.search_results) ? data.search_results.length : 0,
    });

    const { data: saved, error } = await (supabase as any)
      .from('saved_dealer_searches')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[SAVED-SEARCHES] ❌ Erro do Supabase:', error);
      
      // ✅ Erro específico: tabela não existe (404 ou 42P01)
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('not found')) {
        const errorMsg = 'A tabela de buscas salvas não existe no banco de dados. Por favor, aplique a migração `20260118000004_create_saved_dealer_searches.sql` no Supabase SQL Editor. Veja o arquivo `APLICAR_MIGRACAO_SAVED_SEARCHES.md` para instruções.';
        console.error('[SAVED-SEARCHES] 🔴 TABELA NÃO EXISTE!', errorMsg);
        throw new Error(errorMsg);
      }
      
      // ✅ Erro específico: permissão negada
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        throw new Error('Você não tem permissão para salvar buscas. Verifique as políticas RLS.');
      }
      
      // ✅ Erro específico: constraint violation (nome duplicado)
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        throw new Error(`Já existe uma busca salva com o nome "${data.name}". Por favor, escolha outro nome ou edite a busca existente.`);
      }
      
      // ✅ Erro genérico
      throw new Error(error.message || 'Erro desconhecido ao salvar busca');
    }

    const savedSearch = {
      ...saved,
      search_results: saved.search_results || [], // ✅ Garantir que sempre é array
    } as SavedDealerSearch;

    console.log('[SAVED-SEARCHES] ✅ Busca salva com sucesso:', {
      id: savedSearch.id,
      name: savedSearch.name,
      results_count: savedSearch.results_count,
      search_results_count: Array.isArray(savedSearch.search_results) ? savedSearch.search_results.length : 0,
    });

    return savedSearch;
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao salvar busca:', error);
    
    // ✅ Retornar mensagem amigável
    const errorMessage = error.message || 'Erro desconhecido ao salvar busca';
    throw new Error(errorMessage);
  }
}

/**
 * ✅ Verificar se nome já existe
 */
export async function checkNameExists(
  tenantId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('saved_dealer_searches')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', name.trim())
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).length > 0;
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao verificar nome:', error);
    return false; // Em caso de erro, permitir (não bloquear)
  }
}

/**
 * ✅ Buscar buscas salvas do tenant
 */
export async function getSavedDealerSearches(
  tenantId: string,
  workspaceId?: string | null
): Promise<SavedDealerSearch[]> {
  try {
    let query = (supabase as any)
      .from('saved_dealer_searches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_run_at', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false });

    if (workspaceId) {
      query = query.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      search_params: item.search_params as DealerSearchParams,
      search_results: item.search_results || [], // ✅ Garantir que sempre é array
    }));
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao buscar buscas salvas:', error);
    throw error;
  }
}

/**
 * ✅ Carregar busca salva por ID
 */
export async function getSavedDealerSearchById(
  searchId: string
): Promise<SavedDealerSearch | null> {
  try {
    const { data, error } = await supabase
      .from('saved_dealer_searches')
      .select('*')
      .eq('id', searchId)
      .single();

    if (error) throw error;

    return {
      ...data,
      search_params: data.search_params as DealerSearchParams,
    } as SavedDealerSearch;
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao buscar busca salva:', error);
    throw error;
  }
}

/**
 * ✅ Atualizar busca salva
 */
export async function updateSavedDealerSearch(
  searchId: string,
  data: Partial<SaveSearchData>,
  tenantId?: string
): Promise<SavedDealerSearch> {
  try {
    // ✅ VALIDAÇÃO: Se está mudando o nome, verificar se já existe
    if (data.name && tenantId) {
      const nameExists = await checkNameExists(tenantId, data.name, searchId);
      if (nameExists) {
        throw new Error(`Já existe uma busca salva com o nome "${data.name}". Por favor, escolha outro nome.`);
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name.trim();
    if (data.search_params) updateData.search_params = data.search_params as any;
    if (data.results_count !== undefined) {
      updateData.results_count = data.results_count;
      updateData.last_run_at = new Date().toISOString();
    }
    if (data.search_results !== undefined) {
      updateData.search_results = data.search_results; // ✅ Permitir atualizar search_results também
    }

    const { data: updated, error } = await (supabase as any)
      .from('saved_dealer_searches')
      .update(updateData)
      .eq('id', searchId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...updated,
      search_params: updated.search_params as DealerSearchParams,
      search_results: updated.search_results || [], // ✅ Garantir que sempre é array
    } as SavedDealerSearch;
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao atualizar busca:', error);
    throw error;
  }
}

/**
 * ✅ Deletar busca salva
 */
export async function deleteSavedDealerSearch(
  searchId: string
): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('saved_dealer_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
    
    console.log('[SAVED-SEARCHES] ✅ Busca deletada com sucesso:', searchId);
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao deletar busca:', error);
    throw error;
  }
}
