
import React, { useState, useEffect } from 'react';
import { User, Furnace, CremationOptionGroup, CremationOption, CooperatingCompany, Driver, CompanyTag, Vehicle, Checklist, Relation, WarehouseCategory, PayrollBonus, Company, BulletinCategory, BulletinAd } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { ColorPicker } from '../components/ColorPicker';
import { 
  getFurnaces, saveFurnace, deleteFurnace, 
  getOptionGroups, saveOptionGroup, deleteOptionGroup,
  getOptions, saveOption, deleteOption,
  getCoopCompanies, saveCoopCompany, deleteCoopCompany, fetchGusData,
  getDrivers, saveDriver, deleteDriver,
  getTags, saveTag, deleteTag,
  getCompanyById,
  getVehicles, saveVehicle, deleteVehicle,
  getChecklists, saveChecklist, deleteChecklist,
  getRelations, saveRelation, deleteRelation, getWarehouseCategories,
  getPayrollBonuses, savePayrollBonus, deletePayrollBonus,
  updateCompany, getBulletinCategories, getUserAds, deleteBulletinAd
} from '../services/storageService';
import { 
  Flame, 
  List, 
  Building2, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  User as UserIcon, 
  Phone, 
  Tag, 
  Package, 
  FileText, 
  Truck, 
  ClipboardList, 
  Image as ImageIcon, 
  Save, 
  X, 
  Link as LinkIcon, 
  Coins,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { Warehouse } from '../components/Warehouse';
import { Documents } from './Documents';

interface SettingsProps {
  user: User;
  currentBranchId?: string | 'all';
}

export const Settings: React.FC<SettingsProps> = ({ user, currentBranchId = 'all' }) => {
  const [activeTab, setActiveTab] = useState<string>('companies');
  const [company, setCompany] = useState<Company | null>(null);
  
  useEffect(() => {
     if (user.companyId) {
        getCompanyById(user.companyId).then(c => setCompany(c || null));
     }
  }, [user.companyId]);

  const pkg = company?.package_type;
  const showCremation = pkg === 'cremation' || pkg === 'full';
  const showFunerals = pkg === 'funerals' || pkg === 'full';

  // Define tabs dynamically based on package
  const tabs = [];

  if (showCremation) {
     tabs.push({ id: 'furnaces', label: 'Piece', icon: Flame });
     tabs.push({ id: 'options', label: 'Opcje Kremacji', icon: List });
  }

  if (showFunerals) {
     tabs.push({ id: 'fleet', label: 'Flota', icon: Truck });
     tabs.push({ id: 'checklists', label: 'Checklista', icon: ClipboardList });
  }

  // Common modules
  tabs.push({ id: 'companies', label: 'Firmy Współpracujące', icon: Building2 });
  
  tabs.push({ id: 'relations', label: 'Powiązania', icon: LinkIcon });
  tabs.push({ id: 'documents', label: 'Dokumenty', icon: FileText });
  tabs.push({ id: 'payroll', label: 'Dodatki Płacowe', icon: Coins });
  tabs.push({ id: 'marketplace', label: 'Giełda', icon: ShoppingBag });

  // Set default tab if current one is hidden
  useEffect(() => {
     if (company && !tabs.find(t => t.id === activeTab)) {
        setActiveTab(tabs[0]?.id || 'companies');
     }
  }, [pkg, activeTab, company]);

  if (!user.companyId) return <div>Dostęp zabroniony.</div>;
  if (!company) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
         <div>
            <h2 className="text-3xl font-bold">Ustawienia i Administracja</h2>
            <p className="text-[var(--color-text-secondary)]">
               Pakiet: <Badge variant="primary" className="ml-1">{pkg?.toUpperCase()}</Badge>
            </p>
         </div>
         <div className="flex gap-2 bg-[var(--color-surface)] p-1 rounded-xl shadow-sm flex-wrap">
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                     activeTab === tab.id 
                     ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm' 
                     : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]'
                  }`}
               >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
               </button>
            ))}
         </div>
      </div>

      {activeTab === 'furnaces' && <FurnacesTab companyId={user.companyId} currentBranchId={currentBranchId} />}
      {activeTab === 'options' && <OptionsTab companyId={user.companyId} />}
      {activeTab === 'fleet' && <FleetTab companyId={user.companyId} currentBranchId={currentBranchId} />}
      {activeTab === 'checklists' && <ChecklistTab companyId={user.companyId} currentBranchId={currentBranchId} />}
      {activeTab === 'companies' && <CoopCompaniesTab companyId={user.companyId} />}
      {activeTab === 'relations' && <RelationsTab companyId={user.companyId} />}
      {activeTab === 'documents' && <Documents user={user} embedded={true} />}
      {activeTab === 'payroll' && <PayrollTab companyId={user.companyId} currentBranchId={currentBranchId} />}
      {activeTab === 'marketplace' && <MarketplaceTab company={company} user={user} onUpdate={() => getCompanyById(user.companyId!).then(c => setCompany(c || null))} />}
    </div>
  );
};

// --- SUB COMPONENTS ---

const MarketplaceTab: React.FC<{ company: Company, user: User, onUpdate: () => void }> = ({ company, user, onUpdate }) => {
   const [categories, setCategories] = useState<BulletinCategory[]>([]);
   const [myAds, setMyAds] = useState<BulletinAd[]>([]);
   
   // Config State
   const [isEnabled, setIsEnabled] = useState(company.bulletinConfig?.enabled || false);
   const [selectedCats, setSelectedCats] = useState<string[]>(company.bulletinConfig?.displayCategories || []);

   useEffect(() => {
      loadData();
   }, []);

   const loadData = async () => {
      setCategories(await getBulletinCategories());
      setMyAds(await getUserAds(user.id));
   };

   const handleSaveConfig = async () => {
      await updateCompany(company.id, {
         bulletinConfig: {
            enabled: isEnabled,
            displayCategories: selectedCats
         }
      });
      onUpdate();
      toast.success('Konfiguracja Giełdy zapisana');
   };

   const toggleCategory = (id: string) => {
      setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
   };

   const handleDeleteAd = async (id: string) => {
      if(confirm('Usunąć ogłoszenie?')) {
         await deleteBulletinAd(id);
         setMyAds(prev => prev.filter(ad => ad.id !== id));
         toast.info('Ogłoszenie usunięte');
      }
   };

   return (
      <div className="space-y-8 animate-fade-in">
         {/* Configuration Section */}
         <Card className="border border-[var(--color-primary)]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <ShoppingBag className="text-[var(--color-primary)]"/> Konfiguracja Giełdy
            </h3>
            
            <div className="space-y-6">
               <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-highlight)] rounded-xl border border-[var(--color-border)]">
                  <label className="switch relative inline-block w-14 h-7">
                     <input 
                        type="checkbox" 
                        checked={isEnabled} 
                        onChange={e => setIsEnabled(e.target.checked)} 
                        className="opacity-0 w-0 h-0"
                     />
                     <span className={`slider round absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-all rounded-full ${isEnabled ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}></span>
                     <span className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${isEnabled ? 'translate-x-7' : ''}`}></span>
                  </label>
                  <div>
                     <div className="font-bold text-sm">Wyświetlaj ogłoszenia na stronie głównej</div>
                     <div className="text-xs text-[var(--color-text-secondary)]">Włącz widget z ogłoszeniami w panelu pracownika</div>
                  </div>
               </div>

               {isEnabled && (
                  <div className="space-y-2">
                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)]">Wybierz kategorie do wyświetlania</label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {categories.filter(c => !c.parentId).map(cat => (
                           <button
                              key={cat.id}
                              onClick={() => toggleCategory(cat.id)}
                              className={`p-3 rounded-lg border text-sm font-bold text-left transition-all ${
                                 selectedCats.includes(cat.id) 
                                 ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)]' 
                                 : 'bg-[var(--color-background)] text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-surface-highlight)]'
                              }`}
                           >
                              {cat.name}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               <div className="flex justify-end">
                  <Button onClick={handleSaveConfig}><Save size={18} className="mr-2"/> Zapisz Ustawienia</Button>
               </div>
            </div>
         </Card>

         {/* User Ads History */}
         <div className="space-y-4">
            <h3 className="text-xl font-bold">Twoje Ogłoszenia</h3>
            <div className="space-y-2">
               {myAds.map(ad => (
                  <div key={ad.id} className="flex justify-between items-center bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
                     <div>
                        <div className="font-bold text-lg">{ad.title}</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                           {categories.find(c => c.id === ad.categoryId)?.name} • {ad.price} PLN • {new Date(ad.createdAt).toLocaleDateString()}
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Badge variant={ad.status === 'active' ? 'success' : 'secondary'}>{ad.status === 'active' ? 'Aktywne' : 'Zakończone'}</Badge>
                        <button onClick={() => handleDeleteAd(ad.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                     </div>
                  </div>
               ))}
               {myAds.length === 0 && (
                  <div className="text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                     Nie dodałeś jeszcze żadnych ogłoszeń.
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

const PayrollTab: React.FC<{ companyId: string, currentBranchId: string | 'all' }> = ({ companyId, currentBranchId }) => {
   const [bonuses, setBonuses] = useState<PayrollBonus[]>([]);
   const [newBonusName, setNewBonusName] = useState('');
   const [newBonusAmount, setNewBonusAmount] = useState('');
   const [editingId, setEditingId] = useState<string | null>(null);

   useEffect(() => {
      loadData();
   }, [companyId, currentBranchId]);

   const loadData = async () => {
      let data = await getPayrollBonuses(companyId);
      if (currentBranchId !== 'all') {
         data = data.filter(b => !b.branchId || b.branchId === currentBranchId);
      }
      setBonuses(data);
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBonusName || !newBonusAmount) return toast.error('Wypełnij wszystkie pola');
      
      const branchIdToSave = currentBranchId !== 'all' ? currentBranchId : undefined;

      await savePayrollBonus({
         id: editingId || undefined,
         companyId,
         branchId: branchIdToSave,
         name: newBonusName,
         amount: parseFloat(newBonusAmount)
      });

      setNewBonusName('');
      setNewBonusAmount('');
      setEditingId(null);
      await loadData();
      toast.success(editingId ? 'Zaktualizowano dodatek' : 'Dodano dodatek płacowy');
   };

   const handleEdit = (b: PayrollBonus) => {
      setNewBonusName(b.name);
      setNewBonusAmount(b.amount.toString());
      setEditingId(b.id);
   };

   const handleDelete = async (id: string) => {
      if(confirm('Usunąć dodatek płacowy?')) {
         await deletePayrollBonus(id);
         await loadData();
         toast.success('Usunięto');
      }
   };

   return (
      <div className="space-y-6">
         <h3 className="font-bold text-xl">Dodatki Płacowe</h3>
         
         <Card className="bg-[var(--color-surface-highlight)] border border-[var(--color-border)]">
            <h4 className="font-bold text-sm mb-4">{editingId ? 'Edytuj Dodatek' : 'Nowy Dodatek'}</h4>
            <form onSubmit={handleSave} className="flex gap-4 items-end">
               <Input label="Nazwa Dodatku" value={newBonusName} onChange={e => setNewBonusName(e.target.value)} placeholder="np. Premia Świąteczna" className="bg-white" />
               <Input label="Kwota (PLN)" type="number" value={newBonusAmount} onChange={e => setNewBonusAmount(e.target.value)} placeholder="0.00" className="bg-white" />
               <div className="flex gap-2 mb-2">
                  <Button type="submit">{editingId ? 'Zapisz' : 'Dodaj'}</Button>
                  {editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setNewBonusName(''); setNewBonusAmount(''); }}>Anuluj</Button>}
               </div>
            </form>
         </Card>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bonuses.map(bonus => (
               <Card key={bonus.id} className="flex justify-between items-center group">
                  <div>
                     <div className="font-bold text-lg">{bonus.name}</div>
                     <div className="text-[var(--color-primary)] font-bold">{bonus.amount.toFixed(2)} PLN</div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleEdit(bonus)} className="p-2 hover:bg-[var(--color-surface-highlight)] rounded"><Edit2 size={16}/></button>
                     <button onClick={() => handleDelete(bonus.id)} className="p-2 text-[var(--color-danger)] hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
               </Card>
            ))}
            {bonuses.length === 0 && <div className="col-span-full text-center text-[var(--color-text-secondary)] py-8">Brak zdefiniowanych dodatków.</div>}
         </div>
      </div>
   );
};

const RelationsTab: React.FC<{ companyId: string }> = ({ companyId }) => {
   const [relations, setRelations] = useState<Relation[]>([]);
   const [categories, setCategories] = useState<WarehouseCategory[]>([]);
   const [newRelationName, setNewRelationName] = useState('');
   const [selectedCats, setSelectedCats] = useState<string[]>([]);
   const [showForm, setShowForm] = useState(false);

   useEffect(() => {
      loadData();
   }, [companyId]);

   const loadData = async () => {
      setRelations(await getRelations(companyId));
      // Get all categories (products and services)
      const products = await getWarehouseCategories(companyId, 'product');
      const services = await getWarehouseCategories(companyId, 'service');
      setCategories([...products, ...services]);
   };

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newRelationName) return toast.error('Nazwa jest wymagana');
      
      await saveRelation({
         companyId,
         name: newRelationName,
         categoryIds: selectedCats
      });
      
      setNewRelationName('');
      setSelectedCats([]);
      setShowForm(false);
      await loadData();
      toast.success('Powiązanie dodane');
   };

   const handleDelete = async (id: string) => {
      if(confirm('Usunąć powiązanie?')) {
         await deleteRelation(id);
         await loadData();
      }
   };

   const toggleCatSelection = (id: string) => {
      setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
   };

   const rootCategories = categories.filter(c => !c.parentId);

   const renderCategoryTree = (cat: WarehouseCategory, depth = 0) => {
      const subCats = categories.filter(c => c.parentId === cat.id);
      const isSelected = selectedCats.includes(cat.id);

      return (
         <div key={cat.id} style={{ marginLeft: depth * 20 }} className="mb-1">
            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--color-surface-highlight)] rounded-lg">
               <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => toggleCatSelection(cat.id)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
               />
               <span className="text-sm font-medium">{cat.name}</span>
               <Badge variant="secondary" className="text-[10px] uppercase ml-auto">{cat.type === 'product' ? 'Produkt' : 'Usługa'}</Badge>
            </label>
            {subCats.map(sub => renderCategoryTree(sub, depth + 1))}
         </div>
      );
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h3 className="font-bold text-xl">Powiązania Produktów</h3>
               <p className="text-[var(--color-text-secondary)]">Definiuj grupy produktów dostępne w kreatorze pogrzebu.</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
               {showForm ? 'Anuluj' : <><Plus size={18}/> Dodaj Powiązanie</>}
            </Button>
         </div>

         {showForm && (
            <Card className="border border-[var(--color-primary)] animate-fade-in">
               <h4 className="font-bold mb-4">Nowe Powiązanie</h4>
               <form onSubmit={handleSave}>
                  <Input label="Nazwa Powiązania" value={newRelationName} onChange={e => setNewRelationName(e.target.value)} placeholder="np. Urny do Wyboru" className="mb-4" />
                  
                  <div className="mb-4">
                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Wybierz Kategorie z Magazynu</label>
                     <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {rootCategories.map(cat => renderCategoryTree(cat))}
                        {rootCategories.length === 0 && <div className="text-center text-sm text-[var(--color-text-secondary)]">Brak kategorii w magazynie.</div>}
                     </div>
                  </div>

                  <div className="flex justify-end">
                     <Button type="submit">Zapisz Powiązanie</Button>
                  </div>
               </form>
            </Card>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relations.map(rel => (
               <Card key={rel.id} className="relative group">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-lg">{rel.name}</h4>
                     <button onClick={() => handleDelete(rel.id)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16}/>
                     </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                     {rel.categoryIds.map(catId => {
                        const cat = categories.find(c => c.id === catId);
                        return cat ? (
                           <Badge key={catId} variant="secondary">{cat.name}</Badge>
                        ) : null;
                     })}
                     {rel.categoryIds.length === 0 && <span className="text-xs text-[var(--color-text-secondary)] italic">Brak przypisanych kategorii</span>}
                  </div>
               </Card>
            ))}
            {relations.length === 0 && (
               <div className="col-span-full text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                  Brak zdefiniowanych powiązań.
               </div>
            )}
         </div>
      </div>
   );
};

const FleetTab: React.FC<{ companyId: string, currentBranchId: string | 'all' }> = ({ companyId, currentBranchId }) => {
   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
   const [showForm, setShowForm] = useState(false);
   const [editId, setEditId] = useState<string | null>(null);
   
   const initialFormState: Partial<Vehicle> = {
      model: '',
      manufacturer: '',
      fuelType: 'diesel',
      color: '',
      seats: 5,
      inspectionDate: '',
      technicalDate: '',
      photoUrl: ''
   };
   const [formData, setFormData] = useState(initialFormState);

   useEffect(() => {
      loadData();
   }, [companyId, currentBranchId]);

   const loadData = async () => {
      let v = await getVehicles(companyId);
      if (currentBranchId !== 'all') {
         v = v.filter(vehicle => !vehicle.branchId || vehicle.branchId === currentBranchId);
      }
      setVehicles(v);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.model) return toast.error('Model jest wymagany');

      const branchIdToSave = currentBranchId !== 'all' ? currentBranchId : undefined;

      await saveVehicle({
         ...formData,
         id: editId || undefined,
         companyId,
         branchId: branchIdToSave
      });
      
      setFormData(initialFormState);
      setShowForm(false);
      setEditId(null);
      await loadData();
      toast.success(editId ? 'Pojazd zaktualizowany' : 'Pojazd dodany');
   };

   const handleEdit = (v: Vehicle) => {
      setEditId(v.id);
      setFormData(v);
      setShowForm(true);
   };

   const handleDelete = async (id: string) => {
      if(confirm('Usunąć pojazd?')) {
         await deleteVehicle(id);
         await loadData();
         toast.success('Pojazd usunięty');
      }
   };

   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
         const reader = new FileReader();
         reader.onload = (ev) => {
            if(ev.target?.result) setFormData(prev => ({ ...prev, photoUrl: ev.target!.result as string }));
         };
         reader.readAsDataURL(e.target.files[0]);
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl">Flota Pojazdów</h3>
            {currentBranchId !== 'all' ? (
                <Button onClick={() => { setShowForm(!showForm); setEditId(null); setFormData(initialFormState); }}>
                   {showForm ? 'Anuluj' : <><Plus size={18}/> Dodaj Pojazd</>}
                </Button>
            ) : (
               <Button variant="secondary" disabled>Wybierz oddział, aby dodać</Button>
            )}
         </div>

         {showForm && currentBranchId !== 'all' && (
            <Card className="border border-[var(--color-primary)] animate-fade-in">
               <h4 className="font-bold mb-4">{editId ? 'Edytuj Pojazd' : 'Nowy Pojazd'}</h4>
               <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6">
                  <div className="w-48 h-32 bg-[var(--color-secondary)] rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] cursor-pointer relative overflow-hidden group">
                     {formData.photoUrl ? (
                        <img src={formData.photoUrl} className="w-full h-full object-cover" />
                     ) : (
                        <div className="text-[var(--color-text-secondary)] text-center">
                           <ImageIcon size={24} className="mx-auto mb-1"/>
                           <span className="text-xs">Dodaj zdjęcie</span>
                        </div>
                     )}
                     <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>

                  <div className="flex-1 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Model (Wymagane)" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
                        <Input label="Producent" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div>
                           <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Paliwo</label>
                           <select 
                              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                              value={formData.fuelType}
                              onChange={e => setFormData({...formData, fuelType: e.target.value as any})}
                           >
                              <option value="diesel">Diesel</option>
                              <option value="petrol">Benzyna</option>
                              <option value="electric">Elektryczny</option>
                              <option value="hybrid">Hybryda</option>
                              <option value="lpg">LPG</option>
                           </select>
                        </div>
                        <Input label="Kolor" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                        <Input label="Liczba miejsc" type="number" value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input type="date" label="Data Przeglądu" value={formData.inspectionDate} onChange={e => setFormData({...formData, inspectionDate: e.target.value})} />
                        <Input type="date" label="Badanie Techniczne" value={formData.technicalDate} onChange={e => setFormData({...formData, technicalDate: e.target.value})} />
                     </div>
                     <div className="flex justify-end pt-2">
                        <Button type="submit"><Save size={16} className="mr-2"/> Zapisz</Button>
                     </div>
                  </div>
               </form>
            </Card>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
               <Card key={v.id} className="group relative overflow-hidden p-0 border border-[var(--color-border)] hover:shadow-lg transition-all">
                  <div className="h-40 bg-[var(--color-secondary)] relative">
                     {v.photoUrl ? (
                        <img src={v.photoUrl} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                           <Truck size={48} opacity={0.2} />
                        </div>
                     )}
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(v)} className="p-2 bg-white rounded-full shadow text-black hover:bg-gray-100"><Edit2 size={14}/></button>
                        <button onClick={() => handleDelete(v.id)} className="p-2 bg-white rounded-full shadow text-red-500 hover:bg-red-50"><Trash2 size={14}/></button>
                     </div>
                  </div>
                  <div className="p-4">
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <div className="font-bold text-lg">{v.model}</div>
                           <div className="text-sm text-[var(--color-text-secondary)]">{v.manufacturer}</div>
                        </div>
                        <Badge variant="secondary" className="uppercase text-[10px]">{v.fuelType}</Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)] mt-4 pt-4 border-t border-[var(--color-border)]">
                        <div>
                           <span className="block font-bold">Kolor</span> {v.color || '-'}
                        </div>
                        <div>
                           <span className="block font-bold">Miejsca</span> {v.seats || '-'}
                        </div>
                        <div>
                           <span className="block font-bold">Przegląd</span> {v.inspectionDate || '-'}
                        </div>
                        <div>
                           <span className="block font-bold">Badanie Tech.</span> {v.technicalDate || '-'}
                        </div>
                     </div>
                  </div>
               </Card>
            ))}
            {vehicles.length === 0 && (
               <div className="col-span-full text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                  Brak pojazdów w tym oddziale.
               </div>
            )}
         </div>
      </div>
   );
};

const ChecklistTab: React.FC<{ companyId: string, currentBranchId: string | 'all' }> = ({ companyId, currentBranchId }) => {
   const [checklists, setChecklists] = useState<Checklist[]>([]);
   const [newChecklistName, setNewChecklistName] = useState('');
   
   // Adding item to existing checklist state
   const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
   const [newItemLabel, setNewItemLabel] = useState('');

   useEffect(() => {
      loadData();
   }, [companyId, currentBranchId]);

   const loadData = async () => {
      let list = await getChecklists(companyId);
      if (currentBranchId !== 'all') {
         list = list.filter(c => !c.branchId || c.branchId === currentBranchId);
      }
      setChecklists(list);
   };

   const handleCreateChecklist = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newChecklistName) return;
      const branchIdToSave = currentBranchId !== 'all' ? currentBranchId : undefined;
      
      await saveChecklist({ 
         companyId, 
         branchId: branchIdToSave,
         name: newChecklistName 
      });
      setNewChecklistName('');
      await loadData();
      toast.success('Checklista utworzona');
   };

   const handleDeleteChecklist = async (id: string) => {
      if(confirm('Usunąć checklistę?')) {
         await deleteChecklist(id);
         await loadData();
      }
   };

   const handleAddItem = async (checklistId: string) => {
      if(!newItemLabel) return;
      const checklist = checklists.find(c => c.id === checklistId);
      if(!checklist) return;

      const newItem = { id: crypto.randomUUID(), label: newItemLabel, isChecked: false };
      const updated = { ...checklist, items: [...checklist.items, newItem] };
      
      await saveChecklist({ ...updated, companyId });
      setNewItemLabel('');
      // Keep adding mode open
      await loadData();
   };

   const handleDeleteItem = async (checklistId: string, itemId: string) => {
      const checklist = checklists.find(c => c.id === checklistId);
      if(!checklist) return;
      const updated = { ...checklist, items: checklist.items.filter(i => i.id !== itemId) };
      await saveChecklist({ ...updated, companyId });
      await loadData();
   };

   return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
               <h3 className="font-bold text-xl">Checklisty</h3>
               <p className="text-[var(--color-text-secondary)]">Listy zadań dla pracowników (np. przygotowanie do pogrzebu).</p>
            </div>
            {currentBranchId !== 'all' ? (
               <Card className="p-2 flex gap-2 border border-[var(--color-primary)] bg-[var(--color-surface)]">
                  <Input 
                     placeholder="Nazwa nowej listy..." 
                     value={newChecklistName} 
                     onChange={e => setNewChecklistName(e.target.value)} 
                     className="min-w-[200px] border-none shadow-none bg-transparent"
                  />
                  <Button size="sm" onClick={handleCreateChecklist}><Plus size={16}/></Button>
               </Card>
            ) : (
               <Button variant="secondary" disabled>Wybierz oddział, aby dodać</Button>
            )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checklists.map(list => (
               <Card key={list.id} className="relative group">
                  <div className="flex justify-between items-center mb-4 border-b border-[var(--color-border)] pb-2">
                     <h4 className="font-bold text-lg">{list.name}</h4>
                     <button onClick={() => handleDeleteChecklist(list.id)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                  </div>

                  <div className="space-y-2 mb-4">
                     {list.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-[var(--color-background)] p-2 rounded text-sm">
                           <span>{item.label}</span>
                           <button onClick={() => handleDeleteItem(list.id, item.id)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"><X size={14}/></button>
                        </div>
                     ))}
                     {list.items.length === 0 && <div className="text-xs text-[var(--color-text-secondary)] italic">Brak pozycji.</div>}
                  </div>

                  {addingItemTo === list.id ? (
                     <div className="flex gap-2">
                        <Input 
                           autoFocus
                           placeholder="Nowa pozycja..." 
                           value={newItemLabel} 
                           onChange={e => setNewItemLabel(e.target.value)} 
                           className="text-sm h-9 py-1"
                           onKeyDown={e => e.key === 'Enter' && handleAddItem(list.id)}
                        />
                        <Button size="sm" onClick={() => handleAddItem(list.id)} className="h-9 w-9 p-0"><Plus size={16}/></Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingItemTo(null)} className="h-9 w-9 p-0"><X size={16}/></Button>
                     </div>
                  ) : (
                     <Button size="sm" variant="secondary" className="w-full" onClick={() => setAddingItemTo(list.id)}>
                        <Plus size={14} className="mr-1"/> Dodaj Pozycję
                     </Button>
                  )}
               </Card>
            ))}
            {checklists.length === 0 && (
               <div className="col-span-full text-center p-8 text-[var(--color-text-secondary)]">Brak checklist w tym oddziale.</div>
            )}
         </div>
      </div>
   );
};

const FurnacesTab: React.FC<{ companyId: string, currentBranchId: string | 'all' }> = ({ companyId, currentBranchId }) => {
   const [furnaces, setFurnaces] = useState<Furnace[]>([]);
   const [showForm, setShowForm] = useState(false);
   const [editId, setEditId] = useState<string | null>(null);
   const [formData, setFormData] = useState({ name: '', color: '#32FFDC' });

   useEffect(() => {
      loadData();
   }, [companyId, currentBranchId]);

   const loadData = async () => {
      let f = await getFurnaces(companyId);
      if (currentBranchId !== 'all') {
         f = f.filter(furnace => !furnace.branchId || furnace.branchId === currentBranchId);
      }
      setFurnaces(f);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // If a specific branch is selected, assign it. If 'all', default to first branch or none? 
      // Prompt says "zapisywanie danych również powinno odbywać się w ten sam sposób".
      const branchIdToSave = currentBranchId !== 'all' ? currentBranchId : undefined;

      await saveFurnace({ 
         id: editId || undefined, 
         companyId, 
         name: formData.name, 
         color: formData.color,
         branchId: branchIdToSave
      });
      await loadData();
      resetForm();
      toast.success(editId ? 'Piec zaktualizowany' : 'Piec dodany');
   };

   const handleEdit = (f: Furnace) => {
      setEditId(f.id);
      setFormData({ name: f.name, color: f.color });
      setShowForm(true);
   };

   const handleDelete = async (id: string) => {
      if(confirm('Usunąć piec?')) {
         await deleteFurnace(id);
         await loadData();
         toast.success('Piec usunięty');
      }
   };

   const resetForm = () => {
      setFormData({ name: '', color: '#32FFDC' });
      setEditId(null);
      setShowForm(false);
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-end">
            {currentBranchId !== 'all' ? (
                <Button onClick={() => setShowForm(!showForm)}>
                   {showForm ? 'Anuluj' : <><Plus size={18}/> Dodaj Piec</>}
                </Button>
            ) : (
               <div className="text-xs text-[var(--color-text-secondary)] italic">Wybierz oddział, aby dodać piec.</div>
            )}
         </div>

         {showForm && currentBranchId !== 'all' && (
            <Card className="border border-[var(--color-primary)]">
               <h3 className="font-bold mb-4">{editId ? 'Edytuj Piec' : 'Nowy Piec'}</h3>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Nazwa Pieca" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <div>
                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Kolor Oznaczenia</label>
                     <ColorPicker selectedColor={formData.color} onSelect={c => setFormData({...formData, color: c})} />
                  </div>
                  <Button type="submit">{editId ? 'Zapisz Zmiany' : 'Dodaj Piec'}</Button>
               </form>
            </Card>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {furnaces.map(f => (
               <Card key={f.id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: f.color }}>
                        <Flame size={20} className="text-white mix-blend-overlay" />
                     </div>
                     <div>
                        <div className="font-bold">{f.name}</div>
                        {/* SAFE ACCESS TO ID.SLICE */}
                        <div className="text-[10px] text-[var(--color-text-secondary)] font-mono uppercase">ID: {f.id?.slice(0,8)}</div>
                     </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => f.id && handleEdit(f)} className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-lg"><Edit2 size={16}/></button>
                     <button onClick={() => f.id && handleDelete(f.id)} className="p-2 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:bg-opacity-10 rounded-lg"><Trash2 size={16}/></button>
                  </div>
               </Card>
            ))}
            {furnaces.length === 0 && <div className="col-span-full text-center text-[var(--color-text-secondary)] py-8">Brak pieców w tym oddziale.</div>}
         </div>
      </div>
   );
};

const OptionsTab: React.FC<{ companyId: string }> = ({ companyId }) => {
   const [groups, setGroups] = useState<CremationOptionGroup[]>([]);
   const [optionsByGroup, setOptionsByGroup] = useState<{[key: string]: CremationOption[]}>({});
   const [newGroup, setNewGroup] = useState('');
   
   // Option Form State
   const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
   const [optionForm, setOptionForm] = useState({ name: '', color: '#32FFDC' });

   useEffect(() => {
      refreshData();
   }, [companyId]);

   const refreshData = async () => {
      const g = await getOptionGroups(companyId);
      setGroups(g);
      const opts: any = {};
      for (const group of g) {
         opts[group.id] = await getOptions(group.id);
      }
      setOptionsByGroup(opts);
   };

   const handleAddGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newGroup) return;
      await saveOptionGroup({ companyId, name: newGroup });
      setNewGroup('');
      await refreshData();
      toast.success('Grupa opcji dodana');
   };

   const handleDeleteGroup = async (id: string) => {
      if(confirm('Usunąć grupę i wszystkie jej opcje?')) {
         await deleteOptionGroup(id);
         await refreshData();
         toast.success('Grupa usunięta');
      }
   };

   const handleAddOption = async (e: React.FormEvent, groupId: string) => {
      e.preventDefault();
      await saveOption({ 
         groupId, 
         companyId, 
         name: optionForm.name, 
         color: optionForm.color, 
         isDefault: false 
      });
      setOptionForm({ name: '', color: '#32FFDC' });
      setActiveGroupId(null);
      await refreshData();
      toast.success('Opcja dodana');
   };

   const handleSetDefault = async (option: CremationOption) => {
      await saveOption({ ...option, isDefault: true, companyId });
      await refreshData();
      toast.success('Ustawiono jako domyślne');
   };

   const handleDeleteOption = async (id: string) => {
      await deleteOption(id);
      await refreshData();
      toast.success('Opcja usunięta');
   };

   return (
      <div className="space-y-8">
         {/* Add Group */}
         <Card className="bg-[var(--color-surface-highlight)] bg-opacity-30">
            <form onSubmit={handleAddGroup} className="flex gap-4 items-end">
               <Input label="Nowa Grupa Opcji" value={newGroup} onChange={e => setNewGroup(e.target.value)} placeholder="np. Rodzaj Urny" />
               <Button type="submit" className="mb-2">Dodaj Grupę</Button>
            </form>
         </Card>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map(group => (
               <Card key={group.id} className="relative">
                  <div className="flex justify-between items-center mb-4 border-b border-[var(--color-border)] pb-2">
                     <h3 className="font-bold text-lg">{group.name}</h3>
                     <button onClick={() => handleDeleteGroup(group.id)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"><Trash2 size={16}/></button>
                  </div>

                  <div className="space-y-2 mb-4">
                     {(optionsByGroup[group.id] || []).map(opt => (
                        <div key={opt.id} className={`flex items-center justify-between p-3 rounded-lg border ${opt.isDefault ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-5' : 'border-[var(--color-border)]'}`}>
                           <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt.color }}></div>
                              <span className="font-medium">{opt.name}</span>
                              {opt.isDefault && <Badge variant="primary">Default</Badge>}
                           </div>
                           <div className="flex gap-2">
                              {!opt.isDefault && (
                                 <button onClick={() => handleSetDefault(opt)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-xs font-bold" title="Ustaw jako domyślne">Set Default</button>
                              )}
                              <button onClick={() => handleDeleteOption(opt.id)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"><Trash2 size={14}/></button>
                           </div>
                        </div>
                     ))}
                  </div>

                  {activeGroupId === group.id ? (
                     <form onSubmit={e => handleAddOption(e, group.id)} className="p-3 bg-[var(--color-surface-highlight)] rounded-lg border border-[var(--color-border)] animate-fade-in">
                        <Input label="Nazwa Opcji" value={optionForm.name} onChange={e => setOptionForm({...optionForm, name: e.target.value})} className="mb-3 bg-white" autoFocus />
                        <div className="mb-3">
                           <ColorPicker selectedColor={optionForm.color} onSelect={c => setOptionForm({...optionForm, color: c})} />
                        </div>
                        <div className="flex gap-2 justify-end">
                           <Button size="sm" variant="ghost" onClick={() => setActiveGroupId(null)}>Anuluj</Button>
                           <Button size="sm" type="submit">Dodaj</Button>
                        </div>
                     </form>
                  ) : (
                     <Button variant="ghost" className="w-full border border-dashed border-[var(--color-border)]" onClick={() => setActiveGroupId(group.id)}>
                        <Plus size={16} /> Dodaj Opcję
                     </Button>
                  )}
               </Card>
            ))}
         </div>
      </div>
   );
};

