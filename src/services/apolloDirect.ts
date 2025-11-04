// ✅ Serviço para consultar Apollo.io SEM Edge Function
// Funciona diretamente no frontend (com API key exposta - OK para agora)

const APOLLO_API_KEY = import.meta.env.VITE_APOLLO_API_KEY;

export async function searchApolloOrganizations(name: string, domain?: string): Promise<{
  success: boolean;
  organizations?: any[];
  error?: string;
}> {
  if (!APOLLO_API_KEY) {
    return {
      success: false,
      error: 'VITE_APOLLO_API_KEY não configurada no .env.local'
    };
  }

  try {
    console.log('[Apollo] 🔍 Buscando organizações:', name, domain);

    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify({
        q_organization_name: name,
        q_organization_domains: domain ? [domain] : undefined,
        page: 1,
        per_page: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] ❌ Erro:', response.status, errorText);
      return {
        success: false,
        error: `Apollo retornou status ${response.status}`
      };
    }

    const data = await response.json();
    console.log('[Apollo] ✅ Sucesso:', data.organizations?.length || 0, 'organizações');

    return {
      success: true,
      organizations: data.organizations || []
    };

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao consultar Apollo'
    };
  }
}

export async function searchApolloPeople(organizationId: string, limit: number = 10): Promise<{
  success: boolean;
  people?: any[];
  error?: string;
}> {
  if (!APOLLO_API_KEY) {
    return {
      success: false,
      error: 'VITE_APOLLO_API_KEY não configurada'
    };
  }

  try {
    console.log('[Apollo] 🔍 Buscando decisores:', organizationId);

    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify({
        organization_ids: [organizationId],
        person_titles: [
          'CEO', 'CFO', 'CIO', 'CTO', 'COO',
          'Diretor', 'Diretora', 'Director',
          'VP', 'Vice President',
          'Gerente', 'Manager'
        ],
        page: 1,
        per_page: limit,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Apollo] ❌ Erro pessoas:', response.status, errorText);
      return {
        success: false,
        error: `Apollo retornou status ${response.status}`
      };
    }

    const data = await response.json();
    console.log('[Apollo] ✅ Decisores encontrados:', data.people?.length || 0);

    return {
      success: true,
      people: data.people || []
    };

  } catch (error: any) {
    console.error('[Apollo] ❌ Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar decisores'
    };
  }
}

