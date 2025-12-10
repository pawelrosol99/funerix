
import React, { useState, useEffect, useCallback } from 'react';
import { initializeDatabase, getCurrentSession, logoutUser, getCompanyBranches } from './services/storageService';
import { User, Theme, Branch } from './types';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { LandingPage } from './views/LandingPage';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminUsers } from './views/AdminUsers';
import { AdminCompanies } from './views/AdminCompanies'; 
import { AdminThemes } from './views/AdminThemes';
import { AdminManufacturers } from './views/AdminManufacturers';
import { AdminBulletinCategories } from './views/AdminBulletinCategories'; // NEW IMPORT
import { BulletinBoard } from './views/BulletinBoard'; // NEW IMPORT
import { ClientPanel } from './views/ClientPanel';
import { ClientUrneoStore } from './views/ClientUrneoStore';
import { CompanyPanel } from './views/CompanyPanel';
import { CompanyUsers } from './views/CompanyUsers';
import { Settings } from './views/Settings';
import { Cremations } from './views/Cremations';
import { Funerals } from './views/Funerals';
import { Warehouse } from './components/Warehouse';
import { BranchAdminPanel } from './views/BranchAdminPanel'; 
import { DEFAULT_THEME_CSS } from './constants';
import { Toaster, toast } from 'sonner';
import { Button, Card } from './components/UI';
import { ArrowLeft, Construction } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('landing'); // Default to landing
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME_CSS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Branch Management State
  const [companyBranches, setCompanyBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | 'all'>('all');

  // Initialize App
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      const sessionUser = await getCurrentSession();
      if (sessionUser) {
        setCurrentUser(sessionUser);
        // Direct Super Admin to dashboard immediately
        if (sessionUser.role === 'super_admin') {
           setCurrentView('dashboard');
        } else {
           setCurrentView('client-dashboard');
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Fetch branches when user or company changes
  const refreshBranches = useCallback(async () => {
    if (currentUser && currentUser.companyId) {
      const branches = await getCompanyBranches(currentUser.companyId);
      setCompanyBranches(branches);
      
      // Auto-select first branch if available and current selection is invalid or 'all'
      if (branches.length > 0) {
         if (currentBranchId === 'all' || !branches.find(b => b.id === currentBranchId)) {
            setCurrentBranchId(branches[0].id);
         }
      } else {
         setCurrentBranchId('all');
      }
    } else {
      setCompanyBranches([]);
    }
  }, [currentUser, currentBranchId]);

  useEffect(() => {
    refreshBranches();
  }, [currentUser]); // Simplified ref to avoid loop

  // Inject CSS Variables
  useEffect(() => {
    const lightVars = Object.entries(theme.cssVars.light).map(([key, val]) => `${key}: ${val};`).join(' ');
    const darkVars = Object.entries(theme.cssVars.dark).map(([key, val]) => `${key}: ${val};`).join(' ');

    const cssString = `
      :root {
        ${lightVars}
        --radius-sm: calc(var(--radius) - 4px);
        --radius-md: calc(var(--radius) - 2px);
        --radius-lg: var(--radius);
        --radius-xl: calc(var(--radius) + 4px);
      }
      .dark {
        ${darkVars}
      }
      :root {
        --color-background: var(--background);
        --color-surface: var(--card);
        --color-surface-highlight: var(--muted);
        --color-primary: var(--primary);
        --color-primary-foreground: var(--primary-foreground);
        --color-secondary: var(--secondary);
        --color-text-main: var(--foreground);
        --color-text-secondary: var(--muted-foreground);
        --color-accent: var(--accent);
        --color-accent-foreground: var(--accent-foreground);
        --color-success: var(--chart-2);
        --color-danger: var(--destructive);
        --color-border: var(--border);
        --color-input: var(--input);
        --color-chart-1: var(--chart-1);
        --color-chart-2: var(--chart-2);
        --color-chart-4: var(--chart-4);
        --color-sidebar: var(--sidebar);
        --radius-card: var(--radius-lg);
        --radius-button: var(--radius-md);
        --radius-input: var(--radius-md);
        --shadow: var(--shadow);
        --shadow-sm: var(--shadow-sm);
        font-family: var(--font-sans);
      }
    `;

    let styleTag = document.getElementById('lively-theme-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'lively-theme-styles';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = cssString;

    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

  }, [theme, isDarkMode]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'super_admin') {
      setCurrentView('dashboard');
    } else if (user.role === 'client' && user.companyId) {
      setCurrentView('company-panel');
    } else {
      setCurrentView('client-dashboard');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCompanyBranches([]);
    setCurrentView('landing'); // Return to landing on logout
  };

  const handleToggleLayout = () => {
    if (!currentUser) return;
    const newLayout: 'sidebar' | 'topbar' = currentUser.preferences.layoutMode === 'sidebar' ? 'topbar' : 'sidebar';
    const updatedUser: User = { 
       ...currentUser, 
       preferences: { 
          ...currentUser.preferences, 
          layoutMode: newLayout 
       } 
    };
    setCurrentUser(updatedUser);
  };

  const handleCompanyCreated = () => {
    if (currentUser) {
       setCurrentView('company-panel');
    }
  };

  // SUPER ADMIN ACTION: Enter Company Context
  const handleAdminEnterCompany = (companyId: string, branchId?: string) => {
     if (currentUser?.role !== 'super_admin') return;
     
     // Temporarily patch the current user object to "be" in that company
     const impostorUser: User = {
        ...currentUser,
        companyId: companyId,
        companyRole: 'owner', // Grant full access within company
        branchId: branchId
     };
     setCurrentUser(impostorUser);
     if (branchId) setCurrentBranchId(branchId);
     else setCurrentBranchId('all');
     
     setCurrentView('company-panel');
     toast.success('Przełączono kontekst na wybraną firmę');
  };

  // SUPER ADMIN ACTION: Leave Company Context
  const handleStopImpersonation = () => {
     if (currentUser?.role === 'super_admin' && currentUser.companyId) {
        // Reset to pure admin state
        const adminUser: User = {
           ...currentUser,
           companyId: undefined,
           branchId: undefined,
           companyRole: undefined
        };
        setCurrentUser(adminUser);
        setCompanyBranches([]);
        setCurrentView('admin-companies'); // Return to companies list
        toast.info('Powrócono do panelu Super Admina');
     }
  };

  if (isLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">Ładowanie Urneo...</div>;
  }

  // --- PUBLIC ROUTING ---
  // If not logged in, only allow Landing and Auth and Bulletin
  if (!currentUser) {
    if (currentView === 'bulletin-board') {
       return <BulletinBoard user={null} onNavigate={setCurrentView} />;
    }
    if (currentView === 'landing') {
       return <LandingPage onNavigate={setCurrentView} />;
    }
    return (
      <>
        <Auth onLogin={handleLogin} onNavigate={setCurrentView} />
        <Toaster position="top-center" theme={isDarkMode ? 'dark' : 'light'} />
      </>
    );
  }

  // --- PROTECTED ROUTING ---
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <AdminDashboard />;
      case 'users': return <AdminUsers />;
      case 'admin-companies': return <AdminCompanies onEnterCompany={handleAdminEnterCompany} />;
      case 'manufacturers': return <AdminManufacturers />;
      case 'themes': return <AdminThemes currentTheme={theme} onThemeUpdate={setTheme} setGlobalDarkMode={setIsDarkMode} />;
      case 'admin-bulletin-categories': return <AdminBulletinCategories />; // Admin view for categories
      
      case 'client-dashboard': return <ClientPanel user={currentUser} onUpdateUser={setCurrentUser} />;
      case 'store': return <ClientUrneoStore user={currentUser} onCompanyCreated={handleCompanyCreated} />;
      case 'company-panel': return <CompanyPanel user={currentUser} onBranchesChange={refreshBranches} />;
      case 'company-users': return <CompanyUsers user={currentUser} currentBranchId={currentBranchId} />;
      case 'settings': return <Settings user={currentUser} currentBranchId={currentBranchId} />;
      case 'cremations': return <Cremations user={currentUser} currentBranchId={currentBranchId} />;
      case 'funerals': return <Funerals user={currentUser} currentBranchId={currentBranchId} />;
      case 'branch-admin-panel': return <BranchAdminPanel user={currentUser} currentBranchId={currentBranchId} />;
      case 'warehouse': return (
         <div className="h-[calc(100vh-140px)]">
            <h2 className="text-3xl font-bold mb-6">Magazyn Główny</h2>
            <Warehouse companyId={currentUser.companyId!} currentBranchId={currentBranchId} />
         </div>
      );
      // Protected access to Bulletin Board
      case 'bulletin-board': return <BulletinBoard user={currentUser} onNavigate={setCurrentView} />;
      
      default: return <div className="text-center p-10">Widok nieznany</div>;
    }
  };

  return (
    <>
      <Layout 
        user={currentUser} 
        onLogout={handleLogout}
        toggleLayout={handleToggleLayout}
        currentView={currentView}
        onChangeView={setCurrentView}
        toggleThemeMode={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        branches={companyBranches}
        currentBranchId={currentBranchId}
        onBranchChange={setCurrentBranchId}
        onStopImpersonation={handleStopImpersonation}
      >
        {renderView()}
      </Layout>
      <Toaster 
        position="top-right"
        theme={isDarkMode ? 'dark' : 'light'}
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-main)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-body)',
            borderRadius: 'var(--radius-button)',
            boxShadow: 'var(--shadow)',
          },
          className: 'urneo-toast'
        }}
      />
    </>
  );
};

export default App;
