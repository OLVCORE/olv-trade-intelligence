// src/services/multi-tenant.service.ts

import { supabase } from '@/integrations/supabase/client';
import type { Tenant, Workspace } from '@/contexts/TenantContext';

export interface CreateTenantData {
  name: string;
  slug?: string; // Opcional, será gerado automaticamente se não fornecido
  cnpj?: string;
  email: string;
  website?: string;
  industry?: string;
  telefone?: string;
  subscription_tier?: 'starter' | 'pro' | 'enterprise';
}

export interface CreateWorkspaceData {
  tenant_id: string;
  name: string;
  type: 'domestic' | 'export' | 'import';
  description?: string;
  target_countries?: string[];
}

/**
 * Serviço de Multi-Tenancy
 * Gerencia criação, isolamento e operações de tenants
 * 🔒 BLINDADO: Sistema multi-tenant do OLV Trade Intelligence (não alterar sem autorização)
 */
export class MultiTenantService {
  /**
   * Criar novo tenant
   */
  async criarTenant(dados: CreateTenantData): Promise<Tenant> {
    try {
      console.log('[MultiTenantService] 🚀 Criando novo tenant:', dados.name);

      // 1. Gerar slug único se não fornecido
      const slug = dados.slug || this.gerarSlug(dados.name);

      // 2. Verificar se slug já existe
      const { data: existente } = await supabase
        .from('tenants')
        .select('id, slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existente) {
        throw new Error(`Já existe um tenant com o slug "${slug}". Escolha outro nome.`);
      }

      // 3. Criar tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: dados.name,
          slug: slug,
          cnpj: dados.cnpj?.replace(/\D/g, '') || null,
          website: dados.website || null,
          industry: dados.industry || null,
          subscription_tier: dados.subscription_tier || 'starter',
          subscription_status: 'active',
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) {
        console.error('[MultiTenantService] ❌ Erro ao criar tenant:', tenantError);
        throw new Error(`Erro ao criar tenant: ${tenantError.message}`);
      }

      console.log('[MultiTenantService] ✅ Tenant criado:', tenant.id);

      // 4. Criar workspaces padrão para o tenant
      await this.criarWorkspacesPadrao(tenant.id);

      // 5. Associar usuário atual ao tenant (se autenticado)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.associarUsuarioATenant(user.id, tenant.id, 'owner');
        console.log('[MultiTenantService] ✅ Usuário associado ao tenant');
      }

