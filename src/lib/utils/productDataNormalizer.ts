/**
 * UNIVERSAL PRODUCT DATA NORMALIZER
 * 
 * Este normalizador reconhece automaticamente os campos de produto
 * independentemente da ordem das colunas ou nomes diferentes.
 * 
 * Inspirado no companyDataNormalizer.ts
 */

// ============================================================================
// MAPEAMENTO DE SINÔNIMOS DE CAMPOS
// ============================================================================

const FIELD_SYNONYMS = {
  // Nome do Produto
  name: ['name', 'nome', 'produto', 'product', 'item', 'description', 'descricao'],
  
  // Categoria
  category: ['category', 'categoria', 'tipo', 'type', 'linha', 'line', 'familia', 'family'],
  
  // HS Code / NCM
  hs_code: ['hs_code', 'hs', 'hscode', 'ncm', 'hs code', 'codigo ncm', 'codigo_ncm'],
  
  // Preço USD
  price_usd: ['price_usd', 'preco_usd', 'price', 'valor_usd', 'usd', 'price usd', 'preco usd'],
  
  // Preço BRL
  price_brl: ['price_brl', 'preco_brl', 'preco', 'valor_brl', 'brl', 'reais', 'price brl', 'preco brl'],
  
  // MOQ (Minimum Order Quantity)
  moq: ['moq', 'minimo', 'quantidade_minima', 'min_order', 'minimum', 'qtd_minima'],
  
  // Peso
  weight_kg: ['weight_kg', 'peso', 'peso_kg', 'weight', 'kg', 'peso kg', 'weight kg'],
  
  // Dimensões
  dimensions_cm: ['dimensions_cm', 'dimensoes', 'dimensões', 'dimensions', 'medidas', 'tamanho', 'size'],
  
  // Volume
  volume_m3: ['volume_m3', 'volume', 'cubagem', 'm3', 'volume m3'],
  
  // SKU
  sku: ['sku', 'codigo', 'código', 'code', 'ref', 'referencia', 'reference'],
  
  // Marca
  brand: ['brand', 'marca', 'fabricante', 'manufacturer'],
  
  // Materiais
  materials: ['materials', 'materiais', 'material', 'composicao', 'composition'],
  
  // Garantia
  warranty_months: ['warranty_months', 'garantia', 'warranty', 'garantia_meses', 'warranty months'],
  
  // Descrição
  description: ['description', 'descricao', 'descricão', 'desc', 'detalhes', 'details'],
  
  // Imagem URL
  image_url: ['image_url', 'imagem', 'image', 'foto', 'photo', 'img', 'url_imagem'],
  
  // Main Image
  main_image: ['main_image', 'imagem_principal', 'primary_image', 'cover', 'capa'],
  
  // Origin Country
  origin_country: ['origin_country', 'origem', 'country', 'pais', 'país', 'origin'],
  
  // Min Order Quantity (alternativo)
  min_order_quantity: ['min_order_quantity', 'quantidade_minima', 'moq', 'minimum_order'],
  
  // Status Ativo
  is_active: ['is_active', 'ativo', 'active', 'status', 'ativado'],
};

// ============================================================================
// FUNÇÃO PRINCIPAL: NORMALIZAR DADOS DO PRODUTO
// ============================================================================

export interface NormalizedProductData {
  name: string;
  description?: string | null;
  category?: string | null;
  hs_code?: string | null;
  price_usd?: number | null;
  price_brl?: number | null;
  moq?: number | null;
  weight_kg?: number | null;
  dimensions_cm?: string | null;
  volume_m3?: number | null;
  sku?: string | null;
  brand?: string | null;
  materials?: string | null;
  warranty_months?: number | null;
  image_url?: string | null;
  main_image?: string | null;
  origin_country?: string | null;
  min_order_quantity?: number | null;
  is_active?: boolean;
}

/**
 * Normaliza dados de produto vindos de CSV, APIs ou formulários
 * Detecta automaticamente os campos independente da nomenclatura
 */
