import { supabase } from "@/integrations/supabase/client";

interface DiscoveryParams {
  tenantId: string;
  hsCodes?: string[];
  keywords?: string[];
  countries?: string[];
  limit?: number;
}

export interface GlobalCompany {
  id: string;
  company_name: string;
  domain?: string | null;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  company_type?: string | null;
  fit_score?: number | null;
  status?: string;
  enrichment_stage?: string;
}

export async function runGlobalDiscovery(params: DiscoveryParams) {
  const { data, error } = await supabase.functions.invoke("discover-companies-global", {
    body: {
      tenant_id: params.tenantId,
      hs_codes: params.hsCodes,
      keywords: params.keywords,
      countries: params.countries,
      limit: params.limit,
    },
  });

  if (error) {
    console.error("[GLOBAL-DISCOVERY] Function error", error);
    throw error;
  }

  return data?.inserted as GlobalCompany[] | undefined;
}


