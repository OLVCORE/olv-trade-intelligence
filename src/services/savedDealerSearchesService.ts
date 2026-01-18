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
    const { data: saved, error } = await supabase
      .from('saved_dealer_searches')
      .insert({
        tenant_id: tenantId,
        workspace_id: workspaceId,
        name: data.name,
        search_params: data.search_params as any,
        results_count: data.results_count,
        last_run_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return saved as SavedDealerSearch;
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao salvar busca:', error);
    throw error;
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
    let query = supabase
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

    return (data || []).map(item => ({
      ...item,
      search_params: item.search_params as DealerSearchParams,
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
  data: Partial<SaveSearchData>
): Promise<SavedDealerSearch> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name;
    if (data.search_params) updateData.search_params = data.search_params as any;
    if (data.results_count !== undefined) {
      updateData.results_count = data.results_count;
      updateData.last_run_at = new Date().toISOString();
    }

    const { data: updated, error } = await supabase
      .from('saved_dealer_searches')
      .update(updateData)
      .eq('id', searchId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...updated,
      search_params: updated.search_params as DealerSearchParams,
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
    const { error } = await supabase
      .from('saved_dealer_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
  } catch (error: any) {
    console.error('[SAVED-SEARCHES] ❌ Erro ao deletar busca:', error);
    throw error;
  }
}
