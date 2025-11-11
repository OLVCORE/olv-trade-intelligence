import { ProductCatalogManager } from '@/components/admin/ProductCatalogManager';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function ProductCatalogPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os produtos do seu catálogo. Importe do seu site ou adicione manualmente.
          </p>
        </div>
      </div>

      {/* CATALOG MANAGER */}
      <ProductCatalogManager />
    </div>
  );
}

