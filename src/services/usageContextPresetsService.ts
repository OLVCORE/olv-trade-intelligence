/**
 * USAGE CONTEXT PRESETS SERVICE
 * 
 * Serviço para gerenciar presets de uso final no banco de dados
 */

import { supabase } from '@/integrations/supabase/client';

export interface HSCodeWithDescription {
  code: string;
  description: string;
}

export interface UsageContextPresetDB {
  id: string;
  tenant_id: string;
  workspace_id: string | null;
  name: string;
  sector: string | null;
  description: string | null;
  usage_context_include: string[];
  usage_context_exclude: string[];
  hs_codes: HSCodeWithDescription[];
  keywords: string[];
  is_system_preset: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CreatePresetData {
  name: string;
  sector?: string;
  description?: string;
  usage_context_include: string[];
  usage_context_exclude?: string[];
  hs_codes?: HSCodeWithDescription[];
  keywords?: string[];
  workspace_id?: string;
}

export interface UpdatePresetData extends Partial<CreatePresetData> {
  is_active?: boolean;
}

/**
 * Buscar todos os presets do tenant atual
 * ✅ Usa view v_usage_context_presets_active para melhor performance
 */
export async function getPresets(tenantId: string, workspaceId?: string): Promise<UsageContextPresetDB[]> {
  try {
    // ✅ Usar view otimizada quando não houver filtro de workspace
    // A view já filtra is_active = TRUE automaticamente
    let query = workspaceId
      ? supabase
          .from('usage_context_presets')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
      : supabase
          .from('v_usage_context_presets_active')
          .select('*')
          .eq('tenant_id', tenantId);

    query = query
      .order('is_system_preset', { ascending: false }) // Presets do sistema primeiro
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(preset => ({
      ...preset,
      usage_context_include: Array.isArray(preset.usage_context_include) 
        ? preset.usage_context_include 
        : [],
      usage_context_exclude: Array.isArray(preset.usage_context_exclude) 
        ? preset.usage_context_exclude 
        : [],
      hs_codes: Array.isArray(preset.hs_codes) 
        ? preset.hs_codes 
        : [],
      keywords: Array.isArray(preset.keywords) 
        ? preset.keywords 
        : [],
    }));
  } catch (error: any) {
    console.error('[PRESETS-SERVICE] ❌ Erro ao buscar presets:', error);
    throw error;
  }
}

/**
 * Buscar preset por ID
 */
export async function getPresetById(id: string): Promise<UsageContextPresetDB | null> {
  try {
    const { data, error } = await supabase
      .from('usage_context_presets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      usage_context_include: Array.isArray(data.usage_context_include) 
        ? data.usage_context_include 
        : [],
      usage_context_exclude: Array.isArray(data.usage_context_exclude) 
        ? data.usage_context_exclude 
        : [],
      hs_codes: Array.isArray(data.hs_codes) 
        ? data.hs_codes 
        : [],
      keywords: Array.isArray(data.keywords) 
        ? data.keywords 
        : [],
    };
  } catch (error: any) {
    console.error('[PRESETS-SERVICE] ❌ Erro ao buscar preset:', error);
    throw error;
  }
}

/**
 * Criar novo preset
 */
export async function createPreset(
  tenantId: string,
  data: CreatePresetData
): Promise<UsageContextPresetDB> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    const { data: preset, error } = await supabase
      .from('usage_context_presets')
      .insert({
        tenant_id: tenantId,
        workspace_id: data.workspace_id || null,
        name: data.name,
        sector: data.sector || null,
        description: data.description || null,
        usage_context_include: data.usage_context_include || [],
        usage_context_exclude: data.usage_context_exclude || [],
        hs_codes: data.hs_codes || [],
        keywords: data.keywords || [],
        is_system_preset: false,
        is_active: true,
        created_by: user?.user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...preset,
      usage_context_include: Array.isArray(preset.usage_context_include) 
        ? preset.usage_context_include 
        : [],
      usage_context_exclude: Array.isArray(preset.usage_context_exclude) 
        ? preset.usage_context_exclude 
        : [],
      hs_codes: Array.isArray(preset.hs_codes) 
        ? preset.hs_codes 
        : [],
      keywords: Array.isArray(preset.keywords) 
        ? preset.keywords 
        : [],
    };
  } catch (error: any) {
    console.error('[PRESETS-SERVICE] ❌ Erro ao criar preset:', error);
    throw error;
  }
}

/**
 * Atualizar preset
 */
