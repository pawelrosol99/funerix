
import React, { useState, useEffect } from 'react';
import { Card, Input, Button } from '../components/UI';
import { loginUser, registerClient, activateUser } from '../services/storageService';
import { User } from '../types';
import { toast } from 'sonner';
import { DatabaseInstructions } from './DatabaseInstructions';
import { Database, TerminalSquare, Home, ShieldCheck, LockKeyhole } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  onNavigate: (view: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
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
    city: ''
  });

  // Check URL params for email invitation link OR activation link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registerEmail = params.get('register_email');
    const activationId = params.get('activation_id');
    const emailParam = params.get('email');
    
    if (activationId) {
       // --- ACTIVATION FLOW ---
       setIsLogin(false);
       setActivationUserId(activationId);
       setFormData(prev => ({ ...prev, email: emailParam || '' }));
       toast.info('Wypełnij dane, aby aktywować swoje konto pracownicze.');
    } else if (registerEmail) {
       // --- OLD REGISTRATION FLOW (Fallback) ---
       setIsLogin(false); 
       setFormData(prev => ({ ...prev, email: registerEmail }));
       toast.info('Wypełnij pozostałe dane, aby utworzyć konto.');
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

  const quickLoginAdmin = async () => {
    setLoading(true);
    try {
      // Hardcoded check for demo purposes, usually handled by form
      const user = await loginUser('jogi', 'jogi123');
      if (user) {
         toast.success('Zalogowano jako Super Admin');
         onLogin(user);
      } else {
         toast.error('Konto admina (jogi) nie istnieje w bazie. Uruchom skrypt SQL.');
      }
    } catch (e: any) {
       if (e.message === 'RLS_ERROR') {
          toast.error('Błąd uprawnień (RLS). Musisz uruchomić skrypt SQL z instrukcji.', { duration: 8000 });
       }
    }
    setLoading(false);
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

      <Card className="w-full max-w-md z-10 backdrop-blur-3xl bg-opacity-60 border-opacity-20 shadow-2xl relative">
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
           <h1 className="text-3xl font-bold tracking-tight mb-2">URNEO</h1>
           <p className="text-[var(--color-text-secondary)]">
              {isLogin ? 'Zaloguj się do systemu' : (activationUserId ? 'Aktywacja Konta' : 'Dołącz do nas')}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            <>
              <Input label="Login / Email" name="login" value={formData.login} onChange={handleChange} placeholder="np. jogi" />
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
               
               {/* Email is read-only in activation mode usually, but allow edit in normal register */}
               <Input 
                  label="Email" 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  disabled={!!activationUserId} // Lock email during activation
                  className={activationUserId ? 'opacity-70 cursor-not-allowed' : ''}
               />
               
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

          <Button type="submit" className="w-full mt-4" size="lg" disabled={loading}>
            {loading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : (activationUserId ? 'Aktywuj i Zaloguj' : 'Zarejestruj się'))}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {isLogin ? 'Nie masz konta?' : 'Masz już konto?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setActivationUserId(null); }}
              className="ml-2 text-[var(--color-primary)] font-bold hover:underline"
            >
              {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </p>
          
          {isLogin && (
            <div className="pt-6 border-t border-[var(--color-border)]">
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={quickLoginAdmin}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-highlight)] hover:border-[var(--color-primary)] transition-all text-sm font-bold text-[var(--color-text-main)] group"
                    disabled={loading}
                  >
                    <ShieldCheck size={16} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
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
            </div>
          )}
        </div>
      </Card>

      {showSql && <DatabaseInstructions onClose={() => setShowSql(false)} />}
    </div>
  );
};
