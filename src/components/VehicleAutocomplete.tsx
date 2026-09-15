import React, { useState, useEffect, useRef } from 'react';
import { Search, Car, Check, ChevronRight } from 'lucide-react';
import { CatalogoVehiculoItem, buscarEnCatalogo } from '../data/catalogoVehicular';

interface VehicleAutocompleteProps {
  onSelect: (item: CatalogoVehiculoItem) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
  required?: boolean;
}

export const VehicleAutocomplete: React.FC<VehicleAutocompleteProps> = ({
  onSelect,
  placeholder = 'Ej: Amarok V6, Cronos 1.3, Hilux SRX...',
  initialValue = '',
  className = '',
  required = false
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<CatalogoVehiculoItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue !== undefined) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      const results = buscarEnCatalogo(trimmed, 7);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
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
            if (query.trim().length >= 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto divide-y divide-slate-800">
          <div className="px-3 py-1.5 bg-slate-800/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-400" /> Catálogo Predictivo Argentina ($0 Cost)
            </span>
            <span>Usa flechas ↑↓ y Enter</span>
          </div>

          {suggestions.map((item, index) => {
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
                    <span className="text-[11px] text-slate-400 truncate">
                      Años sugeridos: {item.anios_disponibles[0]} - {item.anios_disponibles[item.anios_disponibles.length - 1]}
                    </span>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
