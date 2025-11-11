import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface ProposalRequest {
  tenant_id: string;
  workspace_id: string;
  dealer: {
    id: string;
    name: string;
    country: string;
    city: string;
    decision_makers: any[];
  };
  products: Array<{
    product_id: string;
    name: string;
    hs_code: string | null;
    quantity: number;
    unit_price_usd: number;
    total_usd: number;
  }>;
  incoterm: string;
  pricing: {
    value: number;
    breakdown: any[];
    savings: {
      exportIncentives: number;
      netCost: number;
    };
    metadata: {
      estimatedDays: number;
      shippingSource: string;
    };
  };
  notes?: string;
}

// ============================================================================
// GENERATE PDF (HTML com Logo e Branding do Tenant)
// ============================================================================

async function generateProposalPDF(
  request: ProposalRequest, 
  proposalNumber: string,
  tenant: any
): Promise<string> {
  console.log('[PDF] 📄 Gerando PDF para proposta:', proposalNumber);
  console.log('[PDF] 🎨 Tenant branding:', {
    logo: tenant.logo_url || 'sem logo',
    primaryColor: tenant.primary_color,
    name: tenant.name
  });

  // OPÇÃO 1: Usar API externa de HTML-to-PDF (Recomendado)
  // Por exemplo: https://pdfshift.io/ ou https://pdflayer.com/
  
  // OPÇÃO 2: Renderizar HTML e converter (fallback)
  // Por enquanto, vamos criar um HTML estruturado que pode ser convertido
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Commercial Proposal ${proposalNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white; }
    .header { 
      background: ${tenant.primary_color || '#10B981'}; 
      color: white; 
      padding: 30px;
      border-radius: 8px 8px 0 0;
      margin: -40px -40px 30px -40px;
    }
    .logo { height: 50px; margin-bottom: 15px; }
    .company-name { font-size: 28px; font-weight: bold; color: white; margin-bottom: 10px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: bold; }
    .total-row { font-size: 18px; font-weight: bold; background: #f0f9ff; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; }
  </style>
</head>
<body>
  <!-- HEADER COM LOGO E BRANDING -->}
  <div class="header">
    ${tenant.logo_url ? `<img src="${tenant.logo_url}" class="logo" alt="${tenant.name}" />` : ''}
    <div class="company-name">${tenant.name}</div>
    <div>${tenant.cnpj ? `CNPJ: ${tenant.cnpj}` : ''}</div>
    <div>${tenant.city || ''}, ${tenant.state || ''}, ${tenant.country || 'Brazil'}</div>
    <div style="margin-top: 15px;">
      <strong>COMMERCIAL PROPOSAL</strong><br />
      Proposal #: ${proposalNumber}<br />
      Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br />
      Valid Until: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (30 days)
    </div>
  </div>

  <!-- TO -->
  <div class="section">
    <strong>TO:</strong><br />
    ${request.dealer.name}<br />
    ${request.dealer.city}, ${request.dealer.country}<br />
    ${request.dealer.decision_makers && request.dealer.decision_makers.length > 0 
      ? `Attn: ${request.dealer.decision_makers[0].name} (${request.dealer.decision_makers[0].title})`
      : ''
    }
  </div>

  <!-- PRODUCTS -->
  <div class="section">
    <div class="section-title">PRODUCTS</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>HS Code</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${request.products.map(p => `
          <tr>
            <td>${p.name}</td>
            <td>${p.hs_code || 'N/A'}</td>
            <td>${p.quantity} units</td>
            <td>USD ${p.unit_price_usd.toLocaleString()}</td>
            <td>USD ${p.total_usd.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <!-- PRICING -->
  <div class="section">
    <div class="section-title">PRICING (${request.incoterm})</div>
    <table>
      <tbody>
        ${request.pricing.breakdown.map(item => `
          <tr>
            <td>${item.label}</td>
            <td style="text-align: right;">
              ${item.isNegative ? '-' : ''}USD ${Math.abs(item.value).toLocaleString()}
            </td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td>TOTAL ${request.incoterm}:</td>
          <td style="text-align: right;">USD ${request.pricing.value.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TERMS -->
  <div class="section">
    <div class="section-title">TERMS & CONDITIONS</div>
    <p><strong>Payment Terms:</strong> 30% advance, 70% at Bill of Lading (BL)</p>
    <p><strong>Lead Time:</strong> 45-60 days from order confirmation</p>
    <p><strong>Origin Port:</strong> Santos, Brazil (BRSSZ)</p>
    <p><strong>Incoterm:</strong> ${request.incoterm} (ICC 2020)</p>
    ${request.pricing.metadata.estimatedDays ? `<p><strong>Estimated Delivery:</strong> ${request.pricing.metadata.estimatedDays} days</p>` : ''}
  </div>

  <!-- CERTIFICATIONS -->
  <div class="section">
    <div class="section-title">CERTIFICATIONS</div>
    <p>✅ ISO 9001:2015 (Quality Management)</p>
    <p>✅ FSC (Forest Stewardship Council) for furniture components</p>
  </div>

  <!-- NOTES -->
  ${request.notes ? `
  <div class="section">
    <div class="section-title">ADDITIONAL NOTES</div>
    <p>${request.notes}</p>
  </div>
  ` : ''}

  <!-- FOOTER COM DADOS DO TENANT -->
  <div class="footer">
    <p><strong>Contact:</strong> ${tenant.contact_email || 'N/A'}</p>
    <p><strong>Phone:</strong> ${tenant.contact_phone || 'N/A'}</p>
    <p><strong>Website:</strong> ${tenant.website || 'N/A'}</p>
    ${tenant.address ? `<p><strong>Address:</strong> ${tenant.address}, ${tenant.city}, ${tenant.state}</p>` : ''}
    <p style="margin-top: 20px;">We look forward to your partnership!</p>
    <p><strong>Best regards,</strong><br />${tenant.name} Export Team</p>
  </div>
</body>
</html>
  `;

  // Converter HTML para PDF (via API ou biblioteca)
  // Por enquanto, retornar HTML (pode ser convertido no frontend ou via API)
  return htmlContent;
}

// ============================================================================
// SEND EMAIL (Resend ou SendGrid)
// ============================================================================

async function sendProposalEmail(
  dealer: any,
  proposalNumber: string,
  pdfUrl: string,
  tenant: any
): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.warn('[EMAIL] ⚠️ RESEND_API_KEY não configurada - email não enviado');
    return false;
  }

  const toEmail = dealer.decision_makers?.[0]?.email || 'noreply@example.com';

  // Email HTML com logo e branding do tenant
  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { 
      background-color: ${tenant.primary_color || '#10B981'}; 
      padding: 30px; 
      text-align: center; 
    }
    .logo { max-height: 60px; margin-bottom: 10px; }
    .content { padding: 30px; line-height: 1.6; }
    .footer { 
      background-color: #f5f5f5; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666; 
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header com logo -->
    <div class="header">
      ${tenant.logo_url ? `<img src="${tenant.logo_url}" class="logo" alt="${tenant.name}" />` : ''}
      <h1 style="color: white; margin: 0;">${tenant.name}</h1>
    </div>
    
    <!-- Conteúdo -->
    <div class="content">
      <p>Dear ${dealer.decision_makers?.[0]?.name || 'Sir/Madam'},</p>
      
      <p>Thank you for your interest in ${tenant.name} products.</p>
      
      <p>Please find attached our commercial proposal <strong>${proposalNumber}</strong> for your review.</p>
      
      <p>Should you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br />
      <strong>${tenant.name} Export Team</strong><br />
      ${tenant.contact_email || ''}<br />
      ${tenant.contact_phone || ''}</p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>${tenant.name} | ${tenant.cnpj ? `CNPJ: ${tenant.cnpj}` : ''}</p>
      ${tenant.address ? `<p>${tenant.address}, ${tenant.city}, ${tenant.state}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const emailText = `
Dear ${dealer.decision_makers?.[0]?.name || 'Sir/Madam'},

Thank you for your interest in ${tenant.name} products.

Please find attached our commercial proposal ${proposalNumber} for your review.

Should you have any questions, please don't hesitate to contact us.

Best regards,
${tenant.name} Export Team
${tenant.contact_email || ''}
${tenant.contact_phone || ''}
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${tenant.name} Export <${tenant.contact_email || 'noreply@olv.trade'}>`,
        to: toEmail,
        subject: `Commercial Proposal ${proposalNumber} - ${tenant.name}`,
        html: emailHTML,
        text: emailText,
        attachments: [
          {
            filename: `${proposalNumber}.pdf`,
            path: pdfUrl
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('[EMAIL] ❌ Erro ao enviar:', await response.text());
      return false;
    }

    console.log('[EMAIL] ✅ Email enviado para:', toEmail);
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ Erro:', error);
    return false;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: ProposalRequest = await req.json();

    console.log('[PROPOSAL] 📄 Gerando proposta comercial para:', request.dealer.name);

    // Criar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1️⃣ Gerar número de proposta
    const { data: proposalNumberData } = await supabase.rpc('generate_proposal_number', {
      p_tenant_id: request.tenant_id
    });

    const proposalNumber = proposalNumberData || 'PROP-25-001';

    console.log('[PROPOSAL] 🔢 Número gerado:', proposalNumber);

    // 1.5️⃣ Buscar dados completos do tenant (para branding)
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', request.tenant_id)
      .single();

    if (tenantError) {
      console.error('[PROPOSAL] ❌ Erro ao buscar tenant:', tenantError);
      throw tenantError;
    }

    console.log('[PROPOSAL] 🎨 Tenant branding carregado:', {
      name: tenantData.name,
      logo: tenantData.logo_url || 'sem logo',
      primaryColor: tenantData.primary_color
    });

    // 2️⃣ Gerar PDF (com branding do tenant!)
    const htmlContent = await generateProposalPDF(request, proposalNumber, tenantData);

    // Salvar HTML em Storage (por enquanto - PDF real virá com API)
    const filename = `${request.tenant_id}/${proposalNumber}.html`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proposal-pdfs')
      .upload(filename, htmlContent, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('[PROPOSAL] ❌ Erro ao upload PDF:', uploadError);
      throw uploadError;
    }

    // URL pública do PDF
    const { data: urlData } = supabase.storage
      .from('proposal-pdfs')
      .getPublicUrl(filename);

    const pdfUrl = urlData.publicUrl;

    console.log('[PROPOSAL] ✅ PDF salvo:', pdfUrl);

    // 3️⃣ Salvar proposta no banco
    const subtotal = request.products.reduce((sum, p) => sum + p.total_usd, 0);

    const { data: proposalData, error: dbError } = await supabase
      .from('commercial_proposals')
      .insert({
        tenant_id: request.tenant_id,
        workspace_id: request.workspace_id,
        dealer_id: request.dealer.id,
        dealer_name: request.dealer.name,
        dealer_email: request.dealer.decision_makers?.[0]?.email,
        dealer_country: request.dealer.country,
        dealer_city: request.dealer.city,
        proposal_number: proposalNumber,
        products: request.products,
        subtotal_usd: subtotal,
        shipping_cost_usd: 0, // Será calculado
        total_value_usd: request.pricing.value,
        incoterm: request.incoterm,
        all_incoterms: {}, // Todos os incoterms calculados
        origin_port: 'BRSSZ',
        destination_port: null, // Será preenchido
        transport_mode: 'ocean',
        estimated_delivery_days: request.pricing.metadata.estimatedDays,
        export_incentives: request.pricing.savings,
        status: 'draft',
        valid_until: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        pdf_url: pdfUrl,
        pdf_filename: `${proposalNumber}.html`,
        notes: request.notes,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[PROPOSAL] ❌ Erro ao salvar no banco:', dbError);
      throw dbError;
    }

    console.log('[PROPOSAL] ✅ Proposta salva no banco:', proposalData.id);

    // 4️⃣ Enviar email (opcional - se configurado) - COM BRANDING DO TENANT
    const emailSent = await sendProposalEmail(request.dealer, proposalNumber, pdfUrl, tenantData);

    if (emailSent) {
      // Atualizar status para 'sent'
      await supabase
        .from('commercial_proposals')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString(),
          email_sent_to: request.dealer.decision_makers?.[0]?.email
        })
        .eq('id', proposalData.id);
    }

    // 5️⃣ Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        proposal_id: proposalData.id,
        proposal_number: proposalNumber,
        pdf_url: pdfUrl,
        email_sent: emailSent,
        total_value_usd: request.pricing.value,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[PROPOSAL] ❌ Erro:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao gerar proposta',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

