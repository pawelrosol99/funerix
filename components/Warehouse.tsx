
import React, { useState, useEffect, useRef } from 'react';
import { WarehouseItem, WarehouseCategory, WarehouseItemType, ServiceUnit, Manufacturer } from '../types';
import { Card, Button, Input, Badge } from './UI';
import { 
  getWarehouseCategories, saveWarehouseCategory, deleteWarehouseCategory,
  getWarehouseItems, saveWarehouseItem, deleteWarehouseItem, getManufacturers
} from '../services/storageService';
import { 
  Package, LayoutGrid, Table as TableIcon, Plus, 
  Trash2, Edit2, Search, Filter, ChevronRight, ChevronDown, 
  Folder, FolderOpen, Image as ImageIcon, Briefcase, Save, X, Upload, Copy,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseProps {
  companyId: string;
  currentBranchId?: string | 'all';
}

const SERVICE_UNITS: { value: ServiceUnit, label: string }[] = [
   { value: 'hour', label: 'Godzina' },
   { value: 'day', label: 'Doba' },
   { value: 'km', label: 'Kilometr' },
   { value: 'piece', label: 'Sztuka' },
];

type SortField = 'name' | 'salesPrice' | 'manufacturer';
type SortOrder = 'asc' | 'desc';

export const Warehouse: React.FC<WarehouseProps> = ({ companyId, currentBranchId = 'all' }) => {
  const [activeTab, setActiveTab] = useState<WarehouseItemType>('product');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Data State
  const [categories, setCategories] = useState<WarehouseCategory[]>([]);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Edit/Add State
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<WarehouseItem> | null>(null);

  // Multi-Add State
  const [showMultiAdd, setShowMultiAdd] = useState(false);
  const [multiAddCategory, setMultiAddCategory] = useState('');
  const [multiAddSubCategory, setMultiAddSubCategory] = useState('');
  const [multiUploadItems, setMultiUploadItems] = useState<Partial<WarehouseItem>[]>([]);

  // Category Management State
  const [newCatName, setNewCatName] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);

  useEffect(() => {
     loadData();
  }, [companyId, activeTab, currentBranchId]);

  const loadData = async () => {
     setCategories(await getWarehouseCategories(companyId, activeTab));
     
     let allItems = await getWarehouseItems(companyId, activeTab);
     // Filter by branch
     if (currentBranchId !== 'all') {
        allItems = allItems.filter(i => !i.branchId || i.branchId === currentBranchId);
     }
     setItems(allItems);
     
     setManufacturers(await getManufacturers());
  };

  const handleSaveItem = async (e?: React.FormEvent) => {
     if(e) e.preventDefault();
     if(!editingItem?.name) return toast.error('Nazwa jest wymagana');
     if(!editingItem.categoryId) return toast.error('Kategoria jest wymagana');

     const branchIdToSave = currentBranchId !== 'all' ? currentBranchId : undefined;

     await saveWarehouseItem({
        ...editingItem,
        companyId,
        type: activeTab,
        branchId: branchIdToSave
     } as any);
     
     setShowAddForm(false);
     setEditingItem(null);
     await loadData();
     toast.success('Zapisano pomyślnie');
  };

  const handleDeleteItem = async (id: string) => {
     if(confirm('Usunąć element?')) {
        await deleteWarehouseItem(id);
        await loadData();
     }
  };

  const handleQuickUpdate = async (id: string, field: keyof WarehouseItem, value: any) => {
     const item = items.find(i => i.id === id);
     if(item) {
        // Optimistic update locally
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
        await saveWarehouseItem({ ...item, [field]: value, companyId });
     }
  };

  const handleAddCategory = async (parentId?: string) => {
     if(!newCatName) return;
     await saveWarehouseCategory({ companyId, name: newCatName, type: activeTab, parentId });
     setNewCatName('');
     setAddingSubTo(null);
     await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
     if(confirm('Usunąć kategorię?')) {
        await deleteWarehouseCategory(id);
        await loadData();
     }
  };

  const handleSort = (field: SortField) => {
     if (sortBy === field) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
     } else {
        setSortBy(field);
        setSortOrder('asc');
     }
  };

  // --- MULTI UPLOAD LOGIC ---
  const handleMultiFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files) {
        // Safer casting for TS/React environment
        const files: File[] = Array.from(e.target.files || []);
        const newItems: Partial<WarehouseItem>[] = [];

        files.forEach(file => {
           const reader = new FileReader();
           reader.onload = (ev) => {
              newItems.push({
                 type: activeTab,
                 categoryId: multiAddCategory,
                 subCategoryId: multiAddSubCategory,
                 name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
                 photoUrl: ev.target?.result as string,
                 salesPrice: 0,
                 quantity: 1
              });
              // Update state after last file
              if(newItems.length === files.length) {
                 setMultiUploadItems(prev => [...prev, ...newItems]);
              }
           };
           reader.readAsDataURL(file);
        });
     }
  };

  const copyToAll = (field: keyof WarehouseItem, value: any) => {
     setMultiUploadItems(prev => prev.map(item => ({
        ...item,
        [field]: value
     })));
     toast.info(`Skopiowano wartość do ${multiUploadItems.length - 1} elementów`);
  };

  const saveMultiItems = async () => {
     const branchIdToSave = currentBranchId !== 'all' ? currentBranchId : undefined;
     // Promise all to wait for all saves
     await Promise.all(multiUploadItems.map(item => 
        saveWarehouseItem({ ...item, companyId, branchId: branchIdToSave } as any)
     ));
     
     setMultiUploadItems([]);
     setShowMultiAdd(false);
     setMultiAddCategory('');
     setMultiAddSubCategory('');
     await loadData();
     toast.success('Pomyślnie dodano produkty!');
  };

  const updateMultiItem = (index: number, field: keyof WarehouseItem, value: any) => {
     const newItems = [...multiUploadItems];
     newItems[index] = { ...newItems[index], [field]: value };
     setMultiUploadItems(newItems);
  };

  // --- Filtering & Sorting ---
  const filteredItems = items
     .filter(item => {
        const matchesCategory = selectedCategoryId ? (item.categoryId === selectedCategoryId || item.subCategoryId === selectedCategoryId) : true;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.manufacturer || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
     })
     .sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
     });

  const rootCategories = categories.filter(c => !c.parentId);

  // --- Render Helpers ---

  const CategoryTreeItem: React.FC<{ cat: WarehouseCategory, depth?: number }> = ({ cat, depth = 0 }) => {
     const subCats = categories.filter(c => c.parentId === cat.id);
     const isSelected = selectedCategoryId === cat.id;

     return (
        <div className="mb-1">
           <div 
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${isSelected ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'hover:bg-[var(--color-surface-highlight)]'}`}
              style={{ marginLeft: `${depth * 12}px` }}
              onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
           >
              <div className="flex items-center gap-2">
                 {subCats.length > 0 ? (isSelected ? <FolderOpen size={16}/> : <Folder size={16}/>) : <div className="w-4"/>}
                 <span className="font-medium">{cat.name}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                 <button onClick={(e) => { e.stopPropagation(); setAddingSubTo(cat.id); }} title="Dodaj podkategorię" className="p-1 hover:bg-white/20 rounded"><Plus size={12}/></button>
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }} title="Usuń" className="p-1 hover:bg-white/20 rounded text-red-500"><Trash2 size={12}/></button>
              </div>
           </div>
           
           {/* Subcategories */}
           {subCats.map(sub => <CategoryTreeItem key={sub.id} cat={sub} depth={depth + 1} />)}
           
           {/* Add Sub Form */}
           {addingSubTo === cat.id && (
              <div className="ml-6 mt-1 flex gap-1">
                 <input 
                    autoFocus 
                    className="w-full text-xs p-1 border rounded" 
                    placeholder="Nazwa subkategorii"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCategory(cat.id)}
                 />
                 <button onClick={() => handleAddCategory(cat.id)} className="bg-[var(--color-success)] text-white p-1 rounded"><CheckIcon size={12}/></button>
                 <button onClick={() => setAddingSubTo(null)} className="bg-gray-200 p-1 rounded"><X size={12}/></button>
              </div>
           )}
        </div>
     )
  };

  return (
    <div className="flex flex-col h-full gap-6">
       
       {/* Top Controls */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-[var(--color-surface)] p-2 rounded-xl border border-[var(--color-border)] shadow-sm gap-4">
          <div className="flex gap-2">
             <Button 
                variant={activeTab === 'product' ? 'primary' : 'ghost'} 
                onClick={() => { setActiveTab('product'); setSelectedCategoryId(null); setIsEditMode(false); setShowMultiAdd(false); }}
                size="sm"
             >
                <Package size={16} className="mr-2"/> Produkty
             </Button>
             <Button 
                variant={activeTab === 'service' ? 'primary' : 'ghost'} 
                onClick={() => { setActiveTab('service'); setSelectedCategoryId(null); setIsEditMode(false); setShowMultiAdd(false); }}
                size="sm"
             >
                <Briefcase size={16} className="mr-2"/> Usługi
             </Button>
          </div>

          <div className="flex-1 max-w-md mx-4 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16}/>
             <input 
                className="w-full bg-[var(--color-input)] pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="Szukaj produktu..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="flex gap-2 items-center">
             {!showMultiAdd && (
                <>
                   <div className="flex bg-[var(--color-background)] rounded-lg p-1 border border-[var(--color-border)] mr-2">
                      <button onClick={() => handleSort('name')} className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${sortBy === 'name' ? 'bg-[var(--color-surface)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>
                         Nazwa {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowDown size={10}/> : <ArrowUp size={10}/>)}
                      </button>
                      <button onClick={() => handleSort('salesPrice')} className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${sortBy === 'salesPrice' ? 'bg-[var(--color-surface)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>
                         Cena {sortBy === 'salesPrice' && (sortOrder === 'asc' ? <ArrowDown size={10}/> : <ArrowUp size={10}/>)}
                      </button>
                      {activeTab === 'product' && (
                         <button onClick={() => handleSort('manufacturer')} className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${sortBy === 'manufacturer' ? 'bg-[var(--color-surface)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>
                            Prod. {sortBy === 'manufacturer' && (sortOrder === 'asc' ? <ArrowDown size={10}/> : <ArrowUp size={10}/>)}
                         </button>
                      )}
                   </div>

                   <Button 
                      variant={isEditMode ? 'warning' : 'outline'} 
                      size="sm" 
                      onClick={() => {
                         setIsEditMode(!isEditMode);
                         if(!isEditMode) setViewMode('table'); // Force table view
                      }}
                   >
                      <Edit2 size={16} className="mr-2"/> {isEditMode ? 'Koniec' : 'Edycja'}
                   </Button>
                   <div className="w-[1px] h-8 bg-[var(--color-border)] mx-1"></div>
                   <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[var(--color-secondary)] text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}><LayoutGrid size={18}/></button>
                   <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-[var(--color-secondary)] text-[var(--color-text-main)]' : 'text-[var(--color-text-secondary)]'}`}><TableIcon size={18}/></button>
                   <div className="w-[1px] h-8 bg-[var(--color-border)] mx-1"></div>
                </>
             )}
             
             {showMultiAdd ? (
                <Button size="sm" variant="secondary" onClick={() => setShowMultiAdd(false)}>Anuluj</Button>
             ) : (
                currentBranchId !== 'all' ? (
                   <>
                      <Button size="sm" variant="secondary" onClick={() => setShowMultiAdd(true)}>Multi</Button>
                      <Button size="sm" onClick={() => { setEditingItem({ type: activeTab }); setShowAddForm(true); }}>
                         <Plus size={16} className="mr-2"/> Dodaj
                      </Button>
                   </>
                ) : (
                   <Button size="sm" variant="ghost" disabled>Wybierz oddział</Button>
                )
             )}
          </div>
       </div>

       <div className="flex gap-6 flex-1 min-h-0">
          
          {/* Sidebar: Categories (Hidden in Multi Add for clarity) */}
          {!showMultiAdd && (
             <Card className="w-64 flex flex-col p-4 border border-[var(--color-border)] h-full overflow-hidden shrink-0">
                <div className="mb-4">
                   <h4 className="font-bold text-xs uppercase text-[var(--color-text-secondary)] mb-2">Kategorie</h4>
                   <div className="flex gap-1">
                      <Input 
                         placeholder="Nowa kategoria..." 
                         value={!addingSubTo ? newCatName : ''} 
                         onChange={e => !addingSubTo && setNewCatName(e.target.value)} 
                         className="text-xs h-8 py-1"
                      />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleAddCategory()}><Plus size={14}/></Button>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar group">
                   <div 
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm mb-1 ${!selectedCategoryId ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'hover:bg-[var(--color-surface-highlight)]'}`}
                      onClick={() => setSelectedCategoryId(null)}
                   >
                      <Folder size={16}/> <span>Wszystkie</span>
                   </div>
                   {rootCategories.map(cat => <CategoryTreeItem key={cat.id} cat={cat} />)}
                   {rootCategories.length === 0 && <div className="text-center text-xs text-[var(--color-text-secondary)] mt-4">Brak kategorii</div>}
                </div>
             </Card>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--color-background)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 relative">
             
             {/* --- MULTI UPLOAD VIEW --- */}
             {showMultiAdd && (
                <div className="animate-fade-in space-y-6">
                   <h3 className="text-xl font-bold flex items-center gap-2"><Upload size={24}/> Multi-Dodawanie Produktów</h3>
                   
                   <div className="grid grid-cols-2 gap-4 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                      <div>
                         <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">1. Wybierz Kategorię</label>
                         <select className="w-full bg-[var(--color-input)] p-2 rounded border border-[var(--color-border)] outline-none" value={multiAddCategory} onChange={e => setMultiAddCategory(e.target.value)}>
                            <option value="">-- Wybierz --</option>
                            {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">2. Wybierz Subkategorię</label>
                         <select className="w-full bg-[var(--color-input)] p-2 rounded border border-[var(--color-border)] outline-none" value={multiAddSubCategory} onChange={e => setMultiAddSubCategory(e.target.value)} disabled={!multiAddCategory}>
                            <option value="">-- Opcjonalnie --</option>
                            {categories.filter(c => c.parentId === multiAddCategory).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                   </div>

                   {multiAddCategory && (
                      <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-8 text-center hover:bg-[var(--color-surface-highlight)] transition-colors cursor-pointer relative">
                         <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMultiFiles} />
                         <ImageIcon size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4" />
                         <p className="font-bold text-lg">Kliknij lub upuść zdjęcia tutaj</p>
                         <p className="text-sm text-[var(--color-text-secondary)]">Każde zdjęcie utworzy nowy produkt. Nazwa pliku zostanie użyta jako nazwa produktu.</p>
                      </div>
                   )}

                   {multiUploadItems.length > 0 && (
                      <div className="space-y-2">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold">Lista Produktów do dodania ({multiUploadItems.length})</h4>
                            <Button onClick={saveMultiItems} className="bg-[var(--color-success)]">Zapisz Wszystkie</Button>
                         </div>
                         <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                            <table className="w-full text-left text-sm">
                               <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                                  <tr>
                                     <th className="p-3 w-16">Foto</th>
                                     <th className="p-3">Nazwa</th>
                                     {activeTab === 'product' && <th className="p-3">Producent</th>}
                                     {activeTab === 'product' && <th className="p-3 w-24">Wymiary</th>}
                                     <th className="p-3 w-24">Cena Sprz.</th>
                                     {activeTab === 'product' && <th className="p-3 w-20">Sztuk</th>}
                                     <th className="p-3 w-10"></th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-[var(--color-border)]">
                                  {multiUploadItems.map((item, idx) => (
                                     <tr key={idx} className="group hover:bg-[var(--color-background)]">
                                        <td className="p-2">
                                           <img src={item.photoUrl} className="w-10 h-10 object-cover rounded bg-white border border-[var(--color-border)]" alt="" />
                                        </td>
                                        <td className="p-2">
                                           <input className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] outline-none" value={item.name} onChange={e => updateMultiItem(idx, 'name', e.target.value)} />
                                        </td>
                                        {activeTab === 'product' && (
                                           <td className="p-2 relative">
                                              <select 
                                                 className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] outline-none" 
                                                 value={item.manufacturer || ''} 
                                                 onChange={e => updateMultiItem(idx, 'manufacturer', e.target.value)}
                                              >
                                                 <option value="">--</option>
                                                 {manufacturers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                              </select>
                                              {idx === 0 && (
                                                 <button onClick={() => copyToAll('manufacturer', item.manufacturer)} title="Kopiuj do wszystkich" className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronDown size={14} />
                                                 </button>
                                              )}
                                           </td>
                                        )}
                                        {activeTab === 'product' && (
                                           <td className="p-2 relative">
                                              <input className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] outline-none" value={item.dimensions || ''} onChange={e => updateMultiItem(idx, 'dimensions', e.target.value)} placeholder="Wymiar" />
                                              {idx === 0 && (
                                                 <button onClick={() => copyToAll('dimensions', item.dimensions)} title="Kopiuj do wszystkich" className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronDown size={14} />
                                                 </button>
                                              )}
                                           </td>
                                        )}
                                        <td className="p-2 relative">
                                           <input type="number" className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] outline-none font-bold" value={item.salesPrice} onChange={e => updateMultiItem(idx, 'salesPrice', parseFloat(e.target.value))} />
                                           {idx === 0 && (
                                              <button onClick={() => copyToAll('salesPrice', item.salesPrice)} title="Kopiuj do wszystkich" className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <ChevronDown size={14} />
                                              </button>
                                           )}
                                        </td>
                                        {activeTab === 'product' && (
                                           <td className="p-2 relative">
                                              <input type="number" className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-primary)] outline-none" value={item.quantity} onChange={e => updateMultiItem(idx, 'quantity', parseInt(e.target.value))} />
                                              {idx === 0 && (
                                                 <button onClick={() => copyToAll('quantity', item.quantity)} title="Kopiuj do wszystkich" className="absolute -right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronDown size={14} />
                                                 </button>
                                              )}
                                           </td>
                                        )}
                                        <td className="p-2 text-center">
                                           <button onClick={() => setMultiUploadItems(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                                        </td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   )}
                </div>
             )}

             {/* --- SINGLE ADD FORM --- */}
             {showAddForm && !showMultiAdd && (
                <div className="absolute inset-0 bg-[var(--color-background)] z-20 p-6 animate-fade-in flex flex-col">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold">Dodaj {activeTab === 'product' ? 'Produkt' : 'Usługę'}</h3>
                      <Button variant="ghost" onClick={() => setShowAddForm(false)}><X/></Button>
                   </div>
                   
                   <form onSubmit={handleSaveItem} className="space-y-6 max-w-3xl mx-auto w-full">
                      <div className="flex gap-6">
                         {/* Photo Mock */}
                         <div className="w-48 h-48 bg-[var(--color-secondary)] rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-text-secondary)] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-surface-highlight)] transition-colors">
                            <ImageIcon size={32} className="mb-2"/>
                            <span className="text-xs font-bold">Dodaj Zdjęcie</span>
                            <input type="file" className="hidden" />
                         </div>
                         
                         <div className="flex-1 space-y-4">
                            <Input label="Nazwa (Wymagane)" value={editingItem?.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                            
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Kategoria</label>
                                  <select 
                                     className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                                     value={editingItem?.categoryId || ''}
                                     onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}
                                  >
                                     <option value="">Wybierz...</option>
                                     {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                               </div>
                               <div>
                                  <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Subkategoria</label>
                                  <select 
                                     className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                                     value={editingItem?.subCategoryId || ''}
                                     onChange={e => setEditingItem({...editingItem, subCategoryId: e.target.value})}
                                     disabled={!editingItem?.categoryId}
                                  >
                                     <option value="">Wybierz...</option>
                                     {categories.filter(c => c.parentId === editingItem?.categoryId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                               </div>
                            </div>

                            {activeTab === 'product' && (
                               <>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Producent</label>
                                        <select 
                                           className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                                           value={editingItem?.manufacturer || ''}
                                           onChange={e => setEditingItem({...editingItem, manufacturer: e.target.value})}
                                        >
                                           <option value="">Wybierz producenta...</option>
                                           {manufacturers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                        </select>
                                     </div>
                                     <Input label="Wymiary" placeholder="np. 20x30x40" value={editingItem?.dimensions || ''} onChange={e => setEditingItem({...editingItem, dimensions: e.target.value})} />
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                     <Input label="Cena Zakupu" type="number" value={editingItem?.purchasePrice || 0} onChange={e => setEditingItem({...editingItem, purchasePrice: parseFloat(e.target.value)})} />
                                     <Input label="Cena Sprzedaży" type="number" value={editingItem?.salesPrice || 0} onChange={e => setEditingItem({...editingItem, salesPrice: parseFloat(e.target.value)})} />
                                     <Input label="Ilość Sztuk" type="number" value={editingItem?.quantity || 0} onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value)})} />
                                  </div>
                               </>
                            )}

                            {activeTab === 'service' && (
                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Jednostka</label>
                                     <select 
                                        className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                                        value={editingItem?.unit || 'piece'}
                                        onChange={e => setEditingItem({...editingItem, unit: e.target.value as ServiceUnit})}
                                     >
                                        {SERVICE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                     </select>
                                  </div>
                                  <Input label="Cena Sprzedaży" type="number" value={editingItem?.salesPrice || 0} onChange={e => setEditingItem({...editingItem, salesPrice: parseFloat(e.target.value)})} />
                               </div>
                            )}
                         </div>
                      </div>
                      <div className="flex justify-end pt-6 border-t border-[var(--color-border)]">
                         <Button type="submit" size="lg"><Save className="mr-2"/> Zapisz Element</Button>
                      </div>
                   </form>
                </div>
             )}

             {/* --- GRID VIEW (DEFAULT) --- */}
             {!showMultiAdd && viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                   {filteredItems.map(item => (
                      <Card key={item.id} className="p-0 overflow-hidden group hover:shadow-md transition-all border border-[var(--color-border)] flex flex-col">
                         <div className="aspect-square bg-[var(--color-surface-highlight)] flex items-center justify-center relative">
                            {item.photoUrl ? (
                               <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover"/>
                            ) : (
                               <ImageIcon size={32} className="text-[var(--color-text-secondary)] opacity-50"/>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setEditingItem(item); setShowAddForm(true); }} className="bg-white p-1 rounded-full shadow text-black hover:scale-110 transition-transform mb-1 block"><Edit2 size={12}/></button>
                               <button onClick={() => handleDeleteItem(item.id)} className="bg-white p-1 rounded-full shadow text-red-500 hover:scale-110 transition-transform block"><Trash2 size={12}/></button>
                            </div>
                         </div>
                         <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                               <div className="font-bold text-sm truncate" title={item.name}>{item.name}</div>
                               <div className="text-[10px] text-[var(--color-text-secondary)] truncate">
                                  {categories.find(c => c.id === item.categoryId)?.name || 'Bez kategorii'}
                               </div>
                               {item.manufacturer && <div className="text-[10px] text-[var(--color-text-secondary)] truncate">{item.manufacturer}</div>}
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                               <div className="font-bold text-[var(--color-primary)]">{item.salesPrice} PLN</div>
                               {item.type === 'product' && <div className={`text-[10px] px-1.5 py-0.5 rounded ${item.quantity! > 0 ? 'bg-[var(--color-secondary)] text-[var(--color-text-secondary)]' : 'bg-red-100 text-red-500 font-bold'}`}>{item.quantity} szt.</div>}
                            </div>
                         </div>
                      </Card>
                   ))}
                   {filteredItems.length === 0 && <div className="col-span-full text-center py-8 text-[var(--color-text-secondary)]">Brak elementów w tym oddziale.</div>}
                </div>
             )}

             {/* --- TABLE VIEW --- */}
             {!showMultiAdd && viewMode === 'table' && (
                <table className="w-full text-left border-collapse text-sm">
                   <thead>
                      <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs uppercase">
                         <th className="p-3">Nazwa</th>
                         <th className="p-3">Kategoria</th>
                         {activeTab === 'product' && <th className="p-3">Producent</th>}
                         {activeTab === 'product' && <th className="p-3">Ilość</th>}
                         {activeTab === 'service' && <th className="p-3">Jednostka</th>}
                         <th className="p-3">Cena Sprzedaży</th>
                         {!isEditMode && <th className="p-3 text-right">Akcje</th>}
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--color-border)]">
                      {filteredItems.map(item => (
                         <tr key={item.id} className="hover:bg-[var(--color-surface-highlight)]">
                            <td className="p-3 font-bold text-[var(--color-text-main)]">
                               {isEditMode ? (
                                  <input 
                                     className="bg-transparent border-b border-dashed border-gray-400 w-full outline-none focus:border-[var(--color-primary)] text-[var(--color-text-main)]" 
                                     defaultValue={item.name} 
                                     onBlur={(e) => handleQuickUpdate(item.id, 'name', e.target.value)}
                                  />
                               ) : item.name}
                            </td>
                            <td className="p-3 text-[var(--color-text-secondary)]">
                               {categories.find(c => c.id === item.categoryId)?.name}
                            </td>
                            {activeTab === 'product' && (
                               <td className="p-3 text-[var(--color-text-main)]">
                                  {isEditMode ? (
                                     <select 
                                        className="bg-transparent text-xs w-full text-[var(--color-text-main)]"
                                        defaultValue={item.manufacturer || ''}
                                        onBlur={(e) => handleQuickUpdate(item.id, 'manufacturer', e.target.value)}
                                     >
                                        <option value="">--</option>
                                        {manufacturers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                     </select>
                                  ) : item.manufacturer || '-'}
                               </td>
                            )}
                            {activeTab === 'product' && (
                               <td className="p-3 font-medium text-[var(--color-text-main)]">
                                  {isEditMode ? (
                                     <input 
                                        type="number"
                                        className="bg-transparent border-b border-dashed border-gray-400 w-16 outline-none focus:border-[var(--color-primary)] text-[var(--color-text-main)]" 
                                        defaultValue={item.quantity} 
                                        onBlur={(e) => handleQuickUpdate(item.id, 'quantity', parseInt(e.target.value))}
                                     />
                                  ) : item.quantity}
                               </td>
                            )}
                            {activeTab === 'service' && (
                               <td className="p-3 text-[var(--color-text-main)]">
                                  {SERVICE_UNITS.find(u => u.value === item.unit)?.label || item.unit}
                               </td>
                            )}
                            <td className="p-3 font-bold text-[var(--color-primary)]">
                               {isEditMode ? (
                                  <input 
                                     type="number"
                                     className="bg-transparent border-b border-dashed border-gray-400 w-20 outline-none focus:border-[var(--color-primary)] font-bold text-[var(--color-primary)]" 
                                     defaultValue={item.salesPrice} 
                                     onBlur={(e) => handleQuickUpdate(item.id, 'salesPrice', parseFloat(e.target.value))}
                                  />
                               ) : `${item.salesPrice} PLN`}
                            </td>
                            {!isEditMode && (
                               <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                     <button onClick={() => { setEditingItem(item); setShowAddForm(true); }} className="p-1 hover:text-[var(--color-primary)] text-[var(--color-text-secondary)]"><Edit2 size={14}/></button>
                                     <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-[var(--color-danger)] text-[var(--color-text-secondary)]"><Trash2 size={14}/></button>
                                  </div>
                               </td>
                            )}
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>
       </div>
    </div>
  );
};

const CheckIcon = ({size}: {size?:number}) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size||24} height={size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
