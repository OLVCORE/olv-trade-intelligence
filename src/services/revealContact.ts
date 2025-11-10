/**
 * ============================================================================
 * SISTEMA HÍBRIDO DE REVEAL DE CONTATOS
 * ============================================================================
 * 
 * CASCATA INTELIGENTE:
 * 1️⃣ Apollo (corporativo) - ~1 crédito
 * 2️⃣ Hunter.io (email alternativo) - ~1 crédito
 * 3️⃣ Lusha (mobile pessoal) - ~2-3 créditos (apenas VIP/C-Level)
 * 
 * ============================================================================
 */

import { supabase } from '@/integrations/supabase/client';

export interface RevealResult {
  success: boolean;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  source: 'apollo' | 'hunter' | 'lusha' | 'none';
  cost: number;
  error?: string;
}

/**
 * 🥇 REVEAL PADRÃO: Apollo + Hunter (Email corporativo + Telefone comercial)
 */
export async function revealCorporateContact(
  decisorId: string,
  linkedinUrl?: string,
  fullName?: string,
  companyDomain?: string
): Promise<RevealResult> {
  console.log('[REVEAL] 🔍 Iniciando reveal corporativo para:', fullName);
  
  // 1️⃣ TENTAR APOLLO PRIMEIRO (mais barato e completo)
  try {
    console.log('[REVEAL] 🥇 Tentando Apollo...');
    
    const { data: apolloData, error: apolloError } = await supabase.functions.invoke('reveal-apollo-email', {
      body: {
        decisor_id: decisorId,
        linkedin_url: linkedinUrl,
        full_name: fullName,
        company_domain: companyDomain
      }
    });
    
    if (!apolloError && apolloData?.email) {
      console.log('[REVEAL] ✅ Apollo sucesso!');
      
      // Salvar no banco
      await supabase
        .from('decision_makers')
        .update({
          email: apolloData.email,
          phone: apolloData.phone || null,
          email_status: 'verified'
        })
        .eq('id', decisorId);
      
      return {
        success: true,
        email: apolloData.email,
        phone: apolloData.phone,
        source: 'apollo',
        cost: 1
      };
    }
  } catch (apolloErr) {
    console.warn('[REVEAL] ⚠️ Apollo falhou:', apolloErr);
  }
  
  // 2️⃣ FALLBACK: HUNTER.IO (apenas email)
  try {
    console.log('[REVEAL] 🥈 Tentando Hunter.io...');
    
    const { data: hunterData, error: hunterError } = await supabase.functions.invoke('hunter-email-finder', {
      body: {
        full_name: fullName,
        domain: companyDomain
      }
    });
    
    if (!hunterError && hunterData?.email) {
      console.log('[REVEAL] ✅ Hunter.io sucesso!');
      
      // Salvar no banco
      await supabase
        .from('decision_makers')
        .update({
          email: hunterData.email,
          email_status: 'verified'
        })
        .eq('id', decisorId);
      
      return {
        success: true,
        email: hunterData.email,
        source: 'hunter',
        cost: 1
      };
    }
  } catch (hunterErr) {
    console.warn('[REVEAL] ⚠️ Hunter.io falhou:', hunterErr);
  }
  
  // ❌ NENHUMA FONTE FUNCIONOU
  return {
    success: false,
    source: 'none',
    cost: 0,
    error: 'Nenhuma fonte disponível (Apollo e Hunter falharam)'
  };
}

/**
 * 🥉 REVEAL VIP: Lusha (Mobile pessoal + Email pessoal)
 * APENAS para C-Level e Decisores importantes
 */
export async function revealPersonalContact(
  decisorId: string,
  linkedinUrl?: string,
  fullName?: string,
  companyName?: string
): Promise<RevealResult> {
  console.log('[REVEAL-VIP] 💎 Iniciando reveal VIP (Lusha) para:', fullName);
  
  try {
    const { data: lushaData, error: lushaError } = await supabase.functions.invoke('reveal-lusha-contact', {
      body: {
        decisor_id: decisorId,
        linkedin_url: linkedinUrl,
        full_name: fullName,
        company_name: companyName
      }
    });
    
    if (!lushaError && (lushaData?.mobile || lushaData?.personal_email)) {
      console.log('[REVEAL-VIP] ✅ Lusha sucesso!');
      
      // Salvar no banco
      const updateData: any = {};
      if (lushaData.mobile) updateData.phone = lushaData.mobile;
      if (lushaData.personal_email) updateData.email = lushaData.personal_email;
      
      await supabase
        .from('decision_makers')
        .update(updateData)
        .eq('id', decisorId);
      
      return {
        success: true,
        mobile: lushaData.mobile,
        email: lushaData.personal_email,
        source: 'lusha',
        cost: 3
      };
    }
  } catch (lushaErr) {
    console.error('[REVEAL-VIP] ❌ Lusha falhou:', lushaErr);
  }
  
  return {
    success: false,
    source: 'none',
    cost: 0,
    error: 'Lusha não disponível ou falhou'
  };
}

/**
 * 🔍 VERIFICAR se é VIP (C-Level) para mostrar botão Lusha
 */
export function isVIPDecisor(title?: string, seniority?: string): boolean {
  const titleLower = (title || '').toLowerCase();
  const seniorityLower = (seniority || '').toLowerCase();
  
  return (
    // C-Level
    titleLower.includes('ceo') ||
    titleLower.includes('cfo') ||
    titleLower.includes('cto') ||
    titleLower.includes('cio') ||
    titleLower.includes('cmo') ||
    titleLower.includes('presidente') ||
    titleLower.includes('president') ||
    titleLower.includes('founder') ||
    titleLower.includes('owner') ||
    titleLower.includes('sócio') ||
    // Seniority
    seniorityLower.includes('c_suite') ||
    seniorityLower.includes('c-suite') ||
    seniorityLower.includes('vp') ||
    seniorityLower.includes('vice president')
  );
}

