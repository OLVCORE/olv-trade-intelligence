// ✅ Serviço para consultar Receita Federal SEM Edge Function
// Funciona diretamente no frontend

interface ReceitaWSResponse {
  status: string;
  uf: string;
  municipio: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  cep: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  atividades_secundarias?: Array<{
    code: string;
    text: string;
  }>;
  natureza_juridica: string;
  porte: string;
  nome?: string;
  fantasia?: string;
  situacao?: string;
  qsa?: Array<{
    nome: string;
    qual: string;
  }>;
}

export async function consultarReceitaFederal(cnpj: string): Promise<{
  success: boolean;
  data?: ReceitaWSResponse;
  source?: 'receitaws' | 'brasilapi';
  error?: string;
}> {
  const cnpjClean = cnpj.replace(/\D/g, '');
  
  if (cnpjClean.length !== 14) {
    return {
      success: false,
      error: 'CNPJ inválido (deve ter 14 dígitos)'
    };
  }

  // Tentar ReceitaWS primeiro
  try {
    console.log('[ReceitaFederal] 🔍 Consultando ReceitaWS:', cnpjClean);
    
    const receitaUrl = `https://receitaws.com.br/v1/cnpj/${cnpjClean}`;
    const response = await fetch(receitaUrl);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[ReceitaFederal] ✅ ReceitaWS sucesso');
      return {
        success: true,
        data: data as ReceitaWSResponse,
        source: 'receitaws'
      };
    }
    
    // Se ReceitaWS falhar, tentar BrasilAPI
    console.log('[ReceitaFederal] ⚠️ ReceitaWS falhou, tentando BrasilAPI...');
    
  } catch (error: any) {
    console.error('[ReceitaFederal] Erro ReceitaWS:', error);
  }

  // Fallback: BrasilAPI
  try {
    console.log('[ReceitaFederal] 🔍 Consultando BrasilAPI:', cnpjClean);
    
    const brasilApiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`;
    const response = await fetch(brasilApiUrl);
    
    if (response.ok) {
      const b = await response.json();
      console.log('[ReceitaFederal] ✅ BrasilAPI sucesso');
      
      // Mapear resposta do BrasilAPI para formato ReceitaWS
      const data: ReceitaWSResponse = {
        status: b.descricao_situacao_cadastral || 'OK',
        uf: b.uf || b.estado || '',
        municipio: b.municipio || b.cidade || '',
        bairro: b.bairro || '',
        logradouro: b.logradouro || '',
        numero: b.numero?.toString() || '',
        complemento: b.complemento || '',
        cep: (b.cep || '').toString(),
        atividade_principal: b.cnae_fiscal
          ? [{ code: String(b.cnae_fiscal), text: b.cnae_fiscal_descricao || '' }]
          : [],
        atividades_secundarias: Array.isArray(b.cnaes_secundarios)
          ? b.cnaes_secundarios.map((i: any) => ({ 
              code: String(i.codigo || i.code || ''), 
              text: i.descricao || i.text || '' 
            }))
          : [],
        natureza_juridica: b.natureza_juridica || '',
        porte: b.porte || b.porte_empresa || '',
        nome: b.razao_social || '',
        fantasia: b.nome_fantasia || '',
        situacao: b.descricao_situacao_cadastral || '',
        qsa: Array.isArray(b.qsa) 
          ? b.qsa.map((s: any) => ({ nome: s.nome, qual: s.qual }))
          : [],
      };
      
      return {
        success: true,
        data,
        source: 'brasilapi'
      };
    }
    
    console.error('[ReceitaFederal] ❌ BrasilAPI falhou:', response.status);
    return {
      success: false,
      error: `BrasilAPI retornou status ${response.status}`
    };
    
  } catch (error: any) {
    console.error('[ReceitaFederal] ❌ Erro BrasilAPI:', error);
    return {
      success: false,
      error: error.message || 'Erro ao consultar BrasilAPI'
    };
  }
}

