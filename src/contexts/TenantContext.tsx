import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  subscription_tier: 'starter' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled';
  monthly_price_brl: number;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  tenant_id: string;
  name: string;
  type: 'domestic' | 'export' | 'import';
  description: string | null;
  target_countries: string[];
  is_active: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshTenantData: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // LOAD TENANT DATA (quando usuário loga)
  // ============================================================================
  
  const loadTenantData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[TENANT] 🔍 Carregando dados do tenant...');

      // 1️⃣ Buscar usuário autenticado
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('[TENANT] ❌ Erro ao buscar usuário:', authError);
        throw authError;
      }

      if (!authData.user) {
        console.warn('[TENANT] ⚠️ Nenhum usuário autenticado');
        setCurrentTenant(null);
        setCurrentWorkspace(null);
        setWorkspaces([]);
        setIsLoading(false);
        return;
      }

      console.log('[TENANT] ✅ Usuário autenticado:', authData.user.id);

      // 2️⃣ Buscar dados do usuário (tenant_id, default_workspace_id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id, default_workspace_id')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('[TENANT] ❌ Erro ao buscar dados do usuário:', userError);
        throw userError;
      }

      if (!userData?.tenant_id) {
        console.warn('[TENANT] ⚠️ Usuário sem tenant associado');
        toast.warning('Usuário sem tenant', {
          description: 'Entre em contato com o administrador para configurar seu acesso.',
        });
        setIsLoading(false);
        return;
      }

      console.log('[TENANT] 📦 Tenant ID:', userData.tenant_id);

      // 3️⃣ Buscar dados do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantError) {
        console.error('[TENANT] ❌ Erro ao buscar tenant:', tenantError);
        throw tenantError;
      }

      if (!tenantData) {
        console.error('[TENANT] ❌ Tenant não encontrado');
        throw new Error('Tenant não encontrado');
      }

      console.log('[TENANT] ✅ Tenant carregado:', tenantData.name);
      setCurrentTenant(tenantData as Tenant);

      // 4️⃣ Buscar workspaces do tenant
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .eq('is_active', true)
        .order('type', { ascending: true }); // domestic, export, import

      if (workspacesError) {
        console.error('[TENANT] ❌ Erro ao buscar workspaces:', workspacesError);
        throw workspacesError;
      }

      console.log('[TENANT] ✅ Workspaces carregados:', workspacesData?.length || 0);
      setWorkspaces((workspacesData || []) as Workspace[]);

      // 5️⃣ Definir workspace atual
      if (userData.default_workspace_id) {
        // Usuário tem workspace padrão configurado
        const defaultWs = workspacesData?.find((ws) => ws.id === userData.default_workspace_id);
        if (defaultWs) {
          console.log('[TENANT] ✅ Workspace padrão:', defaultWs.name);
          setCurrentWorkspace(defaultWs as Workspace);
        } else {
          // Workspace padrão não existe, usar primeiro disponível
          const firstWs = workspacesData?.[0];
          if (firstWs) {
            console.warn('[TENANT] ⚠️ Workspace padrão não encontrado, usando primeiro:', firstWs.name);
            setCurrentWorkspace(firstWs as Workspace);
            // Atualizar default no banco
            await supabase
              .from('users')
              .update({ default_workspace_id: firstWs.id })
              .eq('id', authData.user.id);
          }
        }
      } else {
        // Usuário não tem workspace padrão, usar primeiro disponível
        const firstWs = workspacesData?.[0];
        if (firstWs) {
          console.log('[TENANT] ✅ Definindo primeiro workspace como padrão:', firstWs.name);
          setCurrentWorkspace(firstWs as Workspace);
          // Salvar como default
          await supabase
            .from('users')
            .update({ default_workspace_id: firstWs.id })
            .eq('id', authData.user.id);
        }
      }

      console.log('[TENANT] 🎉 Dados do tenant carregados com sucesso!');
    } catch (err: any) {
      console.error('[TENANT] ❌ Erro ao carregar dados do tenant:', err);
      setError(err);
      toast.error('Erro ao carregar dados do tenant', {
        description: err.message || 'Erro desconhecido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // SWITCH WORKSPACE
  // ============================================================================

  const switchWorkspace = async (workspaceId: string) => {
    try {
      console.log('[TENANT] 🔄 Mudando para workspace:', workspaceId);

      // 1️⃣ Buscar workspace
      const newWorkspace = workspaces.find((ws) => ws.id === workspaceId);

      if (!newWorkspace) {
        throw new Error('Workspace não encontrado');
      }

      // 2️⃣ Atualizar estado local
      setCurrentWorkspace(newWorkspace);

      // 3️⃣ Salvar como workspace padrão do usuário
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        await supabase
          .from('users')
          .update({ default_workspace_id: workspaceId })
          .eq('id', authData.user.id);

        console.log('[TENANT] ✅ Workspace atualizado:', newWorkspace.name);
        
        toast.success('Workspace alterado', {
          description: `Agora você está em: ${newWorkspace.name}`,
        });
      }

      // 4️⃣ Recarregar página para aplicar RLS filters
      // TODO: Melhorar isso futuramente para não precisar reload
      window.location.reload();
    } catch (err: any) {
      console.error('[TENANT] ❌ Erro ao trocar workspace:', err);
      toast.error('Erro ao trocar workspace', {
        description: err.message || 'Erro desconhecido',
      });
    }
  };

  // ============================================================================
  // REFRESH TENANT DATA
  // ============================================================================

  const refreshTenantData = async () => {
    console.log('[TENANT] 🔄 Recarregando dados do tenant...');
    await loadTenantData();
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Carregar dados do tenant quando componente monta
  useEffect(() => {
    loadTenantData();
  }, []);

  // Listener para mudanças de autenticação
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[TENANT] 🔐 Auth state changed:', event);

      if (event === 'SIGNED_IN') {
        loadTenantData();
      } else if (event === 'SIGNED_OUT') {
        setCurrentTenant(null);
        setCurrentWorkspace(null);
        setWorkspaces([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  const value: TenantContextType = {
    currentTenant,
    currentWorkspace,
    workspaces,
    switchWorkspace,
    refreshTenantData,
    isLoading,
    error,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTenant() {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
}

// ============================================================================
// HELPER: Workspace Icon
// ============================================================================

export function getWorkspaceIcon(type: Workspace['type']): string {
  switch (type) {
    case 'domestic':
      return '🏠';
    case 'export':
      return '🌍';
    case 'import':
      return '📦';
    default:
      return '💼';
  }
}

// ============================================================================
// HELPER: Workspace Color
// ============================================================================

export function getWorkspaceColor(type: Workspace['type']): string {
  switch (type) {
    case 'domestic':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'export':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'import':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