      return tenant as Tenant;
    } catch (error: any) {
      console.error('[MultiTenantService] ❌ Erro completo:', error);
      throw error;
    }
  }

  /**
   * Criar workspaces padrão para um tenant
   */
  async criarWorkspacesPadrao(tenantId: string): Promise<Workspace[]> {
    const workspacesPadrao: CreateWorkspaceData[] = [
      {
        tenant_id: tenantId,
        name: 'Prospecção Brasil',
        type: 'domestic',
        description: 'Prospecção de clientes no mercado doméstico brasileiro',
        target_countries: ['BR'],
      },
      {
        tenant_id: tenantId,
        name: 'Export - Global',
        type: 'export',
        description: 'Descoberta de dealers e distribuidores internacionais',
        target_countries: ['US', 'DE', 'JP', 'AU', 'ES', 'IT', 'CA', 'GB'],
      },
      {
        tenant_id: tenantId,
        name: 'Import - Sourcing',
        type: 'import',
        description: 'Sourcing de componentes e matérias-primas',
        target_countries: ['CN', 'TW', 'KR'],
      },
    ];

    const workspacesCriados: Workspace[] = [];

    for (const wsData of workspacesPadrao) {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert(wsData)
        .select()
        .single();

      if (error) {
        // Se já existir (unique constraint), continuar
        if (error.code === '23505') {
          console.log(`[MultiTenantService] ⚠️ Workspace ${wsData.type} já existe, pulando...`);
          continue;
        }
        console.error(`[MultiTenantService] ❌ Erro ao criar workspace ${wsData.type}:`, error);
      } else {
        workspacesCriados.push(workspace as Workspace);
      }
    }

    console.log(`[MultiTenantService] ✅ ${workspacesCriados.length} workspaces criados`);
    return workspacesCriados;
  }

  /**
   * Associar usuário a um tenant
   */
  async associarUsuarioATenant(
    userId: string,
    tenantId: string,
    role: 'owner' | 'admin' | 'user' = 'user',
    defaultWorkspaceId?: string
  ): Promise<void> {
    try {
      console.log(`[MultiTenantService] 🔗 Associando usuário ${userId} ao tenant ${tenantId}`);

      // Buscar workspaces do tenant para definir default se não fornecido
      let workspaceId = defaultWorkspaceId;
      if (!workspaceId) {
        const { data: workspaces } = await supabase
          .from('workspaces')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('type', { ascending: true })
          .limit(1);

        if (workspaces && workspaces.length > 0) {
          workspaceId = workspaces[0].id;
        }
      }

      // Buscar ou criar registro em users
      const { data: userExistente } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('id', userId)
        .maybeSingle();

      if (userExistente) {
        // Atualizar usuário existente
        const { error: updateError } = await supabase
          .from('users')
          .update({
            tenant_id: tenantId,
            default_workspace_id: workspaceId || null,
            role: role,
            is_active: true,
          })
          .eq('id', userId);

        if (updateError) {
          throw new Error(`Erro ao atualizar usuário: ${updateError.message}`);
        }
      } else {
        // Criar novo registro
        const { data: authUser } = await supabase.auth.getUser();
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            tenant_id: tenantId,
            default_workspace_id: workspaceId || null,
            full_name: authUser.user?.user_metadata?.full_name || null,
            email: authUser.user?.email || null,
            role: role,
            is_active: true,
          });

        if (insertError) {
          throw new Error(`Erro ao criar registro de usuário: ${insertError.message}`);
        }
      }

      console.log('[MultiTenantService] ✅ Usuário associado com sucesso');
    } catch (error: any) {
      console.error('[MultiTenantService] ❌ Erro ao associar usuário:', error);
      throw error;
    }
  }

  /**
   * Obter tenant por ID
   */
  async obterTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      console.warn(`[MultiTenantService] ⚠️ Tenant ${tenantId} não encontrado`);
      return null;
    }

    return data as Tenant;
  }

  /**
   * Obter tenant por slug
   */
  async obterTenantPorSlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Tenant;
  }

  /**
   * Obter tenant do usuário autenticado
   */
  async obterTenantDoUsuario(authUserId: string): Promise<Tenant | null> {
    try {
      // Buscar tenant_id do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', authUserId)
        .maybeSingle();

      if (userError || !userData?.tenant_id) {
        return null;
      }

      return this.obterTenant(userData.tenant_id);
    } catch (error: any) {
      console.error('[MultiTenantService] ❌ Erro ao obter tenant do usuário:', error);
      return null;
    }
  }

  /**
   * Listar todos os tenants (apenas para admin)
   */
  async listarTenants(): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar tenants: ${error.message}`);
    }

    return (data || []) as Tenant[];
  }

  /**
   * Atualizar tenant
   */
  async atualizarTenant(tenantId: string, dados: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        ...dados,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar tenant: ${error.message}`);
    }

    return data as Tenant;
  }

  /**
   * Verificar se slug está disponível
   */
  async verificarSlugDisponivel(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    return !data; // true se não existe (disponível)
  }

  // ===== MÉTODOS AUXILIARES =====

  /**
   * Gerar slug único a partir do nome
   */
  private gerarSlug(nome: string): string {
    const base = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim

    // Adicionar timestamp para garantir unicidade
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);

    return `${base}-${timestamp}${random}`;
  }
}

// Exportar instância singleton
export const multiTenantService = new MultiTenantService();