const CoopCompaniesTab: React.FC<{ companyId: string }> = ({ companyId }) => {
   const [companies, setCompanies] = useState<CooperatingCompany[]>([]);
   const [drivers, setDrivers] = useState<{[key: string]: Driver[]}>({});
   const [tags, setTags] = useState<CompanyTag[]>([]);
   
   // UI States
   const [showAdd, setShowAdd] = useState(false);
   const [showTagManager, setShowTagManager] = useState(false);
   const [expandedId, setExpandedId] = useState<string | null>(null);
   
   // Company Form
   const [formData, setFormData] = useState({ nip: '', name: '', street: '', city: '', phone: '', email: '', tagId: '' });
   const [isLoadingGus, setIsLoadingGus] = useState(false);

   // Driver Form
   const [driverForm, setDriverForm] = useState({ name: '', phone: '' });

   // Tag Form
   const [newTagName, setNewTagName] = useState('');
   const [newTagColor, setNewTagColor] = useState('#E2E8F0'); // Default color
   const [editingTagId, setEditingTagId] = useState<string | null>(null);

   useEffect(() => {
      refreshData();
   }, [companyId]);

   const refreshData = async () => {
      const c = await getCoopCompanies(companyId);
      setCompanies(c);
      setTags(await getTags(companyId));
      const d: any = {};
      for (const comp of c) {
         d[comp.id] = await getDrivers(comp.id);
      }
      setDrivers(d);
   };

   // --- TAGS LOGIC ---
   const handleSaveTag = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTagName) return;
      await saveTag({ 
         id: editingTagId || undefined, 
         companyId, 
         name: newTagName,
         color: newTagColor 
      });
      setNewTagName('');
      setNewTagColor('#E2E8F0');
      setEditingTagId(null);
      await refreshData();
      toast.success(editingTagId ? 'Tag zaktualizowany' : 'Tag dodany');
   };

   const handleEditTag = (tag: CompanyTag) => {
      setNewTagName(tag.name);
      setNewTagColor(tag.color || '#E2E8F0');
      setEditingTagId(tag.id);
   };

   const handleDeleteTag = async (id: string) => {
      if(confirm("Usunąć tag?")) {
         await deleteTag(id);
         await refreshData();
         toast.success('Tag usunięty');
      }
   };


   // --- COMPANY LOGIC ---
   const handleGusFetch = async () => {
      if(!formData.nip) return toast.warning('Wpisz NIP');
      setIsLoadingGus(true);
      try {
         const data = await fetchGusData(formData.nip);
         if(data) {
            setFormData(prev => ({ ...prev, ...data }));
            toast.success('Dane pobrane z GUS');
         }
      } catch (e: any) {
         toast.error(e.message || 'Błąd pobierania danych');
      } finally {
         setIsLoadingGus(false);
      }
   };

   const handleAddCompany = async (e: React.FormEvent) => {
      e.preventDefault();
      await saveCoopCompany({ ...formData, companyId });
      setFormData({ nip: '', name: '', street: '', city: '', phone: '', email: '', tagId: '' });
      setShowAdd(false);
      await refreshData();
      toast.success('Firma współpracująca dodana');
   };

   const handleDeleteCompany = async (id: string) => {
      if(confirm('Usunąć firmę współpracującą?')) {
         await deleteCoopCompany(id);
         await refreshData();
         toast.success('Firma usunięta');
      }
   };

   const toggleExpand = (id: string) => {
      setExpandedId(expandedId === id ? null : id);
   };

   const handleAddDriver = async (e: React.FormEvent, coopId: string) => {
      e.preventDefault();
      await saveDriver({ cooperatingCompanyId: coopId, ...driverForm });
      setDriverForm({ name: '', phone: '' });
      await refreshData();
      toast.success('Kierowca dodany');
   };

   const handleDeleteDriver = async (id: string) => {
      await deleteDriver(id);
      await refreshData();
      toast.success('Kierowca usunięty');
   };

   const getTagName = (tagId?: string) => {
      if(!tagId) return null;
      return tags.find(t => t.id === tagId)?.name;
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowTagManager(!showTagManager)}>
               <Tag size={18} /> Zarządzaj Tagami
            </Button>
            <Button onClick={() => setShowAdd(!showAdd)}>
               {showAdd ? 'Anuluj' : <><Plus size={18}/> Dodaj Firmę</>}
            </Button>
         </div>

         {/* TAG MANAGER */}
         {showTagManager && (
            <Card className="bg-[var(--color-surface-highlight)] border border-[var(--color-border)] animate-fade-in">
               <h3 className="font-bold mb-4">Tagi Firm</h3>
               
               <form onSubmit={handleSaveTag} className="mb-6 space-y-4">
                  <div className="flex gap-2">
                     <Input 
                        placeholder="Nazwa Taga (np. Kwiaciarnia)" 
                        value={newTagName} 
                        onChange={e => setNewTagName(e.target.value)} 
                        className="bg-white"
                     />
                     <Button type="submit">{editingTagId ? 'Zapisz' : 'Dodaj'}</Button>
                     {editingTagId && <Button type="button" variant="ghost" onClick={() => { setEditingTagId(null); setNewTagName(''); setNewTagColor('#E2E8F0'); }}>Anuluj</Button>}
                  </div>
                  <div>
                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Kolor Oznaczenia</label>
                     <ColorPicker selectedColor={newTagColor} onSelect={setNewTagColor} />
                  </div>
               </form>

               <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                     <div key={tag.id} className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-border)] shadow-sm" style={{ backgroundColor: tag.color || '#fff' }}>
                        <span className="font-medium text-sm" style={{ color: '#000' }}>{tag.name}</span>
                        <button onClick={() => handleEditTag(tag)} className="text-black/50 hover:text-black"><Edit2 size={12}/></button>
                        <button onClick={() => handleDeleteTag(tag.id)} className="text-black/50 hover:text-red-600"><Trash2 size={12}/></button>
                     </div>
                  ))}
                  {tags.length === 0 && <span className="text-sm text-[var(--color-text-secondary)] italic">Brak tagów.</span>}
               </div>
            </Card>
         )}

         {/* ADD COMPANY FORM */}
         {showAdd && (
            <Card className="border border-[var(--color-primary)]">
               <h3 className="font-bold mb-4">Nowa Firma Współpracująca</h3>
               <form onSubmit={handleAddCompany} className="space-y-4">
                  <div className="flex gap-4 items-end">
                     <Input label="NIP" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
                     <Button type="button" variant="secondary" onClick={handleGusFetch} disabled={isLoadingGus} className="mb-2 w-48">
                        {isLoadingGus ? 'Pobieranie...' : <><Search size={16}/> Pobierz z GUS</>}
                     </Button>
                  </div>
                  <Input label="Nazwa Firmy" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  
                  {/* TAG SELECTOR */}
                  <div>
                     <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Tag (Kategoria)</label>
                     <select 
                        value={formData.tagId} 
                        onChange={e => setFormData({...formData, tagId: e.target.value})}
                        className="w-full bg-[var(--color-input)] border-2 border-transparent rounded-[var(--radius-input)] px-4 py-3 text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] transition-all font-medium"
                     >
                        <option value="">-- Wybierz Tag --</option>
                        {tags.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Ulica" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                     <Input label="Miasto" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Telefon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     <Input label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <Button type="submit">Zapisz Firmę</Button>
               </form>
            </Card>
         )}

         {/* COMPANIES LIST */}
         <div className="space-y-4">
            {companies.map(comp => {
               const tag = tags.find(t => t.id === comp.tagId);

               return (
                  <Card key={comp.id} className="transition-all">
                     <div className="flex justify-between items-center cursor-pointer" onClick={(e) => {
                        if((e.target as HTMLElement).closest('button, input, select')) return;
                        toggleExpand(comp.id);
                     }}>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-[var(--color-surface-highlight)] rounded-xl flex items-center justify-center">
                              <Building2 size={24} className="text-[var(--color-text-secondary)]"/>
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <div className="font-bold text-lg">{comp.name}</div>
                                 {tag && (
                                    <span 
                                       className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-black/5"
                                       style={{ backgroundColor: tag.color || 'var(--color-primary)', color: tag.color ? '#000' : '#fff' }}
                                    >
                                       {tag.name}
                                    </span>
                                 )}
                              </div>
                              <div className="text-sm text-[var(--color-text-secondary)]">{comp.city}, {comp.street}</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button onClick={() => handleDeleteCompany(comp.id)} className="p-2 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:bg-opacity-10 rounded-lg"><Trash2 size={18}/></button>
                           <button>{expandedId === comp.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</button>
                        </div>
                     </div>

                     {expandedId === comp.id && (
                        <div className="mt-6 pt-6 border-t border-[var(--color-border)] animate-fade-in">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                 <span className="text-xs uppercase text-[var(--color-text-secondary)] font-bold">Dane Kontaktowe</span>
                                 <div className="mt-2 text-sm space-y-1">
                                    <div>NIP: {comp.nip}</div>
                                    <div>Tel: {comp.phone}</div>
                                    <div>Email: {comp.email}</div>
                                 </div>
                              </div>
                              
                              {/* Drivers Section */}
                              <div>
                                 <span className="text-xs uppercase text-[var(--color-text-secondary)] font-bold mb-2 block">Kierowcy ({drivers[comp.id]?.length || 0})</span>
                                 
                                 <div className="bg-[var(--color-background)] rounded-lg p-3 border border-[var(--color-border)] mb-3 max-h-40 overflow-y-auto">
                                    {(drivers[comp.id] || []).length === 0 && <span className="text-xs text-[var(--color-text-secondary)]">Brak kierowców</span>}
                                    {(drivers[comp.id] || []).map(d => (
                                       <div key={d.id} className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0">
                                          <div className="flex items-center gap-2">
                                             <UserIcon size={14} className="text-[var(--color-primary)]"/>
                                             <span className="text-sm font-medium">{d.name}</span>
                                             <span className="text-xs text-[var(--color-text-secondary)]">({d.phone})</span>
                                          </div>
                                          <div className="flex gap-1">
                                             <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]"><Edit2 size={12}/></button>
                                             <button onClick={() => handleDeleteDriver(d.id)} className="text-[var(--color-danger)] hover:text-red-700"><Trash2 size={12}/></button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>

                                 <form onSubmit={e => handleAddDriver(e, comp.id)} className="flex gap-2">
                                    <Input placeholder="Imię i Nazwisko" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="bg-white text-xs py-2 h-9" />
                                    <Input placeholder="Telefon" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="bg-white text-xs py-2 h-9" />
                                    <Button size="sm" type="submit" className="h-9 w-9 p-0 flex items-center justify-center"><Plus size={16}/></Button>
                                 </form>
                              </div>
                           </div>
                        </div>
                     )}
                  </Card>
               );
            })}
         </div>
      </div>
   );
};
