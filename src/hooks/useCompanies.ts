import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Company, Inserts } from '@/lib/db';
import { useTenant } from '@/contexts/TenantContext';

export const COMPANIES_QUERY_KEY = ['companies'];

// Hook otimizado com paginação e filtros
export function useCompanies(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { currentWorkspace } = useTenant();
  const { page = 0, pageSize = 50, search = '', sortBy = 'created_at', sortOrder = 'desc' } = options || {};
  
  return useQuery({
    queryKey: [...COMPANIES_QUERY_KEY, currentWorkspace?.id, page, pageSize, search, sortBy, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' });

      // 🔐 FILTRO MULTI-TENANT: Apenas empresas do workspace atual
      if (currentWorkspace?.id) {
        query = query.eq('workspace_id', currentWorkspace.id);
      }

      // Filtro de busca
      if (search) {
        query = query.or(`company_name.ilike.%${search}%,cnpj.ilike.%${search}%`); // FIX: company_name não name
      }

      // Ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Paginação
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) {
        console.error('[useCompanies] ❌ Query error:', error);
        console.error('[useCompanies] 📝 Query details:', { search, sortBy, sortOrder, page, pageSize });
        // Retornar vazio em vez de quebrar
        return { 
          data: [] as Company[], 
          count: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }
      return { 
        data: data as Company[], 
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 5 * 1000, // ✅ 5 segundos (atualiza mais rápido)
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // ✅ Revalida ao focar janela
  });
}

// Hook para buscar todas as empresas (usar com cuidado)
export function useAllCompanies() {
  const { currentWorkspace } = useTenant();
  
  return useQuery({
    queryKey: ['companies', 'all', currentWorkspace?.id],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      // 🔐 FILTRO MULTI-TENANT: Apenas empresas do workspace atual
      if (currentWorkspace?.id) {
        query = query.eq('workspace_id', currentWorkspace.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Company[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (company: Inserts<'companies'>) => {
      const { data, error } = await supabase
        .from('companies')
        .insert([company])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // ✅ DELETE DIRETO (sem Edge Function - como Quarentena)
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
