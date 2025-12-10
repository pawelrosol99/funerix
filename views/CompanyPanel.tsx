
import React, { useState, useEffect } from 'react';
import { Company, User, Branch } from '../types';
import { Card, Button, Badge, Input } from '../components/UI';
import { Store, Users, FileText, Settings, ArrowRight, Plus, MapPin, Trash2, Edit2, ChevronDown, ChevronUp, Save, X, Send } from 'lucide-react';
import { getCompanyById, getCompanyBranches, createBranch, deleteBranch, updateBranch, getBranchUsers, deleteUser, sendInvitation, getUserByEmail } from '../services/storageService';
import { toast } from 'sonner';

interface CompanyPanelProps {
  user: User;
  onBranchesChange?: () => void;
}

export const CompanyPanel: React.FC<CompanyPanelProps> = ({ user, onBranchesChange }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  
  // Create Branch State
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
     name: '', street: '', city: '', zip_code: '', phone: ''
  });

  // Edit Branch State
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchData, setEditBranchData] = useState<Partial<Branch>>({});

  // Add User to Branch State
  const [userForms, setUserForms] = useState<{[key: string]: boolean}>({}); // branchId -> boolean (show form)
  const [inviteEmail, setInviteEmail] = useState('');
  const [branchUsers, setBranchUsers] = useState<{[key: string]: User[]}>({}); // cache users for expanded branches

  useEffect(() => {
    if (user.companyId) {
      getCompanyById(user.companyId).then(c => setCompany(c || null));
      refreshBranches();
    }
  }, [user.companyId]);

  const refreshBranches = async () => {
    if(user.companyId) {
       const fetched = await getCompanyBranches(user.companyId);
       setBranches(fetched);
       // Refresh users for currently expanded branch if any
       if (expandedBranchId) {
         const users = await getBranchUsers(expandedBranchId);
         setBranchUsers(prev => ({...prev, [expandedBranchId]: users}));
       }
       if(onBranchesChange) onBranchesChange();
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if(user.companyId) {
      createBranch(user.companyId, newBranchData);
      setNewBranchData({ name: '', street: '', city: '', zip_code: '', phone: '' });
      setShowAddBranch(false);
      refreshBranches();
    }
  };

  const toggleBranchExpand = async (branchId: string) => {
    if (expandedBranchId === branchId) {
      setExpandedBranchId(null);
    } else {
      setExpandedBranchId(branchId);
      // Load users for this branch
      const users = await getBranchUsers(branchId);
      setBranchUsers(prev => ({...prev, [branchId]: users}));
    }
  };

  const handleDeleteBranch = (branchId: string) => {
    if(confirm("Czy na pewno usunąć ten oddział?")) {
      deleteBranch(branchId);
      refreshBranches();
      if(expandedBranchId === branchId) setExpandedBranchId(null);
    }
  };

  const handleStartEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditBranchData(branch);
  };

  const handleSaveEditBranch = () => {
     if(editingBranchId && user.companyId) {
        updateBranch(editingBranchId, editBranchData);
        setEditingBranchId(null);
        refreshBranches();
     }
  };

  // User Management in Branch
  const handleInviteUserToBranch = async (e: React.FormEvent, branchId: string) => {
    e.preventDefault();
    if (!inviteEmail) return;
    if (!user.companyId) return;

    const existingUser = await getUserByEmail(inviteEmail);

    if (existingUser) {
       if (existingUser.companyId === user.companyId && existingUser.branchId === branchId) {
          toast.warning('Ten użytkownik już jest w tym oddziale.');
          return;
       }
       sendInvitation(inviteEmail, user.companyId, branchId);
       toast.success(`Wysłano zaproszenie do ${existingUser.first_name}`);
    } else {
       toast.success(`Wysłano e-mail z linkiem rejestracyjnym do ${inviteEmail}`);
    }

    setInviteEmail('');
    setUserForms({...userForms, [branchId]: false});
  };

  const handleDeleteBranchUser = async (userId: string, branchId: string) => {
     if(confirm("Usunąć pracownika z oddziału?")) {
       await deleteUser(userId);
       const users = await getBranchUsers(branchId);
       setBranchUsers(prev => ({...prev, [branchId]: users}));
     }
  };


  if (!company) return <div>Błąd: Nie znaleziono firmy.</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-8 bg-[var(--color-secondary)] rounded-[2rem] relative overflow-hidden">
          {/* Decor */}
          <div className="absolute -right-10 -top-10 text-[var(--color-background)] opacity-20">
             <Store size={200} />
          </div>

          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-2">
                <Badge variant="primary">Panel Firmowy</Badge>
                <span className="font-mono text-sm opacity-60 font-bold">{company.company_number}</span>
             </div>
             <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
             <p className="text-[var(--color-text-secondary)]">{company.street}, {company.zip_code} {company.city}</p>
          </div>
          
          <div className="relative z-10">
             <Button variant="outline" className="bg-white">Edytuj Dane Firmy</Button>
          </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-[var(--color-chart-1)] bg-opacity-20 text-[var(--color-chart-1)] flex items-center justify-center">
                <Users size={24} />
             </div>
             <div>
                <div className="text-2xl font-bold">1</div>
                <div className="text-xs text-[var(--color-text-secondary)]">Pracownicy</div>
             </div>
          </Card>
          <Card className="p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-[var(--color-chart-2)] bg-opacity-20 text-[var(--color-chart-2)] flex items-center justify-center">
                <FileText size={24} />
             </div>
             <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-[var(--color-text-secondary)]">Aktywne Sprawy</div>
             </div>
          </Card>
          <Card className="p-6 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-[var(--color-chart-4)] bg-opacity-20 text-[var(--color-chart-4)] flex items-center justify-center">
                <Settings size={24} />
             </div>
             <div>
                <div className="text-2xl font-bold uppercase">{company.package_type}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">Twój Pakiet</div>
             </div>
          </Card>
       </div>

       {/* --- BRANCHES SECTION --- */}
       <div className="space-y-6 pt-6 border-t border-[var(--color-border)]">
          <div className="flex justify-between items-center">
             <div>
                <h3 className="text-2xl font-bold flex items-center gap-2"><MapPin className="text-[var(--color-primary)]"/> Oddziały Firmy</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Zarządzaj lokalizacjami i przypisanymi pracownikami</p>
             </div>
             <Button onClick={() => setShowAddBranch(!showAddBranch)}>
                {showAddBranch ? 'Anuluj' : <><Plus size={18}/> Dodaj Oddział</>}
             </Button>
          </div>

          {showAddBranch && (
             <Card className="bg-[var(--color-surface-highlight)] bg-opacity-30 border border-[var(--color-primary)]">
                <h4 className="font-bold mb-4">Nowy Oddział</h4>
                <form onSubmit={handleCreateBranch} className="space-y-4">
                   <Input label="Nazwa Oddziału (Wymagane)" value={newBranchData.name} onChange={e => setNewBranchData({...newBranchData, name: e.target.value})} required />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Ulica" value={newBranchData.street} onChange={e => setNewBranchData({...newBranchData, street: e.target.value})} />
                      <Input label="Miasto" value={newBranchData.city} onChange={e => setNewBranchData({...newBranchData, city: e.target.value})} />
                      <Input label="Kod Pocztowy" value={newBranchData.zip_code} onChange={e => setNewBranchData({...newBranchData, zip_code: e.target.value})} />
                      <Input label="Telefon" value={newBranchData.phone} onChange={e => setNewBranchData({...newBranchData, phone: e.target.value})} />
                   </div>
                   <Button type="submit">Utwórz Oddział</Button>
                </form>
             </Card>
          )}

          <div className="space-y-4">
             {branches.length === 0 && !showAddBranch && (
                <div className="text-center p-8 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-card)] text-[var(--color-text-secondary)]">
                   Brak oddziałów. Kliknij "Dodaj Oddział" aby rozpocząć.
                </div>
             )}

             {branches.map(branch => {
                const isExpanded = expandedBranchId === branch.id;
                const isEditing = editingBranchId === branch.id;
                const users = branchUsers[branch.id] || [];

                return (
                   <Card key={branch.id} className={`transition-all duration-300 ${isExpanded ? 'ring-2 ring-[var(--color-primary)] ring-opacity-50' : ''}`}>
                      {/* Branch Header Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={(e) => { 
                         // Don't toggle if clicking buttons
                         if((e.target as HTMLElement).closest('button')) return;
                         toggleBranchExpand(branch.id); 
                      }}>
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[var(--color-surface-highlight)] rounded-xl flex items-center justify-center font-bold text-[var(--color-primary)] shadow-sm">
                               {branch.branch_number.split('/')[1]}
                            </div>
                            <div>
                               <h4 className="font-bold text-lg">{branch.name}</h4>
                               <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                  <span className="font-mono bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]">{branch.branch_number}</span>
                                  <span>{branch.city}, {branch.street}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleStartEditBranch(branch)}><Edit2 size={16}/></Button>
                            <Button variant="ghost" size="sm" className="text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white" onClick={() => handleDeleteBranch(branch.id)}><Trash2 size={16}/></Button>
                            <Button variant="ghost" size="sm">
                               {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </Button>
                         </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                         <div className="mt-6 pt-6 border-t border-[var(--color-border)] animate-fade-in">
                            {/* Edit Form */}
                            {isEditing ? (
                               <div className="mb-8 p-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
                                  <h5 className="font-bold mb-4 flex items-center gap-2"><Settings size={16}/> Edycja Danych Oddziału</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                     <Input label="Nazwa" value={editBranchData.name} onChange={e => setEditBranchData({...editBranchData, name: e.target.value})} />
                                     <Input label="Ulica" value={editBranchData.street} onChange={e => setEditBranchData({...editBranchData, street: e.target.value})} />
                                     <Input label="Miasto" value={editBranchData.city} onChange={e => setEditBranchData({...editBranchData, city: e.target.value})} />
                                     <Input label="Telefon" value={editBranchData.phone} onChange={e => setEditBranchData({...editBranchData, phone: e.target.value})} />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                     <Button variant="ghost" onClick={() => setEditingBranchId(null)}>Anuluj</Button>
                                     <Button onClick={handleSaveEditBranch} className="bg-[var(--color-success)]"><Save size={16}/> Zapisz</Button>
                                  </div>
                               </div>
                            ) : null}

                            {/* Users in Branch */}
                            <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                  <h5 className="font-bold text-sm uppercase tracking-wider text-[var(--color-text-secondary)]">Pracownicy Oddziału ({users.length})</h5>
                                  <Button size="sm" variant="secondary" onClick={() => setUserForms({...userForms, [branch.id]: !userForms[branch.id]})}>
                                     {userForms[branch.id] ? 'Anuluj' : 'Zaproś Pracownika'}
                                  </Button>
                               </div>

                               {userForms[branch.id] && (
                                  <div className="p-4 bg-[var(--color-surface-highlight)] rounded-xl border border-[var(--color-border)]">
                                     <form onSubmit={(e) => handleInviteUserToBranch(e, branch.id)} className="space-y-3">
                                        <p className="text-xs text-[var(--color-text-secondary)] mb-2">Wprowadź adres e-mail. Jeśli użytkownik istnieje, otrzyma zaproszenie.</p>
                                        <Input label="Email Użytkownika" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="bg-white" />
                                        <div className="flex justify-end">
                                           <Button size="sm" type="submit"><Send size={14} className="mr-2"/> Wyślij Zaproszenie</Button>
                                        </div>
                                     </form>
                                  </div>
                               )}

                               {users.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                     {users.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-border)]">
                                           <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-xs font-bold">
                                                 {u.first_name[0]}{u.last_name[0]}
                                              </div>
                                              <div className="overflow-hidden">
                                                 <div className="font-bold text-sm truncate">{u.first_name} {u.last_name}</div>
                                                 <div className="text-[10px] text-[var(--color-text-secondary)] truncate">{u.email}</div>
                                              </div>
                                           </div>
                                           <button onClick={() => handleDeleteBranchUser(u.id, branch.id)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]">
                                              <X size={16} />
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               ) : (
                                  <div className="text-sm text-[var(--color-text-secondary)] italic">Brak przypisanych pracowników.</div>
                               )}
                            </div>
                         </div>
                      )}
                   </Card>
                );
             })}
          </div>
       </div>
    </div>
  );
};
