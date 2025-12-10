
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
  ChevronUp
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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // App Menu State - Category is needed, isOpen is removed as it's always open now
  const [activeCategory, setActiveCategory] = useState<'company' | 'community' | 'admin'>('company');

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

  // --- MENU ITEMS DEFINITION ---

  const systemItems = [
      { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard', desc: 'Statystyki' },
      { icon: Users, label: 'Użytkownicy', view: 'users', desc: 'Baza kont' },
      { icon: Building2, label: 'Firmy', view: 'admin-companies', desc: 'Zarządzanie' },
      { icon: Tag, label: 'Kategorie', view: 'admin-bulletin-categories', desc: 'Giełda' },
      { icon: Factory, label: 'Producenci', view: 'manufacturers', desc: 'Baza' },
      { icon: Palette, label: 'Motywy', view: 'themes', desc: 'Wygląd' },
  ];

  let companyItems: {icon: any, label: string, view: string, desc?: string, color?: string}[] = [];
  if (user.companyId) {
    if (user.companyRole === 'owner') {
       companyItems.push({ icon: Shield, label: 'Administrator', view: 'branch-admin-panel', desc: 'Oddział' });
    }
    companyItems.push({ icon: Briefcase, label: 'Pracownicy', view: 'company-users', desc: 'Kadry' });
    if (company && (company.package_type === 'funerals' || company.package_type === 'full')) {
       companyItems.push({ icon: Cross, label: 'Pogrzeby', view: 'funerals', desc: 'Ceremonie' });
    }
    if (company && (company.package_type === 'cremation' || company.package_type === 'full')) {
       companyItems.push({ icon: Flame, label: 'Kremacje', view: 'cremations', desc: 'Piece' });
    }
    companyItems.push({ icon: Package, label: 'Magazyn', view: 'warehouse', desc: 'Stany' });
    if (company && (company.package_type === 'cremation' || company.package_type === 'funerals' || company.package_type === 'full')) {
       companyItems.push({ icon: Settings, label: 'Ustawienia', view: 'settings', desc: 'Konfiguracja' });
    }
  }

  const communityItems = [
     { icon: ShoppingBag, label: 'Giełda', view: 'bulletin-board', desc: 'Ogłoszenia' },
     { icon: ShoppingBag, label: 'Urneo Store', view: 'store', desc: 'Pakiety' },
     { icon: LayoutIcon, label: 'Panel Klienta', view: 'client-dashboard', desc: 'Start' }
  ];

  const allItems = [...systemItems, ...companyItems, ...communityItems];
  const currentItem = allItems.find(i => i.view === currentView);

  // --- COMPONENTS ---

  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-80 bg-[var(--color-sidebar)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} border-r border-[var(--color-border)]
      ${isImpersonating ? 'top-14' : ''}
      flex flex-col
    `}>
      <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
         {/* Logo Area */}
         <div className="mb-10 flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-[1rem] bg-[var(--color-primary)] flex items-center justify-center shadow-lg text-[var(--color-primary-foreground)]">
               <span className="font-sans font-bold text-xl">U</span>
             </div>
             <div>
                <h1 className="text-xl font-sans font-bold text-[var(--color-text-main)] leading-none tracking-tight">Urneo</h1>
                <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mt-1">System 2035</p>
             </div>
         </div>

         {/* Navigation */}
         <nav className="flex-1 space-y-1">
            <div className="text-[10px] font-bold uppercase text-[var(--color-text-secondary)] mb-3 px-3 tracking-wider">Menu</div>
            {[...companyItems, ...communityItems, ...systemItems].map(item => (
               <button 
                  key={item.view} 
                  onClick={() => { onChangeView(item.view); setIsMobileMenuOpen(false); }} 
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                     ${currentView === item.view 
                        ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' 
                        : 'hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}
                  `}
               >
                  <item.icon size={18} className={currentView === item.view ? 'text-[var(--color-primary)]' : 'opacity-70'} /> 
                  {item.label}
               </button>
            ))}
         </nav>

         {/* Bottom User Area (Restored) */}
         <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            
            {/* User Profile Info */}
            <div className="bg-[var(--color-surface)] bg-opacity-50 rounded-xl p-2 mb-3">
               <div 
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-[var(--color-surface)] transition-colors group"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
               >
                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold text-sm">
                     {user.first_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="font-bold text-sm truncate leading-tight">{user.first_name} {user.last_name}</div>
                     <div className="text-[10px] text-[var(--color-text-secondary)] truncate">{user.email}</div>
                  </div>
                  {isProfileMenuOpen ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
               </div>

               {/* Collapsible Profile Menu */}
               {isProfileMenuOpen && (
                  <div className="mt-2 space-y-1 px-1 animate-fade-in">
                     <button onClick={() => { onChangeView('client-dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] flex items-center gap-2">
                        <LayoutIcon size={12}/> Panel Klienta
                     </button>
                     {user.companyId && (
                        <button onClick={() => { onChangeView('company-panel'); setIsMobileMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] flex items-center gap-2">
                           <Building2 size={12}/> Firma
                        </button>
                     )}
                  </div>
               )}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-4 gap-2">
               <button 
                  onClick={toggleThemeMode} 
                  className="flex items-center justify-center h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                  title="Przełącz motyw"
               >
                  {isDarkMode ? <Sun size={18}/> : <Moon size={18}/>}
               </button>
               
               <button 
                  onClick={toggleLayout} 
                  className="flex items-center justify-center h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                  title="Zmień układ na górny"
               >
                  <PanelTop size={18}/>
               </button>

               <button 
                  onClick={() => { setIsNotificationsOpen(true); setIsMobileMenuOpen(false); }} 
                  className="flex items-center justify-center h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all relative"
                  title="Powiadomienia"
               >
                  <Bell size={18}/>
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
               </button>

               <button 
                  onClick={onLogout} 
                  className="flex items-center justify-center h-10 rounded-xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="Wyloguj"
               >
                  <LogOut size={18}/>
               </button>
            </div>
         </div>
      </div>
    </aside>
  );

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
            
            {/* Category Selector (Pills) */}
            <div className="flex gap-2 pr-6 border-r border-[var(--color-border)] h-10 items-center shrink-0">
               {user.role === 'super_admin' && (
                  <button 
                     onClick={() => setActiveCategory('admin')}
                     className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === 'admin' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-surface)] hover:bg-[var(--color-secondary)]'}`}
                  >
                     Admin
                  </button>
               )}
               {user.companyId && (
                  <button 
                     onClick={() => setActiveCategory('company')}
                     className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === 'company' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-surface)] hover:bg-[var(--color-secondary)]'}`}
                  >
                     Firma
                  </button>
               )}
               <button 
                  onClick={() => setActiveCategory('community')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === 'community' ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'bg-[var(--color-surface)] hover:bg-[var(--color-secondary)]'}`}
               >
                  Społeczność
               </button>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-2 h-full">
               {(activeCategory === 'company' ? companyItems : activeCategory === 'community' ? communityItems : systemItems).map(item => (
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
        ${layoutMode === 'sidebar' ? 'lg:pl-80 pt-6' : 'pt-44'}
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
