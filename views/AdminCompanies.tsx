
import React, { useState, useEffect } from 'react';
import { Company, Branch, User, Funeral, Cremation, Vehicle, WarehouseItem, Furnace, CremationOptionGroup, CremationOption } from '../types';
import { 
   getCompanies, getBranches, updateCompany, deleteCompany, updateBranch, deleteBranch,
   getBranchUsers, getFunerals, getCremations, getVehicles, getWarehouseItems, deleteUser, deleteFuneral, deleteCremation, deleteVehicle, deleteWarehouseItem,
   getFurnaces, getOptionGroups, getOptions, getCompanyUsers
} from '../services/storageService';
import { Card, Button, Input, Badge } from '../components/UI';
import { 
   Building2, MapPin, ChevronDown, ChevronUp, Edit2, Trash2, Save, X, Phone, Settings, 
   ExternalLink, Database, Users, Cross, Flame, Truck, Package, List, Calendar, User as UserIcon, Clock, Hash, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminCompaniesProps {
   onEnterCompany?: (companyId: string, branchId?: string) => void;
}

export const AdminCompanies: React.FC<AdminCompaniesProps> = ({ onEnterCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  
  // Cache for users in expanded branches
  const [branchUsers, setBranchUsers] = useState<{[key: string]: User[]}>({});
  // Cache for company owner info
  const [companyOwners, setCompanyOwners] = useState<{[key: string]: User | undefined}>({});

  // Edit States
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState<Partial<Company>>({});

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchForm, setEditBranchForm] = useState<Partial<Branch>>({});

  // --- DATA INSPECTOR MODAL STATE ---
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<{
     companyId: string;
     branchId: string;
     branchName: string;
     users: User[];
     funerals: Funeral[];
     cremations: Cremation[];
     vehicles: Vehicle[];
     warehouse: WarehouseItem[];
     furnaces: Furnace[];
     optionGroups: (CremationOptionGroup & { options: CremationOption[] })[];
  } | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'users'|'funerals'|'cremations'|'vehicles'|'warehouse'|'furnaces'|'options'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [c, b] = await Promise.all([getCompanies(), getBranches()]);
    setCompanies(c);
    setBranches(b);
  };

  const toggleCompany = async (id: string) => {
    if (expandedCompanyId === id) {
       setExpandedCompanyId(null);
    } else {
       setExpandedCompanyId(id);
       // Fetch company users to find the owner
       try {
          const users = await getCompanyUsers(id);
          const owner = users.find(u => u.companyRole === 'owner');
          setCompanyOwners(prev => ({ ...prev, [id]: owner }));
       } catch (e) {
          console.error("Error fetching company owner", e);
       }
    }
  };

  const toggleBranch = async (id: string) => {
    if (expandedBranchId === id) {
       setExpandedBranchId(null);
    } else {
       setExpandedBranchId(id);
       // Fetch users for this branch if not already present or refresh
       const users = await getBranchUsers(id);
       setBranchUsers(prev => ({ ...prev, [id]: users }));
    }
  };

  // --- Company Actions ---
  const startEditCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditCompanyForm(company);
  };

  const saveEditCompany = async () => {
    if (editingCompanyId) {
      await updateCompany(editingCompanyId, editCompanyForm);
      setEditingCompanyId(null);
      loadData();
      toast.success('Dane firmy zaktualizowane');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (confirm('UWAGA: Usunięcie firmy spowoduje usunięcie wszystkich powiązanych oddziałów, pracowników i danych operacyjnych! Czy na pewno kontynuować?')) {
      await deleteCompany(id);
      loadData();
      toast.success('Firma usunięta');
    }
  };

  // --- Branch Actions ---
  const startEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditBranchForm(branch);
  };

  const saveEditBranch = async () => {
    if (editingBranchId) {
      await updateBranch(editingBranchId, editBranchForm);
      setEditingBranchId(null);
      loadData();
      toast.success('Dane oddziału zaktualizowane');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (confirm('Usunąć ten oddział i wszystkie powiązane dane?')) {
      await deleteBranch(id);
      loadData();
      toast.success('Oddział usunięty');
    }
  };

  // --- INSPECTOR LOGIC ---
  const openInspector = async (companyId: string, branchId: string, branchName: string) => {
     toast.loading('Ładowanie danych oddziału...');
     try {
        const [users, funerals, cremations, vehicles, warehouse, furnaces, groups] = await Promise.all([
           getBranchUsers(branchId),
           getFunerals(companyId),
           getCremations(companyId),
           getVehicles(companyId),
           getWarehouseItems(companyId),
           getFurnaces(companyId),
           getOptionGroups(companyId)
        ]);

        // Enrich groups with options
        const groupsWithOptions = await Promise.all(groups.map(async g => {
           const options = await getOptions(g.id);
           return { ...g, options };
        }));

        setInspectorData({
           companyId,
           branchId,
           branchName,
           users,
           funerals: funerals.filter(f => f.branchId === branchId),
           cremations: cremations.filter(c => c.branchId === branchId),
           vehicles: vehicles.filter(v => v.branchId === branchId),
           warehouse: warehouse.filter(w => w.branchId === branchId),
           furnaces: furnaces.filter(f => !f.branchId || f.branchId === branchId), // Furnaces can be global or branch specific
           optionGroups: groupsWithOptions
        });
        setInspectorOpen(true);
        toast.dismiss();
     } catch (e) {
        toast.error('Błąd ładowania danych');
     }
  };

  // Generic delete handler for inspector
  const deleteInspectorItem = async (type: 'user'|'funeral'|'cremation'|'vehicle'|'warehouse', id: string) => {
     if(!confirm('Czy na pewno chcesz trwale usunąć ten element?')) return;
     
     if(type === 'user') await deleteUser(id);
     if(type === 'funeral') await deleteFuneral(id);
     if(type === 'cremation') await deleteCremation(id);
     if(type === 'vehicle') await deleteVehicle(id);
     if(type === 'warehouse') await deleteWarehouseItem(id);

     if(inspectorData) {
        // Refresh Data
        openInspector(inspectorData.companyId, inspectorData.branchId, inspectorData.branchName);
        toast.success('Element usunięty');
     }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h2 className="text-3xl font-bold">Zarządzanie Firmami</h2>
        <p className="text-[var(--color-text-secondary)]">Przeglądaj i edytuj strukturę firm w systemie.</p>
      </div>

      <div className="space-y-4">
        {companies.map(company => {
          const isExpanded = expandedCompanyId === company.id;
          const isEditing = editingCompanyId === company.id;
          const companyBranches = branches.filter(b => b.companyId === company.id);
          const owner = companyOwners[company.id];

          return (
            <Card key={company.id} className={`transition-all duration-300 border ${isExpanded ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
              
              {/* Company Header */}
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => toggleCompany(company.id)}>
                  <div className="flex items-center gap-3 mb-1">
                    <Building2 size={24} className="text-[var(--color-primary)]" />
                    <h3 className="text-xl font-bold text-[var(--color-text-main)]">{company.name}</h3>
                    <Badge variant="secondary">{company.company_number}</Badge>
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] flex gap-4">
                    <span>NIP: {company.nip}</span>
                    <span>{company.city}, {company.street}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-highlight)] px-2 py-1 rounded">
                     Oddziałów: {companyBranches.length}
                  </span>
                  
                  {/* Enter Company Panel (Admin Impersonation) */}
                  <Button size="sm" variant="ghost" onClick={() => onEnterCompany && onEnterCompany(company.id)} title="Wejdź do panelu głównego firmy">
                     <ExternalLink size={16} />
                  </Button>

                  <Button size="sm" variant="ghost" onClick={() => startEditCompany(company)}><Edit2 size={16}/></Button>
                  <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:bg-red-50" onClick={() => handleDeleteCompany(company.id)}><Trash2 size={16}/></Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleCompany(company.id)}>
                    {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                  </Button>
                </div>
              </div>

              {/* Company Expanded Content */}
              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-[var(--color-border)] animate-fade-in pl-4">
                  
                  {/* COMPANY METRICS & OWNER INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-[var(--color-surface-highlight)] p-4 rounded-xl border border-[var(--color-border)]">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-background)] rounded-lg text-[var(--color-primary)]"><Calendar size={18}/></div>
                        <div>
                           <div className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Data Utworzenia</div>
                           <div className="text-sm font-bold text-[var(--color-text-main)]">{new Date(company.created_at).toLocaleDateString()}</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-background)] rounded-lg text-[var(--color-chart-4)]"><Hash size={18}/></div>
                        <div>
                           <div className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Numer Firmy</div>
                           <div className="text-sm font-bold text-[var(--color-text-main)]">{company.company_number}</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-background)] rounded-lg text-[var(--color-accent)]"><ShieldCheck size={18}/></div>
                        <div>
                           <div className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Założyciel / Właściciel</div>
                           <div className="text-sm font-bold text-[var(--color-text-main)]">
                              {owner ? `${owner.first_name} ${owner.last_name}` : 'Brak danych'}
                           </div>
                           {owner && <div className="text-[10px] text-[var(--color-text-secondary)]">{owner.email}</div>}
                        </div>
                     </div>
                  </div>

                  {/* Edit Company Form */}
                  {isEditing && (
                    <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl mb-6 border border-[var(--color-border)]">
                      <h4 className="font-bold mb-4 flex items-center gap-2"><Settings size={16}/> Edycja Danych Firmy</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input label="Nazwa" value={editCompanyForm.name || ''} onChange={e => setEditCompanyForm({...editCompanyForm, name: e.target.value})} />
                        <Input label="NIP" value={editCompanyForm.nip || ''} onChange={e => setEditCompanyForm({...editCompanyForm, nip: e.target.value})} />
                        <Input label="Ulica" value={editCompanyForm.street || ''} onChange={e => setEditCompanyForm({...editCompanyForm, street: e.target.value})} />
                        <Input label="Miasto" value={editCompanyForm.city || ''} onChange={e => setEditCompanyForm({...editCompanyForm, city: e.target.value})} />
                        <Input label="Kod Pocztowy" value={editCompanyForm.zip_code || ''} onChange={e => setEditCompanyForm({...editCompanyForm, zip_code: e.target.value})} />
                        <Input label="Telefon" value={editCompanyForm.phone || ''} onChange={e => setEditCompanyForm({...editCompanyForm, phone: e.target.value})} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingCompanyId(null)}>Anuluj</Button>
                        <Button variant="primary" size="sm" onClick={saveEditCompany}><Save size={16} className="mr-2"/> Zapisz Firmę</Button>
                      </div>
                    </div>
                  )}

                  <h4 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Oddziały Firmy</h4>
                  
                  <div className="space-y-3">
                    {companyBranches.map(branch => {
                      const isBranchExpanded = expandedBranchId === branch.id;
                      const isBranchEditing = editingBranchId === branch.id;
                      const employees = branchUsers[branch.id] || [];

                      return (
                        <div key={branch.id} className="border border-[var(--color-border)] rounded-xl bg-[var(--color-background)] overflow-hidden">
                          <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-[var(--color-surface)] transition-colors" onClick={() => toggleBranch(branch.id)}>
                             <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-[var(--color-text-secondary)]"/>
                                <div>
                                   <div className="font-bold text-sm text-[var(--color-text-main)]">{branch.name}</div>
                                   <div className="text-xs text-[var(--color-text-secondary)]">{branch.branch_number}</div>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                
                                {/* NEW ICONS: Enter Panel & Data Overview */}
                                <Button size="sm" variant="ghost" className="hover:bg-[var(--color-surface-highlight)]" onClick={(e) => { e.stopPropagation(); onEnterCompany && onEnterCompany(company.id, branch.id); }} title="Zarządzaj tym oddziałem (Wejdź)">
                                   <ExternalLink size={16} className="text-[var(--color-primary)]"/>
                                </Button>
                                <Button size="sm" variant="ghost" className="hover:bg-[var(--color-surface-highlight)]" onClick={(e) => { e.stopPropagation(); openInspector(company.id, branch.id, branch.name); }} title="Przegląd Danych Oddziału">
                                   <Database size={16} className="text-[var(--color-chart-4)]"/>
                                </Button>

                                <div className="h-4 w-[1px] bg-[var(--color-border)] mx-1"></div>

                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); startEditBranch(branch); }}><Edit2 size={14}/></Button>
                                <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id); }}><Trash2 size={14}/></Button>
                                {isBranchExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                             </div>
                          </div>

                          {isBranchExpanded && (
                             <div className="p-4 bg-[var(--color-surface-highlight)] border-t border-[var(--color-border)] animate-fade-in">
                                
                                {/* BRANCH METRICS */}
                                <div className="flex gap-6 mb-4 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border)] pb-3">
                                   <div>
                                      <span className="font-bold uppercase mr-1">Utworzono:</span>
                                      <span className="text-[var(--color-text-main)]">{new Date(branch.created_at).toLocaleDateString()}</span>
                                   </div>
                                   <div>
                                      <span className="font-bold uppercase mr-1">Numer:</span>
                                      <span className="text-[var(--color-text-main)] font-mono">{branch.branch_number}</span>
                                   </div>
                                   <div>
                                      <span className="font-bold uppercase mr-1">Utworzył:</span>
                                      {/* Assuming the Company Owner created it, as Branch schema doesn't have created_by */}
                                      <span className="text-[var(--color-text-main)]">{owner ? `${owner.first_name} ${owner.last_name}` : 'Admin'}</span>
                                   </div>
                                </div>

                                {isBranchEditing ? (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <Input label="Nazwa Oddziału" value={editBranchForm.name || ''} onChange={e => setEditBranchForm({...editBranchForm, name: e.target.value})} className="bg-white" />
                                      <Input label="Telefon" value={editBranchForm.phone || ''} onChange={e => setEditBranchForm({...editBranchForm, phone: e.target.value})} className="bg-white" />
                                      <Input label="Ulica" value={editBranchForm.street || ''} onChange={e => setEditBranchForm({...editBranchForm, street: e.target.value})} className="bg-white" />
                                      <Input label="Miasto" value={editBranchForm.city || ''} onChange={e => setEditBranchForm({...editBranchForm, city: e.target.value})} className="bg-white" />
                                      <div className="col-span-full flex justify-end gap-2 mt-2">
                                         <Button size="sm" variant="ghost" onClick={() => setEditingBranchId(null)}>Anuluj</Button>
                                         <Button size="sm" onClick={saveEditBranch}>Zapisz Oddział</Button>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="grid grid-cols-2 text-sm mb-4">
                                      <div><span className="font-bold text-[var(--color-text-main)]">Adres:</span> <span className="text-[var(--color-text-secondary)]">{branch.street}, {branch.zip_code} {branch.city}</span></div>
                                      <div><span className="font-bold text-[var(--color-text-main)]">Telefon:</span> <span className="text-[var(--color-text-secondary)]">{branch.phone}</span></div>
                                   </div>
                                )}

                                {/* --- DISPLAY EMPLOYEES --- */}
                                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                                   <h5 className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-2 flex items-center gap-2"><Users size={12}/> Pracownicy Oddziału ({employees.length})</h5>
                                   {employees.length > 0 ? (
                                      <table className="w-full text-xs text-left border-collapse">
                                         <thead>
                                            <tr className="text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                                               <th className="font-normal py-2 px-1">Nr Klienta</th>
                                               <th className="font-normal py-2 px-1">Imię i Nazwisko</th>
                                               <th className="font-normal py-2 px-1">Rola</th>
                                               <th className="font-normal py-2 px-1">Email</th>
                                               <th className="font-normal py-2 px-1 text-right">Data Dodania</th>
                                            </tr>
                                         </thead>
                                         <tbody>
                                            {employees.map(emp => (
                                               <tr key={emp.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)]">
                                                  <td className="py-2 px-1 font-mono text-[var(--color-primary)] font-bold">{emp.client_number}</td>
                                                  <td className="py-2 px-1 font-bold text-[var(--color-text-main)]">{emp.first_name} {emp.last_name}</td>
                                                  <td className="py-2 px-1">
                                                     <Badge variant={emp.companyRole === 'owner' ? 'primary' : 'secondary'} className="text-[10px]">
                                                        {emp.companyRole === 'owner' ? 'Właściciel' : 'Pracownik'}
                                                     </Badge>
                                                  </td>
                                                  <td className="py-2 px-1 text-[var(--color-text-secondary)]">{emp.email}</td>
                                                  <td className="py-2 px-1 text-[var(--color-text-secondary)] text-right">{new Date(emp.created_at).toLocaleDateString()}</td>
                                               </tr>
                                            ))}
                                         </tbody>
                                      </table>
                                   ) : (
                                      <p className="text-xs text-[var(--color-text-secondary)] italic">Brak pracowników w tym oddziale.</p>
                                   )}
                                </div>
                             </div>
                          )}
                        </div>
                      );
                    })}
                    {companyBranches.length === 0 && <div className="text-sm text-[var(--color-text-secondary)] italic">Brak oddziałów.</div>}
                  </div>

                </div>
              )}
            </Card>
          );
        })}
        {companies.length === 0 && <div className="text-center p-8 text-[var(--color-text-secondary)]">Brak firm w systemie.</div>}
      </div>

      {/* --- DATA INSPECTOR MODAL --- */}
      {inspectorOpen && inspectorData && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden animate-fade-in border-2 border-[var(--color-primary)]">
               
               {/* Header */}
               <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
                  <div>
                     <h3 className="text-xl font-bold flex items-center gap-2"><Database size={20} className="text-[var(--color-primary)]"/> Inspektor Danych</h3>
                     <p className="text-sm text-[var(--color-text-secondary)]">Oddział: <strong>{inspectorData.branchName}</strong></p>
                  </div>
                  <button onClick={() => setInspectorOpen(false)} className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full"><X/></button>
               </div>

               {/* Tabs */}
               <div className="flex border-b border-[var(--color-border)] bg-[var(--color-background)] overflow-x-auto">
                  {[
                     { id: 'users', label: 'Pracownicy', icon: Users, count: inspectorData.users.length },
                     { id: 'funerals', label: 'Pogrzeby', icon: Cross, count: inspectorData.funerals.length },
                     { id: 'cremations', label: 'Kremacje', icon: Flame, count: inspectorData.cremations.length },
                     { id: 'vehicles', label: 'Flota', icon: Truck, count: inspectorData.vehicles.length },
                     { id: 'warehouse', label: 'Magazyn', icon: Package, count: inspectorData.warehouse.length },
                     { id: 'furnaces', label: 'Piece', icon: Flame, count: inspectorData.furnaces.length },
                     { id: 'options', label: 'Opcje', icon: List, count: inspectorData.optionGroups.reduce((acc, g) => acc + g.options.length, 0) },
                  ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setInspectorTab(tab.id as any)}
                        className={`flex-1 min-w-[120px] py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors
                           ${inspectorTab === tab.id 
                              ? 'border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]' 
                              : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}
                        `}
                     >
                        <tab.icon size={16}/> {tab.label} 
                        <Badge variant="secondary" className="ml-1 text-[10px]">{tab.count}</Badge>
                     </button>
                  ))}
               </div>

               {/* Content */}
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[var(--color-background)]">
                  
                  {inspectorTab === 'users' && (
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                           <tr><th className="p-2">ID</th><th className="p-2">Nr Klienta</th><th className="p-2">Imię i Nazwisko</th><th className="p-2">Email</th><th className="p-2">Rola</th><th className="p-2 text-right">Akcje</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {inspectorData.users.map(u => (
                              <tr key={u.id}>
                                 <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{u.id.substring(0,8)}...</td>
                                 <td className="p-2 font-mono font-bold text-[var(--color-primary)]">{u.client_number}</td>
                                 <td className="p-2 font-bold text-[var(--color-text-main)]">{u.first_name} {u.last_name}</td>
                                 <td className="p-2 text-[var(--color-text-secondary)]">{u.email}</td>
                                 <td className="p-2 text-[var(--color-text-main)]">{u.companyRole === 'owner' ? 'Admin' : 'Pracownik'}</td>
                                 <td className="p-2 text-right"><Button size="sm" variant="danger" onClick={() => deleteInspectorItem('user', u.id)}><Trash2 size={14}/></Button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {inspectorTab === 'funerals' && (
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                           <tr><th className="p-2">ID</th><th className="p-2">Numer</th><th className="p-2">Zmarły</th><th className="p-2">Data</th><th className="p-2 text-right">Akcje</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {inspectorData.funerals.map(f => (
                              <tr key={f.id}>
                                 <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{f.id.substring(0,8)}...</td>
                                 <td className="p-2 font-mono text-xs font-bold text-[var(--color-text-secondary)]">{f.funeral_number}</td>
                                 <td className="p-2 font-bold text-[var(--color-text-main)]">{f.deceased_first_name} {f.deceased_last_name}</td>
                                 <td className="p-2 text-[var(--color-text-secondary)]">{f.transport_date}</td>
                                 <td className="p-2 text-right"><Button size="sm" variant="danger" onClick={() => deleteInspectorItem('funeral', f.id)}><Trash2 size={14}/></Button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {inspectorTab === 'cremations' && (
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                           <tr><th className="p-2">ID</th><th className="p-2">Numer</th><th className="p-2">Data</th><th className="p-2">Godzina</th><th className="p-2 text-right">Akcje</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {inspectorData.cremations.map(c => (
                              <tr key={c.id}>
                                 <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{c.id.substring(0,8)}...</td>
                                 <td className="p-2 font-mono text-xs font-bold text-[var(--color-text-main)]">{c.cremation_number}</td>
                                 <td className="p-2 text-[var(--color-text-secondary)]">{c.date}</td>
                                 <td className="p-2 text-[var(--color-text-secondary)]">{c.time}</td>
                                 <td className="p-2 text-right"><Button size="sm" variant="danger" onClick={() => deleteInspectorItem('cremation', c.id)}><Trash2 size={14}/></Button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {inspectorTab === 'vehicles' && (
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                           <tr><th className="p-2">ID</th><th className="p-2">Model</th><th className="p-2">Producent</th><th className="p-2">Rejestracja/Kolor</th><th className="p-2 text-right">Akcje</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {inspectorData.vehicles.map(v => (
                              <tr key={v.id}>
                                 <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{v.id.substring(0,8)}...</td>
                                 <td className="p-2 font-bold text-[var(--color-text-main)]">{v.model}</td>
                                 <td className="p-2 text-[var(--color-text-secondary)]">{v.manufacturer}</td>
                                 <td className="p-2 text-[var(--color-text-secondary)]">{v.color}</td>
                                 <td className="p-2 text-right"><Button size="sm" variant="danger" onClick={() => deleteInspectorItem('vehicle', v.id)}><Trash2 size={14}/></Button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {inspectorTab === 'warehouse' && (
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                           <tr><th className="p-2">ID</th><th className="p-2">Nazwa</th><th className="p-2">Typ</th><th className="p-2">Ilość</th><th className="p-2">Cena</th><th className="p-2 text-right">Akcje</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {inspectorData.warehouse.map(w => (
                              <tr key={w.id}>
                                 <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{w.id.substring(0,8)}...</td>
                                 <td className="p-2 font-bold text-[var(--color-text-main)]">{w.name}</td>
                                 <td className="p-2 uppercase text-xs text-[var(--color-text-secondary)]">{w.type}</td>
                                 <td className="p-2 text-[var(--color-text-main)]">{w.quantity}</td>
                                 <td className="p-2 text-[var(--color-text-main)]">{w.salesPrice} PLN</td>
                                 <td className="p-2 text-right"><Button size="sm" variant="danger" onClick={() => deleteInspectorItem('warehouse', w.id)}><Trash2 size={14}/></Button></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {inspectorTab === 'furnaces' && (
                     <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                           <tr><th className="p-2">ID</th><th className="p-2">Nazwa</th><th className="p-2">Kolor</th><th className="p-2 text-right">Akcje</th></tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                           {inspectorData.furnaces.map(f => (
                              <tr key={f.id}>
                                 <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{f.id.substring(0,8)}...</td>
                                 <td className="p-2 font-bold text-[var(--color-text-main)]">{f.name}</td>
                                 <td className="p-2"><div className="w-4 h-4 rounded-full" style={{backgroundColor: f.color}}></div></td>
                                 <td className="p-2 text-right"><span className="text-xs text-[var(--color-text-secondary)]">Edycja w panelu firmy</span></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {inspectorTab === 'options' && (
                     <div className="space-y-4">
                        {inspectorData.optionGroups.map(group => (
                           <div key={group.id} className="border border-[var(--color-border)] rounded-lg p-3">
                              <h4 className="font-bold text-sm mb-2 text-[var(--color-text-main)]">{group.name} (ID: {group.id.substring(0,8)}...)</h4>
                              <table className="w-full text-left border-collapse text-sm">
                                 <thead className="bg-[var(--color-surface-highlight)] text-xs uppercase text-[var(--color-text-secondary)]">
                                    <tr><th className="p-2">ID Opcji</th><th className="p-2">Nazwa</th><th className="p-2">Kolor</th></tr>
                                 </thead>
                                 <tbody className="divide-y divide-[var(--color-border)]">
                                    {group.options.map(opt => (
                                       <tr key={opt.id}>
                                          <td className="p-2 font-mono text-[10px] text-[var(--color-text-secondary)]">{opt.id.substring(0,8)}...</td>
                                          <td className="p-2 text-[var(--color-text-main)]">{opt.name}</td>
                                          <td className="p-2"><div className="w-4 h-4 rounded-full" style={{backgroundColor: opt.color}}></div></td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </Card>
         </div>
      )}
    </div>
  );
};
