import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowLeft, Home, Save } from 'lucide-react';

interface FloatingNavigationProps {
  onBack?: () => void;
  onHome?: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
  saveDisabled?: boolean;
  hasUnsavedChanges?: boolean;
}

/**
 * 🎯 COMPONENTE REUTILIZÁVEL - NAVEGAÇÃO FLUTUANTE
 * 
 * Features:
 * - Botão flutuante "Voltar ao Topo" (fixo como WhatsApp)
 * - Barra de navegação Voltar/Home/Salvar
 * - Aparece apenas quando há conteúdo renderizado
 * - Usado nas 9 abas do relatório TOTVS
 */
export function FloatingNavigation({
  onBack,
  onHome,
  onSave,
  showSaveButton = false,
  saveDisabled = false,
  hasUnsavedChanges = false,
}: FloatingNavigationProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Mostrar botão "Topo" apenas após scroll de 300px
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 🎯 BOTÃO FLUTUANTE - VOLTAR AO TOPO (fixo como WhatsApp) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 animate-bounce hover:animate-none"
          title="Voltar ao topo"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* 🎯 BARRA DE NAVEGAÇÃO - VOLTAR/HOME/SALVAR */}
      <div className="flex items-center justify-between gap-2 p-3 bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg border-2 border-slate-300 dark:border-slate-700 shadow-md mb-4">
        {/* GRUPO ESQUERDO: Navegação */}
        <div className="flex gap-2">
          {onBack && (
            <Button 
              onClick={onBack}
              variant="outline" 
              size="sm" 
              className="gap-2 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
          
          {onHome && (
            <Button 
              onClick={onHome}
              variant="ghost" 
              size="sm" 
              className="gap-2"
            >
              <Home className="w-4 h-4" /> Início
            </Button>
          )}
        </div>

        {/* GRUPO DIREITO: Ações */}
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
              ⚠️ Alterações não salvas
            </span>
          )}
          
          {showSaveButton && onSave && (
            <Button
              onClick={onSave}
              disabled={saveDisabled}
              size="sm"
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 font-bold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" /> Salvar Relatório
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

