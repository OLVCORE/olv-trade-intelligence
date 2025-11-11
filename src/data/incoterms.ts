// ============================================================================
// INCOTERMS OFICIAIS - ICC 2020 (International Chamber of Commerce)
// ============================================================================
// Fonte: ICC (https://iccwbo.org/resources-for-business/incoterms-rules/)
// Atualização: Incoterms 2020 (vigente)
// ============================================================================

export interface Incoterm {
  code: string; // EXW, FOB, CIF, DDP, etc
  name: string; // Nome oficial em inglês
  namePt: string; // Nome em português
  group: 'E' | 'F' | 'C' | 'D'; // Grupo ICC
  description: string; // Descrição completa
  responsibility: string; // Quem paga o que
  modal: string[]; // Modais permitidos ('Any', 'Sea', 'Inland waterway')
  useCase: string; // Quando usar
  riskTransfer: string; // Onde o risco transfere
  costComponents: string[]; // O que está incluído
}

export const INCOTERMS: Incoterm[] = [
  // ========================================
  // GRUPO E: PARTIDA (Seller minimum obligation)
  // ========================================
  {
    code: 'EXW',
    name: 'Ex Works',
    namePt: 'Na Origem',
    group: 'E',
    description: 'O vendedor disponibiliza a mercadoria em seu próprio estabelecimento (fábrica, armazém, loja)',
    responsibility: 'Comprador assume TODOS os custos e riscos desde a coleta',
    modal: ['Any'],
    useCase: 'Comprador experiente com logística própria. Mínima responsabilidade do vendedor.',
    riskTransfer: 'No estabelecimento do vendedor',
    costComponents: ['Custo do produto na fábrica']
  },

  // ========================================
  // GRUPO F: TRANSPORTE PRINCIPAL NÃO PAGO
  // ========================================
  {
    code: 'FCA',
    name: 'Free Carrier',
    namePt: 'Livre no Transportador',
    group: 'F',
    description: 'O vendedor entrega a mercadoria ao transportador nomeado pelo comprador em local especificado',
    responsibility: 'Vendedor até transportador, comprador após',
    modal: ['Any'],
    useCase: 'Flexível, multimodal. Comprador escolhe transportadora. Substitui FOB para contêineres.',
    riskTransfer: 'Quando entregue ao transportador',
    costComponents: ['Produto', 'Movimentação até transportador', 'Desembaraço exportação']
  },
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    namePt: 'Livre ao Lado do Navio',
    group: 'F',
    description: 'O vendedor entrega a mercadoria ao lado do navio no porto de embarque nomeado',
    responsibility: 'Vendedor até porto, comprador carrega navio',
    modal: ['Sea', 'Inland waterway'],
    useCase: 'Cargas pesadas, granéis. Comprador tem controle sobre o carregamento.',
    riskTransfer: 'Ao lado do navio no porto',
    costComponents: ['Produto', 'Transporte até porto', 'Desembaraço exportação']
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    namePt: 'Livre a Bordo',
    group: 'F',
    description: 'O vendedor coloca a mercadoria a bordo do navio no porto de embarque nomeado',
    responsibility: 'Vendedor até navio carregado, comprador após',
    modal: ['Sea', 'Inland waterway'],
    useCase: '⭐ MAIS USADO NO BRASIL para export marítimo. Vendedor garante embarque.',
    riskTransfer: 'Quando mercadoria cruza a amurada do navio',
    costComponents: ['Produto', 'Transporte até porto', 'Carregamento no navio', 'Desembaraço exportação']
  },

  // ========================================
  // GRUPO C: TRANSPORTE PRINCIPAL PAGO
  // ========================================
  {
    code: 'CFR',
    name: 'Cost and Freight',
    namePt: 'Custo e Frete',
    group: 'C',
    description: 'O vendedor paga o custo e o frete até o porto de destino',
    responsibility: 'Vendedor paga frete, mas risco transfere no embarque (igual FOB)',
    modal: ['Sea', 'Inland waterway'],
    useCase: 'Vendedor negocia frete (economia de escala). Comprador assume risco no trânsito.',
    riskTransfer: 'Quando mercadoria cruza amurada do navio (igual FOB)',
    costComponents: ['Produto', 'Transporte origem', 'Carregamento', 'Frete marítimo', 'Desembaraço exportação']
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    namePt: 'Custo, Seguro e Frete',
    group: 'C',
    description: 'O vendedor paga o custo, seguro e frete até o porto de destino',
    responsibility: 'Vendedor paga frete+seguro, risco transfere no embarque (igual FOB)',
    modal: ['Sea', 'Inland waterway'],
    useCase: '⭐ 2º MAIS USADO. Comprador quer segurança. Vendedor controla frete e seguro.',
    riskTransfer: 'Quando mercadoria cruza amurada do navio (igual FOB)',
    costComponents: ['Produto', 'Transporte origem', 'Carregamento', 'Frete marítimo', 'Seguro marítimo', 'Desembaraço exportação']
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    namePt: 'Transporte Pago Até',
    group: 'C',
    description: 'O vendedor paga o transporte até o local de destino nomeado',
    responsibility: 'Vendedor paga transporte, risco transfere na entrega ao transportador',
    modal: ['Any'],
    useCase: 'Multimodal (Ocean+Road+Air). Flexível. Similar a CFR mas para qualquer modal.',
    riskTransfer: 'Quando entregue ao primeiro transportador',
    costComponents: ['Produto', 'Transporte completo até destino', 'Desembaraço exportação']
  },
  {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    namePt: 'Transporte e Seguro Pagos Até',
    group: 'C',
    description: 'O vendedor paga transporte e seguro até o local de destino nomeado',
    responsibility: 'Vendedor paga transporte+seguro, risco transfere na entrega ao transportador',
    modal: ['Any'],
    useCase: 'Multimodal com seguro. Similar a CIF mas para qualquer modal. Seguro mais amplo (all risks).',
    riskTransfer: 'Quando entregue ao primeiro transportador',
    costComponents: ['Produto', 'Transporte completo', 'Seguro all risks', 'Desembaraço exportação']
  },

  // ========================================
  // GRUPO D: CHEGADA (Seller maximum obligation)
  // ========================================
  {
    code: 'DAP',
    name: 'Delivered At Place',
    namePt: 'Entregue no Local',
    group: 'D',
    description: 'O vendedor entrega a mercadoria em local nomeado no país de destino, pronta para descarga',
    responsibility: 'Vendedor assume TUDO até local destino (exceto desembaraço importação)',
    modal: ['Any'],
    useCase: 'Vendedor controla toda logística. Comprador só desembarca e paga impostos de importação.',
    riskTransfer: 'No local de destino nomeado, pronta para descarga',
    costComponents: ['Produto', 'Todos os transportes', 'Seguro', 'Desembaraço exportação', 'Transporte até endereço destino']
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    namePt: 'Entregue no Local Descarregada',
    group: 'D',
    description: 'O vendedor entrega a mercadoria descarregada em local nomeado no país de destino',
    responsibility: 'Vendedor assume TUDO incluindo descarga (exceto desembaraço importação)',
    modal: ['Any'],
    useCase: 'Máximo serviço ao comprador. Vendedor descarrega em armazém/terminal do comprador.',
    riskTransfer: 'Após descarga no local de destino nomeado',
    costComponents: ['Produto', 'Todos os transportes', 'Seguro', 'Desembaraço exportação', 'Transporte até destino', 'Descarga']
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    namePt: 'Entregue com Direitos Pagos',
    group: 'D',
    description: 'O vendedor entrega a mercadoria com TODOS os custos pagos, incluindo impostos de importação',
    responsibility: 'Vendedor assume ABSOLUTAMENTE TUDO (frete, seguro, impostos, desembaraço, entrega)',
    modal: ['Any'],
    useCase: 'Comprador não quer se preocupar com NADA. Vendedor assume máximo risco. Door-to-door.',
    riskTransfer: 'No local de destino nomeado, pronta para descarga',
    costComponents: ['Produto', 'Todos os transportes', 'Seguro', 'Desembaraço exportação', 'Transporte internacional', 'Impostos de importação', 'Desembaraço importação', 'Entrega final']
  },
];

// ============================================================================
// TOP 5 MAIS USADOS NO BRASIL (Export)
// ============================================================================

export const TOP_INCOTERMS = ['FOB', 'CIF', 'EXW', 'DDP', 'FCA'];

// ============================================================================
// HELPERS
// ============================================================================

export function getIncotermByCode(code: string): Incoterm | undefined {
  return INCOTERMS.find(i => i.code === code);
}

export function getIncotermsByGroup(group: Incoterm['group']): Incoterm[] {
  return INCOTERMS.filter(i => i.group === group);
}

export function getIncotermsByModal(modal: 'Sea' | 'Air' | 'Any'): Incoterm[] {
  return INCOTERMS.filter(i => i.modal.includes(modal) || i.modal.includes('Any'));
}

