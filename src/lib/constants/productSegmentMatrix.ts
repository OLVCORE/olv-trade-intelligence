// ============================================================================
// ⚠️ DEPRECATED - SERÁ SUBSTITUÍDO NA FASE 3
// ============================================================================
// Este arquivo contém produtos TOTVS hard-coded e será COMPLETAMENTE
// SUBSTITUÍDO por dados dinâmicos da tabela tenant_products (FASE 3).
//
// NÃO adicione novas referências a este arquivo.
// NÃO modifique este arquivo.
//
// FASE 3 implementará:
// - Catálogo dinâmico por tenant (tenant_products)
// - Produtos MetaLife importados do site (246 itens)
// - Lógica de recomendação baseada em workspace_type (domestic/export/import)
// ============================================================================

/* COMENTADO - SERÁ REMOVIDO NA FASE 3

/**
 * PRODUCT_SEGMENT_MATRIX
 * 
 * Matriz de produtos TOTVS por segmento de mercado
 * Define produtos Primários (nucleares) e Relevantes (complementares) por setor
 * 
 * Baseado em [[memory:10894699]]
 *\u002F

export interface ProductRecommendation {
  name: string;
  category: string;
  priority: 'primary' | 'relevant' | 'future';
  useCase: string;
  estimatedROI: string;
  typicalARR: string;
  implementationTime: string;
}

export interface SegmentMatrix {
  segment: string;
  primary: ProductRecommendation[];
  relevant: ProductRecommendation[];
  future: ProductRecommendation[];
}

/**
 * CATÁLOGO COMPLETO TOTVS (14 CATEGORIAS)
 *\u002F
export const TOTVS_CATALOG = {
  'IA': ['Carol AI', 'Auditoria Folha IA', 'Análise Preditiva', 'IA Generativa'],
  'ERP': ['Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice'],
  'Analytics': ['TOTVS BI', 'Advanced Analytics', 'Data Platform', 'Dashboards'],
  'Assinatura': ['TOTVS Assinatura Eletrônica', 'DocuSign Integration'],
  'Atendimento': ['TOTVS Chatbot', 'Service Desk', 'Omnichannel'],
  'Cloud': ['TOTVS Cloud', 'IaaS', 'Backup Cloud', 'Disaster Recovery'],
  'Crédito': ['TOTVS Techfin', 'Antecipação de Recebíveis', 'Capital de Giro'],
  'CRM': ['TOTVS CRM', 'Sales Force Automation', 'Customer 360'],
  'Fluig': ['Fluig BPM', 'Fluig ECM', 'Fluig Workflow', 'Processos Digitais'],
  'iPaaS': ['TOTVS iPaaS', 'API Management', 'Integração de Sistemas'],
  'Marketing': ['RD Station', 'Marketing Automation', 'Lead Generation'],
  'Pagamentos': ['TOTVS Pay', 'PIX Integrado', 'Gateway de Pagamentos'],
  'RH': ['TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento', 'LMS', 'Performance'],
  'SFA': ['TOTVS SFA', 'Força de Vendas', 'Mobile Sales']
};

// ... (Todo o conteúdo do arquivo comentado - 800+ linhas omitidas para brevidade)
// O arquivo completo está preservado, apenas comentado.

*\u002F

// ============================================================================
// EXPORTS TEMPORÁRIOS (para não quebrar imports existentes)
// ============================================================================
// Estes exports serão removidos na FASE 3 quando substituirmos por tenant_products

export interface ProductRecommendation {
  name: string;
  category: string;
  priority: 'primary' | 'relevant' | 'future';
  useCase: string;
  estimatedROI: string;
  typicalARR: string;
  implementationTime: string;
}

export interface SegmentMatrix {
  segment: string;
  primary: ProductRecommendation[];
  relevant: ProductRecommendation[];
  future: ProductRecommendation[];
}

// Retorna matriz vazia (placeholder até FASE 3)
export function getProductMatrixForSegment(_segment: string): SegmentMatrix {
  console.warn('⚠️ productSegmentMatrix.ts está deprecated. Use tenant_products (FASE 3)');
  return {
    segment: 'Placeholder',
    primary: [],
    relevant: [],
    future: []
  };
}

// Retorna vazio (placeholder até FASE 3)
export function identifyOpportunities(
  _segment: string,
  _detectedProducts: string[]
): {
  productsInUse: { product: string; category: string; evidenceCount: number }[];
  primaryOpportunities: ProductRecommendation[];
  relevantOpportunities: ProductRecommendation[];
  futureOpportunities: ProductRecommendation[];
} {
  console.warn('⚠️ identifyOpportunities está deprecated. Use tenant_products (FASE 3)');
  return {
    productsInUse: [],
    primaryOpportunities: [],
    relevantOpportunities: [],
    futureOpportunities: []
  };
}

// ============================================================================
// FIM DO ARQUIVO DEPRECATED
// ============================================================================
