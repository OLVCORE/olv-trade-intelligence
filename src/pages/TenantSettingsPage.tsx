import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantBrandingManager } from '@/components/admin/TenantBrandingManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, FolderTree, Users, Key } from 'lucide-react';

export default function TenantSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Configurações da Empresa
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie branding, workspaces, usuários e integrações
          </p>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="workspaces" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Workspaces
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BRANDING */}
        <TabsContent value="branding" className="mt-6">
          <TenantBrandingManager />
        </TabsContent>

        {/* TAB 2: WORKSPACES */}
        <TabsContent value="workspaces" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>
                Gerencie seus workspaces (Domestic, Export, Import)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-12">
                Gerenciamento de workspaces em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: USUÁRIOS */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>Gerencie os usuários da sua empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-12">
                Gerenciamento de usuários em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: API KEYS */}
        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Integrações</CardTitle>
              <CardDescription>
                Configure chaves de API externas (Apollo, Freightos, etc)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-12">
                Gerenciamento de API Keys em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

