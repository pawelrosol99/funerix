
import React, { useState, useEffect } from 'react';
import { BulletinCategory } from '../types';
import { getBulletinCategories, saveBulletinCategory, deleteBulletinCategory } from '../services/storageService';
import { Card, Button, Input } from '../components/UI';
import { Plus, Trash2, FolderOpen, Folder, Edit2, Check, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const AdminBulletinCategories: React.FC = () => {
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setCategories(await getBulletinCategories());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    await saveBulletinCategory({ name: newCatName, parentId });
    setNewCatName('');
    setParentId(undefined); // Reset parent selection to allow adding root cats easily
    await loadData();
    toast.success('Kategoria dodana');
  };

  const handleUpdate = async (id: string) => {
     if(!editingName) return;
     const cat = categories.find(c => c.id === id);
     if(cat) {
        await saveBulletinCategory({ ...cat, name: editingName });
        setEditingId(null);
        await loadData();
        toast.success('Zaktualizowano');
     }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Usunąć kategorię i wszystkie podkategorie?')) {
      await deleteBulletinCategory(id);
      loadData();
      toast.success('Usunięto');
    }
  };

  // Tree View Rendering
  const renderCategory = (cat: BulletinCategory, level = 0) => {
     const subCats = categories.filter(c => c.parentId === cat.id);
     const isEditing = editingId === cat.id;

     return (
        <div key={cat.id} className="mb-2">
           <div 
              className={`flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] ${parentId === cat.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
              style={{ marginLeft: `${level * 24}px` }}
           >
              {level === 0 ? <FolderOpen size={20} className="text-[var(--color-primary)]"/> : <ArrowRight size={16} className="text-[var(--color-text-secondary)]"/>}
              
              <div className="flex-1">
                 {isEditing ? (
                    <div className="flex gap-2">
                       <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-8 py-1 text-sm bg-white" autoFocus />
                       <Button size="sm" onClick={() => handleUpdate(cat.id)} className="h-8 w-8 p-0"><Check size={14}/></Button>
                       <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0"><X size={14}/></Button>
                    </div>
                 ) : (
                    <span className="font-bold text-sm">{cat.name}</span>
                 )}
              </div>

              <div className="flex gap-1 opacity-60 hover:opacity-100">
                 {level === 0 && (
                    <Button 
                       size="sm" 
                       variant={parentId === cat.id ? 'primary' : 'secondary'} 
                       className="text-xs h-7 px-2"
                       onClick={() => setParentId(parentId === cat.id ? undefined : cat.id)}
                    >
                       {parentId === cat.id ? 'Wybrano' : '+ Podkategoria'}
                    </Button>
                 )}
                 <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }} className="p-1.5 hover:bg-[var(--color-surface-highlight)] rounded"><Edit2 size={14}/></button>
                 <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
              </div>
           </div>
           {subCats.map(sub => renderCategory(sub, level + 1))}
        </div>
     );
  };

  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-bold">Kategorie Ogłoszeń</h2>
        <p className="text-[var(--color-text-secondary)]">Zarządzaj strukturą tablicy ogłoszeń.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Form */}
         <Card className="h-fit sticky top-6 border border-[var(--color-primary)]">
            <h3 className="font-bold mb-4">{parentId ? 'Dodaj Podkategorię' : 'Dodaj Kategorię Główną'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
               {parentId && (
                  <div className="text-xs p-2 bg-[var(--color-surface-highlight)] rounded mb-2">
                     Rodzic: <strong>{categories.find(c => c.id === parentId)?.name}</strong>
                     <button type="button" onClick={() => setParentId(undefined)} className="ml-2 text-red-500 hover:underline">Anuluj</button>
                  </div>
               )}
               <Input label="Nazwa" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
               <Button type="submit" className="w-full"><Plus size={18} className="mr-2"/> Dodaj</Button>
            </form>
         </Card>

         {/* Tree List */}
         <div className="md:col-span-2 space-y-2">
            {rootCategories.length === 0 && <div className="text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">Brak kategorii. Dodaj pierwszą.</div>}
            {rootCategories.map(cat => renderCategory(cat))}
         </div>
      </div>
    </div>
  );
};
