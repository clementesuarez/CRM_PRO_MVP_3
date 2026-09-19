import React, { useState, useEffect, useRef } from 'react';
import { Search, Car, Check, ChevronRight, Loader2, Edit3 } from 'lucide-react';
import { CatalogoVehiculoItem } from '../data/catalogoVehicular';
import { dataService } from '../services/dataService';

interface VehicleAutocompleteProps {
  onSelect: (item: CatalogoVehiculoItem) => void;
  onManualToggle?: () => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
  required?: boolean;
}

export const VehicleAutocomplete: React.FC<VehicleAutocompleteProps> = ({
  onSelect,
  onManualToggle,
  placeholder = 'Ej: Amarok V6, Cronos 1.3, Hilux SRX...',
  initialValue = '',
  className = '',
  required = false
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<CatalogoVehiculoItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (initialValue !== undefined) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Búsqueda predictiva con debounce estricto de 250ms
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await dataService.searchCatalogo(trimmed);
        setSuggestions(results);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Error al buscar en catálogo:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectItem(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: CatalogoVehiculoItem) => {
    setQuery(item.version_completa);
    setIsOpen(false);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 pr-20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
        />
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute left-3 top-3" />
        ) : (
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        )}

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Limpiar
            </button>
          )}
          {onManualToggle && (
            <button
              type="button"
              onClick={onManualToggle}
              className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded font-bold cursor-pointer transition"
              title="Cargar ficha sin catálogo"
            >
              Manual
            </button>
          )}
        </div>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto divide-y divide-slate-800">
          <div className="px-3 py-1.5 bg-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-400" /> Catálogo Predictivo DNRPA ($0 Cost)
            </span>
            <span>{isSearching ? 'Buscando...' : 'Usa ↑↓ y Enter'}</span>
          </div>

          {suggestions.length === 0 && !isSearching ? (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-slate-400">
                No se encontró coincidencia para <strong className="text-slate-200">"{query}"</strong> en el catálogo.
              </p>
              {onManualToggle && (
                <button
                  type="button"
                  onClick={onManualToggle}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition flex items-center gap-1.5 mx-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Cargar manualmente esta unidad
                </button>
              )}
            </div>
          ) : (
            suggestions.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3.5 py-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-amber-500/20 text-white' : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-amber-400">{item.marca}</span>
                      <span className="text-white text-sm font-medium truncate">{item.version_completa}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                        {item.tipo}
                      </span>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded font-medium ${
                        item.origen === 'Nacional' 
                          ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' 
                          : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                      }`}>
                        {item.origen}
                      </span>
                      {item.anios_disponibles && item.anios_disponibles.length > 0 && (
                        <span className="text-[11px] text-slate-400 truncate">
                          Años: {item.anios_disponibles[0]} - {item.anios_disponibles[item.anios_disponibles.length - 1]}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'}`} />
                </div>
              );
            })
          )}

          {/* Footer con acceso rápido a carga manual */}
          {onManualToggle && suggestions.length > 0 && (
            <div
              onClick={onManualToggle}
              className="p-2.5 bg-slate-950 hover:bg-slate-900 text-center text-xs text-amber-300 border-t border-slate-800 cursor-pointer flex items-center justify-center gap-1.5 font-bold transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              ¿Unidad no catalogada? Cargar manualmente
            </div>
          )}
        </div>
      )}
    </div>
  );
};