export async function updatePreset(
  id: string,
  data: UpdatePresetData
): Promise<UsageContextPresetDB> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      throw new Error('Usuário não autenticado');
    }

    // ✅ Verificar se o preset existe e pertence ao tenant do usuário
    const existingPreset = await getPresetById(id);
    if (!existingPreset) {
      throw new Error('Preset não encontrado');
    }

    // ✅ Buscar tenant do usuário para garantir que pertence ao mesmo tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.user.id)
      .single();

    if (!userData || userData.tenant_id !== existingPreset.tenant_id) {
      throw new Error('Você não tem permissão para atualizar este preset');
    }

    // ✅ Se é preset do sistema, criar uma cópia personalizada em vez de atualizar o original
    if (existingPreset.is_system_preset) {
      console.log('[PRESETS-SERVICE] 📋 Preset do sistema detectado - criando cópia personalizada');
      
      // ✅ Verificar se já existe uma cópia personalizada com o mesmo nome
      let presetName = data.name || existingPreset.name;
      
      // Se o nome não mudou, adicionar sufixo para evitar conflito
      if (!data.name || data.name === existingPreset.name) {
        // Verificar se já existe cópia
        const { data: existingCopy } = await supabase
          .from('usage_context_presets')
          .select('id, name')
          .eq('tenant_id', userData.tenant_id)
          .eq('name', presetName)
          .neq('id', id) // Excluir o preset original do sistema
          .maybeSingle();
        
        // Se já existe, adicionar sufixo numérico ou timestamp
        if (existingCopy) {
          const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          presetName = `${existingPreset.name} (Editado ${timestamp})`;
          
          // Verificar novamente se ainda há conflito
          const { data: checkCopy } = await supabase
            .from('usage_context_presets')
            .select('id')
            .eq('tenant_id', userData.tenant_id)
            .eq('name', presetName)
            .maybeSingle();
          
          if (checkCopy) {
            // Se ainda houver conflito, usar timestamp mais específico
            const now = new Date();
            const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
            presetName = `${existingPreset.name} (Editado ${timeStr})`;
          }
        }
      }
      
      // Criar novo preset baseado no sistema, mas marcado como não-sistema
      const newPresetData: CreatePresetData = {
        name: presetName,
        sector: data.sector !== undefined ? data.sector : existingPreset.sector || undefined,
        description: data.description !== undefined ? data.description : existingPreset.description || undefined,
        usage_context_include: data.usage_context_include || existingPreset.usage_context_include,
        usage_context_exclude: data.usage_context_exclude !== undefined ? data.usage_context_exclude : existingPreset.usage_context_exclude,
        hs_codes: data.hs_codes !== undefined ? data.hs_codes : existingPreset.hs_codes,
        keywords: data.keywords !== undefined ? data.keywords : existingPreset.keywords,
        workspace_id: data.workspace_id !== undefined ? data.workspace_id : existingPreset.workspace_id || undefined,
      };

      // Criar novo preset (cópia personalizada) com upsert para evitar conflitos
      try {
        const newPreset = await createPreset(userData.tenant_id, newPresetData);
        return newPreset;
      } catch (createError: any) {
        // Se ainda houver conflito de nome, tentar com nome único garantido
        if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
          const uniqueName = `${presetName} (${Date.now()})`;
          const uniquePresetData = { ...newPresetData, name: uniqueName };
          const newPreset = await createPreset(userData.tenant_id, uniquePresetData);
          return newPreset;
        }
        throw createError;
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sector !== undefined) updateData.sector = data.sector;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.usage_context_include !== undefined) updateData.usage_context_include = data.usage_context_include;
    if (data.usage_context_exclude !== undefined) updateData.usage_context_exclude = data.usage_context_exclude;
    if (data.hs_codes !== undefined) updateData.hs_codes = data.hs_codes;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.workspace_id !== undefined) updateData.workspace_id = data.workspace_id;

    // Não incluir updated_by - será preenchido pelo trigger
    // updateData.updated_by = user.user.id; // Removido - trigger preenche automaticamente

    // ✅ Tentar atualizar sem .single() primeiro para verificar se há resultados
    const { data: presets, error: updateError } = await supabase
      .from('usage_context_presets')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', existingPreset.tenant_id) // ✅ Garantir que pertence ao mesmo tenant
      .select();

    if (updateError) {
      console.error('[PRESETS-SERVICE] ❌ Erro do Supabase ao atualizar:', updateError);
      if (updateError.code === 'PGRST116') {
        throw new Error('Preset não encontrado ou você não tem permissão para atualizá-lo (verifique se não é preset do sistema)');
      }
      throw updateError;
    }

    if (!presets || presets.length === 0) {
      throw new Error('Preset não encontrado após atualização. Verifique se você tem permissão para atualizar este preset.');
    }

    const preset = presets[0];

    return {
      ...preset,
      usage_context_include: Array.isArray(preset.usage_context_include) 
        ? preset.usage_context_include 
        : [],
      usage_context_exclude: Array.isArray(preset.usage_context_exclude) 
        ? preset.usage_context_exclude 
        : [],
      hs_codes: Array.isArray(preset.hs_codes) 
        ? preset.hs_codes 
        : [],
      keywords: Array.isArray(preset.keywords) 
        ? preset.keywords 
        : [],
    };
  } catch (error: any) {
    console.error('[PRESETS-SERVICE] ❌ Erro ao atualizar preset:', error);
    throw error;
  }
}

/**
 * Deletar preset (soft delete: is_active = false)
 */
export async function deletePreset(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('usage_context_presets')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('[PRESETS-SERVICE] ❌ Erro ao deletar preset:', error);
    throw error;
  }
}

/**
 * Deletar preset permanentemente (apenas para presets do usuário, não do sistema)
 */
export async function deletePresetPermanently(id: string): Promise<void> {
  try {
    // Verificar se é preset do sistema antes de deletar
    const preset = await getPresetById(id);
    if (preset?.is_system_preset) {
      throw new Error('Não é possível deletar presets do sistema permanentemente.');
    }

    const { error } = await supabase
      .from('usage_context_presets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('[PRESETS-SERVICE] ❌ Erro ao deletar preset permanentemente:', error);
    throw error;
  }
}
