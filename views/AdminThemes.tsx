
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getThemes, saveTheme } from '../services/storageService';
import { Theme } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { Plus, Code, Sun, Moon, Save, Edit2, ArrowLeft, X, Copy, Check, Palette, LayoutDashboard, BarChart3, FormInput, Pipette } from 'lucide-react';
import { DEFAULT_THEME_CSS } from '../constants';
import { toast } from 'sonner';

interface AdminThemesProps {
  currentTheme: Theme;
  onThemeUpdate: (theme: Theme) => void;
  setGlobalDarkMode: (isDark: boolean) => void;
}

// --- Helper Functions ---

const parseCssString = (css: string): { light: Record<string,string>, dark: Record<string,string> } => {
  const lightVars: Record<string, string> = {};
  const darkVars: Record<string, string> = {};

  const rootMatch = css.match(/:root\s*{([^}]*)}/);
  if (rootMatch) {
    rootMatch[1].split(';').forEach(line => {
      const [key, val] = line.split(':');
      if (key && val) lightVars[key.trim()] = val.trim();
    });
  }

  const darkMatch = css.match(/\.dark\s*{([^}]*)}/);
  if (darkMatch) {
     darkMatch[1].split(';').forEach(line => {
       const [key, val] = line.split(':');
       if (key && val) darkVars[key.trim()] = val.trim();
     });
  }

  return { light: lightVars, dark: darkVars };
};

const generateCssString = (theme: Theme): string => {
   const light = Object.entries(theme.cssVars.light).map(([k,v]) => `  ${k}: ${v};`).join('\n');
   const dark = Object.entries(theme.cssVars.dark).map(([k,v]) => `  ${k}: ${v};`).join('\n');
   return `:root {\n${light}\n}\n\n.dark {\n${dark}\n}`;
};

// --- Sub-Components ---

const AdvancedColorPickerPopover: React.FC<{ 
  color: string, 
  onChange: (val: string) => void, 
  onClose: () => void,
  variableName: string
}> = ({ color, onChange, onClose, variableName }) => {
  const [localColor, setLocalColor] = useState(color);

  // Debounce effect to avoid lag on drag, but update parent
  useEffect(() => {
     onChange(localColor);
  }, [localColor]);

  // Use EyeDropper API if available
  const handleEyeDropper = async () => {
    if (!(window as any).EyeDropper) {
      toast.error('Twoja przeglądarka nie obsługuje pipety.');
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      setLocalColor(result.sRGBHex);
    } catch (e) {
      // User canceled
    }
  };

  return (
    <div className="absolute left-10 top-0 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-xl p-3 w-[280px] animate-fade-in flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 mb-1">
        <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)] truncate max-w-[180px]">{variableName}</span>
        <button onClick={onClose} className="hover:bg-[var(--color-surface-highlight)] p-1 rounded"><X size={14}/></button>
      </div>
      
      {/* Native Color Picker Styled as Custom */}
      <div className="w-full h-32 rounded-lg overflow-hidden relative cursor-pointer border border-[var(--color-border)] group">
         <input 
            type="color" 
            value={localColor.length === 7 ? localColor : '#000000'}
            onChange={(e) => setLocalColor(e.target.value)}
            className="absolute inset-0 w-[150%] h-[150%] -left-[25%] -top-[25%] p-0 border-0 cursor-pointer opacity-0"
         />
         <div className="w-full h-full" style={{ backgroundColor: localColor }}></div>
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
               Kliknij, aby zmienić
            </span>
         </div>
      </div>

      {/* Inputs Row */}
      <div className="flex gap-2 items-center">
         <div className="flex-1 relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-secondary)] font-bold">#</span>
            <input 
               className="w-full pl-5 pr-2 py-1.5 text-xs bg-[var(--color-input)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] uppercase"
               value={localColor.replace('#', '')}
               onChange={(e) => setLocalColor(`#${e.target.value}`)}
               maxLength={6}
            />
         </div>
         <button onClick={handleEyeDropper} className="p-2 bg-[var(--color-surface-highlight)] hover:bg-[var(--color-border)] rounded border border-[var(--color-border)]" title="Pobierz kolor z ekranu">
            <Pipette size={14} />
         </button>
      </div>

      {/* Preset Swatches (Quick Colors) */}
      <div>
         <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] mb-1 block">Szybki Wybór</span>
         <div className="flex flex-wrap gap-1.5">
            {['#FFFFFF', '#000000', '#32FFDC', '#FDD792', '#A581D4', '#FF6B6B', '#84705B', '#232B32', '#F5F4ED', '#60A5FA', '#10B981'].map(c => (
               <button 
                  key={c}
                  className="w-5 h-5 rounded-md border border-[var(--color-border)] hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  onClick={() => setLocalColor(c)}
               />
            ))}
         </div>
      </div>
    </div>
  );
};

