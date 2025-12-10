
import React, { useState, useEffect } from 'react';
import { User, Cremation, CooperatingCompany, CremationOptionGroup, CremationOption, Furnace, Driver, DeceasedData, ApplicantData, WarehouseItem, CremationItem } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { 
  getCremations, saveCremation, deleteCremation,
  getCoopCompanies, getOptionGroups, getOptions, getFurnaces, 
  getCoopCompanyById, getDrivers, getWarehouseItems, updateWarehouseStock
} from '../services/storageService';
import { 
  Flame, Plus, Calendar, Building2, Search, 
  ChevronDown, Trash2, Edit2, 
  User as UserIcon, FileText, Check, List as ListIcon, X, History as HistoryIcon, Clock, Package, ShoppingCart, Layers as LayersIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface CremationsProps {
  user: User;
  currentBranchId?: string | 'all';
}

export const Cremations: React.FC<CremationsProps> = ({ user, currentBranchId = 'all' }) => {
  if (!user.companyId) return <div>Brak dostępu.</div>;

  // --- Schedule State ---
  const [cremations, setCremations] = useState<Cremation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCremationId, setEditingCremationId] = useState<string | null>(null); // For edit mode
  
  // Data for Selectors
  const [coopCompanies, setCoopCompanies] = useState<CooperatingCompany[]>([]);
  const [optionGroups, setOptionGroups] = useState<CremationOptionGroup[]>([]);
  const [optionsByGroup, setOptionsByGroup] = useState<{[key: string]: CremationOption[]}>({});
  const [furnaces, setFurnaces] = useState<Furnace[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Cremation>>({
     date: new Date().toISOString().split('T')[0],
     time: '12:00',
     selectedOptions: []
  });

  // Company Selector State
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<CooperatingCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CooperatingCompany | null>(null);

  // List View State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailDrivers, setDetailDrivers] = useState<Driver[]>([]);
  const [detailTab, setDetailTab] = useState<'info' | 'data' | 'products'>('info');
  const [showHistory, setShowHistory] = useState(false); // Toggle history in expanded card

  // Warehouse Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerItems, setPickerItems] = useState<WarehouseItem[]>([]);

  // View Filtering
  const [activeFurnaceTab, setActiveFurnaceTab] = useState<string>('all'); // 'all' or furnaceId
  const [globalSearch, setGlobalSearch] = useState('');

  // Deceased/Applicant Form in Expanded View
  const [deceasedForm, setDeceasedForm] = useState<DeceasedData>({ first_name: '', last_name: '' });
  const [applicantForm, setApplicantForm] = useState<ApplicantData>({ first_name: '', last_name: '', phone: '' });

  useEffect(() => {
     loadData();
  }, [user.companyId, currentBranchId]);

  const loadData = async () => {
     if(!user.companyId) return;
     const allCremations = await getCremations(user.companyId);
     
     // FILTER BY BRANCH IF SELECTED
     const filteredByBranch = currentBranchId === 'all' 
        ? allCremations 
        : allCremations.filter(c => c.branchId === currentBranchId);

     setCremations(filteredByBranch);
     setCoopCompanies(await getCoopCompanies(user.companyId));
     setFurnaces(await getFurnaces(user.companyId));
     
     // Load all warehouse items for picker
     const products = await getWarehouseItems(user.companyId, 'product');
     const services = await getWarehouseItems(user.companyId, 'service');
     setWarehouseItems([...products, ...services]);

     const groups = await getOptionGroups(user.companyId);
     setOptionGroups(groups);
     const opts: any = {};
     for(const g of groups) {
        opts[g.id] = await getOptions(g.id);
     }
     setOptionsByGroup(opts);
  };

  // --- Schedule Logic ---

  const handleCompanySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.value;
     setCompanySearch(val);
     if (val.length >= 3) {
        setFilteredCompanies(coopCompanies.filter(c => c.name.toLowerCase().includes(val.toLowerCase()) || c.nip.includes(val)));
     } else {
        setFilteredCompanies([]);
     }
  };

  const selectCompany = (c: CooperatingCompany) => {
     setSelectedCompany(c);
     setFormData({ ...formData, cooperatingCompanyId: c.id });
     setCompanySearch('');
     setFilteredCompanies([]);
     setShowCompanyList(false);
  };

  const toggleOption = (id: string) => {
     const current = formData.selectedOptions || [];
     if (current.includes(id)) {
        setFormData({ ...formData, selectedOptions: current.filter(x => x !== id) });
     } else {
        setFormData({ ...formData, selectedOptions: [...current, id] });
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.cooperatingCompanyId) return toast.warning('Wybierz firmę współpracującą');
     if (!formData.furnaceId) return toast.warning('Wybierz piec');

     // Determine Branch ID: Use currently selected tab, or fallback to user's branch
     const assignBranchId = currentBranchId !== 'all' ? currentBranchId : user.branchId;

     saveCremation({
        ...formData,
        id: editingCremationId || undefined,
        companyId: user.companyId!,
        branchId: assignBranchId
     }, user);
     
     setShowAddForm(false);
     setEditingCremationId(null);
     resetForm();
     loadData();
     toast.success(editingCremationId ? 'Kremacja zaktualizowana' : 'Kremacja zaplanowana pomyślnie');
  };

  const resetForm = () => {
     setFormData({ date: new Date().toISOString().split('T')[0], time: '12:00', selectedOptions: [] });
     setSelectedCompany(null);
     setEditingCremationId(null);
  }

  const handleEditCremation = (cremation: Cremation) => {
     setEditingCremationId(cremation.id);
     setFormData(cremation);
     const comp = coopCompanies.find(c => c.id === cremation.cooperatingCompanyId);
     if(comp) setSelectedCompany(comp);
     setShowAddForm(true);
     // Scroll to top or form
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCremation = (id: string) => {
     const shouldRestore = confirm('Czy chcesz zwrócić produkty przypisane do tej kremacji na magazyn?');
     if(confirm('Czy na pewno chcesz usunąć tę kremację? Zostanie ona przeniesiona do archiwum.')) {
        deleteCremation(id, user, shouldRestore);
        loadData();
        toast.info(shouldRestore ? 'Kremacja usunięta, produkty zwrócone' : 'Kremacja przeniesiona do archiwum');
     }
  };

  const toggleExpand = async (cremation: Cremation) => {
     if (expandedId === cremation.id) {
        setExpandedId(null);
        setShowHistory(false);
        setDetailTab('info');
     } else {
        setExpandedId(cremation.id);
        setDetailDrivers(await getDrivers(cremation.cooperatingCompanyId));
        setDeceasedForm(cremation.deceased || { first_name: '', last_name: '' });
        setApplicantForm(cremation.applicant || { first_name: '', last_name: '', phone: '' });
        setShowHistory(false);
        setDetailTab('info');
     }
  };

  const handleSaveExpandedData = (cremationId: string) => {
     if(!user.companyId) return;
     saveCremation({
        id: cremationId,
        companyId: user.companyId,
        deceased: deceasedForm,
        applicant: applicantForm
     }, user);
     loadData();
     toast.success('Dane kremacji zaktualizowane');
  };

  // --- Product Picker Logic ---
  const openProductPicker = async () => {
     const items = await getWarehouseItems(user.companyId!, undefined);
     const filtered = currentBranchId === 'all' ? items : items.filter(i => !i.branchId || i.branchId === currentBranchId);
     
     setPickerItems(filtered);
     setPickerSearch('');
     setShowPicker(true);
  };

  const handleAddProduct = (item: WarehouseItem) => {
     if(!expandedId) return;
     
     // Stock Check
     if (item.type === 'product' && typeof item.quantity === 'number' && item.quantity <= 0) {
        return toast.error('Produkt niedostępny w magazynie (stan: 0)');
     }

     const cremation = cremations.find(c => c.id === expandedId);
     if(!cremation) return;

     const newItem: CremationItem = {
        id: crypto.randomUUID(),
        warehouseItemId: item.id,
        type: item.type,
        name: item.name,
        photoUrl: item.photoUrl,
        price: item.salesPrice,
        quantity: 1
     };

     const updatedItems = [...(cremation.items || []), newItem];
     
     // Deduct Stock
     if (item.type === 'product') {
        updateWarehouseStock(item.id, -1);
     }

     saveCremation({
        id: cremation.id,
        companyId: user.companyId!,
        items: updatedItems
     }, user);

     loadData();
     toast.success('Dodano do kremacji');
     // Don't close picker to allow multiple adds
  };

  const handleUpdateItemPrice = (cremationId: string, itemId: string, newPrice: number) => {
     const cremation = cremations.find(c => c.id === cremationId);
     if(!cremation || !cremation.items) return;

     const updatedItems = cremation.items.map(i => i.id === itemId ? { ...i, price: newPrice } : i);
     
     saveCremation({
        id: cremationId,
        companyId: user.companyId!,
        items: updatedItems
     }, user);
     
     // Optimistic update locally
     setCremations(prev => prev.map(c => c.id === cremationId ? { ...c, items: updatedItems } : c));
  };

  const handleRemoveItem = (cremationId: string, item: CremationItem) => {
     if(!confirm('Usunąć pozycję?')) return;
     
     const cremation = cremations.find(c => c.id === cremationId);
     if(!cremation || !cremation.items) return;

     const updatedItems = cremation.items.filter(i => i.id !== item.id);
     
     // Restore Stock?
     if (item.type === 'product' && confirm('Czy zwrócić produkt na magazyn?')) {
        updateWarehouseStock(item.warehouseItemId, item.quantity);
     }

     saveCremation({
        id: cremationId,
        companyId: user.companyId!,
        items: updatedItems
     }, user);
     
     loadData();
  };

  const togglePaidStatus = (cremationId: string, currentStatus?: boolean) => {
     saveCremation({
        id: cremationId,
        companyId: user.companyId!,
        isPaid: !currentStatus
     }, user);
     loadData();
  };

  // Grouping & Filtering
  const today = new Date().toISOString().split('T')[0];

  const filteredCremations = cremations.filter(c => {
     // Search Logic: if text exists, allow deleted items if they match
     if (globalSearch) {
        const term = globalSearch.toLowerCase();
        const company = coopCompanies.find(co => co.id === c.cooperatingCompanyId);
        const matches = 
           c.cremation_number.toLowerCase().includes(term) ||
           (c.deceased?.first_name + ' ' + c.deceased?.last_name).toLowerCase().includes(term) ||
           (company?.name || '').toLowerCase().includes(term);
        
        return matches;
     }

     // Default Logic: Hide deleted, Filter by Furnace
     if (c.isDeleted) return false;
     if (activeFurnaceTab !== 'all' && c.furnaceId !== activeFurnaceTab) return false;
     
     return true;
  });

  const groupedCremations: { [date: string]: Cremation[] } = {};
  filteredCremations.sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach(c => {
     if(!groupedCremations[c.date]) groupedCremations[c.date] = [];
     groupedCremations[c.date].push(c);
  });

  const getOptionById = (id: string) => {
     for(const key in optionsByGroup) {
        const found = optionsByGroup[key].find(o => o.id === id);
        if(found) return found;
     }
     return null;
  };

  const getFurnaceColor = (furnaceId: string) => {
     return furnaces.find(f => f.id === furnaceId)?.color || 'transparent';
  };

  // Picker Filter
  const filteredPickerItems = pickerItems.filter(i => i.name.toLowerCase().includes(pickerSearch.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
         <div>
            <h2 className="text-3xl font-bold flex items-center gap-3"><Flame className="text-[var(--color-chart-2)]"/> Harmonogram Kremacji</h2>
            <p className="text-[var(--color-text-secondary)]">Zarządzaj bieżącymi procesami</p>
         </div>
         <div className="flex justify-end gap-4">
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16}/>
               <input 
                  type="text" 
                  placeholder="Szukaj (również archiwum)..." 
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-primary)] w-64"
               />
            </div>
            {currentBranchId !== 'all' ? (
                <Button onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}>
                   {showAddForm ? 'Anuluj' : <><Plus size={18}/> Dodaj Kremację</>}
                </Button>
            ) : (
               <Button disabled title="Wybierz oddział, aby dodać kremację" variant="secondary">
                  Wybierz oddział, aby dodać
               </Button>
            )}
         </div>
      </div>

      {/* Furnace Tabs */}
      {!globalSearch && (
         <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-[var(--color-border)]">
            <button 
               onClick={() => setActiveFurnaceTab('all')}
               className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all border-b-2 flex items-center gap-2
                  ${activeFurnaceTab === 'all' 
                     ? 'border-[var(--color-primary)] text-[var(--color-text-main)] bg-[var(--color-surface)]' 
                     : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-main)]'}
               `}
            >
               <LayersIcon size={16}/> Wszystkie
            </button>
            {furnaces.map(f => (
               <button 
                  key={f.id}
                  onClick={() => setActiveFurnaceTab(f.id)}
                  className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all border-b-2 flex items-center gap-2
                     ${activeFurnaceTab === f.id
                        ? 'text-[var(--color-text-main)] bg-[var(--color-surface)]' 
                        : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-main)]'}
                  `}
                  style={{ borderColor: activeFurnaceTab === f.id ? f.color : 'transparent' }}
               >
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: f.color}}></div>
                  {f.name}
               </button>
            ))}
         </div>
      )}

      {/* ADD FORM */}
      {showAddForm && currentBranchId !== 'all' && (
         <Card className="border border-[var(--color-primary)] relative overflow-hidden animate-fade-in">
            <h3 className="font-bold text-xl mb-6">{editingCremationId ? 'Edycja Kremacji' : 'Nowa Kremacja'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
               
               <div className="grid grid-cols-2 gap-4">
                  <Input type="date" label="Data" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="bg-white" />
                  <Input type="time" label="Godzina" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required className="bg-white" />
               </div>

               {/* Company Selection */}
               <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl border border-[var(--color-border)]">
                  <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Firma Współpracująca</label>
                  
                  {selectedCompany ? (
                     <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[var(--color-primary)]">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-[var(--color-secondary)] rounded-lg flex items-center justify-center"><Building2 size={20}/></div>
                           <div>
                              <div className="font-bold">{selectedCompany.name}</div>
                              <div className="text-xs text-[var(--color-text-secondary)]">{selectedCompany.city}, {selectedCompany.street}</div>
                           </div>
                        </div>
                        <button type="button" onClick={() => setSelectedCompany(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={16}/></button>
                     </div>
                  ) : (
                     <div className="space-y-2 relative">
                        <div className="flex gap-2">
                           <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16}/>
                              <Input 
                                 placeholder="Wpisz nazwę firmy..." 
                                 className="pl-10 bg-white" 
                                 value={companySearch} 
                                 onChange={handleCompanySearch}
                              />
                              {filteredCompanies.length > 0 && (
                                 <div className="absolute top-full left-0 right-0 bg-white border border-[var(--color-border)] rounded-lg shadow-xl mt-1 z-20 max-h-48 overflow-y-auto">
                                    {filteredCompanies.map(c => (
                                       <div key={c.id} onClick={() => selectCompany(c)} className="p-3 hover:bg-[var(--color-secondary)] cursor-pointer border-b border-[var(--color-border)] last:border-0">
                                          <div className="font-bold text-sm">{c.name}</div>
                                          <div className="text-xs text-[var(--color-text-secondary)]">{c.city}</div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                           <Button type="button" variant="secondary" onClick={() => setShowCompanyList(!showCompanyList)}>
                              <ListIcon size={18}/>
                           </Button>
                        </div>
                        
                        {showCompanyList && (
                           <div className="mt-2 bg-white rounded-lg border border-[var(--color-border)] p-2 max-h-60 overflow-y-auto">
                              {coopCompanies.map(c => (
                                 <div key={c.id} onClick={() => selectCompany(c)} className="p-2 hover:bg-[var(--color-secondary)] rounded cursor-pointer flex justify-between items-center">
                                    <span className="text-sm font-medium">{c.name}</span>
                                    <span className="text-xs text-[var(--color-text-secondary)]">{c.city}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  )}
               </div>

               {/* Options Groups */}
               <div className="space-y-4">
                  <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] block">Opcje Kremacji</label>
                  {optionGroups.map(group => (
                     <div key={group.id} className="bg-[var(--color-background)] p-3 rounded-lg border border-[var(--color-border)]">
                        <div className="text-xs font-bold mb-2 text-[var(--color-text-secondary)]">{group.name}</div>
                        <div className="flex flex-wrap gap-2">
                           {optionsByGroup[group.id]?.map(opt => {
                              const isSelected = formData.selectedOptions?.includes(opt.id);
                              return (
                                 <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleOption(opt.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-1
                                       ${isSelected ? 'brightness-110 shadow-sm scale-105' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}
                                    `}
                                    style={{ 
                                       backgroundColor: isSelected ? opt.color : 'transparent',
                                       borderColor: opt.color,
                                       color: isSelected ? '#000' : 'var(--color-text-main)'
                                    }}
                                 >
                                    {isSelected && <Check size={12}/>}
                                    {opt.name}
                                 </button>
                              )
                           })}
                        </div>
                     </div>
                  ))}
               </div>

               {/* Furnace */}
               <div>
                  <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Piec Kremacyjny</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                     {furnaces.map(f => (
                        <div 
                           key={f.id} 
                           onClick={() => setFormData({...formData, furnaceId: f.id})}
                           className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${
                              formData.furnaceId === f.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-10 shadow-sm' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-highlight)]'
                           }`}
                        >
                           <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: f.color }}>
                              <Flame size={16} className="text-white mix-blend-overlay"/>
                           </div>
                           <span className="font-bold text-sm">{f.name}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg">{editingCremationId ? 'Zapisz Zmiany' : 'Zaplanuj Kremację'}</Button>
               </div>
            </form>
         </Card>
      )}

      {/* LIST VIEW */}
      <div className="space-y-8">
         {Object.entries(groupedCremations).map(([date, items]) => (
            <div key={date}>
               <div className="flex items-center gap-3 mb-4 sticky top-24 z-10 bg-[var(--color-background)] py-2 border-b border-[var(--color-border)] bg-opacity-95 backdrop-blur-sm">
                  <div className="p-2 bg-[var(--color-surface)] rounded-lg shadow-sm border border-[var(--color-border)]">
                     <Calendar size={18} className="text-[var(--color-text-secondary)]"/>
                  </div>
                  <h3 className="text-lg font-bold capitalize">{new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                  {date === today && <Badge variant="warning">Dzisiaj</Badge>}
               </div>

               <div className="space-y-3">
                  {items.map(item => {
                     const company = coopCompanies.find(c => c.id === item.cooperatingCompanyId);
                     const isExpanded = expandedId === item.id;
                     const isDeleted = item.isDeleted;
                     const isNotToday = item.date !== today;
                     const furnaceColor = getFurnaceColor(item.furnaceId);
                     const totalPrice = (item.items || []).reduce((acc, i) => acc + (i.price * i.quantity), 0);

                     // Card Style Logic
                     let cardClasses = `flex-1 transition-all duration-300 p-4 border relative overflow-hidden `;
                     if(isExpanded) cardClasses += 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] ';
                     else cardClasses += 'border-[var(--color-border)] hover:border-[var(--color-primary)] ';
                     
                     if(isDeleted) cardClasses += 'grayscale bg-[var(--color-muted)] ';
                     else if(isNotToday) cardClasses += 'opacity-60 hover:opacity-100 ';

                     return (
                        <div key={item.id} className={`flex flex-col md:flex-row gap-2`}>
                           {/* Time Badge - Compact */}
                           <div className="md:w-20 pt-1 text-center md:text-right shrink-0">
                              <span className="text-lg font-bold font-mono text-[var(--color-text-secondary)]">{item.time}</span>
                           </div>

                           {/* Compact Card */}
                           <Card className={cardClasses}>
                              {/* Furnace Color Accent Strip */}
                              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: furnaceColor }}></div>

                              <div className="cursor-pointer pl-3" onClick={(e) => {
                                 if((e.target as HTMLElement).closest('button, input, textarea, select')) return;
                                 toggleExpand(item);
                              }}>
                                 {/* Header Compact - NO Buttons */}
                                 <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                       <div className="flex flex-col min-w-0">
                                          <h4 className={`font-bold text-sm truncate ${isDeleted ? 'line-through' : ''}`}>{company?.name || 'Firma nieznana'}</h4>
                                          <div className="text-xs text-[var(--color-text-secondary)] truncate flex items-center gap-1">
                                             {/* Collapsed: Show City instead of Deceased Name */}
                                             {!isExpanded ? (
                                                <><Building2 size={10}/> {company?.city || 'Brak miasta'}</>
                                             ) : (
                                                <>{item.deceased?.last_name ? `Śp. ${item.deceased.first_name} ${item.deceased.last_name}` : 'Brak danych osoby zmarłej'}</>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                    
                                    {/* Options Badges Mini */}
                                    <div className="hidden lg:flex gap-1">
                                       {item.selectedOptions.slice(0, 3).map(optId => {
                                          const opt = getOptionById(optId);
                                          if(!opt) return null;
                                          return <div key={optId} className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} title={opt.name}></div>
                                       })}
                                    </div>

                                    {/* Summary Payment Badge */}
                                    {item.isPaid ? (
                                       <Badge variant="success" className="text-[10px]">Opłacone</Badge>
                                    ) : (
                                       <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">Nieopłacone</span>
                                    )}

                                    <div className="flex items-center gap-2">
                                       <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''} text-[var(--color-text-secondary)]`}>
                                          <ChevronDown size={16}/>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Expanded Details */}
                              {isExpanded && (
                                 <div className="mt-4 pt-4 border-t border-[var(--color-border)] animate-fade-in pl-3">
                                    
                                    {/* Expanded Header: Actions */}
                                    <div className="flex justify-end items-center mb-6">
                                       <div className="flex gap-2">
                                          {!isDeleted && (
                                              <Button size="sm" variant="ghost" onClick={() => handleEditCremation(item)} title="Edytuj">
                                                <Edit2 size={14} className="mr-1"/> Edytuj
                                              </Button>
                                          )}
                                          <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:bg-red-50" onClick={() => handleDeleteCremation(item.id)} disabled={!!isDeleted} title={isDeleted ? 'Zarchiwizowane' : 'Usuń'}>
                                             <Trash2 size={14} className="mr-1"/> {isDeleted ? 'Usunięto' : 'Usuń'}
                                          </Button>
                                       </div>
                                    </div>

                                    {isDeleted && <div className="mb-4 text-center text-xs font-bold text-[var(--color-danger)] uppercase bg-red-100 p-2 rounded border border-red-200">Ta kremacja została usunięta (archiwum)</div>}
                                    
                                    {/* Tabs */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto">
                                       <button 
                                          onClick={() => setDetailTab('info')}
                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${detailTab === 'info' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
                                       >
                                          Informacje
                                       </button>
                                       <button 
                                          onClick={() => setDetailTab('data')}
                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${detailTab === 'data' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
                                       >
                                          Dane Osobowe
                                       </button>
                                       <button 
                                          onClick={() => setDetailTab('products')}
                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${detailTab === 'products' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
                                       >
                                          <Package size={14}/> Produkty i Usługi
                                       </button>
                                    </div>

                                    {detailTab === 'info' && (
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                             <h5 className="font-bold text-xs uppercase text-[var(--color-text-secondary)] mb-2">Szczegóły Firmy</h5>
                                             <div className="text-sm space-y-1 bg-[var(--color-background)] p-3 rounded-lg border border-[var(--color-border)]">
                                                <div><span className="font-bold">Nazwa:</span> {company?.name}</div>
                                                <div><span className="font-bold">NIP:</span> {company?.nip}</div>
                                                <div><span className="font-bold">Kontakt:</span> {company?.phone}</div>
                                             </div>
                                             
                                             <div className="mt-3">
                                                 <h5 className="font-bold text-xs uppercase text-[var(--color-text-secondary)] mb-2">Wybrane Opcje</h5>
                                                 <div className="flex flex-wrap gap-1">
                                                   {item.selectedOptions.map(optId => {
                                                      const opt = getOptionById(optId);
                                                      return opt ? <Badge key={opt.id} className="text-[10px]" style={{backgroundColor: opt.color, color: 'black'}}>{opt.name}</Badge> : null
                                                   })}
                                                   {item.selectedOptions.length === 0 && <span className="text-xs text-[var(--color-text-secondary)] italic">Brak opcji</span>}
                                                </div>
                                             </div>
                                          </div>
                                          <div>
                                             <h5 className="font-bold text-xs uppercase text-[var(--color-text-secondary)] mb-2">Kierowcy</h5>
                                             <div className="space-y-2">
                                                {detailDrivers.map(d => (
                                                   <div key={d.id} className="flex items-center gap-2 text-xs p-2 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                                                      <UserIcon size={12}/> {d.name} <span className="opacity-50">({d.phone})</span>
                                                   </div>
                                                ))}
                                                {detailDrivers.length === 0 && <span className="text-xs text-[var(--color-text-secondary)] italic p-2 bg-[var(--color-background)] rounded border border-[var(--color-border)]">Brak przypisanych kierowców w firmie.</span>}
                                             </div>
                                          </div>
                                       </div>
                                    )}

                                    {detailTab === 'data' && (
                                       <div className="space-y-4 animate-fade-in">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="bg-[var(--color-background)] p-4 rounded-xl border border-[var(--color-border)]">
                                                <h5 className="font-bold text-xs mb-4 flex items-center gap-2 text-[var(--color-text-secondary)] uppercase tracking-wider"><UserIcon size={14}/> Osoba Zmarła</h5>
                                                <div className="space-y-3">
                                                   <Input placeholder="Imię" value={deceasedForm.first_name} onChange={e => setDeceasedForm({...deceasedForm, first_name: e.target.value})} className="bg-white text-sm" />
                                                   <Input placeholder="Nazwisko" value={deceasedForm.last_name} onChange={e => setDeceasedForm({...deceasedForm, last_name: e.target.value})} className="bg-white text-sm" />
                                                   <Input placeholder="PESEL" value={deceasedForm.pesel || ''} onChange={e => setDeceasedForm({...deceasedForm, pesel: e.target.value})} className="bg-white text-sm" />
                                                   <Input type="date" label="Data Zgonu" value={deceasedForm.date_of_death || ''} onChange={e => setDeceasedForm({...deceasedForm, date_of_death: e.target.value})} className="bg-white text-sm" />
                                                </div>
                                             </div>

                                             <div className="bg-[var(--color-background)] p-4 rounded-xl border border-[var(--color-border)]">
                                                <h5 className="font-bold text-xs mb-4 flex items-center gap-2 text-[var(--color-text-secondary)] uppercase tracking-wider"><FileText size={14}/> Zlecający</h5>
                                                <div className="space-y-3">
                                                   <Input placeholder="Imię" value={applicantForm.first_name} onChange={e => setApplicantForm({...applicantForm, first_name: e.target.value})} className="bg-white text-sm" />
                                                   <Input placeholder="Nazwisko" value={applicantForm.last_name} onChange={e => setApplicantForm({...applicantForm, last_name: e.target.value})} className="bg-white text-sm" />
                                                   <Input placeholder="Telefon" value={applicantForm.phone} onChange={e => setApplicantForm({...applicantForm, phone: e.target.value})} className="bg-white text-sm" />
                                                   <Input placeholder="Pokrewieństwo" value={applicantForm.relation || ''} onChange={e => setApplicantForm({...applicantForm, relation: e.target.value})} className="bg-white text-sm" />
                                                </div>
                                             </div>
                                          </div>
                                          
                                          <div className="flex justify-end pt-2">
                                             <Button size="sm" onClick={() => handleSaveExpandedData(item.id)} disabled={!!isDeleted}>Zapisz Dane Osobowe</Button>
                                          </div>
                                       </div>
                                    )}

                                    {detailTab === 'products' && (
                                       <div className="animate-fade-in space-y-4">
                                          <div className="flex justify-between items-center">
                                             <h5 className="font-bold text-xs uppercase text-[var(--color-text-secondary)]">Lista Pozycji</h5>
                                             <Button size="sm" onClick={openProductPicker} disabled={!!isDeleted}><Plus size={14} className="mr-1"/> Dodaj Pozycję</Button>
                                          </div>

                                          <div className="space-y-2">
                                             {(item.items || []).map((prod) => (
                                                <div key={prod.id} className="flex items-center gap-4 bg-[var(--color-background)] p-2 rounded-lg border border-[var(--color-border)]">
                                                   <div className="w-12 h-12 bg-[var(--color-surface)] rounded overflow-hidden flex-shrink-0 flex items-center justify-center border border-[var(--color-border)]">
                                                      {prod.photoUrl ? (
                                                         <img src={prod.photoUrl} alt="" className="w-full h-full object-cover"/>
                                                      ) : (
                                                         <Package size={20} className="text-[var(--color-text-secondary)] opacity-50"/>
                                                      )}
                                                   </div>
                                                   
                                                   <div className="flex-1 min-w-0">
                                                      <div className="font-bold text-sm truncate">{prod.name}</div>
                                                      <div className="text-xs text-[var(--color-text-secondary)]">{prod.quantity} szt.</div>
                                                   </div>

                                                   <div className="w-24">
                                                      <input 
                                                         type="number" 
                                                         className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-right text-sm font-bold outline-none focus:border-[var(--color-primary)]"
                                                         value={prod.price}
                                                         onChange={(e) => handleUpdateItemPrice(item.id, prod.id, parseFloat(e.target.value))}
                                                         disabled={!!isDeleted}
                                                      />
                                                   </div>
                                                   
                                                   <div className="text-sm font-bold w-16 text-right">
                                                      {(prod.price * prod.quantity).toFixed(2)}
                                                   </div>

                                                   {!isDeleted && (
                                                      <button onClick={() => handleRemoveItem(item.id, prod)} className="text-[var(--color-text-secondary)] hover:text-red-500 p-2">
                                                         <X size={16}/>
                                                      </button>
                                                   )}
                                                </div>
                                             ))}
                                             {(item.items || []).length === 0 && <div className="text-center py-4 text-xs text-[var(--color-text-secondary)] italic border border-dashed border-[var(--color-border)] rounded-lg">Brak dodanych produktów.</div>}
                                          </div>

                                          <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
                                             <div className="flex items-center gap-2">
                                                <label className="flex items-center cursor-pointer gap-2 select-none">
                                                   <input 
                                                      type="checkbox" 
                                                      className="hidden" 
                                                      checked={!!item.isPaid} 
                                                      onChange={() => togglePaidStatus(item.id, item.isPaid)}
                                                      disabled={!!isDeleted}
                                                   />
                                                   <div className={`w-10 h-5 rounded-full p-1 transition-colors ${item.isPaid ? 'bg-[var(--color-success)]' : 'bg-gray-300'}`}>
                                                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${item.isPaid ? 'translate-x-5' : ''}`}></div>
                                                   </div>
                                                   <span className="text-sm font-bold">{item.isPaid ? 'Opłacone' : 'Nieopłacone'}</span>
                                                </label>
                                             </div>
                                             <div className="text-right">
                                                <div className="text-xs text-[var(--color-text-secondary)] uppercase font-bold">Suma Całkowita</div>
                                                <div className="text-2xl font-bold text-[var(--color-primary)]">{totalPrice.toFixed(2)} PLN</div>
                                             </div>
                                          </div>
                                       </div>
                                    )}

                                    {/* History Button (Small & Subtle) */}
                                    <div className="mt-8 border-t border-[var(--color-border)] pt-2">
                                       <button 
                                          onClick={() => setShowHistory(!showHistory)}
                                          className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] opacity-50 hover:opacity-100 flex items-center gap-1 transition-opacity mx-auto"
                                       >
                                          <HistoryIcon size={10}/> Historia Zmian
                                       </button>
                                       
                                       {showHistory && (
                                          <div className="mt-3 space-y-2 bg-[var(--color-background)] p-3 rounded-lg border border-[var(--color-border)] animate-fade-in max-h-40 overflow-y-auto custom-scrollbar">
                                             {(item.history || []).slice().reverse().map((entry, idx) => (
                                                <div key={idx} className="flex justify-between items-start text-[10px] border-b border-[var(--color-border)] last:border-0 pb-1">
                                                   <div>
                                                      <span className="font-bold block text-[var(--color-text-main)]">{entry.userName}</span>
                                                      <span className="text-[var(--color-text-secondary)]">{entry.details}</span>
                                                   </div>
                                                   <div className="text-right">
                                                      <span className="block font-mono opacity-70">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                                      <span className="block opacity-50">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                   </div>
                                                </div>
                                             ))}
                                             {(!item.history || item.history.length === 0) && <div className="text-center text-[10px] italic">Brak historii.</div>}
                                          </div>
                                       )}
                                    </div>

                                 </div>
                              )}
                           </Card>
                        </div>
                     );
                  })}
               </div>
            </div>
         ))}

         {cremations.length === 0 && (
            <div className="text-center p-12 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-[2rem]">
               Brak zaplanowanych kremacji{currentBranchId !== 'all' ? ' w tym oddziale' : ''}.
            </div>
         )}
      </div>

      {/* Warehouse Picker Modal */}
      {showPicker && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl h-[80vh] flex flex-col p-0 animate-fade-in border border-[var(--color-primary)] overflow-hidden">
               <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Wybierz Produkt</h3>
                  <button onClick={() => setShowPicker(false)} className="hover:bg-[var(--color-surface-highlight)] p-2 rounded-full"><X/></button>
               </div>
               
               <div className="p-4 bg-[var(--color-surface)]">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={16}/>
                     <input 
                        className="w-full bg-[var(--color-input)] pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                        placeholder="Szukaj produktu lub usługi..."
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        autoFocus
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {filteredPickerItems.map(item => (
                        <div 
                           key={item.id} 
                           onClick={() => handleAddProduct(item)}
                           className="group border border-[var(--color-border)] rounded-xl overflow-hidden hover:shadow-lg hover:border-[var(--color-primary)] transition-all cursor-pointer bg-[var(--color-background)]"
                        >
                           <div className="aspect-square bg-white flex items-center justify-center relative">
                              {item.photoUrl ? (
                                 <img src={item.photoUrl} alt="" className="w-full h-full object-cover"/>
                              ) : (
                                 <Package size={32} className="text-gray-300"/>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                 <Plus className="text-white drop-shadow-md" size={32}/>
                              </div>
                           </div>
                           <div className="p-3">
                              <div className="font-bold text-sm truncate" title={item.name}>{item.name}</div>
                              <div className="flex justify-between items-end mt-1">
                                 <div className="text-[var(--color-primary)] font-bold text-sm">{item.salesPrice} zł</div>
                                 {item.type === 'product' && (
                                    <div className={`text-[10px] px-1.5 py-0.5 rounded ${item.quantity! > 0 ? 'bg-[var(--color-secondary)]' : 'bg-red-100 text-red-500'}`}>
                                       {item.quantity} szt.
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))}
                     {filteredPickerItems.length === 0 && <div className="col-span-full text-center py-10 text-[var(--color-text-secondary)]">Nie znaleziono produktów.</div>}
                  </div>
               </div>
            </Card>
         </div>
      )}
    </div>
  );
};
