import { useTenant, getWorkspaceIcon, getWorkspaceColor } from '@/contexts/TenantContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Globe, ShoppingCart, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// WORKSPACE ICONS (Lucide)
// ============================================================================

const WORKSPACE_ICONS = {
  domestic: Home,
  export: Globe,
  import: ShoppingCart,
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace, isLoading, error } = useTenant();

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-[280px]" />
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-[300px]">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Erro ao carregar workspaces
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // NO WORKSPACES
  // ============================================================================

  if (!workspaces || workspaces.length === 0) {
    return (
      <Alert className="max-w-[300px]">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Nenhum workspace disponível
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER SELECT
  // ============================================================================

  return (
    <Select
      value={currentWorkspace?.id || ''}
      onValueChange={switchWorkspace}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[280px] h-10 border-2 hover:border-primary/50 transition-colors">
        <SelectValue>
          {currentWorkspace ? (
            <div className="flex items-center gap-2">
              {/* Ícone */}
              {(() => {
                const Icon = WORKSPACE_ICONS[currentWorkspace.type];
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}

              {/* Nome */}
              <span className="font-medium truncate max-w-[160px]">
                {currentWorkspace.name}
              </span>

              {/* Badge tipo */}
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 ${getWorkspaceColor(currentWorkspace.type)}`}
              >
                {getWorkspaceIcon(currentWorkspace.type)} {currentWorkspace.type.toUpperCase()}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">Selecione um workspace...</span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {workspaces.map((workspace) => {
          const Icon = WORKSPACE_ICONS[workspace.type];

          return (
            <SelectItem key={workspace.id} value={workspace.id}>
              <div className="flex items-center gap-3 py-1">
                {/* Ícone */}
                <div className="flex-shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Nome + Descrição */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{workspace.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${getWorkspaceColor(workspace.type)}`}
                    >
                      {getWorkspaceIcon(workspace.type)} {workspace.type}
                    </Badge>
                  </div>

                  {workspace.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {workspace.description}
                    </p>
                  )}

                  {/* Target Countries */}
                  {workspace.target_countries && workspace.target_countries.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {workspace.target_countries.slice(0, 3).join(', ')}
                        {workspace.target_countries.length > 3 && ` +${workspace.target_countries.length - 3}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// COMPACT VERSION (para mobile/sidebar)
// ============================================================================

export function WorkspaceSwitcherCompact() {
  const { currentWorkspace, workspaces, switchWorkspace, isLoading } = useTenant();

  if (isLoading) {
    return <Skeleton className="h-8 w-[120px]" />;
  }

  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  return (
    <Select
      value={currentWorkspace?.id || ''}
      onValueChange={switchWorkspace}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[120px] h-8 text-xs border hover:border-primary/50">
        <SelectValue>
          {currentWorkspace ? (
            <div className="flex items-center gap-1">
              <span className="text-xs">{getWorkspaceIcon(currentWorkspace.type)}</span>
              <span className="truncate">{currentWorkspace.type}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Workspace</span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {workspaces.map((workspace) => {
          const Icon = WORKSPACE_ICONS[workspace.type];

          return (
            <SelectItem key={workspace.id} value={workspace.id} className="text-xs">
              <div className="flex items-center gap-2">
                <Icon className="h-3 w-3" />
                <span>{workspace.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

