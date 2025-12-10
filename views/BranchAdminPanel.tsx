
import React, { useState, useEffect } from 'react';
import { User, LeaveRequest, WorkSession } from '../types';
import { getLeaveRequests, respondToLeaveRequest, getWorkSessions, approveSessionEdit } from '../services/storageService';
import { Card, Button, Badge } from '../components/UI';
import { Check, X, Clock, Palmtree, User as UserIcon, Calendar, ChevronDown, ChevronUp, History, Edit2, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface BranchAdminPanelProps {
  user: User;
  currentBranchId?: string | 'all';
}

export const BranchAdminPanel: React.FC<BranchAdminPanelProps> = ({ user, currentBranchId = 'all' }) => {
  if (!user.companyId || user.companyRole !== 'owner') return <div>Brak dostępu.</div>;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [sessionRequests, setSessionRequests] = useState<WorkSession[]>([]);
  
  const [activeTab, setActiveTab] = useState<'leave' | 'sessions'>('leave');
  const [showHistory, setShowHistory] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);

  useEffect(() => {
     loadData();
  }, [user.companyId, currentBranchId]);

  const loadData = async () => {
     if(!user.companyId) return;

     // 1. Leave Requests
     let leaves = await getLeaveRequests(user.companyId);
     if (currentBranchId !== 'all') {
        leaves = leaves.filter(l => l.branchId === currentBranchId);
     }
     // Sort by creation date desc initially
     leaves.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
     setLeaveRequests(leaves);

     // 2. Work Sessions
     let sessions = await getWorkSessions(user.companyId);
     let relevantSessions = sessions.filter(s => s.status === 'pending_approval' || (s.status === 'completed' && s.resolvedBy));
     
     if (currentBranchId !== 'all') {
        relevantSessions = relevantSessions.filter(s => s.branchId === currentBranchId);
     }
     
     relevantSessions.sort((a,b) => {
        if(a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
        if(a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
     });

     setSessionRequests(relevantSessions);
  };

  const handleLeaveResponse = async (id: string, approved: boolean) => {
     // OPTIMISTIC UPDATE: Update UI immediately before server response
     // This prevents the user from clicking again and removes the "lag"
     setLeaveRequests(prev => prev.map(req => {
        if (req.id === id) {
           return {
              ...req,
              status: approved ? 'approved' : 'rejected',
              resolvedBy: user.id,
              resolvedByName: `${user.first_name} ${user.last_name}`,
              resolvedAt: new Date().toISOString()
           };
        }
        return req;
     }));

     setEditingRequestId(null);
     
     // Proceed with backend update
     await respondToLeaveRequest(id, approved, user);
     
     // Optionally reload to sync everything, but UI is already correct
     // await loadData(); 
     
     toast.success(approved ? 'Wniosek zaakceptowany' : 'Wniosek odrzucony');
  };

  const handleSessionResponse = async (id: string, approved: boolean) => {
     // Optimistic update for sessions as well
     setSessionRequests(prev => prev.map(s => {
        if(s.id === id) {
           return {
              ...s,
              status: 'completed', // Or whatever status means resolved
              resolvedBy: user.id,
              resolvedByName: `${user.first_name} ${user.last_name}`,
              resolvedAt: new Date().toISOString()
           }
        }
        return s;
     }));

     await approveSessionEdit(id, approved, user);
     await loadData();
     toast.success(approved ? 'Korekta zatwierdzona' : 'Korekta odrzucona');
  };

  const AuditInfo = ({ by, at, status }: { by?: string, at?: string, status: string }) => {
     if (!by) return null;
     // Determine styling based on status
     const isApproved = status === 'approved' || status === 'completed';
     const statusText = isApproved ? 'Zaakceptował(a)' : 'Odrzucił(a)';
     const statusColor = isApproved ? 'text-green-600' : 'text-red-600';
     
     return (
        <div className={`text-[10px] ${statusColor} mt-1 pt-1 border-t border-[var(--color-border)] flex justify-between w-full`}>
           <span>{statusText}: <strong>{by}</strong></span>
           {at && <span className="opacity-70">{new Date(at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
        </div>
     );
  };

  // --- Logic for Leave Requests Grouping ---
  const todayStr = new Date().toDateString();

  // 1. Pending (Oczekujące) - Top Priority
  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending');
  
  // 2. Resolved Today (Rozpatrzone Dzisiaj) - Shown below Pending
  const resolvedTodayLeaves = leaveRequests.filter(r => 
     r.status !== 'pending' && 
     r.resolvedAt && 
     new Date(r.resolvedAt).toDateString() === todayStr
  ).sort((a,b) => new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime());

  // 3. History (Starsze) - Hidden by default
  const historyLeaves = leaveRequests.filter(r => 
     r.status !== 'pending' && 
     (!r.resolvedAt || new Date(r.resolvedAt).toDateString() !== todayStr)
  );

  // Group History by Month -> Day
  const groupedHistory: { [key: string]: { [key: string]: LeaveRequest[] } } = {};
  historyLeaves.forEach(req => {
     const date = new Date(req.createdAt);
     const monthKey = date.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
     const dayKey = date.toLocaleDateString('pl-PL', { day: 'numeric', weekday: 'long' });

     if (!groupedHistory[monthKey]) groupedHistory[monthKey] = {};
     if (!groupedHistory[monthKey][dayKey]) groupedHistory[monthKey][dayKey] = [];
     
     groupedHistory[monthKey][dayKey].push(req);
  });

  const renderLeaveCard = (req: LeaveRequest, isHistory: boolean = false, isTodayResolved: boolean = false) => {
      const isEditing = editingRequestId === req.id;
      const isPending = req.status === 'pending';

      // Visual Logic
      let cardClasses = "flex flex-col md:flex-row justify-between items-center gap-3 p-4 transition-all duration-500 ";
      
      if (isPending) {
         cardClasses += "border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)] shadow-md";
      } else if (isTodayResolved) {
         // Resolved Today: 60% opacity as requested
         cardClasses += "border border-[var(--color-border)] opacity-60 hover:opacity-100 bg-[var(--color-background)] grayscale-[0.5] hover:grayscale-0";
      } else {
         // History
         cardClasses += "border border-[var(--color-border)] bg-[var(--color-surface)]";
      }

      return (
         <Card key={req.id} className={cardClasses}>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-[var(--color-border)] shrink-0 ${isPending ? 'bg-white text-[var(--color-primary)]' : 'bg-[var(--color-background)] text-[var(--color-text-secondary)]'}`}>
                  <UserIcon size={20} />
               </div>
               <div>
                  <div className="font-bold text-base text-[var(--color-text-main)]">{req.user?.first_name} {req.user?.last_name}</div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] mt-1">
                     <Calendar size={14}/> 
                     <span className="font-medium">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</span>
                     <Badge variant="primary" className="ml-1 text-[10px] py-0 px-2 h-5 flex items-center">{req.daysCount} dni</Badge>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1 italic">
                     Typ: {req.type === 'vacation' ? 'Wypoczynkowy' : req.type === 'sick' ? 'Chorobowy' : 'Inny'}
                  </div>
               </div>
            </div>

            <div className="w-full md:w-auto flex flex-col items-end gap-2 pl-4 border-l border-[var(--color-border)] md:border-l-0 md:pl-0">
               {isPending || isEditing ? (
                  <div className="flex gap-2">
                     <Button size="sm" variant="danger" className="h-9 px-4 text-xs font-bold shadow-sm hover:shadow-md transition-all" onClick={() => handleLeaveResponse(req.id, false)}>
                        <X size={16} className="mr-1"/> Odrzuć
                     </Button>
                     <Button size="sm" className="bg-[var(--color-success)] h-9 px-4 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all" onClick={() => handleLeaveResponse(req.id, true)}>
                        <Check size={16} className="mr-1"/> Akceptuj
                     </Button>
                     {isEditing && <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => setEditingRequestId(null)}><X size={16}/></Button>}
                  </div>
               ) : (
                  <div className="text-right flex flex-col items-end gap-1 min-w-[140px]">
                     <div className="flex items-center gap-2">
                        {/* Display Visible Status Badge */}
                        <Badge variant={req.status === 'approved' ? 'success' : 'danger'} className="text-xs py-1 px-3 shadow-sm">
                           {req.status === 'approved' ? <><Check size={12} className="mr-1 inline"/> Zaakceptowany</> : <><X size={12} className="mr-1 inline"/> Odrzucony</>}
                        </Badge>
                        <button 
                           onClick={() => setEditingRequestId(req.id)} 
                           className="p-1.5 hover:bg-[var(--color-surface)] rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                           title="Zmień decyzję"
                        >
                           <Edit2 size={14}/>
                        </button>
                     </div>
                     <AuditInfo by={req.resolvedByName} at={req.resolvedAt} status={req.status} />
                  </div>
               )}
            </div>
         </Card>
      );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
       <div className="flex items-center justify-between">
          <div>
             <h2 className="text-3xl font-bold">Panel Administratora Oddziału</h2>
             <p className="text-[var(--color-text-secondary)]">Zarządzaj wnioskami i czasem pracy podległych pracowników.</p>
          </div>
          <div className="flex bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
             <button 
                onClick={() => setActiveTab('leave')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'leave' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}`}
             >
                <Palmtree size={16}/> Wnioski <Badge variant="secondary" className="ml-1">{pendingLeaves.length}</Badge>
             </button>
             <button 
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}`}
             >
                <Clock size={16}/> Korekty <Badge variant="secondary" className="ml-1">{sessionRequests.filter(s => s.status === 'pending_approval').length}</Badge>
             </button>
          </div>
       </div>

       {/* --- LEAVE REQUESTS --- */}
       {activeTab === 'leave' && (
          <div className="space-y-8">
             
             {/* 1. Pending Requests Section */}
             <div>
                <h3 className="font-bold text-sm uppercase text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
                   <Clock size={16}/> Oczekujące na decyzję ({pendingLeaves.length})
                </h3>
                <div className="space-y-4">
                   {pendingLeaves.length > 0 ? (
                      pendingLeaves.map(req => renderLeaveCard(req, false, false))
                   ) : (
                      <div className="text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-surface-highlight)] bg-opacity-20">
                         Brak nowych wniosków do rozpatrzenia.
                      </div>
                   )}
                </div>
             </div>

             {/* 2. Resolved Today Section (Separated by delicate line) */}
             {resolvedTodayLeaves.length > 0 && (
                <div className="animate-fade-in">
                   <div className="flex items-center gap-4 mb-6 mt-2">
                      <div className="h-[1px] flex-1 bg-[var(--color-border)] opacity-50"></div>
                      <span className="text-xs uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">Rozpatrzone Dzisiaj</span>
                      <div className="h-[1px] flex-1 bg-[var(--color-border)] opacity-50"></div>
                   </div>
                   <div className="space-y-3">
                      {resolvedTodayLeaves.map(req => renderLeaveCard(req, false, true))}
                   </div>
                </div>
             )}

             {/* 3. History Toggle */}
             <div className="pt-8 border-t border-[var(--color-border)]">
                <button 
                   onClick={() => setShowHistory(!showHistory)}
                   className="w-full flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] transition-colors text-sm font-bold border border-transparent hover:border-[var(--color-border)]"
                >
                   {showHistory ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                   <Archive size={16}/> Historia Wniosków
                </button>

                {showHistory && (
                   <div className="mt-6 space-y-6 animate-fade-in">
                      {Object.entries(groupedHistory).map(([month, days]) => (
                         <div key={month} className="space-y-3">
                            <h4 className="text-xs font-bold uppercase text-[var(--color-text-secondary)] bg-[var(--color-background)] py-1 sticky top-0 z-10">{month}</h4>
                            {Object.entries(days).map(([day, reqs]) => (
                               <div key={day} className="ml-2 pl-4 border-l-2 border-[var(--color-border)] space-y-3">
                                  <div className="text-xs font-bold text-[var(--color-text-secondary)] -ml-5 flex items-center gap-2 bg-[var(--color-background)] w-fit pr-2">
                                     <div className="w-2 h-2 rounded-full bg-[var(--color-border)]"></div>
                                     {day}
                                  </div>
                                  {reqs.map(req => renderLeaveCard(req, true, false))}
                               </div>
                            ))}
                         </div>
                      ))}
                      {historyLeaves.length === 0 && <div className="text-center italic text-xs text-[var(--color-text-secondary)]">Brak starszej historii.</div>}
                   </div>
                )}
             </div>
          </div>
       )}

       {/* --- SESSION REQUESTS --- */}
       {activeTab === 'sessions' && (
          <div className="space-y-4">
             {sessionRequests.map(session => {
                const isPending = session.status === 'pending_approval';
                
                return (
                   <Card key={session.id} className={`flex flex-col md:flex-row justify-between items-center gap-3 p-4 border ${isPending ? 'border-yellow-400 bg-[var(--color-surface-highlight)]' : 'border-[var(--color-border)] opacity-60 hover:opacity-100'}`}>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                         <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shrink-0 border border-yellow-200">
                            <Clock size={18}/>
                         </div>
                         <div>
                            <div className="font-bold text-sm">{session.user?.first_name} {session.user?.last_name}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">
                               Data: {new Date(session.startTime).toLocaleDateString()} | 
                               <span className="ml-1 font-mono">{new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {session.endTime ? new Date(session.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '?'}</span>
                            </div>
                            {isPending && (
                               <div className="text-xs font-bold text-[var(--color-primary)] mt-1 bg-[var(--color-surface)] px-2 py-1 rounded w-fit">
                                  Korekta na: {session.editedStartTime ? new Date(session.editedStartTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '?'} - {session.editedEndTime ? new Date(session.editedEndTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '?'}
                               </div>
                            )}
                         </div>
                      </div>
                      
                      <div className="w-full md:w-auto">
                         {isPending ? (
                            <div className="flex gap-2 justify-end">
                               <Button size="sm" variant="danger" className="h-8 px-3 text-xs" onClick={() => handleSessionResponse(session.id, false)}><X size={14} className="mr-1"/> Odrzuć</Button>
                               <Button size="sm" className="bg-[var(--color-success)] h-8 px-3 text-xs text-white" onClick={() => handleSessionResponse(session.id, true)}><Check size={14} className="mr-1"/> Zatwierdź</Button>
                            </div>
                         ) : (
                            <div className="text-right">
                               <Badge variant="secondary" className="scale-90">Zakończone</Badge>
                               <AuditInfo by={session.resolvedByName} at={session.resolvedAt} status="completed" />
                            </div>
                         )}
                      </div>
                   </Card>
                );
             })}
             {sessionRequests.length === 0 && <div className="text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">Brak oczekujących korekt.</div>}
          </div>
       )}
    </div>
  );
};
