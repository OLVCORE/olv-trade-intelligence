import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  Image,
  FileText,
  Video,
  Presentation,
  Download,
  Eye,
  Search,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

interface MarketingMaterialsLibraryProps {
  dealerId?: string; // Se fornecido, mostra apenas materiais permitidos para esse dealer
}

export function MarketingMaterialsLibrary({ dealerId }: MarketingMaterialsLibraryProps) {
  const { currentTenant } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar materiais
  const { data: materials, isLoading } = useQuery({
    queryKey: ['marketing-materials', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return [];

      let query = supabase
        .from('marketing_materials')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      // Se for dealer, filtrar apenas materiais públicos ou permitidos
      if (dealerId) {
        query = query.or(`is_public.eq.true,allowed_dealers.cs.{${dealerId}}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTenant,
  });

  // Filtrar por busca
  const filteredMaterials = materials?.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ícone por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brochure':
      case 'catalog':
        return FileText;
      case 'video':
        return Video;
      case 'presentation':
        return Presentation;
      case 'banner':
      case 'social_media':
        return Image;
      default:
        return FileText;
    }
  };

  // Badge de tipo
  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      brochure: 'Brochure',
      catalog: 'Catálogo',
      video: 'Vídeo',
      presentation: 'Apresentação',
      banner: 'Banner',
      social_media: 'Social Media',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Biblioteca de Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid de Materiais */}
        {filteredMaterials && filteredMaterials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => {
              const TypeIcon = getTypeIcon(material.type);

              return (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Thumbnail */}
                    <div className="bg-muted rounded-lg h-32 flex items-center justify-center mb-3">
                      {material.thumbnail_url ? (
                        <img
                          src={material.thumbnail_url}
                          alt={material.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <TypeIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight">{material.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getTypeBadge(material.type)}
                        </Badge>
                      </div>

                      {material.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {material.description}
                        </p>
                      )}

                      {/* Métricas */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {material.views_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {material.downloads_count || 0}
                        </span>
                        {material.language && (
                          <Badge variant="secondary" className="text-xs">
                            {material.language.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(material.file_url, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            window.open(material.file_url, '_blank');
                            // Incrementar contador de downloads
                            supabase
                              .from('marketing_materials')
                              .update({ downloads_count: (material.downloads_count || 0) + 1 })
                              .eq('id', material.id)
                              .then(() => refetch());
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum material encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

