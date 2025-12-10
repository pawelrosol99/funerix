
import React, { useState, useEffect } from 'react';
import { User, Invitation, WorkSession, Branch } from '../types';
import { getCompanyUsers, deleteUser, getUserByEmail, sendInvitation, getInvitations, saveUser, getWorkSessions, approveSessionEdit, deleteInvitation, getBranches, removeUserFromCompany } from '../services/storageService';
import { Card, Button, Input, Badge } from '../components/UI';
import { Plus, Trash2, User as UserIcon, Send, Clock, CheckCircle, Edit2, Shield, Calendar, Check, X, AlertTriangle, Mail, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyUsersProps {
  user: User; // The current logged in user (owner/admin of company)
  currentBranchId?: string | 'all';
}

export const CompanyUsers: React.FC<CompanyUsersProps> = ({ user, currentBranchId = 'all' }) => {
  if (!user.companyId) return <div>Brak dostępu.</div>;

  const [activeTab, setActiveTab] = useState<'employees' | 'invitations'>('employees');
  const [employees, setEmployees] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Editing Employee State
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Work Sessions Review State
  const [reviewingEmployeeId, setReviewingEmployeeId] = useState<string | null>(null);
  const [employeeSessions, setEmployeeSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    loadData();
  }, [user.companyId, showAddForm, currentBranchId, editingEmployee, reviewingEmployeeId]);

  const loadData = async () => {
     if (user.companyId) {
        let allUsers = await getCompanyUsers(user.companyId);
        // Filter by branch
        if (currentBranchId !== 'all') {
           allUsers = allUsers.filter(u => u.branchId === currentBranchId || u.companyRole === 'owner'); 
        }
        setEmployees(allUsers);

        // Load branches for selector
        const allBranches = await getBranches();
        setBranches(allBranches.filter(b => b.companyId === user.companyId));

        // Load ALL invitations for the company (for history)
        const allInvites = await getInvitations();
        const companyInvites = allInvites.filter(inv => 
           inv.companyId === user.companyId && 
           (currentBranchId === 'all' || !inv.branchId || inv.branchId === currentBranchId)
        );
        // Sort by date desc
        setInvitations(companyInvites.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

        // Load sessions for review if open
        if (reviewingEmployeeId) {
           const sessions = await getWorkSessions(user.companyId);
           setEmployeeSessions(sessions.filter(s => s.userId === reviewingEmployeeId).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
        }
     }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    if (!user.companyId) return;

    const existingUser = await getUserByEmail(inviteEmail);
    const branchId = currentBranchId !== 'all' ? currentBranchId : undefined;

    if (existingUser) {
       if (existingUser.companyId === user.companyId) {
          toast.warning('Ten użytkownik jest już pracownikiem Twojej firmy.');
          return;
       }
       await sendInvitation(inviteEmail, user.companyId, branchId, user);
       toast.success(`Wysłano powiadomienie w systemie do ${existingUser.first_name} ${existingUser.last_name}`);
    } else {
       await sendInvitation(inviteEmail, user.companyId, branchId, user);
       toast.success(`Wysłano wiadomość e-mail z linkiem rejestracyjnym do ${inviteEmail}`);
    }

    setInviteEmail('');
    setShowAddForm(false);
    loadData();
  };

  const handleDeleteInvitation = async (id: string) => {
     if(confirm('Usunąć to zaproszenie?')) {
        await deleteInvitation(id);
        loadData();
        toast.info('Zaproszenie usunięte');
     }
  };

  const handleRemoveEmployee = async (id: string) => {
    if (id === user.id) return alert('Nie możesz usunąć samego siebie.');
    if (confirm('Czy na pewno chcesz usunąć pracownika z firmy? (Konto zostanie zachowane, ale straci dostęp do panelu firmowego)')) {
      await removeUserFromCompany(id);
      loadData();
      toast.success('Pracownik usunięty z firmy.');
    }
  };

  // --- Employee Edit Logic ---
  const startEdit = (emp: User) => {
     setEditingEmployee(emp);
     setEditForm({
        vacation_days_total: emp.vacation_days_total || 0,
        vacation_days_used: emp.vacation_days_used || 0,
        hourlyRate: emp.hourlyRate || 0,
        companyRole: emp.companyRole,
        branchId: emp.branchId
     });
  };

  const saveEdit = () => {
     if(!editingEmployee) return;
     const updatedUser = { ...editingEmployee, ...editForm };
     saveUser(updatedUser);
     setEditingEmployee(null);
     loadData();
     toast.success('Dane pracownika zaktualizowane');
  };

  // --- Session Approval Logic ---
  const handleApproval = async (sessionId: string, approved: boolean) => {
     await approveSessionEdit(sessionId, approved);
     loadData(); // Reload sessions
     toast.info(approved ? 'Zatwierdzono zmianę' : 'Odrzucono zmianę');
  };

  const getBranchName = (id?: string) => {
     return branches.find(b => b.id === id)?.name || 'Nieprzypisany';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
             <h2 className="text-3xl font-bold">Pracownicy Firmy</h2>
             <p className="text-[var(--color-text-secondary)]">Zarządzaj zespołem i zaproszeniami.</p>
          </div>
          {currentBranchId !== 'all' && activeTab === 'invitations' ? (
             <Button onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Anuluj' : <><Plus size={18}/> Zaproś Pracownika</>}
             </Button>
          ) : currentBranchId !== 'all' && activeTab === 'employees' ? (
             // Allow invite from employees tab too for UX
             <Button onClick={() => { setActiveTab('invitations'); setShowAddForm(true); }}>
                <Plus size={18}/> Zaproś Pracownika
             </Button>
          ) : (
             <Button variant="secondary" disabled>Wybierz oddział, aby dodać</Button>
          )}
       </div>

       {/* Tabs Navigation */}
       <div className="flex gap-4 border-b border-[var(--color-border)]">
          <button 
             onClick={() => setActiveTab('employees')}
             className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'employees' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}`}
          >
             <CheckCircle size={18}/> Aktywni Pracownicy
          </button>
          <button 
             onClick={() => setActiveTab('invitations')}
             className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'invitations' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}`}
          >
             <Mail size={18}/> Wysłane Zaproszenia
          </button>
       </div>

       {/* --- TAB: ACTIVE EMPLOYEES --- */}
       {activeTab === 'employees' && (
          <div className="space-y-4 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => (
                   <Card key={emp.id} className="flex flex-col gap-4 relative group hover:border-[var(--color-primary)] transition-all">
                      <div className="flex items-start justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-highlight)] flex items-center justify-center font-bold text-xl overflow-hidden border border-[var(--color-border)]">
                               {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" /> : `${(emp.first_name || '?')[0]}${(emp.last_name || '?')[0]}`}
                            </div>
                            <div>
                               <div className="font-bold text-lg">{emp.first_name} {emp.last_name}</div>
                               <div className="text-xs text-[var(--color-text-secondary)]">{emp.email}</div>
                            </div>
                         </div>
                         <Badge variant={emp.companyRole === 'owner' ? 'primary' : 'secondary'}>
                            {emp.companyRole === 'owner' ? 'Admin' : 'Pracownik'}
                         </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs bg-[var(--color-background)] p-2 rounded border border-[var(--color-border)]">
                         <Building2 size={14} className="text-[var(--color-text-secondary)]"/>
                         <span className="font-bold text-[var(--color-text-secondary)]">Oddział:</span>
                         <span>{getBranchName(emp.branchId)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--color-background)] p-3 rounded-lg border border-[var(--color-border)]">
                         <div>
                            <span className="text-[var(--color-text-secondary)] block">Urlop (Razem)</span>
                            <span className="font-bold">{emp.vacation_days_total || 0} dni</span>
                         </div>
                         <div>
                            <span className="text-[var(--color-text-secondary)] block">Wykorzystane</span>
                            <span className="font-bold">{emp.vacation_days_used || 0} dni</span>
                         </div>
                         <div>
                            <span className="text-[var(--color-text-secondary)] block">Stawka/h</span>
                            <span className="font-bold">{emp.hourlyRate ? `${emp.hourlyRate} PLN` : '-'}</span>
                         </div>
                      </div>

                      <div className="flex gap-2">
                         <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => startEdit(emp)}>
                            <Edit2 size={14} className="mr-1"/> Edytuj Dane
                         </Button>
                         <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setReviewingEmployeeId(emp.id)}>
                            <Clock size={14} className="mr-1"/> Czas Pracy
                         </Button>
                      </div>

                      {emp.id !== user.id && (
                         <button onClick={() => handleRemoveEmployee(emp.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]">
                            <Trash2 size={16} />
                         </button>
                      )}
                   </Card>
                ))}
                {employees.length === 0 && <div className="col-span-full text-center py-8 text-[var(--color-text-secondary)]">Brak aktywnych pracowników w tym oddziale.</div>}
             </div>
          </div>
       )}

       {/* --- TAB: INVITATIONS --- */}
       {activeTab === 'invitations' && (
          <div className="space-y-6 animate-fade-in">
             {showAddForm && currentBranchId !== 'all' && (
                <Card className="border border-[var(--color-primary)] max-w-lg mb-6">
                   <h3 className="font-bold mb-4">Nowe Zaproszenie</h3>
                   <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      Wprowadź adres e-mail użytkownika.
                   </p>
                   <form onSubmit={handleInvite} className="space-y-4">
                      <Input label="Adres Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="pracownik@email.com" />
                      <Button type="submit" className="w-full"><Send size={16} className="mr-2"/> Wyślij Zaproszenie</Button>
                   </form>
                </Card>
             )}

             <div className="space-y-3">
                {invitations.map(inv => {
                   const isActive = inv.status === 'pending';
                   const opacityClass = isActive ? 'opacity-100' : 'opacity-60';
                   const borderClass = isActive ? 'border-dashed border-[var(--color-primary)]' : 'border-[var(--color-border)]';
                   const bgClass = isActive ? 'bg-[var(--color-surface-highlight)]' : 'bg-[var(--color-surface)]';

                   return (
                      <div key={inv.id} className={`flex flex-col gap-4 p-4 rounded-xl border ${borderClass} ${bgClass} ${opacityClass} transition-all`}>
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                               <div className="flex items-center gap-3 mb-1">
                                  <span className="font-bold text-lg">{inv.email}</span>
                                  <Badge variant={inv.status === 'pending' ? 'warning' : inv.status === 'accepted' ? 'success' : 'danger'}>
                                     {inv.status === 'pending' ? 'Oczekuje' : inv.status === 'accepted' ? 'Zaakceptowane' : 'Odrzucone'}
                                  </Badge>
                               </div>
                               <div className="text-xs text-[var(--color-text-secondary)] flex flex-wrap gap-4 mt-2">
                                  <span>Nr Klienta: <strong className="font-mono text-[var(--color-primary)]">{inv.client_number}</strong></span>
                                  <span>Wysłano: {new Date(inv.created_at).toLocaleString()}</span>
                                  {inv.senderName && <span>Przez: {inv.senderName}</span>}
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                               <div className="text-[10px] text-[var(--color-text-secondary)] font-mono opacity-50 hidden md:block">
                                  ID: {inv.id.slice(0, 8)}...
                               </div>
                               <Button size="sm" variant="ghost" className="text-[var(--color-danger)] hover:bg-red-50" onClick={() => handleDeleteInvitation(inv.id)}>
                                  <Trash2 size={16}/>
                               </Button>
                            </div>
                         </div>

                         {/* Show Registered User Details if Accepted */}
                         {inv.status === 'accepted' && inv.registeredUser && (
                            <div className="mt-2 pt-3 border-t border-[var(--color-border)] bg-[var(--color-background)] bg-opacity-50 p-3 rounded-lg flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold text-xs">
                                  {inv.registeredUser.first_name[0]}{inv.registeredUser.last_name[0]}
                               </div>
                               <div className="text-sm">
                                  <div className="font-bold">{inv.registeredUser.first_name} {inv.registeredUser.last_name}</div>
                                  <div className="text-xs text-[var(--color-text-secondary)]">
                                     {inv.registeredUser.companyRole === 'owner' ? 'Właściciel' : 'Pracownik'} • Oddział: {getBranchName(inv.registeredUser.branchId)}
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                   )
                })}
                {invitations.length === 0 && (
                   <div className="text-center py-12 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                      Brak wysłanych zaproszeń w historii.
                   </div>
                )}
             </div>
          </div>
       )}

       {/* --- EDIT MODAL --- */}
       {editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <Card className="w-full max-w-md animate-fade-in border border-[var(--color-primary)]">
                <h3 className="font-bold text-lg mb-4">Edycja: {editingEmployee.first_name} {editingEmployee.last_name}</h3>
                <div className="space-y-4">
                   
                   <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl border border-[var(--color-border)] mb-2">
                      <div className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-3">Dane Kadrowe (Admin)</div>
                      <div className="grid grid-cols-2 gap-4">
                         <Input label="Dni Urlopu (Razem)" type="number" value={editForm.vacation_days_total || 0} onChange={e => setEditForm({...editForm, vacation_days_total: parseInt(e.target.value)})} className="bg-white" />
                         <Input label="Dni Wykorzystane" type="number" value={editForm.vacation_days_used || 0} onChange={e => setEditForm({...editForm, vacation_days_used: parseInt(e.target.value)})} className="bg-white" />
                      </div>
                      <div className="mt-4">
                         <Input label="Stawka Godzinowa (PLN)" type="number" value={editForm.hourlyRate || ''} onChange={e => setEditForm({...editForm, hourlyRate: parseFloat(e.target.value)})} className="bg-white" />
                      </div>
                   </div>

                   <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl border border-[var(--color-border)]">
                      <div className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-3">Uprawnienia</div>
                      <div className="space-y-2">
                         <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-[var(--color-border)]">
                            <input 
                               type="radio" 
                               name="role" 
                               checked={editForm.companyRole === 'employee' || !editForm.companyRole} 
                               onChange={() => setEditForm({...editForm, companyRole: 'employee'})}
                               className="accent-[var(--color-primary)]"
                            />
                            <div>
                               <div className="font-bold text-sm">Pracownik</div>
                               <div className="text-xs text-[var(--color-text-secondary)]">Standardowy dostęp do grafiku i zadań.</div>
                            </div>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-[var(--color-border)]">
                            <input 
                               type="radio" 
                               name="role" 
                               checked={editForm.companyRole === 'owner'} 
                               onChange={() => setEditForm({...editForm, companyRole: 'owner'})}
                               className="accent-[var(--color-primary)]"
                            />
                            <div>
                               <div className="font-bold text-sm">Właściciel / Admin</div>
                               <div className="text-xs text-[var(--color-text-secondary)]">Pełny dostęp do ustawień firmy.</div>
                            </div>
                         </label>
                      </div>
                   </div>

                   {/* Branch Assignment */}
                   <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl border border-[var(--color-border)]">
                      <label className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-2 block">Przypisany Oddział</label>
                      <select 
                         className="w-full bg-white border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                         value={editForm.branchId || ''}
                         onChange={e => setEditForm({...editForm, branchId: e.target.value || undefined})}
                      >
                         <option value="">-- Domyślny / Wszystkie --</option>
                         {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>

                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border)] mt-4">
                   <Button variant="ghost" onClick={() => setEditingEmployee(null)}>Anuluj</Button>
                   <Button onClick={saveEdit} className="bg-[var(--color-success)]"><Save size={16} className="mr-2"/> Zapisz Zmiany</Button>
                </div>
             </Card>
          </div>
       )}

       {/* --- SESSION REVIEW MODAL --- */}
       {reviewingEmployeeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden animate-fade-in border border-[var(--color-primary)]">
                <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
                   <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20}/> Historia Czasu Pracy</h3>
                   <button onClick={() => setReviewingEmployeeId(null)} className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full"><X/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[var(--color-background)]">
                   {employeeSessions.length > 0 ? (
                      <div className="space-y-3">
                         {employeeSessions.map(session => (
                            <div key={session.id} className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] flex justify-between items-center">
                               <div>
                                  <div className="font-bold text-sm">
                                     {new Date(session.startTime).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-[var(--color-text-secondary)] font-mono">
                                     {new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                     {session.endTime ? new Date(session.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Trwa...'}
                                  </div>
                                  {session.status === 'pending_approval' && (
                                     <div className="text-[10px] font-bold text-[var(--color-primary)] mt-1 flex items-center gap-1">
                                        <AlertTriangle size={10}/> Wniosek o korektę
                                     </div>
                                  )}
                               </div>
                               
                               <div className="flex items-center gap-4">
                                  {session.endTime ? (
                                     <div className="text-right">
                                        <div className="font-bold text-sm">
                                           {Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min
                                        </div>
                                        {session.status === 'completed' && <Badge variant="secondary" className="scale-75 origin-right">Zatwierdzone</Badge>}
                                     </div>
                                  ) : (
                                     <Badge variant="warning" className="animate-pulse">Aktywna</Badge>
                                  )}

                                  {session.status === 'pending_approval' && (
                                     <div className="flex gap-1">
                                        <button onClick={() => handleApproval(session.id, true)} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check size={16}/></button>
                                        <button onClick={() => handleApproval(session.id, false)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={16}/></button>
                                     </div>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="text-center p-8 text-[var(--color-text-secondary)]">Brak historii pracy.</div>
                   )}
                </div>
             </Card>
          </div>
       )}

    </div>
  );
};