export function normalizeProductData(rawData: Record<string, any>): NormalizedProductData {
  const normalized: Partial<NormalizedProductData> = {};

  // Converter todas as chaves para lowercase para comparação
  const lowerCaseData: Record<string, any> = {};
  Object.keys(rawData).forEach((key) => {
    const lowerKey = key.toLowerCase().trim();
    lowerCaseData[lowerKey] = rawData[key];
  });

  // Para cada campo que queremos normalizar
  for (const [targetField, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    // Procurar por qualquer sinônimo nos dados
    for (const synonym of synonyms) {
      const lowerSynonym = synonym.toLowerCase();
      if (lowerCaseData[lowerSynonym] !== undefined && lowerCaseData[lowerSynonym] !== null && lowerCaseData[lowerSynonym] !== '') {
        // Encontrou! Processar o valor
        const value = lowerCaseData[lowerSynonym];
        normalized[targetField as keyof NormalizedProductData] = processFieldValue(targetField, value);
        break; // Já encontrou, não precisa procurar outros sinônimos
      }
    }
  }

  // Nome é obrigatório
  if (!normalized.name) {
    throw new Error('Campo "name" (nome do produto) é obrigatório');
  }

  return normalized as NormalizedProductData;
}

// ============================================================================
// PROCESSAMENTO DE VALORES POR TIPO
// ============================================================================

function processFieldValue(fieldName: string, value: any): any {
  // Se valor é null, undefined ou string vazia, retornar null
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const valueStr = String(value).trim();
  if (valueStr === '') return null;

  switch (fieldName) {
    // Campos numéricos (preços)
    case 'price_usd':
    case 'price_brl':
      return parsePrice(valueStr);

    // Campos numéricos inteiros
    case 'moq':
    case 'warranty_months':
    case 'min_order_quantity':
      return parseInt(valueStr) || null;

    // Campos numéricos decimais
    case 'weight_kg':
    case 'volume_m3':
      return parseFloat(valueStr) || null;

    // Boolean
    case 'is_active':
      return parseBoolean(valueStr);

    // Strings normais
    default:
      return valueStr;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse de preço (aceita vírgula e ponto, remove símbolos)
 */
function parsePrice(value: string): number | null {
  if (!value) return null;
  
  // Remove símbolos de moeda e espaços
  let cleaned = value.replace(/[R$USD$€£¥\s]/gi, '').trim();
  
  // Se tem vírgula e ponto, assume formato brasileiro (1.234,56)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } 
  // Se só tem vírgula, assume decimal brasileiro (1234,56)
  else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse de boolean (aceita várias formas)
 */
function parseBoolean(value: string): boolean {
  const lower = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'sim', 'ativo', 'active', 'y', 's'].includes(lower);
}

// ============================================================================
// FUNÇÃO: AUTO-MAPEAR COLUNAS DO CSV
// ============================================================================

/**
 * Identifica automaticamente quais colunas do CSV correspondem a quais campos
 * Retorna um mapeamento sugerido
 */
export function autoMapCSVColumns(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const header of csvHeaders) {
    const lowerHeader = header.toLowerCase().trim();
    
    // Para cada campo target, verificar se o header é um sinônimo
    for (const [targetField, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (synonyms.some(syn => lowerHeader === syn.toLowerCase())) {
        mapping[header] = targetField;
        break;
      }
    }
  }

  return mapping;
}

// ============================================================================
// FUNÇÃO: VALIDAR DADOS NORMALIZADOS
// ============================================================================

export interface ProductValidationError {
  field: string;
  message: string;
}

/**
 * Valida dados normalizados e retorna erros se houver
 */
export function validateProductData(data: NormalizedProductData): ProductValidationError[] {
  const errors: ProductValidationError[] = [];

  // Nome obrigatório
  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Nome do produto é obrigatório' });
  }

  // Validar preços (se fornecidos, devem ser positivos)
  if (data.price_usd !== null && data.price_usd !== undefined && data.price_usd <= 0) {
    errors.push({ field: 'price_usd', message: 'Preço USD deve ser positivo' });
  }

  if (data.price_brl !== null && data.price_brl !== undefined && data.price_brl <= 0) {
    errors.push({ field: 'price_brl', message: 'Preço BRL deve ser positivo' });
  }

  // Validar peso (se fornecido, deve ser positivo)
  if (data.weight_kg !== null && data.weight_kg !== undefined && data.weight_kg <= 0) {
    errors.push({ field: 'weight_kg', message: 'Peso deve ser positivo' });
  }

  // Validar MOQ (se fornecido, deve ser >= 1)
  if (data.moq !== null && data.moq !== undefined && data.moq < 1) {
    errors.push({ field: 'moq', message: 'MOQ deve ser pelo menos 1' });
  }

  return errors;
}

// ============================================================================
// FUNÇÃO: NORMALIZAR BATCH (múltiplos produtos)
// ============================================================================

export interface NormalizedProductResult {
  success: boolean;
  data?: NormalizedProductData;
  errors?: ProductValidationError[];
  originalData: Record<string, any>;
}

/**
 * Normaliza múltiplos produtos de uma vez
 * Retorna array com resultados individuais
 */
export function normalizeProductBatch(rawDataArray: Record<string, any>[]): NormalizedProductResult[] {
  return rawDataArray.map((rawData, index) => {
    try {
      const normalized = normalizeProductData(rawData);
      const errors = validateProductData(normalized);

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          originalData: rawData,
        };
      }

      return {
        success: true,
        data: normalized,
        originalData: rawData,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [{ field: 'general', message: error.message }],
        originalData: rawData,
      };
    }
  });
}

