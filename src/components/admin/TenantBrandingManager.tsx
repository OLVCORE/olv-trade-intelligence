import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Palette, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// COMPONENT
// ============================================================================

export function TenantBrandingManager() {
  const { currentTenant, refreshTenantData } = useTenant();
  
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentTenant?.logo_url || null);

  // Local state para edição (antes de salvar)
  const [formData, setFormData] = useState({
    primary_color: currentTenant?.primary_color || '#10B981',
    secondary_color: currentTenant?.secondary_color || '#059669',
    contact_email: currentTenant?.contact_email || '',
    contact_phone: currentTenant?.contact_phone || '',
    address: currentTenant?.address || '',
    city: currentTenant?.city || '',
    state: currentTenant?.state || '',
    zip_code: currentTenant?.zip_code || '',
  });

  // ============================================================================
  // UPLOAD LOGO
  // ============================================================================

  const handleLogoUpload = async () => {
    if (!logoFile || !currentTenant) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload para Supabase Storage
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${currentTenant.id}/logo.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true, // Sobrescreve se já existe
        });

      if (uploadError) throw uploadError;

      console.log('[BRANDING] Logo enviado para Storage:', fileName);

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage.from('tenant-logos').getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      console.log('[BRANDING] 📸 URL pública:', publicUrl);

      // 3. Atualizar tenant no banco
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', currentTenant.id);

      if (updateError) throw updateError;

      setLogoPreview(publicUrl);
      await refreshTenantData(); // Atualizar contexto

      toast.success('Logo atualizado com sucesso!', {
        description: 'O logo será exibido no header e nas propostas',
      });
    } catch (error: any) {
      console.error('[BRANDING] Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do logo', {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================================
  // HANDLE FILE CHANGE
  // ============================================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo inválido', {
        description: 'Selecione uma imagem (PNG, JPG, SVG)',
      });
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'Tamanho máximo: 2MB',
      });
      return;
    }

    setLogoFile(file);

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success('Arquivo selecionado', {
      description: 'Clique em "Upload Logo" para salvar',
    });
  };

  // ============================================================================
  // UPDATE TENANT DATA
  // ============================================================================

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant) throw new Error('Tenant não identificado');

      const { error } = await supabase
        .from('tenants')
        .update(formData)
        .eq('id', currentTenant.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshTenantData();
      toast.success('Dados atualizados!', {
        description: 'Branding salvo com sucesso',
      });
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar', {
        description: error.message,
      });
    },
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!currentTenant) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Tenant não identificado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding da Empresa
          </CardTitle>
          <CardDescription>
            Configure logo, cores corporativas e dados de contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. LOGO */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4" />
              Logo da Empresa
            </Label>
            <div className="flex items-start gap-4">
              {/* Preview do logo */}
              <div className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                ) : (
                  <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
                )}
              </div>

              {/* Upload */}
              <div className="flex-1 space-y-3">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  📸 Formatos: PNG, JPG, SVG | Máx: 2MB | Recomendado: 400×200px
                </p>
                <Button onClick={handleLogoUpload} disabled={!logoFile || isUploading} size="sm">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 2. CORES CORPORATIVAS */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4" />
              Cores Corporativas
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Cor Primária</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="font-mono text-xs"
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Cor Secundária</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    className="w-16 h-10 cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    className="font-mono text-xs"
                    placeholder="#059669"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. DADOS DE CONTATO */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4" />
              Dados de Contato (Export)
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Email de Contato</Label>
                <Input
                  type="email"
                  placeholder="export@metalifepilates.com.br"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs">Telefone</Label>
                <Input
                  placeholder="+55 12 0800-056-2467"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 4. ENDEREÇO */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              Endereço Completo
            </Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Endereço</Label>
                <Input
                  placeholder="Estrada Municipal Taubaté-Pinda, KM 8"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input
                    placeholder="Taubaté"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Estado</Label>
                  <Input
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label className="text-xs">CEP</Label>
                  <Input
                    placeholder="12062-000"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full gap-2"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Salvar Branding
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* PREVIEW */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview (Como aparece nas propostas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="bg-white dark:bg-slate-900 p-6 rounded-lg border-4"
            style={{ borderColor: formData.primary_color }}
          >
            {/* Logo */}
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-16 mb-4" />
            )}

            {/* Nome da empresa com cor primária */}
            <h3 className="text-2xl font-bold mb-2" style={{ color: formData.primary_color }}>
              {currentTenant.name}
            </h3>

            {/* Dados */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>CNPJ:</strong> {currentTenant.cnpj}
              </p>
              {formData.address && (
                <p>
                  <strong>Endereço:</strong> {formData.address}
                </p>
              )}
              {formData.city && formData.state && (
                <p>
                  {formData.city}, {formData.state} - CEP {formData.zip_code || 'N/A'}
                </p>
              )}
              {formData.contact_email && (
                <p>
                  <strong>Email:</strong> {formData.contact_email}
                </p>
              )}
              {formData.contact_phone && (
                <p>
                  <strong>Telefone:</strong> {formData.contact_phone}
                </p>
              )}
            </div>

            {/* Faixa com cor secundária */}
            <div
              className="mt-4 p-3 rounded text-white text-center font-semibold"
              style={{ backgroundColor: formData.secondary_color }}
            >
              COMMERCIAL PROPOSAL
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

