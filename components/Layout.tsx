
import React, { useState, useEffect, useRef } from 'react';
import { User, Branch, Notification, Company } from '../types';
import { Button, Badge } from './UI';
import { getCompanyById, getNotifications, markNotificationAsRead, getActiveWorkSession } from '../services/storageService';
import { 
  LayoutDashboard, 
  Users, 
  Palette, 
  LogOut, 
  Menu, 
  PanelLeft, 
  PanelTop,
  User as UserIcon,
  Sun,
  Moon,
  Bell,
  ShoppingBag,
  Building2,
  Briefcase,
  ChevronDown,
  Settings,
  Layout as LayoutIcon,
  Flame,
  FileText,
  Factory,
  MapPin,
  Cross,
  Package,
  ShieldAlert,
  Shield,
  Tag,
  Grip,
  X,
  ChevronRight,
  ChevronUp,
  CreditCard,
  LogOut as LogoutIcon,
  MoreVertical
} from 'lucide-react';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onLogout: () => void;
  toggleLayout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  toggleThemeMode: () => void;
  isDarkMode: boolean;
  branches?: Branch[];
  currentBranchId?: string | 'all';
  onBranchChange?: (id: string | 'all') => void;
  onStopImpersonation?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  user, 
  children, 
  onLogout, 
  toggleLayout, 
  currentView, 
  onChangeView,
  toggleThemeMode,
  isDarkMode,
  branches = [],
  currentBranchId = 'all',
  onBranchChange,
  onStopImpersonation
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  
  // Session Timer State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('00:00');
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const layoutMode = user.preferences.layoutMode;
  const isImpersonating = user.role === 'super_admin' && user.companyId;

  // --- Session Logic ---
  const checkActiveSession = async () => {
     if(!user.id) return;
     const session = await getActiveWorkSession(user.id);
     
     if(session) {
        setIsSessionActive(true);
        startTimeRef.current = new Date(session.startTime).getTime();
        startTimer();
     } else {
        setIsSessionActive(false);
        startTimeRef.current = null;
        setSessionDuration('00:00');
        stopTimer();
     }
  };

  const startTimer = () => {
     if(timerRef.current) clearInterval(timerRef.current);
     const update = () => {
        if(startTimeRef.current) {
           const now = Date.now();
           const diff = Math.floor((now - startTimeRef.current) / 1000);
           const h = Math.floor(diff / 3600).toString().padStart(2, '0');
           const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
           setSessionDuration(`${h}:${m}`);
        }
     };
     update();
     timerRef.current = window.setInterval(update, 60000);
  };

  const stopTimer = () => {
     if(timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
     }
  };

  useEffect(() => {
     if(user) {
        loadNotifications();
        checkActiveSession();
        const interval = setInterval(loadNotifications, 30000);
        const handleSessionUpdate = () => checkActiveSession();
        window.addEventListener('work-session-updated', handleSessionUpdate);
        return () => {
           clearInterval(interval);
           window.removeEventListener('work-session-updated', handleSessionUpdate);
           stopTimer();
        };
     }
  }, [user]);

  useEffect(() => {
    if (user.companyId) {
      getCompanyById(user.companyId).then(c => setCompany(c || null));
    }
  }, [user.companyId]);

  const loadNotifications = async () => {
     const notifs = await getNotifications(user.id);
     setNotifications(notifs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  const handleMarkAsRead = (id: string) => {
     markNotificationAsRead(id);
     loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // --- STRICT MENU ITEMS DEFINITION ---

  // 1. Super Admin Menu (ONLY for Super Admin role)
  const superAdminItems = [
      { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard', desc: 'Statystyki' },
      { icon: Users, label: 'Użytkownicy', view: 'users', desc: 'Baza kont' },
      { icon: Building2, label: 'Firmy', view: 'admin-companies', desc: 'Zarządzanie' },
      { icon: Tag, label: 'Kategorie', view: 'admin-bulletin-categories', desc: 'Giełda' },
      { icon: Factory, label: 'Producenci', view: 'manufacturers', desc: 'Baza' },
      { icon: Palette, label: 'Motywy', view: 'themes', desc: 'Wygląd' },
  ];

  // 2. Client/Branch Menu (ONLY for Clients)
  let clientItems: {icon: any, label: string, view: string, desc?: string, color?: string}[] = [];
  
  if (user.companyId) {
    // Only if user belongs to a company
    if (user.companyRole === 'owner') {
       clientItems.push({ icon: Shield, label: 'Administrator', view: 'branch-admin-panel', desc: 'Oddział' });
    }
    clientItems.push({ icon: Briefcase, label: 'Pracownicy', view: 'company-users', desc: 'Kadry' });
    
    // Dynamic based on package
    if (company && (company.package_type === 'funerals' || company.package_type === 'full')) {
       clientItems.push({ icon: Cross, label: 'Pogrzeby', view: 'funerals', desc: 'Ceremonie' });
    }
    if (company && (company.package_type === 'cremation' || company.package_type === 'full')) {
       clientItems.push({ icon: Flame, label: 'Kremacje', view: 'cremations', desc: 'Piece' });
    }
    clientItems.push({ icon: Package, label: 'Magazyn', view: 'warehouse', desc: 'Stany' });
    
    // Settings always last in business section
    if (company && (company.package_type === 'cremation' || company.package_type === 'funerals' || company.package_type === 'full')) {
       clientItems.push({ icon: Settings, label: 'Ustawienia', view: 'settings', desc: 'Konfiguracja' });
    }
  }

  // 3. Community Items (For Clients, maybe Admin too if desired, but separating for now)
  const communityItems = [
     { icon: ShoppingBag, label: 'Giełda', view: 'bulletin-board', desc: 'Ogłoszenia' },
     { icon: ShoppingBag, label: 'Urneo Store', view: 'store', desc: 'Pakiety' },
     { icon: LayoutIcon, label: 'Panel Klienta', view: 'client-dashboard', desc: 'Start' }
  ];

  // Logic to select which items to display
  let displayItems = [];
  
  if (user.role === 'super_admin') {
     // Admin sees ONLY Admin items. If they impersonate, they see client items.
     if (isImpersonating) {
        displayItems = [...clientItems, ...communityItems];
     } else {
        displayItems = superAdminItems;
     }
  } else {
     // Regular client
     displayItems = [...clientItems, ...communityItems];
  }

  const currentItem = displayItems.find(i => i.view === currentView);

  // --- COMPONENTS ---

  const Sidebar = () => {
    return (
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--color-sidebar)] border-r border-[var(--color-border)] transition-all duration-300 ease-in-out flex flex-col w-64
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isImpersonating ? 'top-14' : ''}
        `}
      >
        <div className="flex-1 flex flex-col py-6 overflow-x-hidden overflow-y-auto custom-scrollbar">
           
           {/* Logo Area */}
           <div className="mb-8 flex items-center px-6 gap-3">
               <div className="w-8 h-8 rounded-[0.8rem] bg-[var(--color-primary)] flex items-center justify-center shadow-lg text-[var(--color-primary-foreground)] shrink-0">
                 <span className="font-sans font-bold text-lg">U</span>
               </div>
               <div>
                  <h1 className="text-base font-sans font-bold text-[var(--color-text-main)] leading-none tracking-tight whitespace-nowrap">Urneo</h1>
                  <p className="text-[8px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mt-0.5 whitespace-nowrap">System 2035</p>
               </div>
           </div>

           {/* Navigation */}
           <nav className="flex-1 space-y-1 px-3">
              {displayItems.map(item => (
                 <button 
                    key={item.view} 
                    onClick={() => { onChangeView(item.view); setIsMobileMenuOpen(false); }} 
                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all group relative overflow-hidden
                       ${currentView === item.view 
                          ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-bold shadow-sm' 
                          : 'hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}
                    `}
                 >
                    <item.icon size={20} className={`shrink-0 transition-transform ${currentView === item.view ? '' : 'group-hover:scale-110'}`} strokeWidth={currentView === item.view ? 2.5 : 2} /> 
                    <span className="text-sm">
                       {item.label}
                    </span>
                    
                    {/* Active Indicator Strip */}
                    {currentView === item.view && (
                       <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--color-primary)] rounded-r-full"></div>
                    )}
                 </button>
              ))}
           </nav>

           {/* Bottom User Area */}
           <div className="mt-auto pt-4 border-t border-[var(--color-border)] px-3">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-surface)] cursor-pointer transition-all group" onClick={toggleLayout}>
                 <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold text-xs shrink-0">
                    {user.first_name[0]}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate leading-tight">{user.first_name}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] truncate">Profil</div>
                 </div>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2">
                 <button onClick={toggleThemeMode} className="h-8 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors" title="Motyw">
                    {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                 </button>
                 <button onClick={onLogout} className="h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Wyloguj">
                    <LogoutIcon size={14}/>
                 </button>
              </div>
           </div>
        </div>
      </aside>
    );
  };

  const Topbar = () => (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 h-20 bg-[var(--color-background)]/90 backdrop-blur-md px-6 lg:px-8 flex items-center justify-between border-b border-[var(--color-border)] transition-all ${isImpersonating ? 'top-14' : ''}`}>
        
        {/* Left: Branding */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold text-xl shadow-sm">U</div>
             <div className="hidden md:block h-8 w-[1px] bg-[var(--color-border)] mx-1"></div>
             <div className="flex flex-col">
                <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Aktualny Widok</span>
                <span className="text-sm font-bold text-[var(--color-text-main)] flex items-center gap-2">
                   {currentItem?.label || 'Pulpit'}
                   {company && <span className="text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5 rounded text-[var(--color-text-secondary)]">{company.name}</span>}
                </span>
             </div>
          </div>
        </div>

        {/* Right: User & Tools */}
        <div className="flex items-center gap-3">
           
           {/* Session Indicator */}
           {isSessionActive && (
             <div className="hidden lg:flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full mr-2">
                <div className="relative flex items-center justify-center w-3 h-3">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse absolute"></div>
                   <div className="w-full h-full bg-red-500 rounded-full animate-ping opacity-50"></div>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--color-text-main)]">{sessionDuration}</span>
             </div>
           )}

           <div className="h-8 w-[1px] bg-[var(--color-border)] mx-1 hidden md:block"></div>

           <button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); loadNotifications(); }} className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors relative">
              <Bell size={18}/>
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-danger)] rounded-full animate-pulse"></span>}
           </button>

           <div className="relative group">
              <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-secondary)] transition-all">
                 <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold">
                    {user.first_name[0]}
                 </div>
                 <ChevronDown size={14} className="text-[var(--color-text-secondary)]"/>
              </button>
              
              {/* Simple User Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-fade-in">
                 <div className="p-3 border-b border-[var(--color-border)]">
                    <p className="font-bold text-sm truncate">{user.first_name}</p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] truncate">{user.email}</p>
                 </div>
                 <div className="p-1">
                    <button onClick={toggleThemeMode} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-background)] rounded-lg flex items-center gap-2">
                       {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>} Motyw
                    </button>
                    <button onClick={toggleLayout} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-background)] rounded-lg flex items-center gap-2">
                       {layoutMode === 'sidebar' ? <PanelTop size={14}/> : <PanelLeft size={14}/>} Układ
                    </button>
                    <button onClick={onLogout} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-500 rounded-lg flex items-center gap-2">
                       <LogOut size={14}/> Wyloguj
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </header>

      {/* --- SECOND ROW: APP MENU (Ribbon Style) - PERMANENTLY VISIBLE --- */}
      <div 
         className={`fixed left-0 right-0 z-40 bg-[var(--color-background)]/95 backdrop-blur-xl border-b border-[var(--color-border)] shadow-sm transition-all h-20
            ${isImpersonating ? 'top-[8.5rem]' : 'top-20'}
         `}
      >
         <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center gap-6">
            
            {/* Scrollable Items List */}
            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-2 h-full">
               {displayItems.map(item => (
                  <button
                     key={item.view}
                     onClick={() => onChangeView(item.view)}
                     className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap group
                        ${currentView === item.view 
                           ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-border)]' 
                           : 'hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}
                     `}
                  >
                     <div className={`p-1.5 rounded-md ${currentView === item.view ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-secondary)] group-hover:text-[var(--color-text-main)]'}`}>
                        <item.icon size={16} />
                     </div>
                     <div className="text-left">
                        <div className="text-xs font-bold leading-none mb-0.5">{item.label}</div>
                        <div className="text-[9px] opacity-60 leading-none">{item.desc}</div>
                     </div>
                  </button>
               ))}
            </div>

         </div>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-text-main)] font-body transition-colors duration-300`}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
      </div>

      {/* IMPERSONATION BANNER */}
      {isImpersonating && (
         <div className="fixed top-0 left-0 right-0 h-14 bg-[#F97316] text-white z-[60] flex items-center justify-between px-6 shadow-md">
            <div className="flex items-center gap-3">
               <ShieldAlert size={20} className="animate-pulse"/>
               <span className="font-bold text-sm tracking-wide">TRYB SUPER ADMINA - ZARZĄDZASZ FIRMĄ: <span className="uppercase bg-black/20 px-2 py-0.5 rounded">{company?.name || '...'}</span></span>
            </div>
            <Button 
               onClick={onStopImpersonation} 
               size="sm" 
               className="bg-white text-[#F97316] hover:bg-gray-100 border-none font-bold"
            >
               Opuść Panel
            </Button>
         </div>
      )}

      {layoutMode === 'sidebar' && <Sidebar />}
      {layoutMode === 'topbar' && <Topbar />}

      <main className={`
        relative z-10 min-h-screen transition-all duration-300
        ${layoutMode === 'sidebar' ? 'lg:pl-64 pt-6' : 'pt-44'}
        ${isImpersonating ? (layoutMode === 'sidebar' ? 'mt-14' : 'pt-56') : ''}
      `}>
         {/* Mobile Toggle for Sidebar Mode */}
         {layoutMode === 'sidebar' && (
            <div className={`lg:hidden fixed top-4 left-4 z-50 ${isImpersonating ? 'top-[4.5rem]' : ''}`}>
               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 bg-[var(--color-surface)] rounded-full shadow-lg border border-[var(--color-border)] text-[var(--color-text-main)]">
                  <Menu size={24} />
               </button>
            </div>
         )}
         
         <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
            {/* --- Branch Tabs (If Applicable) --- */}
            {branches.length > 0 && onBranchChange && (
               <div className="mb-8 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {branches.map(branch => (
                     <button
                        key={branch.id}
                        onClick={() => onBranchChange(branch.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-sm shrink-0 shadow-sm
                           ${currentBranchId === branch.id 
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]' 
                              : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]'}
                        `}
                     >
                        <MapPin size={18} />
                        {branch.name}
                        <span className="text-[10px] font-mono opacity-70 ml-1">#{branch.branch_number.split('/')[1]}</span>
                     </button>
                  ))}
               </div>
            )}

            {children}
         </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Notifications Drawer */}
      {isNotificationsOpen && (
         <>
            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
            <div className={`fixed right-0 top-0 bottom-0 w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl z-50 transform transition-transform duration-300 ${isNotificationsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-background)]">
                  <h4 className="font-bold text-sm">Powiadomienia</h4>
                  <button onClick={() => setIsNotificationsOpen(false)} className="p-1 hover:bg-[var(--color-surface-highlight)] rounded"><X size={18}/></button>
               </div>
               <div className="overflow-y-auto p-2 space-y-2 h-full pb-20 custom-scrollbar">
                  {notifications.length === 0 && <div className="text-center text-xs text-[var(--color-text-secondary)] py-8">Brak powiadomień</div>}
                  {notifications.map(n => (
                     <div 
                        key={n.id} 
                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${n.isRead ? 'bg-[var(--color-background)] border-transparent opacity-60' : 'bg-[var(--color-surface-highlight)] border-[var(--color-primary)] border-opacity-30'}`}
                     >
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`}></div>
                        <div>
                           <div className="font-bold text-sm mb-1">{n.title}</div>
                           <div className="text-xs text-[var(--color-text-secondary)]">{n.message}</div>
                           <div className="text-[10px] text-[var(--color-text-secondary)] opacity-50 mt-2">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </>
      )}
    </div>
  );
};