const VariableRow: React.FC<{ name: string, value: string, onChange: (val: string) => void }> = ({ name, value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isColor = value.includes('#') || value.includes('rgb') || value.includes('hsl') || value.includes('oklch');

  return (
    <div ref={containerRef} className={`flex items-center gap-2 py-1 px-2 hover:bg-[var(--color-surface-highlight)] rounded group relative transition-colors ${showPicker ? 'bg-[var(--color-surface-highlight)]' : ''}`}>
       {/* Color Swatch */}
       <div 
         className="w-6 h-6 rounded border border-[var(--color-border)] flex-shrink-0 cursor-pointer shadow-sm hover:scale-110 transition-transform bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwYXRoIGQ9Ik0wIDBoNHY0SDB6IiBmaWxsPSIjY2NjIiAvPjxwYXRoIGQ9Ik00IDBoNHY0SDR6IiBmaWxsPSIjZmZmIiAvPjxwYXRoIGQ9Ik0wIDRoNHY0SDB6IiBmaWxsPSIjZmZmIiAvPjxwYXRoIGQ9Ik00IDRoNHY0SDR6IiBmaWxsPSIjY2NjIiAvPjwvc3ZnPg==')]"
         onClick={() => setShowPicker(!showPicker)}
       >
          <div className="w-full h-full" style={{ backgroundColor: value }}></div>
       </div>

       {/* Name & Value */}
       <div className="flex-1 min-w-0 flex flex-col cursor-pointer" onClick={() => setShowPicker(!showPicker)}>
          <span className="text-[10px] font-mono text-[var(--color-text-secondary)] truncate group-hover:text-[var(--color-primary)] transition-colors" title={name}>{name}</span>
          <span className="text-[11px] font-bold truncate text-[var(--color-text-main)]" title={value}>{value}</span>
       </div>

       {/* Popover */}
       {showPicker && (
          <AdvancedColorPickerPopover 
             color={value} 
             variableName={name}
             onChange={onChange} 
             onClose={() => setShowPicker(false)} 
          />
       )}
    </div>
  );
};

// --- Live Preview Component ---
const LivePreview = () => {
   return (
      <div className="h-full bg-[var(--color-background)] text-[var(--color-text-main)] p-6 overflow-y-auto custom-scrollbar rounded-xl border-2 border-[var(--color-border)] shadow-inner transition-colors duration-300">
         <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Mock */}
            <div className="flex items-center justify-between pb-6 border-b border-[var(--color-border)]">
               <div>
                  <h1 className="text-3xl font-bold">Podgląd Motywu</h1>
                  <p className="text-[var(--color-text-secondary)]">Weryfikacja spójności kolorystycznej.</p>
               </div>
               <div className="flex gap-2">
                  <Button>Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
               </div>
            </div>

            {/* Dashboard Grid Mock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                        <LayoutDashboard size={20}/>
                     </div>
                     <Badge variant="success">+12%</Badge>
                  </div>
                  <div className="text-3xl font-bold">1,234</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">Aktywni Użytkownicy</div>
               </Card>
               <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 rounded-lg bg-[var(--color-chart-2)] text-[var(--color-text-main)]">
                        <BarChart3 size={20}/>
                     </div>
                     <Badge variant="warning">Uwaga</Badge>
                  </div>
                  <div className="text-3xl font-bold">42</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">Oczekujące Zadania</div>
               </Card>
               <Card className="p-6 bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 rounded-lg bg-white/20">
                        <Palette size={20}/>
                     </div>
                  </div>
                  <div className="text-3xl font-bold">Primary</div>
                  <div className="text-xs opacity-80">Karta z tłem głównym</div>
               </Card>
            </div>

            {/* Form Mock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card>
                  <h3 className="font-bold mb-4 flex items-center gap-2"><FormInput size={16}/> Formularz</h3>
                  <div className="space-y-4">
                     <Input label="Przykładowy Input" placeholder="Wpisz tekst..." />
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Data" type="date" />
                        <div className="flex flex-col gap-2 w-full">
                           <label className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] font-bold ml-1">Select</label>
                           <select className="bg-[var(--color-input)] border-2 border-transparent rounded-[var(--radius-input)] px-4 py-3 text-[var(--color-text-main)] outline-none">
                              <option>Opcja 1</option>
                              <option>Opcja 2</option>
                           </select>
                        </div>
                     </div>
                     <div className="flex gap-2 justify-end">
                        <Button variant="ghost">Anuluj</Button>
                        <Button variant="danger">Usuń</Button>
                        <Button>Zapisz</Button>
                     </div>
                  </div>
               </Card>

               {/* Typography & Elements */}
               <Card>
                  <h3 className="font-bold mb-4">Typografia i Elementy</h3>
                  <div className="space-y-4">
                     <p className="text-sm text-[var(--color-text-secondary)]">
                        To jest tekst poboczny (muted-foreground). Używany do opisów i mniej ważnych informacji.
                     </p>
                     <p className="text-base text-[var(--color-text-main)]">
                        To jest główny tekst. Powinien być czytelny na tle (background/surface).
                     </p>
                     <div className="flex flex-wrap gap-2">
                        <Badge variant="primary">Primary</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="danger">Danger</Badge>
                     </div>
                     <div className="h-4 w-full bg-[var(--color-secondary)] rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-[var(--color-primary)]"></div>
                     </div>
                     <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
                        <span className="text-xs font-mono">Border color test</span>
                     </div>
                  </div>
               </Card>
            </div>
         </div>
      </div>
   );
};

