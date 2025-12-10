
import React, { useState, useEffect } from 'react';
import { Manufacturer } from '../types';
import { Card, Button, Input } from '../components/UI';
import { getManufacturers, saveManufacturer, deleteManufacturer, fetchGusData } from '../services/storageService';
import { Plus, Search, Trash2, Edit2, Factory, X, Save } from 'lucide-react';
import { toast } from 'sonner';

export const AdminManufacturers: React.FC = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Manufacturer>>({});
  const [isLoadingGus, setIsLoadingGus] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setManufacturers(await getManufacturers());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Nazwa jest wymagana');
    
    saveManufacturer({
       ...formData,
       id: editingId || undefined
    });
    
    setFormData({});
    setEditingId(null);
    setShowForm(false);
    loadData();
    toast.success(editingId ? 'Zaktualizowano producenta' : 'Dodano producenta');
  };

  const handleEdit = (m: Manufacturer) => {
    setFormData(m);
    setEditingId(m.id);
    setShowForm(true);
    // Optional: Scroll to top if list is long
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Usunąć producenta?')) {
      deleteManufacturer(id);
      loadData();
      toast.info('Producent usunięty');
    }
  };

  const handleGusFetch = async () => {
     if(!formData.nip) return toast.warning('Wpisz NIP');
     setIsLoadingGus(true);
     try {
        const data = await fetchGusData(formData.nip);
        if(data) {
           setFormData(prev => ({ 
              ...prev, 
              name: data.name,
              street: data.street,
              city: data.city,
              phone: data.phone,
              email: data.email
           }));
           toast.success('Pobrano dane z GUS');
        }
     } catch (e: any) {
        toast.error(e.message || 'Nie udało się pobrać danych');
     } finally {
        setIsLoadingGus(false);
     }
  };

  const filtered = manufacturers.filter(m => 
     m.name.toLowerCase().includes(search.toLowerCase()) || 
     m.nip.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3"><Factory size={32}/> Producenci</h2>
          <p className="text-[var(--color-text-secondary)]">Zarządzanie globalną bazą producentów.</p>
        </div>
        <Button onClick={() => { 
           if(showForm) {
              setShowForm(false);
              setEditingId(null);
              setFormData({});
           } else {
              setShowForm(true); 
              setEditingId(null); 
              setFormData({}); 
           }
        }}>
           {showForm ? 'Anuluj' : <><Plus size={18} className="mr-2"/> Dodaj Producenta</>}
        </Button>
      </div>

      {showForm && (
         <Card className="animate-fade-in border border-[var(--color-primary)]">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold">{editingId ? 'Edycja Producenta' : 'Nowy Producent'}</h3>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
               <div className="flex gap-2 items-end">
                  <Input label="NIP" value={formData.nip || ''} onChange={e => setFormData({...formData, nip: e.target.value})} />
                  <Button type="button" variant="secondary" onClick={handleGusFetch} disabled={isLoadingGus} className="mb-2 w-40">
                     {isLoadingGus ? '...' : <><Search size={16}/> GUS</>}
                  </Button>
               </div>
               
               <Input label="Nazwa Firmy" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
               
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Miasto" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                  <Input label="Ulica" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Telefon" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <Input label="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>

               <div className="flex justify-end pt-4">
                  <Button type="submit"><Save size={18} className="mr-2"/> Zapisz</Button>
               </div>
            </form>
         </Card>
      )}

      <div className="relative max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16}/>
         <input 
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg py-2 pl-10 pr-4 outline-none focus:border-[var(--color-primary)]"
            placeholder="Szukaj producenta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {filtered.map(m => (
            <Card key={m.id} className="group relative hover:border-[var(--color-primary)] transition-colors">
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => handleEdit(m)} className="p-2 bg-[var(--color-surface)] hover:bg-[var(--color-primary)] rounded shadow-sm"><Edit2 size={14}/></button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 bg-[var(--color-surface)] hover:bg-[var(--color-danger)] hover:text-white rounded shadow-sm"><Trash2 size={14}/></button>
               </div>
               
               <h4 className="font-bold text-lg mb-1">{m.name}</h4>
               <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                  <div>NIP: {m.nip}</div>
                  <div>{m.city}, {m.street}</div>
                  <div>{m.email}</div>
                  <div>{m.phone}</div>
               </div>
            </Card>
         ))}
         {filtered.length === 0 && <div className="text-center p-8 text-[var(--color-text-secondary)] col-span-full">Brak producentów.</div>}
      </div>
    </div>
  );
};
