
import React, { useState, useEffect } from 'react';
import { User, Branch, Notification, Company } from '../types';
import { Button } from './UI';
import { getCompanyById, getNotifications, markNotificationAsRead } from '../services/storageService';
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
  Search,
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
  Clock,
  CheckCircle,
  XCircle,
  Info
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
  onBranchChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const layoutMode = user.preferences.layoutMode;

  useEffect(() => {
     if(user) {
        // Simple polling simulation or just load on mount/interaction
        loadNotifications();
        // Set interval to refresh notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
     }
  }, [user]);

  useEffect(() => {
    if (user.companyId) {
      getCompanyById(user.companyId).then(c => setCompany(c || null));
    }
  }, [user.companyId]);

  const loadNotifications = async () => {
     const notifs = await getNotifications(user.id);
     // Sort by new
     setNotifications(notifs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  const handleMarkAsRead = (id: string) => {
     markNotificationAsRead(id);
     loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NavItem: React.FC<{ icon: any, label: string, view: string }> = ({ icon: Icon, label, view }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`group flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 w-full text-left relative overflow-hidden
        ${currentView === view 
          ? 'bg-[var(--color-surface)] text-[var(--color-primary)] font-bold shadow-sm' 
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface)]'}
      `}
    >
      <div className={`relative z-10 transition-transform duration-300 ${currentView === view ? 'scale-110' : 'group-hover:scale-110'}`}>
         <Icon size={22} strokeWidth={currentView === view ? 2.5 : 2} />
      </div>
      <span className="relative z-10">{label}</span>
      {currentView === view && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-accent)] rounded-r-full"></div>
      )}
    </button>
  );

  let menuItems = [];

  if (user.role === 'super_admin') {
    menuItems = [
      { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
      { icon: Users, label: 'Użytkownicy', view: 'users' },
      { icon: Factory, label: 'Producenci', view: 'manufacturers' },
      { icon: Palette, label: 'Motywy', view: 'themes' },
    ];
  } else {
    // Client Menu - "Panel Klienta" is now in Profile Dropdown only
    menuItems = []; 
  }

  // Common Company Items if linked to company
  let companyItems: {icon: any, label: string, view: string}[] = [];
  
  if (user.companyId) {
    companyItems = [
      // Removed 'Panel Firmowy' as requested, it is in Profile Dropdown
      { icon: Briefcase, label: 'Pracownicy', view: 'company-users' },
    ];

    // Add Funeral Module if package is 'funerals' or 'full'
    if (company && (company.package_type === 'funerals' || company.package_type === 'full')) {
       companyItems.push({ icon: Cross, label: 'Pogrzeby', view: 'funerals' });
    }

    // Check for Cremation/Full package for Settings & Cremations Module
    if (company && (company.package_type === 'cremation' || company.package_type === 'full')) {
       // Add Operational View
       companyItems.push({ icon: Flame, label: 'Kremacje', view: 'cremations' });
    }

    // Settings for both modules
    if (company && (company.package_type === 'cremation' || company.package_type === 'funerals' || company.package_type === 'full')) {
       companyItems.push({ icon: Settings, label: 'Ustawienia', view: 'settings' });
    }
  }


  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-80 bg-[var(--color-sidebar)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} border-r border-[var(--color-border)]
    `}>
      <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
        {/* LOGO AREA */}
        <div className="mb-12 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1rem] bg-[var(--color-primary)] flex items-center justify-center shadow-lg text-[var(--color-primary-foreground)]">
            <span className="font-sans font-bold text-2xl">U</span>
          </div>
          <div>
             <h1 className="text-2xl font-sans font-bold text-[var(--color-text-main)] leading-none tracking-tight">Urneo</h1>
             <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mt-1">System 2035</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map(item => <NavItem key={item.view} {...item} />)}
          
          {companyItems.length > 0 && (
            <>
              <div className="my-4 pt-4 border-t border-[var(--color-border)] px-6">
                <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Strefa Firmy</span>
              </div>
              {companyItems.map(item => <NavItem key={item.view} {...item} />)}
            </>
          )}
        </nav>

        {/* BOTTOM USER AREA */}
        <div className="pt-6 mt-6 border-t border-[var(--color-border)] space-y-4">
           
           {/* Profile Dropdown & User Card */}
           <div className="relative">
              {isProfileMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)}></div>
                   <div className="absolute bottom-full left-0 mb-3 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow)] z-40 overflow-hidden animate-fade-in">
                      <div className="p-4 border-b border-[var(--color-border)]">
                         <p className="font-bold text-sm truncate">{user.first_name} {user.last_name}</p>
                         <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                         <button onClick={() => { onChangeView('client-dashboard'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm rounded-[var(--radius-button)] hover:bg-[var(--color-secondary)] flex items-center gap-2">
                            <LayoutIcon size={16} /> Panel Klienta
                         </button>
                         <button onClick={() => { onChangeView('store'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm rounded-[var(--radius-button)] hover:bg-[var(--color-secondary)] flex items-center gap-2">
                            <ShoppingBag size={16} /> Urneo Store
                         </button>
                         {user.companyId && (
                           <button onClick={() => { onChangeView('company-panel'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm rounded-[var(--radius-button)] hover:bg-[var(--color-secondary)] flex items-center gap-2">
                              <Building2 size={16} /> Panel Firmowy
                           </button>
                         )}
                      </div>
                   </div>
                 </>
               )}

               <div 
                  className="flex items-center gap-3 p-3 rounded-[1.5rem] hover:bg-[var(--color-surface)] transition-colors cursor-pointer group"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
               >
                  <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)] overflow-hidden flex items-center justify-center font-bold text-[var(--color-text-secondary)]">
                     {user.first_name[0]}{user.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold truncate">{user.first_name} {user.last_name}</p>
                     <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.companyId ? 'Firma' : 'Klient'}</p>
                  </div>
                  <ChevronDown size={16} className={`text-[var(--color-text-secondary)] transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
               </div>
           </div>
           
           {/* Controls Row: Theme, Layout, Notifications, Logout */}
           <div className="flex items-center justify-between px-2">
             <div className="flex gap-2">
                <button onClick={toggleThemeMode} className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors">
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={toggleLayout} className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors">
                  {layoutMode === 'sidebar' ? <PanelTop size={18} /> : <PanelLeft size={18} />}
                </button>
             </div>

             <div className="flex gap-2">
                {/* Notifications in Sidebar */}
                <div className="relative">
                   {isNotificationsOpen && (
                      <>
                         <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)}></div>
                         <div className="absolute bottom-full left-[-160px] md:left-auto md:right-[-50px] mb-3 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow)] z-40 overflow-hidden animate-fade-in flex flex-col max-h-96">
                            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                               <h4 className="font-bold text-sm">Powiadomienia</h4>
                               {unreadCount > 0 && <span className="text-[10px] bg-[var(--color-danger)] text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
                            </div>
                            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                               {notifications.length === 0 && <div className="text-center text-xs text-[var(--color-text-secondary)] py-4">Brak powiadomień</div>}
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
                   <button 
                     onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); loadNotifications(); }}
                     className="p-2 rounded-full hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-colors relative"
                   >
                      <Bell size={18} />
                      {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-danger)] rounded-full animate-pulse"></span>}
                   </button>
                </div>

                <button onClick={onLogout} className="p-2 rounded-full hover:bg-[var(--color-danger)] hover:text-white text-[var(--color-text-secondary)] transition-colors" title="Wyloguj">
                   <LogOut size={18} />
                </button>
             </div>
           </div>
        </div>
      </div>
    </aside>
  );

  const Topbar = () => (
    <header className="fixed top-0 left-0 right-0 z-40 h-24 bg-[var(--color-background)]/80 backdrop-blur-md px-6 lg:px-12 flex items-center justify-between border-b border-[var(--color-border)]">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-[0.8rem] bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)]">
            <span className="font-sans font-bold text-xl">U</span>
          </div>
          <div className="hidden md:block">
             <h1 className="text-xl font-sans font-bold text-[var(--color-text-main)] leading-none">Urneo</h1>
             <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">System 2035</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1 bg-[var(--color-surface)] p-1 rounded-full shadow-sm border border-[var(--color-border)]">
          {menuItems.map(item => (
             <button
             key={item.view}
             onClick={() => onChangeView(item.view)}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
               ${currentView === item.view 
                 ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm' 
                 : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}
             `}
           >
             {item.label}
           </button>
          ))}
          {/* Company Items in Topbar */}
          {companyItems.map(item => (
             <button
             key={item.view}
             onClick={() => onChangeView(item.view)}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
               ${currentView === item.view 
                 ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm' 
                 : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]'}
             `}
           >
             {item.label}
           </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative">
             <div 
               onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); loadNotifications(); }}
               className={`w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] transition-colors cursor-pointer relative ${isNotificationsOpen ? 'bg-[var(--color-secondary)]' : ''}`}
             >
                <Bell size={18} />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-danger)] rounded-full animate-pulse"></span>}
             </div>

             {/* Notification Dropdown */}
             {isNotificationsOpen && (
                <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                   <div className="absolute right-0 top-12 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow)] z-50 overflow-hidden animate-fade-in flex flex-col max-h-96">
                      <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                         <h4 className="font-bold text-sm">Powiadomienia</h4>
                         {unreadCount > 0 && <span className="text-[10px] bg-[var(--color-danger)] text-white px-2 py-0.5 rounded-full">{unreadCount}</span>}
                      </div>
                      <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                         {notifications.length === 0 && <div className="text-center text-xs text-[var(--color-text-secondary)] py-4">Brak powiadomień</div>}
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
          
          <div className="h-8 w-[1px] bg-[var(--color-border)] mx-2"></div>

          <button onClick={toggleLayout} className="hidden md:block p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]">
             {layoutMode === 'sidebar' ? <PanelTop size={20} /> : <PanelLeft size={20} />}
          </button>
          <button onClick={toggleThemeMode} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)]">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile Dropdown Area */}
          <div className="relative">
             <button 
                className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary-foreground)] font-bold ml-2 cursor-pointer hover:scale-105 transition-transform" 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
             >
                {user.first_name[0]}
             </button>

             {isProfileMenuOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                 <div className="absolute right-0 top-12 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow)] z-50 overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-[var(--color-border)]">
                       <p className="font-bold text-sm truncate">{user.first_name} {user.last_name}</p>
                       <p className="text-xs text-[var(--color-text-secondary)] truncate">{user.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                       <button onClick={() => { onChangeView('client-dashboard'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm rounded-[var(--radius-button)] hover:bg-[var(--color-secondary)] flex items-center gap-2">
                          <LayoutIcon size={16} /> Panel Klienta
                       </button>
                       <button onClick={() => { onChangeView('store'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm rounded-[var(--radius-button)] hover:bg-[var(--color-secondary)] flex items-center gap-2">
                          <ShoppingBag size={16} /> Urneo Store
                       </button>
                       {user.companyId && (
                         <button onClick={() => { onChangeView('company-panel'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm rounded-[var(--radius-button)] hover:bg-[var(--color-secondary)] flex items-center gap-2">
                            <Building2 size={16} /> Panel Firmowy
                         </button>
                       )}
                    </div>
                 </div>
               </>
             )}
          </div>

          <button onClick={onLogout} className="p-2 rounded-full hover:bg-[var(--color-danger)] hover:text-white text-[var(--color-text-secondary)] transition-colors ml-2" title="Wyloguj">
             <LogOut size={20} />
          </button>
      </div>
    </header>
  );

  return (
    <div className={`min-h-screen bg-[var(--color-background)] text-[var(--color-text-main)] font-body transition-colors duration-300`}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
      </div>

      {layoutMode === 'sidebar' && <Sidebar />}
      {layoutMode === 'topbar' && <Topbar />}

      <main className={`
        relative z-10 min-h-screen transition-all duration-300
        ${layoutMode === 'sidebar' ? 'lg:pl-80' : 'pt-24'}
      `}>
         {/* Mobile Toggle for Sidebar Mode */}
         {layoutMode === 'sidebar' && (
            <div className="lg:hidden fixed top-4 left-4 z-50">
               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 bg-[var(--color-surface)] rounded-full shadow-lg border border-[var(--color-border)] text-[var(--color-text-main)]">
                  <Menu size={24} />
               </button>
            </div>
         )}
         
         <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
            {/* --- Branch Tabs (If Applicable) --- */}
            {branches.length > 0 && onBranchChange && (
               <div className="mb-8 flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {/* Removed "Wszystkie Oddziały" button */}
                  
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
    </div>
  );
};