// --- Main Component ---

export const AdminThemes: React.FC<AdminThemesProps> = ({ currentTheme, onThemeUpdate, setGlobalDarkMode }) => {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [themes, setThemes] = useState<Theme[]>([]);
  
  // Edit State
  const [editingTheme, setEditingTheme] = useState<Theme>(currentTheme);
  const [activeModeForEdit, setActiveModeForEdit] = useState<'light' | 'dark'>('light');
  
  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  
  const [showCssModal, setShowCssModal] = useState<Theme | null>(null);

  useEffect(() => {
    getThemes().then(setThemes);
  }, []);

  // --- Handlers ---

  const handleCreate = () => {
     // DEEP COPY to ensure we break reference from the imported constant
     const base = JSON.parse(JSON.stringify(DEFAULT_THEME_CSS));
     const newT: Theme = { 
         ...base, 
         id: crypto.randomUUID(), 
         name: 'Nowy Motyw',
         cssVars: base.cssVars || { light: {}, dark: {} } 
     };
     setEditingTheme(newT);
     setMode('edit');
     onThemeUpdate(newT);
  };

  const handleDuplicate = () => {
      // Create a DEEP copy of the current editing theme to serve as a new independent theme
      const dup = JSON.parse(JSON.stringify(editingTheme));
      dup.id = crypto.randomUUID();
      dup.name = `${dup.name} (Kopia)`;
      setEditingTheme(dup);
      toast.info("Utworzono kopię. Dostosuj i zapisz.");
  };

  const handleEditClick = (theme: Theme) => {
    setEditingTheme(JSON.parse(JSON.stringify(theme))); // Deep copy
    setMode('edit');
    onThemeUpdate(theme); // Apply immediately for preview
    // Auto-set dark mode based on edit mode
    setGlobalDarkMode(activeModeForEdit === 'dark');
  };

  const handleApplyTheme = (theme: Theme, isDark: boolean) => {
    onThemeUpdate(theme);
    setGlobalDarkMode(isDark);
  };

  const handleSaveClick = async () => {
     // Check if ID already exists in DB
     const currentThemes = await getThemes();
     const existing = currentThemes.find(t => t.id === editingTheme.id);
     
     if (existing) {
        // Update existing
        await saveTheme(editingTheme);
        const updated = await getThemes();
        setThemes(updated);
        toast.success('Motyw zaktualizowany');
     } else {
        // It's a new ID, so ask for a name to create it
        setNewThemeName(editingTheme.name);
        setShowSaveModal(true);
     }
  };

  const confirmSaveNew = async () => {
     if(!newThemeName) return toast.error('Podaj nazwę');
     const newTheme = { ...editingTheme, name: newThemeName };
     setEditingTheme(newTheme); // Update local state
     await saveTheme(newTheme);
     const updated = await getThemes();
     setThemes(updated);
     setShowSaveModal(false);
     toast.success('Nowy motyw zapisany');
  };

  const handleVarChange = (key: string, value: string) => {
    const updated = {
      ...editingTheme,
      cssVars: {
        ...editingTheme.cssVars,
        [activeModeForEdit]: {
          ...editingTheme.cssVars[activeModeForEdit],
          [key]: value
        }
      }
    };
    setEditingTheme(updated);
    onThemeUpdate(updated); // Live preview update
  };

  const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast.success('Skopiowano do schowka');
  };

  // --- Views ---

  if (mode === 'list') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-1">Motywy</h2>
            <p className="text-[var(--color-text-secondary)]">Zarządzaj wyglądem aplikacji (CSS Variables).</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}><Plus size={20} /> Stwórz Nowy</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {themes.map(theme => (
            <Card key={theme.id} className="relative overflow-hidden group border border-[var(--color-border)] flex flex-col justify-between">
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="text-xl font-bold truncate pr-2">{theme.name}</h3>
                   <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{background: theme.cssVars.light['--primary']}}></div>
                      <div className="w-4 h-4 rounded-full border border-gray-200" style={{background: theme.cssVars.light['--background']}}></div>
                   </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="flex-1 bg-white text-black hover:bg-gray-100 border border-gray-200" onClick={() => handleApplyTheme(theme, false)}>
                         <Sun size={14} /> Jasny
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 bg-slate-900 text-white hover:bg-slate-800" onClick={() => handleApplyTheme(theme, true)}>
                         <Moon size={14} /> Ciemny
                      </Button>
                   </div>
                   <div className="flex gap-2 mt-2">
                      <Button size="sm" className="flex-1" onClick={() => handleEditClick(theme)}>
                         <Edit2 size={14} className="mr-1" /> Edytuj
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setShowCssModal(theme)} title="Pokaż CSS">
                         <Code size={14} /> CSS
                      </Button>
                   </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CSS Modal */}
        {showCssModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col p-0">
                 <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                    <h3 className="font-bold">Kod CSS: {showCssModal.name}</h3>
                    <button onClick={() => setShowCssModal(null)}><X size={20}/></button>
                 </div>
                 <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 text-gray-300 font-mono text-xs custom-scrollbar relative group">
                    <pre>{generateCssString(showCssModal)}</pre>
                    <button 
                       onClick={() => copyToClipboard(generateCssString(showCssModal))}
                       className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <Copy size={16}/>
                    </button>
                 </div>
              </Card>
           </div>
        )}
      </div>
    );
  }

  // --- EDIT MODE ---
  const varsToEdit = editingTheme.cssVars?.[activeModeForEdit] || {};

  // Group variables for cleaner UI
  const groups = {
     'Colors: Base': ['--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground'],
     'Colors: Brand': ['--primary', '--primary-foreground', '--secondary', '--secondary-foreground', '--accent', '--accent-foreground'],
     'Colors: UI': ['--muted', '--muted-foreground', '--border', '--input', '--ring'],
     'Colors: Status': ['--destructive', '--destructive-foreground', '--success', '--warning'],
     'Charts': ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'],
     'Sidebar': Object.keys(varsToEdit).filter(k => k.startsWith('--sidebar')),
     'System': Object.keys(varsToEdit).filter(k => !k.startsWith('--sidebar') && !['--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground', '--primary', '--primary-foreground', '--secondary', '--secondary-foreground', '--accent', '--accent-foreground', '--muted', '--muted-foreground', '--border', '--input', '--ring', '--destructive', '--destructive-foreground', '--success', '--warning', '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'].includes(k))
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
       
       {/* Top Bar */}
       <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
             <Button variant="ghost" onClick={() => setMode('list')}><ArrowLeft size={18} className="mr-2"/> Wróć</Button>
             <div>
                <h2 className="text-xl font-bold">{editingTheme.name || 'Edycja Motywu'}</h2>
                <div className="flex gap-2 mt-1">
                   <button 
                      onClick={() => { setActiveModeForEdit('light'); setGlobalDarkMode(false); }}
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${activeModeForEdit === 'light' ? 'bg-white text-black shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}
                   >
                      <Sun size={12}/> Jasny
                   </button>
                   <button 
                      onClick={() => { setActiveModeForEdit('dark'); setGlobalDarkMode(true); }}
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${activeModeForEdit === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'}`}
                   >
                      <Moon size={12}/> Ciemny
                   </button>
                </div>
             </div>
          </div>
          <div className="flex gap-2">
             <Button variant="secondary" onClick={handleDuplicate} title="Zapisz jako nowy motyw"><Copy size={18} className="mr-2"/> Duplikuj</Button>
             <Button onClick={handleSaveClick} className="bg-[var(--color-success)]"><Save size={18} className="mr-2"/> Zapisz Motyw</Button>
          </div>
       </div>

       <div className="flex flex-1 gap-6 min-h-0">
          
          {/* LEFT COLUMN: Compact Variable Editor */}
          <Card className="w-80 flex flex-col p-0 overflow-hidden border border-[var(--color-border)] shadow-lg flex-shrink-0">
             <div className="p-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] font-bold text-xs uppercase text-[var(--color-text-secondary)]">
                Zmienne ({activeModeForEdit === 'light' ? 'Jasny' : 'Ciemny'})
             </div>
             <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-[var(--color-background)]">
                {Object.entries(groups).map(([groupName, keys]) => {
                   // Filter keys that actually exist in varsToEdit
                   const validKeys = keys.filter(k => varsToEdit[k] !== undefined);
                   if (validKeys.length === 0) return null;

                   return (
                      <div key={groupName} className="mb-4">
                         <div className="text-[10px] font-bold text-[var(--color-primary)] uppercase mb-1 px-2 opacity-70">{groupName}</div>
                         <div className="space-y-0.5">
                            {validKeys.map(key => (
                               <VariableRow 
                                  key={key} 
                                  name={key} 
                                  value={varsToEdit[key]} 
                                  onChange={(val) => handleVarChange(key, val)} 
                               />
                            ))}
                         </div>
                      </div>
                   );
                })}
             </div>
          </Card>

          {/* RIGHT COLUMN: Live Preview */}
          <div className="flex-1 min-w-0">
             <LivePreview />
          </div>
       </div>

       {/* Save Name Modal */}
       {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
             <Card className="w-full max-w-sm animate-fade-in">
                <h3 className="text-xl font-bold mb-4">Zapisz Nowy Motyw</h3>
                <Input 
                   label="Nazwa Motywu" 
                   value={newThemeName} 
                   onChange={e => setNewThemeName(e.target.value)} 
                   placeholder="np. Neon Future"
                   autoFocus
                />
                <div className="flex justify-end gap-2 mt-6">
                   <Button variant="ghost" onClick={() => setShowSaveModal(false)}>Anuluj</Button>
                   <Button onClick={confirmSaveNew}>Zapisz</Button>
                </div>
             </Card>
          </div>
       )}
    </div>
  );
};
