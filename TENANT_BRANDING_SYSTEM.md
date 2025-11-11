# 🎨 SISTEMA DE BRANDING POR TENANT

---

## 🎯 OBJETIVO

Cada tenant (MetaLife, Empresa X, etc) terá:
- ✅ Logo próprio (upload de imagem)
- ✅ Cores corporativas (primária, secundária)
- ✅ Dados de contato (email, telefone, endereço)
- ✅ Branding aplicado em: Header, Propostas PDF, Emails

---

## 📊 DATABASE (Já existe, precisa adicionar campos)

### Atualizar tabela `tenants`:

```sql
-- Adicionar colunas de branding
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0052CC';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#00B8D9';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR';

-- Atualizar MetaLife com dados reais
UPDATE tenants 
SET 
  logo_url = NULL, -- Será feito upload depois
  primary_color = '#10B981', -- Verde MetaLife
  secondary_color = '#059669',
  contact_email = 'export@metalifepilates.com.br',
  contact_phone = '+55 12 0800-056-2467',
  address = 'Estrada Municipal Taubaté-Pinda',
  city = 'Taubaté',
  state = 'SP',
  country = 'BR'
WHERE slug = 'metalife';
```

---

## 🖼️ UPLOAD DE LOGO (Supabase Storage)

### Criar bucket `tenant-logos`:

```sql
-- Criar bucket público para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-logos', 'tenant-logos', true);

-- Policy: Qualquer tenant pode fazer upload do próprio logo
CREATE POLICY "Tenants can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-logos' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM users WHERE id = auth.uid())
);

-- Policy: Logos são públicos (qualquer um pode ler)
CREATE POLICY "Logos are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-logos');
```

---

