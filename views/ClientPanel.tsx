
import React, { useState, useEffect, useRef } from 'react';
import { User, Invitation, WorkSession, Company, PayrollBonus, UserBonus, LeaveRequest, BulletinAd } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { saveUser, getInvitations, respondToInvitation, startWorkSession, endWorkSession, getUserWorkSessions, getCompanyById, getBranches, requestSessionEdit, getPayrollBonuses, saveUserBonus, getUserBonuses, createLeaveRequest, getUserLeaveRequests, deleteLeaveRequest, getBulletinAds } from '../services/storageService';
import { User as UserIcon, Calendar, Save, MapPin, Hash, Bell, Check, X, Clock, Play, Square, LogOut, Briefcase, Building2, Edit2, AlertTriangle, Image as ImageIcon, Coins, ChevronDown, ChevronUp, Palmtree, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ClientPanelProps {
  user: User;
  onUpdateUser: (u: User) => void;
  onChangeView?: (view: string) => void;
}

export const ClientPanel: React.FC<ClientPanelProps> = ({ user, onUpdateUser, onChangeView }) => {
  const [activeTab, setActiveTab] = useState<'employee' | 'profile'>(user.companyId ? 'employee' : 'profile');
  
  const [formData, setFormData] = useState<User>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [branchName, setBranchName] = useState<string>('');

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [payrollBonuses, setPayrollBonuses] = useState<PayrollBonus[]>([]);
  const [userBonuses, setUserBonuses] = useState<UserBonus[]>([]);
  // Store today's bonuses specifically for the active session card
  const [todaysBonuses, setTodaysBonuses] = useState<UserBonus[]>([]);

  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
  const [editTimes, setEditTimes] = useState({ start: '', end: '' });

  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [expandedDays, setExpandedDays] = useState<{[key: string]: boolean}>({});

  // Leave Requests State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveForm, setLeaveForm] = useState({ start: '', end: '' });

  // --- BULLETIN BOARD WIDGET ---
  const [bulletinAds, setBulletinAds] = useState<BulletinAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isBulletinEnabled, setIsBulletinEnabled] = useState(false);

  useEffect(() => {
     const init = async () => {
       await loadInvitations();
       await loadCompanyData();
       await loadWorkData();
     };
     init();
  }, [user.id, user.companyId]);

  useEffect(() => {
     if(!user.companyId) setActiveTab('profile');
     else if(activeTab === 'profile' && !user.companyId) setActiveTab('profile');
  }, [user.companyId]);

  useEffect(() => {
     if (activeSession) {
        const start = new Date(activeSession.startTime).getTime();
        timerRef.current = window.setInterval(() => {
           const now = new Date().getTime();
           setElapsedTime(Math.floor((now - start) / 60000));
        }, 1000);
     } else {
        if(timerRef.current) clearInterval(timerRef.current);
        setElapsedTime(0);
     }
     return () => {
        if(timerRef.current) clearInterval(timerRef.current);
     };
  }, [activeSession]);

  // Bulletin Rotation
  useEffect(() => {
     if (isBulletinEnabled && bulletinAds.length > 1) {
        const interval = setInterval(() => {
           setCurrentAdIndex(prev => (prev + 1) % bulletinAds.length);
        }, 5000);
        return () => clearInterval(interval);
     }
  }, [isBulletinEnabled, bulletinAds.length]);

  const loadWorkData = async () => {
     const allSessions = await getUserWorkSessions(user.id);
     setSessions(allSessions);
     const active = allSessions.find(s => !s.endTime);
     setActiveSession(active || null);

     if (user.companyId) {
        const bonuses = await getPayrollBonuses(user.companyId);
        const filtered = bonuses.filter(b => !b.branchId || b.branchId === user.branchId);
        setPayrollBonuses(filtered);

        const history = await getUserBonuses(user.id);
        setUserBonuses(history);

        // Filter today's bonuses
        const todayStr = new Date().toDateString();
        const todays = history.filter(b => new Date(b.timestamp).toDateString() === todayStr);
        setTodaysBonuses(todays);

        const requests = await getUserLeaveRequests(user.id);
        setLeaveRequests(requests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
     }
  };

  const loadCompanyData = async () => {
     if(user.companyId) {
        const comp = await getCompanyById(user.companyId);
        setCompany(comp);
        if(user.branchId) {
           const branches = await getBranches();
           const b = branches.find(br => br.id === user.branchId);
           if(b) setBranchName(b.name);
        }

        // --- Load Bulletin Ads if Enabled ---
        if (comp?.bulletinConfig?.enabled) {
           setIsBulletinEnabled(true);
           const allAds = await getBulletinAds();
           // Filter by categories selected in company config
           const allowedCats = comp.bulletinConfig.displayCategories || [];
           const filtered = allAds.filter(ad => allowedCats.includes(ad.categoryId) && ad.status === 'active');
           setBulletinAds(filtered);
        }
     }
  };

  const loadInvitations = async () => {
     const all = await getInvitations();
     const myPending = all.filter(inv => inv.email.toLowerCase() === user.email.toLowerCase() && inv.status === 'pending');
     setPendingInvitations(myPending);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    await saveUser(formData);
    onUpdateUser(formData);
    setIsEditing(false);
    toast.success('Profil zaktualizowany');
  };

  const handleRespond = async (invitation: Invitation, accept: boolean) => {
     await respondToInvitation(invitation.id, accept);
     
     if (accept) {
        toast.success(`Dołączono do firmy ${invitation.companyName}`);
        onUpdateUser({ 
           ...user, 
           companyId: invitation.companyId, 
           branchId: invitation.branchId, 
           companyRole: 'employee' 
        });
        setActiveTab('employee');
     } else {
        toast.info('Odrzucono zaproszenie');
        loadInvitations();
     }
  };

  const handleLeaveCompany = async () => {
     if(confirm('Czy na pewno chcesz opuścić firmę? Stracisz dostęp do panelu pracownika.')) {
        const updated = { ...user, companyId: undefined, branchId: undefined, companyRole: undefined };
        await saveUser(updated as User);
        onUpdateUser(updated as User);
        setCompany(undefined);
        setSessions([]);
        setActiveTab('profile');
        toast.info('Opuszczono firmę.');
     }
  };

  const handleStartWork = async () => {
     if(!user.companyId) return;
     await startWorkSession(user.id, user.companyId, user.branchId);
     loadWorkData();
     toast.success('Rozpoczęto pracę');
  };

  const handleEndWork = async () => {
     await endWorkSession(user.id);
     loadWorkData();
     toast.success('Zakończono pracę');
  };

  const handleAddBonus = async (bonus: PayrollBonus) => {
     if(!user.companyId) return;
     
     await saveUserBonus({
        userId: user.id,
        companyId: user.companyId,
        bonusId: bonus.id,
        name: bonus.name,
        amount: bonus.amount
     });
     
     loadWorkData();
     toast.success(`Dodano dodatek: ${bonus.name}`);
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

  const openEditSession = (session: WorkSession) => {
     setEditingSession(session);
     setEditTimes({
        start: new Date(session.startTime).toISOString().slice(0, 16),
        end: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : ''
     });
  };

  const submitSessionEdit = async () => {
     if(!editingSession) return;
     
     await requestSessionEdit(
        editingSession.id, 
        new Date(editTimes.start).toISOString(),
        editTimes.end ? new Date(editTimes.end).toISOString() : undefined
     );
     
     setEditingSession(null);
     loadWorkData();
     toast.success('Wysłano prośbę o korektę godzin');
  };

  const toggleDayExpand = (monthKey: string, dayKey: string) => {
     const key = `${monthKey}-${dayKey}`;
     setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLeaveRequestSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!user.companyId || !leaveForm.start || !leaveForm.end) return toast.error('Wypełnij daty');

     const start = new Date(leaveForm.start);
     const end = new Date(leaveForm.end);

     if (end < start) {
        return toast.error('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
     }

     const diffTime = Math.abs(end.getTime() - start.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

     // Walidacja dostępnych dni
     const remainingDays = (user.vacation_days_total || 0) - (user.vacation_days_used || 0);
     if (diffDays > remainingDays) {
        return toast.error(`Nie masz wystarczającej liczby dni urlopowych. Pozostało: ${remainingDays}, Wnioskowano: ${diffDays}.`);
     }

     await createLeaveRequest({
        userId: user.id,
        companyId: user.companyId,
        branchId: user.branchId,
        startDate: leaveForm.start,
        endDate: leaveForm.end,
        daysCount: diffDays,
        type: 'vacation'
     });

     setLeaveForm({ start: '', end: '' });
     await loadWorkData(); // Reloads requests immediately
     toast.success('Wniosek urlopowy wysłany');
  };

  const handleDeleteRequest = async (id: string) => {
     if(confirm('Czy na pewno wycofać ten wniosek?')) {
        await deleteLeaveRequest(id);
        await loadWorkData();
        toast.info('Wniosek wycofany');
     }
  };

  const groupedData: { [key: string]: { [key: string]: { sessions: WorkSession[], bonuses: UserBonus[] } } } = {};
  
  sessions.filter(s => s.status !== 'active').forEach(session => {
     const date = new Date(session.startTime);
     const monthKey = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
     const dayKey = date.toLocaleDateString('pl-PL', { day: 'numeric', weekday: 'long' });

     if (!groupedData[monthKey]) groupedData[monthKey] = {};
     if (!groupedData[monthKey][dayKey]) groupedData[monthKey][dayKey] = { sessions: [], bonuses: [] };
     
     groupedData[monthKey][dayKey].sessions.push(session);
  });

  userBonuses.forEach(bonus => {
     const date = new Date(bonus.timestamp);
     const monthKey = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
     const dayKey = date.toLocaleDateString('pl-PL', { day: 'numeric', weekday: 'long' });

     if (!groupedData[monthKey]) groupedData[monthKey] = {};
     if (!groupedData[monthKey][dayKey]) groupedData[monthKey][dayKey] = { sessions: [], bonuses: [] };
     
     groupedData[monthKey][dayKey].bonuses.push(bonus);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* BULLETIN BOARD WIDGET (Top) */}
      {isBulletinEnabled && bulletinAds.length > 0 && (
         <Card className="border border-[var(--color-primary)] bg-[var(--color-surface)] relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all" onClick={() => onChangeView && onChangeView('bulletin-board')}>
            <div className="absolute top-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
               <ShoppingBag size={12}/> GIEŁDA
            </div>
            
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-[var(--color-background)] rounded-xl flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                  <ShoppingBag size={24} className="text-[var(--color-primary)]"/>
               </div>
               <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-1">Polecane Ogłoszenia</div>
                  <div className="animate-fade-in key={currentAdIndex}">
                     <h4 className="font-bold text-lg truncate">{bulletinAds[currentAdIndex].title}</h4>
                     <p className="text-sm text-[var(--color-text-secondary)] truncate">{bulletinAds[currentAdIndex].content}</p>
                  </div>
               </div>
               <div className="text-right hidden sm:block">
                  <div className="text-xl font-bold text-[var(--color-primary)]">{bulletinAds[currentAdIndex].price} PLN</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{bulletinAds[currentAdIndex].location}</div>
               </div>
               <ArrowRight size={20} className="text-[var(--color-text-secondary)] group-hover:translate-x-1 transition-transform"/>
            </div>
            
            {/* Progress Bar for Rotation */}
            <div className="absolute bottom-0 left-0 h-1 bg-[var(--color-border)] w-full">
               <div className="h-full bg-[var(--color-primary)] transition-all duration-[5000ms] ease-linear w-full origin-left" key={currentAdIndex} style={{ animation: 'progress 5s linear' }}></div>
            </div>
            <style>{`@keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
         </Card>
      )}

      {pendingInvitations.length > 0 && (
         <Card className="border-2 border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-5">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Bell className="text-[var(--color-primary)]"/> Oczekujące Zaproszenia</h3>
            <div className="space-y-3">
               {pendingInvitations.map(inv => (
                  <div key={inv.id} className="bg-[var(--color-surface)] p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                     <div>
                        <div className="font-bold text-lg">{inv.companyName}</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                           Zaprasza Cię do zespołu {inv.branchName ? `w oddziale ${inv.branchName}` : ''} jako pracownik.
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="danger" size="sm" onClick={() => handleRespond(inv, false)}><X size={16} className="mr-1"/> Odrzuć</Button>
                        <Button className="bg-[var(--color-success)]" size="sm" onClick={() => handleRespond(inv, true)}><Check size={16} className="mr-1"/> Akceptuj</Button>
                     </div>
                  </div>
               ))}
            </div>
         </Card>
      )}

      {user.companyId && (
         <div className="flex justify-center border-b border-[var(--color-border)] mb-6">
            <button 
               onClick={() => setActiveTab('employee')}
               className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'employee' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}`}
            >
               Panel Pracownika
            </button>
            <button 
               onClick={() => setActiveTab('profile')}
               className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}`}
            >
               Twój Profil
            </button>
         </div>
      )}

      {activeTab === 'profile' && (
         <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
               <div>
                  <h2 className="text-3xl font-bold mb-1">Twój Profil</h2>
                  <p className="text-[var(--color-text-secondary)]">Zarządzaj swoimi danymi osobowymi.</p>
               </div>
               {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edytuj Dane</Button>
               ) : (
                  <div className="flex gap-2">
                     <Button variant="ghost" onClick={() => { setIsEditing(false); setFormData(user); }}>Anuluj</Button>
                     <Button onClick={handleProfileSave} className="bg-[var(--color-success)]"><Save size={18} /> Zapisz</Button>
                  </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="col-span-1 flex flex-col items-center text-center p-8">
                  <div className="relative mb-4 group">
                     <div className="w-32 h-32 rounded-full bg-[var(--color-surface-highlight)] flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden border-4 border-[var(--color-surface)]">
                        {formData.useIcon || !formData.photoUrl ? (
                           <span>{user.first_name[0]}{user.last_name[0]}</span>
                        ) : (
                           <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        )}
                     </div>
                     {isEditing && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                           <label className="cursor-pointer text-white text-xs mb-2 hover:underline">
                              Zmień Foto
                              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                           </label>
                           <button onClick={() => setFormData({...formData, useIcon: !formData.useIcon})} className="text-white text-xs hover:underline">
                              {formData.useIcon ? 'Pokaż Zdjęcie' : 'Użyj Ikony'}
                           </button>
                        </div>
                     )}
                  </div>
                  
                  <h3 className="text-xl font-bold">{user.first_name} {user.last_name}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-6">{user.email}</p>
                  
                  <div className="w-full space-y-3">
                     <div className="bg-[var(--color-background)] p-3 rounded-xl flex justify-between items-center">
                        <span className="text-xs text-[var(--color-text-secondary)] uppercase">Nr Klienta</span>
                        <span className="font-mono font-bold text-[var(--color-primary)]">#{user.client_number}</span>
                     </div>
                  </div>
               </Card>

               <Card className="col-span-1 md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <Input label="Imię" name="first_name" value={formData.first_name} onChange={handleProfileChange} disabled={!isEditing} />
                     <Input label="Nazwisko" name="last_name" value={formData.last_name} onChange={handleProfileChange} disabled={!isEditing} />
                     <Input label="Email" name="email" value={formData.email} onChange={handleProfileChange} disabled={!isEditing} />
                     <Input label="Telefon" name="phone" value={formData.phone || ''} onChange={handleProfileChange} disabled={!isEditing} />
                     <Input label="Ulica i numer" name="address" value={formData.address || ''} onChange={handleProfileChange} disabled={!isEditing} className="col-span-full" />
                     <Input label="Miasto" name="city" value={formData.city || ''} onChange={handleProfileChange} disabled={!isEditing} />
                  </div>
               </Card>
            </div>

            {/* Employment Data Card (Above Company Info) */}
            {user.companyId && (
               <Card className="bg-[var(--color-surface-highlight)] border border-[var(--color-border)]">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Coins size={20}/> Warunki Zatrudnienia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <div className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase font-bold mb-1">Stawka Godz.</div>
                        <div className="text-xl font-bold">{user.hourlyRate ? `${user.hourlyRate} PLN` : '-'}</div>
                     </div>
                     <div className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase font-bold mb-1">Urlop (Razem)</div>
                        <div className="text-xl font-bold">{user.vacation_days_total || 0} dni</div>
                     </div>
                     <div className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase font-bold mb-1">Wykorzystane</div>
                        <div className="text-xl font-bold text-orange-500">{user.vacation_days_used || 0} dni</div>
                     </div>
                     <div className="p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase font-bold mb-1">Pozostało</div>
                        <div className="text-xl font-bold text-[var(--color-success)]">{(user.vacation_days_total || 0) - (user.vacation_days_used || 0)} dni</div>
                     </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-4 italic">Dane te są edytowalne wyłącznie przez administratora Twojego oddziału.</p>
               </Card>
            )}

            {user.companyId && company && (
               <Card className="border-l-4 border-[var(--color-primary)]">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-lg font-bold flex items-center gap-2"><Briefcase size={20}/> Zatrudnienie</h3>
                        <div className="mt-2">
                           <div className="text-xl font-bold text-[var(--color-text-main)]">{company.name}</div>
                           <div className="text-sm text-[var(--color-text-secondary)]">{company.city}, {company.street}</div>
                           {branchName && <Badge variant="secondary" className="mt-2">{branchName}</Badge>}
                        </div>
                     </div>
                     <Button variant="danger" size="sm" onClick={handleLeaveCompany}>
                        <LogOut size={16} className="mr-2"/> Opuść Firmę
                     </Button>
                  </div>
               </Card>
            )}
         </div>
      )}

      {activeTab === 'employee' && user.companyId && (
         <div className="space-y-8 animate-fade-in">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="md:col-span-2 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)]">
                  <div className="absolute top-0 right-0 p-32 bg-[var(--color-primary)] opacity-5 rounded-full filter blur-3xl transform translate-x-10 -translate-y-10"></div>
                  
                  <div>
                     <h3 className="text-xl font-bold flex items-center gap-2"><Clock size={20}/> Rejestracja Czasu Pracy</h3>
                     <p className="text-sm text-[var(--color-text-secondary)]">
                        {activeSession ? 'Sesja aktywna' : 'Rozpocznij pracę, aby naliczać czas.'}
                     </p>
                  </div>

                  <div className="flex flex-col items-center justify-center py-8">
                     <div className="text-6xl font-mono font-bold tracking-tighter mb-2">
                        {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{ (elapsedTime % 60).toString().padStart(2, '0') }
                     </div>
                     <div className="text-xs uppercase font-bold text-[var(--color-text-secondary)] tracking-widest">Czas trwania (min)</div>
                  </div>

                  <div className="flex gap-4">
                     {!activeSession ? (
                        <Button onClick={handleStartWork} className="w-full h-14 text-lg bg-[var(--color-success)] hover:bg-green-600 shadow-lg shadow-green-900/20">
                           <Play size={24} className="mr-2 fill-current"/> Rozpocznij Pracę
                        </Button>
                     ) : (
                        <Button onClick={handleEndWork} className="w-full h-14 text-lg bg-[var(--color-danger)] hover:bg-red-600 shadow-lg shadow-red-900/20">
                           <Square size={24} className="mr-2 fill-current"/> Zakończ Pracę
                        </Button>
                     )}
                  </div>

                  {/* Today's Bonuses List in Active Card */}
                  {todaysBonuses.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-[var(--color-border)]/50">
                        <h4 className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-2">Dodatki z dzisiaj</h4>
                        <div className="space-y-2">
                           {todaysBonuses.map(bonus => (
                              <div key={bonus.id} className="flex justify-between items-center text-sm p-2 bg-white/50 rounded-lg">
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold">{bonus.name}</span>
                                    <span className="text-xs opacity-60">({new Date(bonus.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})})</span>
                                 </div>
                                 <div className="font-bold text-[var(--color-primary)]">+{bonus.amount} PLN</div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </Card>

               <div className="space-y-6">
                  <Card className="flex-1 flex flex-col justify-center items-center text-center">
                     <div className="p-3 rounded-full bg-[var(--color-secondary)] mb-2"><Briefcase size={24}/></div>
                     <div className="text-2xl font-bold">{user.hourlyRate ? `${user.hourlyRate} PLN` : '-'}</div>
                     <div className="text-xs text-[var(--color-text-secondary)]">Stawka godzinowa</div>
                  </Card>
                  
                  {user.companyRole === 'owner' || user.role === 'super_admin' ? (
                     <Card className="flex-1 flex flex-col justify-center items-center text-center cursor-pointer hover:border-[var(--color-primary)] border border-transparent transition-colors" onClick={() => onChangeView && onChangeView('company-panel')}>
                        <div className="p-3 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] mb-2"><Building2 size={24}/></div>
                        <div className="font-bold">Panel Admina</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Zarządzaj firmą</div>
                     </Card>
                  ) : null}
               </div>
            </div>

            {payrollBonuses.length > 0 && (
               <Card className="bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Coins size={20}/> Dodatki Płacowe</h3>
                  <div className="flex flex-wrap gap-3">
                     {payrollBonuses.map(bonus => (
                        <button 
                           key={bonus.id}
                           onClick={() => handleAddBonus(bonus)}
                           className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-highlight)] transition-all group"
                        >
                           <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-text-main)] font-bold text-xs">
                              +
                           </div>
                           <div className="text-left">
                              <div className="font-bold text-sm">{bonus.name}</div>
                              <div className="text-xs text-[var(--color-text-secondary)] font-mono">{bonus.amount} PLN</div>
                           </div>
                        </button>
                     ))}
                  </div>
               </Card>
            )}

            <div className="space-y-6">
               <h3 className="text-xl font-bold flex items-center gap-2"><Calendar size={20}/> Historia Pracy</h3>
               
               {Object.entries(groupedData).map(([month, days]) => (
                  <div key={month} className="space-y-4">
                     <h4 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] sticky top-0 bg-[var(--color-background)] py-2 z-10">{month}</h4>
                     {Object.entries(days).map(([day, { sessions: daySessions, bonuses: dayBonuses }]) => {
                        const dayKey = `${month}-${day}`;
                        const isExpanded = expandedDays[dayKey];
                        const totalMinutes = daySessions.reduce((acc, s) => acc + (s.endTime ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime())/60000) : 0), 0);
                        const totalBonuses = dayBonuses.length;

                        return (
                           <Card key={day} className="p-0 overflow-hidden border border-[var(--color-border)] transition-all">
                              <div 
                                 className="bg-[var(--color-surface-highlight)] px-4 py-3 text-sm font-bold flex justify-between items-center cursor-pointer hover:bg-[var(--color-secondary)] transition-colors"
                                 onClick={() => toggleDayExpand(month, day)}
                              >
                                 <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    <span>{day}</span>
                                 </div>
                                 <div className="flex gap-4 text-[var(--color-text-secondary)] font-normal text-xs">
                                    {totalBonuses > 0 && <span className="flex items-center gap-1"><Coins size={12}/> {totalBonuses} dodatków</span>}
                                    <span className="flex items-center gap-1"><Clock size={12}/> {totalMinutes} min</span>
                                 </div>
                              </div>
                              
                              {isExpanded && (
                                 <div className="divide-y divide-[var(--color-border)] animate-fade-in">
                                    {daySessions.map(session => {
                                       const duration = session.endTime ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) : 0;
                                       return (
                                          <div key={session.id} className="p-4 flex justify-between items-center bg-[var(--color-surface)]">
                                             <div>
                                                <div className="flex items-center gap-2">
                                                   <Clock size={16} className="text-[var(--color-text-secondary)]"/>
                                                   <div className="font-mono font-bold text-lg">
                                                      {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                      {' - '}
                                                      {session.endTime ? new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Trwa...'}
                                                   </div>
                                                   {session.status === 'pending_approval' && (
                                                      <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle size={10}/> Oczekuje na zatwierdzenie</Badge>
                                                   )}
                                                </div>
                                                <div className="text-xs text-[var(--color-text-secondary)] mt-1 ml-6">
                                                   Czas pracy: {duration} min
                                                </div>
                                             </div>
                                             
                                             <Button variant="ghost" size="sm" onClick={() => openEditSession(session)} disabled={session.status === 'pending_approval'}>
                                                <Edit2 size={14}/>
                                             </Button>
                                          </div>
                                       );
                                    })}

                                    {dayBonuses.map(bonus => (
                                       <div key={bonus.id} className="p-4 flex justify-between items-center bg-[var(--color-surface)]">
                                          <div>
                                             <div className="flex items-center gap-2">
                                                <Coins size={16} className="text-[var(--color-primary)]"/>
                                                <div className="font-bold text-sm">{bonus.name}</div>
                                             </div>
                                             <div className="text-xs text-[var(--color-text-secondary)] mt-1 ml-6 flex gap-2">
                                                <span>Dodano: {new Date(bonus.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                             </div>
                                          </div>
                                          <div className="font-bold text-[var(--color-primary)]">
                                             +{bonus.amount} PLN
                                          </div>
                                       </div>
                                    ))}

                                    {daySessions.length === 0 && dayBonuses.length === 0 && (
                                       <div className="p-4 text-center text-xs text-[var(--color-text-secondary)] italic">Brak aktywności.</div>
                                    )}
                                 </div>
                              )}
                           </Card>
                        );
                     })}
                  </div>
               ))}
               {sessions.length === 0 && userBonuses.length === 0 && <div className="text-center text-[var(--color-text-secondary)] py-8 italic">Brak historii pracy.</div>}
            </div>

            {/* Vacation Center - MOVED TO BOTTOM */}
            <Card className="border border-[var(--color-primary)]">
               <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><Palmtree size={20} className="text-[var(--color-primary)]"/> Centrum Urlopowe</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Stats */}
                  <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl space-y-4">
                     <h4 className="font-bold text-sm">Twoje Saldo</h4>
                     <div className="flex justify-between items-center bg-[var(--color-surface)] p-3 rounded-lg">
                        <span className="text-sm text-[var(--color-text-secondary)]">Przysługuje:</span>
                        <span className="font-bold">{user.vacation_days_total || 0} dni</span>
                     </div>
                     <div className="flex justify-between items-center bg-[var(--color-surface)] p-3 rounded-lg">
                        <span className="text-sm text-[var(--color-text-secondary)]">Wykorzystano:</span>
                        <span className="font-bold text-orange-500">{user.vacation_days_used || 0} dni</span>
                     </div>
                     <div className="flex justify-between items-center bg-[var(--color-surface)] p-3 rounded-lg border-l-4 border-[var(--color-success)]">
                        <span className="text-sm text-[var(--color-text-secondary)]">Do wykorzystania:</span>
                        <span className="font-bold text-lg">{(user.vacation_days_total || 0) - (user.vacation_days_used || 0)} dni</span>
                     </div>
                  </div>

                  {/* Request Form */}
                  <div>
                     <h4 className="font-bold text-sm mb-4">Złóż Wniosek</h4>
                     <form onSubmit={handleLeaveRequestSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <Input type="date" label="Od" value={leaveForm.start} onChange={e => setLeaveForm({...leaveForm, start: e.target.value})} required className="bg-white" />
                           <Input type="date" label="Do" value={leaveForm.end} onChange={e => setLeaveForm({...leaveForm, end: e.target.value})} required className="bg-white" />
                        </div>
                        <Button type="submit" className="w-full">Wyślij Wniosek</Button>
                     </form>
                  </div>
               </div>

               {/* Requests History */}
               <div className="mt-8">
                  <h4 className="font-bold text-sm mb-4">Historia Wniosków</h4>
                  <div className="space-y-2">
                     {leaveRequests.map(req => (
                        <div key={req.id} className="flex justify-between items-center p-3 bg-[var(--color-surface-highlight)] rounded-lg text-sm">
                           <div>
                              <div className="font-bold flex items-center gap-2">
                                 {req.requestNumber}
                                 <span className="text-[var(--color-text-secondary)] font-normal text-xs">| {req.daysCount} dni</span>
                              </div>
                              <div className="text-xs text-[var(--color-text-main)] mt-1">
                                 {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                              </div>
                           </div>
                           <div className="text-right flex items-center gap-3">
                              <div>
                                 <Badge variant={req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}>
                                    {req.status === 'pending' ? 'Oczekuje' : req.status === 'approved' ? 'Zatwierdzony' : 'Odrzucony'}
                                 </Badge>
                                 <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                                    {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                 </div>
                              </div>
                              {req.status === 'pending' && (
                                 <button onClick={() => handleDeleteRequest(req.id)} className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors" title="Wycofaj wniosek">
                                    <Trash2 size={16}/>
                                 </button>
                              )}
                           </div>
                        </div>
                     ))}
                     {leaveRequests.length === 0 && <div className="text-center text-xs text-[var(--color-text-secondary)] italic">Brak złożonych wniosków.</div>}
                  </div>
               </div>
            </Card>
         </div>
      )}

      {editingSession && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md border border-[var(--color-primary)] animate-fade-in">
               <h3 className="font-bold text-lg mb-4">Korekta Czasu Pracy</h3>
               <p className="text-xs text-[var(--color-text-secondary)] mb-4">Zmiana godzin wymaga zatwierdzenia przez administratora.</p>
               
               <div className="space-y-4">
                  <Input 
                     type="datetime-local" 
                     label="Rozpoczęcie" 
                     value={editTimes.start} 
                     onChange={e => setEditTimes({...editTimes, start: e.target.value})} 
                  />
                  <Input 
                     type="datetime-local" 
                     label="Zakończenie" 
                     value={editTimes.end} 
                     onChange={e => setEditTimes({...editTimes, end: e.target.value})} 
                  />
                  
                  <div className="flex justify-end gap-2 pt-4">
                     <Button variant="ghost" onClick={() => setEditingSession(null)}>Anuluj</Button>
                     <Button onClick={submitSessionEdit}>Wyślij do akceptacji</Button>
                  </div>
               </div>
            </Card>
         </div>
      )}
    </div>
  );
};
