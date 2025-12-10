
import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/UI';
import { loginUser, registerClient, activateUser } from '../services/storageService';
import { User } from '../types';
import { toast } from 'sonner';
import { DatabaseInstructions } from './DatabaseInstructions';
import { Database, TerminalSquare, Home, ShieldCheck, LockKeyhole, User as UserIcon, ArrowLeft } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onNavigate: (view: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activationUserId, setActivationUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    client_number: '' // New field
  });

  // Check URL params for email invitation link OR activation link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registerEmail = params.get('register_email');
    const clientNumberParam = params.get('client_number');
    const activationId = params.get('activation_id');
    const emailParam = params.get('email');
    
    if (activationId) {
       // --- ACTIVATION FLOW ---
       setIsLogin(false);
       setActivationUserId(activationId);
       setFormData(prev => ({ ...prev, email: emailParam || '' }));
       toast.info('Wypełnij dane, aby aktywować swoje konto pracownicze.');
    } else if (registerEmail) {
       // --- REGISTRATION FLOW ---
       setIsLogin(false); 
       setFormData(prev => ({ 
          ...prev, 
          email: registerEmail,
          client_number: clientNumberParam || ''
       }));
       if (clientNumberParam) {
          toast.success(`Zaproszenie przyjęte! Twój numer klienta to: ${clientNumberParam}`);
       } else {
          toast.info('Wypełnij pozostałe dane, aby utworzyć konto.');
       }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const user = await loginUser(formData.login, formData.password);
        
        if (user) {
          // Admin Mode Validation
          if (isAdminMode && user.role !== 'super_admin') {
             toast.error('To konto nie posiada uprawnień Super Admina.');
             setLoading(false);
             return;
          }

          if (rememberMe) {
             localStorage.setItem('urneo_remember_token', user.id);
          }
          toast.success(`Witaj ponownie, ${user.first_name}!`);
          onLogin(user);
        } else {
          toast.error('Nieprawidłowy login lub hasło.');
        }
      } else {
        // Validation
        if (!formData.password || !formData.first_name || !formData.last_name) {
          toast.warning('Wypełnij wymagane pola (Imię, Nazwisko, Hasło).');
          setLoading(false);
          return;
        }

        if (activationUserId) {
           // --- ACTIVATION SUBMIT ---
           const activatedUser = await activateUser(activationUserId, {
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone,
              password: formData.password
           });

           if (activatedUser) {
              toast.success('Konto aktywowane! Możesz się teraz zalogować.');
              // Auto login or switch to login
              onLogin(activatedUser);
           } else {
              toast.error('Błąd aktywacji konta.');
           }

        } else {
           // --- REGISTRATION SUBMIT ---
           if (!formData.email) {
              toast.warning('Email jest wymagany.');
              setLoading(false);
              return;
           }
           const newUser = await registerClient(formData);
           if (newUser) {
              toast.success('Konto zostało utworzone.');
              onLogin(newUser);
           } else {
              toast.error('Błąd rejestracji. Email może być zajęty.');
           }
        }
      }
    } catch (e: any) {
       if (e.message === 'RLS_ERROR') {
          toast.error('Błąd uprawnień bazy danych (RLS). Kliknij ikonę instrukcji SQL i uruchom skrypt.', { duration: 8000 });
          return;
       }
       console.error(e);
       toast.error('Wystąpił błąd komunikacji z bazą danych.');
    } finally {
       setLoading(false);
    }
  };

  const toggleAdminMode = () => {
     setIsAdminMode(!isAdminMode);
     setIsLogin(true); // Always login for admin
     setFormData({ ...formData, login: '', password: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse-slow delay-75"></div>

      {/* Return to Landing Page Button */}
      <button 
         onClick={() => onNavigate('landing')}
         className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-[var(--color-text-main)] transition-all z-20"
      >
         <Home size={18} /> <span className="text-sm font-bold">Strona Główna</span>
      </button>

      <Card className={`w-full max-w-md z-10 backdrop-blur-3xl bg-opacity-60 border-opacity-20 shadow-2xl relative transition-all duration-500 ${isAdminMode ? 'border-[#F97316] ring-1 ring-[#F97316]' : ''}`}>
        {/* SQL Help Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
           <button 
              onClick={() => setShowSql(true)} 
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
              title="Instrukcja bazy danych"
           >
              <Database size={20}/>
           </button>
        </div>

        <div className="text-center mb-8">
           {isAdminMode ? (
              <div className="flex flex-col items-center animate-fade-in">
                 <div className="w-12 h-12 bg-[#F97316] rounded-xl flex items-center justify-center text-white mb-3 shadow-lg">
                    <ShieldCheck size={24}/>
                 </div>
                 <h1 className="text-2xl font-bold tracking-tight mb-1 text-[#F97316]">Panel Administratora</h1>
                 <p className="text-[var(--color-text-secondary)] text-sm">Wymagane uprawnienia Super Admin</p>
              </div>
           ) : (
              <>
                 <h1 className="text-3xl font-bold tracking-tight mb-2">URNEO</h1>
                 <p className="text-[var(--color-text-secondary)]">
                    {isLogin ? 'Zaloguj się do systemu' : (activationUserId ? 'Aktywacja Konta' : 'Dołącz do nas')}
                 </p>
              </>
           )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <>
              <Input label="Login / Email" name="login" value={formData.login} onChange={handleChange} placeholder={isAdminMode ? 'Login administratora' : 'np. jogi'} autoFocus />
              <Input label="Hasło" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
              
              <div className="flex items-center gap-2 mt-2">
                 <input 
                    type="checkbox" 
                    id="rememberMe" 
                    checked={rememberMe} 
                    onChange={e => setRememberMe(e.target.checked)}
                    className="accent-[var(--color-primary)] w-4 h-4"
                 />
                 <label htmlFor="rememberMe" className="text-sm text-[var(--color-text-secondary)] cursor-pointer">Zapamiętaj mnie</label>
              </div>
            </>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
               {activationUserId && <div className="text-xs text-[var(--color-primary)] font-bold text-center mb-2">Uzupełnij swoje dane, aby dokończyć konfigurację.</div>}
               
               <div className="grid grid-cols-2 gap-4">
                 <Input label="Imię (Wymagane)" name="first_name" value={formData.first_name} onChange={handleChange} required />
                 <Input label="Nazwisko (Wymagane)" name="last_name" value={formData.last_name} onChange={handleChange} required />
               </div>
               
               <Input 
                  label="Email" 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  disabled={!!activationUserId || !!formData.client_number} // Readonly if passed via URL
                  className={activationUserId || formData.client_number ? 'opacity-70 cursor-not-allowed' : ''}
               />

               {/* Reserved Client Number Display */}
               {formData.client_number && (
                  <div className="bg-[var(--color-surface-highlight)] p-2 rounded border border-[var(--color-primary)] text-center">
                     <div className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Twój Numer Klienta</div>
                     <div className="font-mono text-xl font-bold text-[var(--color-primary)] tracking-widest">{formData.client_number}</div>
                  </div>
               )}
               
               <Input label="Hasło (Wymagane)" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Utwórz hasło" />
               <Input label="Telefon" name="phone" value={formData.phone} onChange={handleChange} />
               
               {!activationUserId && (
                  <>
                     <Input label="Ulica i nr" name="address" value={formData.address} onChange={handleChange} />
                     <Input label="Miasto" name="city" value={formData.city} onChange={handleChange} />
                  </>
               )}
            </div>
          )}

          <Button 
             type="submit" 
             className={`w-full mt-4 ${isAdminMode ? 'bg-[#F97316] hover:bg-[#EA580C]' : ''}`} 
             size="lg" 
             disabled={loading}
          >
            {loading ? 'Przetwarzanie...' : (isLogin ? (isAdminMode ? 'Zaloguj do Panelu' : 'Zaloguj się') : (activationUserId ? 'Aktywuj i Zaloguj' : 'Zarejestruj się'))}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          {!isAdminMode && (
             <p className="text-sm text-[var(--color-text-secondary)]">
               {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}
               <button 
                 onClick={() => { setIsLogin(!isLogin); setActivationUserId(null); }}
                 className="ml-2 text-[var(--color-primary)] font-bold hover:underline"
               >
                 {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
               </button>
             </p>
          )}
          
          <div className="pt-6 border-t border-[var(--color-border)]">
             {isAdminMode ? (
                <button 
                   onClick={toggleAdminMode}
                   className="flex items-center justify-center gap-2 w-full py-2 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] transition-colors"
                >
                   <ArrowLeft size={16} /> Wróć do logowania użytkownika
                </button>
             ) : (
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={toggleAdminMode}
                     className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-highlight)] hover:border-[#F97316] hover:text-[#F97316] transition-all text-sm font-bold text-[var(--color-text-secondary)] group"
                     disabled={loading}
                   >
                     <ShieldCheck size={16} className="group-hover:text-[#F97316] transition-colors" />
                     Panel Super Admina
                   </button>
                   
                   <div className="flex justify-center">
                       <button 
                           onClick={() => setShowSql(true)}
                           className="text-[10px] flex items-center gap-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors opacity-70 hover:opacity-100"
                       >
                           <TerminalSquare size={12} />
                           Reset Bazy Danych
                       </button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </Card>

      {showSql && <DatabaseInstructions onClose={() => setShowSql(false)} />}
    </div>
  );
};