## 💻 COMPONENTE: TenantBrandingManager.tsx

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function TenantBrandingManager() {
  const { currentTenant, refreshTenant } = useTenant();
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentTenant.logo_url);

  // Upload de logo
  async function handleLogoUpload() {
    if (!logoFile || !currentTenant) return;

    setIsUploading(true);

    try {
      // 1. Upload para Supabase Storage
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${currentTenant.id}/logo.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true // Sobrescreve se já existe
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(fileName);

      // 3. Atualizar tenant no banco
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', currentTenant.id);

      if (updateError) throw updateError;

      setLogoPreview(publicUrl);
      refreshTenant(); // Atualizar contexto

      toast.success('✅ Logo atualizado com sucesso!');
    } catch (error: any) {
      console.error('[BRANDING] Erro:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setIsUploading(false);
    }
  }

  // Preview do arquivo selecionado
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo deve ser uma imagem (PNG, JPG, SVG)');
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 2MB)');
      return;
    }

    setLogoFile(file);

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding da Empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* 1. LOGO */}
        <div>
          <Label>Logo da Empresa</Label>
          <div className="mt-2 flex items-center gap-4">
            {/* Preview do logo */}
            <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            
            {/* Upload */}
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Formatos: PNG, JPG, SVG | Máx: 2MB | Recomendado: 400×200px
              </p>
              <Button 
                onClick={handleLogoUpload}
                disabled={!logoFile || isUploading}
                size="sm"
              >
                {isUploading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Upload Logo</>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* 2. CORES CORPORATIVAS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cor Primária</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={currentTenant.primary_color || '#0052CC'}
                onChange={(e) => updateTenantColor('primary_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={currentTenant.primary_color || '#0052CC'}
                readOnly
                className="font-mono"
              />
            </div>
          </div>
          
          <div>
            <Label>Cor Secundária</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={currentTenant.secondary_color || '#00B8D9'}
                onChange={(e) => updateTenantColor('secondary_color', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={currentTenant.secondary_color || '#00B8D9'}
                readOnly
                className="font-mono"
              />
            </div>
          </div>
        </div>
        
        {/* 3. DADOS DE CONTATO */}
        <div className="space-y-4">
          <div>
            <Label>Email de Contato (Export)</Label>
            <Input
              type="email"
              placeholder="export@metalifepilates.com.br"
              value={currentTenant.contact_email || ''}
              onChange={(e) => updateTenantField('contact_email', e.target.value)}
            />
          </div>
          
          <div>
            <Label>Telefone</Label>
            <Input
              placeholder="+55 12 0800-056-2467"
              value={currentTenant.contact_phone || ''}
              onChange={(e) => updateTenantField('contact_phone', e.target.value)}
            />
          </div>
          
          <div>
            <Label>Endereço Completo</Label>
            <Input
              placeholder="Rua X, 123 - Bairro - Cidade, Estado"
              value={currentTenant.address || ''}
              onChange={(e) => updateTenantField('address', e.target.value)}
            />
          </div>
        </div>
        
        {/* PREVIEW */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Preview (como aparece nas propostas):</h4>
          <div className="bg-white p-4 rounded border">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-12 mb-3" />
            )}
            <h3 className="font-bold" style={{ color: currentTenant.primary_color }}>
              {currentTenant.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              CNPJ: {currentTenant.cnpj}<br />
              {currentTenant.address}<br />
              {currentTenant.contact_email} | {currentTenant.contact_phone}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📄 **LOGO NAS PROPOSTAS (PDF):**

```typescript
// No generate-commercial-proposal Edge Function:

async function generateProposalPDF(data: ProposalData) {
  const pdf = new jsPDF();
  
  // 1️⃣ ADICIONAR LOGO (se existir)
  if (data.tenant.logo_url) {
    const logoImg = await loadImage(data.tenant.logo_url);
    pdf.addImage(logoImg, 'PNG', 10, 10, 50, 25); // Posição: canto superior esquerdo
  }
  
  // 2️⃣ CABEÇALHO COM CORES DO TENANT
  pdf.setFillColor(data.tenant.primary_color); // Verde MetaLife
  pdf.rect(0, 0, 210, 40, 'F'); // Faixa colorida no topo
  
  // 3️⃣ DADOS DA EMPRESA
  pdf.setTextColor(255, 255, 255); // Branco (sobre fundo colorido)
  pdf.setFontSize(18);
  pdf.text(data.tenant.name, 70, 20);
  
  pdf.setFontSize(10);
  pdf.text(`CNPJ: ${data.tenant.cnpj}`, 70, 28);
  pdf.text(data.tenant.address, 70, 33);
  
  // ... resto da proposta
}
```

---

## 🖼️ **LOGO NO HEADER DA PLATAFORMA:**

```typescript
// src/components/layout/AppLayout.tsx

import { useTenant } from '@/contexts/TenantContext';

export function AppLayout() {
  const { currentTenant } = useTenant();
  
  return (
    <div className="flex h-screen">
      {/* Sidebar com logo do tenant */}
      <aside className="w-64 border-r">
        <div className="p-4 border-b">
          {/* Logo do Tenant */}
          {currentTenant.logo_url ? (
            <img 
              src={currentTenant.logo_url} 
              alt={currentTenant.name}
              className="h-10 w-auto mb-2"
            />
          ) : (
            <div 
              className="h-10 w-full rounded flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentTenant.primary_color }}
            >
              {currentTenant.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          
          <h2 className="text-sm font-semibold text-muted-foreground">
            OLV Trade Intelligence
          </h2>
        </div>
        
        {/* Menu items */}
        <nav>...</nav>
      </aside>
      
      {/* Main content */}
      <main>...</main>
    </div>
  );
}
```

---

## 📧 **LOGO NOS EMAILS:**

```typescript
// Email template com logo do tenant

const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .header { 
      background-color: ${tenant.primary_color}; 
      padding: 20px; 
      text-align: center; 
    }
    .logo { 
      max-height: 60px; 
    }
  </style>
</head>
<body>
  <div class="header">
    ${tenant.logo_url ? `<img src="${tenant.logo_url}" class="logo" alt="${tenant.name}" />` : `<h1 style="color: white;">${tenant.name}</h1>`}
  </div>
  
  <div style="padding: 20px;">
    <p>Dear ${dealer.contact_name},</p>
    
    <p>Please find attached our commercial proposal...</p>
    
    <p>Best regards,<br />
    ${tenant.name} Export Team<br />
    ${tenant.contact_email}<br />
    ${tenant.contact_phone}</p>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 11px; color: #666;">
    ${tenant.name} | CNPJ: ${tenant.cnpj} | ${tenant.address}
  </div>
</body>
</html>
`;
```

---

## 🎨 PÁGINA DE CONFIGURAÇÃO

### Criar `src/pages/TenantSettingsPage.tsx`:

```typescript
import { TenantBrandingManager } from '@/components/admin/TenantBrandingManager';
import { WorkspaceConfigManager } from '@/components/admin/WorkspaceConfigManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TenantSettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Configurações da Empresa</h1>
      
      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">🎨 Branding</TabsTrigger>
          <TabsTrigger value="workspaces">📁 Workspaces</TabsTrigger>
          <TabsTrigger value="users">👥 Usuários</TabsTrigger>
          <TabsTrigger value="api">🔑 API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="branding">
          <TenantBrandingManager />
        </TabsContent>
        
        {/* Outras tabs */}
      </Tabs>
    </div>
  );
}
```

---

## 🚀 IMPLEMENTAÇÃO (Adicionar à FASE 6)

### FASE 6 Atualizada:

**6.1** CommercialProposalGenerator  
**6.2** Edge Function generate-commercial-proposal (com logo no PDF)  
**6.3** Tabela commercial_proposals  
**6.4** ProposalHistoryPage  
**6.5** TenantBrandingManager ← NOVO  
**6.6** TenantSettingsPage ← NOVO  
**6.7** Atualizar AppLayout com logo do tenant ← NOVO  

---

## 📋 CHECKLIST BRANDING

- [ ] Adicionar colunas na tabela `tenants` (logo_url, cores, contato)
- [ ] Criar bucket `tenant-logos` no Supabase Storage
- [ ] Criar TenantBrandingManager.tsx (upload logo, cores, contato)
- [ ] Criar TenantSettingsPage.tsx (página configurações)
- [ ] Atualizar AppLayout para mostrar logo do tenant
- [ ] Integrar logo na geração de PDF (propostas)
- [ ] Integrar logo nos emails automáticos
- [ ] Rota /settings (sidebar)

---

## 🎯 RESULTADO FINAL

**Quando MetaLife fizer upload do logo:**

1. ✅ Logo aparece no header da plataforma
2. ✅ Logo aparece em TODAS as propostas PDF
3. ✅ Logo aparece em TODOS os emails
4. ✅ Cores MetaLife aplicadas (verde #10B981)
5. ✅ Dados de contato nas propostas
6. ✅ 100% white-label (parece plataforma da MetaLife!)

**Quando Empresa X cadastrar depois:**
- ✅ Logo próprio
- ✅ Cores próprias
- ✅ Contatos próprios
- ✅ Isolamento total de dados

**Multi-tenant com branding independente!** 🎨


