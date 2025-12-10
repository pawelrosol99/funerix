
import React from 'react';
import { Button, Badge } from '../components/UI';
import { 
  ArrowRight, LayoutDashboard, ShieldCheck, 
  Globe, Clock, CheckCircle2,
  Flame, Bell, Menu, User,
  Calendar, Layers, Check, Briefcase, Coins, ShoppingBag
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  
  // --- REAL APP MOCKUPS ---

  // 1. Dashboard Mockup (Reflects AdminDashboard.tsx)
  const DashboardMockup = ({ className = "" }: { className?: string }) => (
    <div className={`relative w-full bg-[#F5F4ED] rounded-xl overflow-hidden border border-[#E5E0D5] shadow-2xl flex flex-col aspect-[16/10] ${className || "max-w-2xl"}`}>
       {/* Topbar */}
       <div className="h-12 border-b border-[#E5E0D5] bg-[#F5F4ED]/80 backdrop-blur flex items-center justify-between px-4">
          <div className="flex gap-2">
             <div className="w-8 h-8 bg-[#32FFDC] rounded-lg flex items-center justify-center font-bold text-[#232B32]">U</div>
             <div className="hidden md:block">
                <div className="text-xs font-bold text-[#493C31]">Urneo</div>
                <div className="text-[8px] uppercase tracking-wider text-[#84705B]">System 2035</div>
             </div>
          </div>
          <div className="flex gap-2">
             <div className="w-8 h-8 rounded-full bg-white border border-[#E5E0D5] flex items-center justify-center"><Bell size={14} className="text-[#493C31]"/></div>
             <div className="w-8 h-8 rounded-full bg-[#32FFDC] flex items-center justify-center font-bold text-[#232B32]">A</div>
          </div>
       </div>
       
       <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-16 md:w-48 bg-[#F5F4ED] border-r border-[#E5E0D5] p-3 flex flex-col gap-2">
             <div className="h-8 w-full bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E5E0D5] flex items-center px-3 text-xs font-bold text-[#493C31] gap-2">
                <LayoutDashboard size={14}/> <span className="hidden md:inline">Dashboard</span>
             </div>
             <div className="h-8 w-full opacity-50 flex items-center px-3 text-xs font-bold text-[#493C31] gap-2">
                <User size={14}/> <span className="hidden md:inline">Pracownicy</span>
             </div>
          </div>

          {/* Content Area - AdminDashboard.tsx replica */}
          <div className="flex-1 p-4 md:p-6 bg-[#FFFFFF] overflow-hidden flex flex-col gap-4">
             {/* Big Time Card */}
             <div className="bg-[#32FFDC] rounded-[1.5rem] p-6 text-[#232B32] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Czas Lokalny</div>
                <div className="text-4xl md:text-5xl font-light tracking-tighter">14:30</div>
                <div className="text-sm font-medium opacity-80 mt-1">Poniedziałek, 24 Listopada</div>
             </div>

             {/* Team Status */}
             <div className="flex gap-4 overflow-hidden">
                <div className="flex-1 bg-[#F5F4ED] p-4 rounded-[1.2rem] border border-[#E5E0D5]">
                   <div className="text-xs font-bold text-[#493C31] mb-3">Status Zespołu</div>
                   <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-[#E5E0D5]"></div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-[#FDD792]"></div>
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-[#32FFDC] flex items-center justify-center text-[10px] font-bold">+2</div>
                   </div>
                </div>
                <div className="flex-1 bg-[#F5F4ED] p-4 rounded-[1.2rem] border border-[#E5E0D5]">
                   <div className="text-xs font-bold text-[#493C31] mb-3">Wnioski</div>
                   <div className="text-xl font-bold text-[#493C31]">3 <span className="text-xs font-normal text-[#84705B]">nowe</span></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  // 2. Mobile Employee Mockup (Reflects ClientPanel.tsx)
  const MobileEmployeeMockup = () => (
    <div className="relative w-[280px] h-[560px] bg-[#232B32] rounded-[3rem] border-[8px] border-[#3b4650] shadow-2xl overflow-hidden mx-auto">
       <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-[#3b4650] rounded-b-xl z-20"></div>
       
       <div className="h-full w-full bg-[#F5F4ED] flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="pt-12 px-6 pb-4 bg-white border-b border-[#E5E0D5]">
             <div className="flex justify-between items-center">
                <div>
                   <div className="text-xs text-[#84705B]">Witaj,</div>
                   <div className="font-bold text-lg text-[#493C31]">Kowalski Jan</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#E5E0D5] flex items-center justify-center font-bold text-[#493C31]">JK</div>
             </div>
          </div>

          {/* RCP Card */}
          <div className="p-4 space-y-4">
             <div className="bg-gradient-to-br from-[#32FFDC] to-[#20E6C5] p-6 rounded-[1.5rem] shadow-lg text-[#232B32] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2 mb-4">
                   <Clock size={18}/> <span className="font-bold text-sm">Czas Pracy</span>
                </div>
                <div className="text-center py-2">
                   <div className="text-4xl font-mono font-bold tracking-tighter">04:12</div>
                   <div className="text-[10px] opacity-70 uppercase tracking-widest mt-1">Trwa sesja</div>
                </div>
                <button className="w-full mt-4 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold shadow-sm text-sm">
                   Zakończ Pracę
                </button>
             </div>

             {/* Stats */}
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-[#E5E0D5]">
                   <div className="text-[#493C31] font-bold text-lg">25.00</div>
                   <div className="text-[10px] text-[#84705B]">Stawka PLN/h</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#E5E0D5]">
                   <div className="text-[#493C31] font-bold text-lg">20/26</div>
                   <div className="text-[10px] text-[#84705B]">Urlop</div>
                </div>
             </div>

             {/* Recent History Item */}
             <div className="bg-white p-4 rounded-xl border border-[#E5E0D5] flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#E5E0D5] flex items-center justify-center text-[#493C31]"><Coins size={14}/></div>
                   <div>
                      <div className="text-xs font-bold text-[#493C31]">Premia</div>
                      <div className="text-[10px] text-[#84705B]">Dzisiaj</div>
                   </div>
                </div>
                <div className="font-bold text-[#32FFDC] text-sm">+200 PLN</div>
             </div>
          </div>
       </div>
    </div>
  );

  // 3. Cremation List Mockup (Reflects Cremations.tsx)
  const CremationListMockup = () => (
    <div className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-xl overflow-hidden shadow-2xl flex flex-col aspect-[16/10] border border-[#E5E0D5]">
       <div className="h-12 bg-[#F5F4ED] border-b border-[#E5E0D5] flex items-center px-4 justify-between">
          <div className="flex items-center gap-2 text-[#493C31] font-bold">
             <Flame size={18} className="text-[#FF6B6B]"/> Harmonogram
          </div>
          <div className="flex gap-2">
             <div className="text-xs px-2 py-1 bg-[#32FFDC] rounded-md font-bold text-[#232B32]">Piec 1</div>
             <div className="text-xs px-2 py-1 bg-white border border-[#E5E0D5] rounded-md text-[#84705B]">Piec 2</div>
          </div>
       </div>
       
       <div className="flex-1 p-4 bg-[#F9F9F9] overflow-hidden">
          <div className="text-xs font-bold text-[#84705B] mb-2 uppercase tracking-wider">Dzisiaj, 24 Listopada</div>
          
          <div className="space-y-3">
             {/* Item 1 */}
             <div className="flex gap-3">
                <div className="pt-2 text-right w-12 text-sm font-bold text-[#84705B]">08:00</div>
                <div className="flex-1 bg-white border-l-4 border-l-[#32FFDC] rounded-r-lg p-3 shadow-sm border-y border-r border-[#E5E0D5]">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="font-bold text-[#493C31] text-sm">Zakład "Eden"</div>
                         <div className="text-xs text-[#84705B]">Śp. Jan Kowalski</div>
                      </div>
                      <div className="px-2 py-0.5 bg-[#E5E0D5] rounded text-[10px] font-bold text-[#493C31]">Opłacone</div>
                   </div>
                   <div className="mt-2 flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#FDD792]" title="Urna Drewniana"></div>
                      <div className="w-2 h-2 rounded-full bg-[#A581D4]" title="Pożegnanie"></div>
                   </div>
                </div>
             </div>

             {/* Item 2 */}
             <div className="flex gap-3">
                <div className="pt-2 text-right w-12 text-sm font-bold text-[#84705B]">10:30</div>
                <div className="flex-1 bg-white border-l-4 border-l-[#FF6B6B] rounded-r-lg p-3 shadow-sm border-y border-r border-[#E5E0D5] opacity-60">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="font-bold text-[#493C31] text-sm">Firma "Ostatnia Droga"</div>
                         <div className="text-xs text-[#84705B]">Śp. Anna Nowak</div>
                      </div>
                      <div className="px-2 py-0.5 border border-[#E5E0D5] rounded text-[10px] font-bold text-[#84705B]">Nieopłacone</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  // 4. Laptop Container
  const LaptopMockup = () => (
    <div className="relative mx-auto max-w-[900px] w-full">
        <div className="relative bg-[#232323] rounded-[20px] p-[10px] md:p-[14px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-[#333]">
            <div className="overflow-hidden rounded-[10px] bg-white relative">
                {/* Camera */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#232323] rounded-b-lg z-20 flex justify-center items-center">
                    <div className="w-1.5 h-1.5 bg-[#444] rounded-full"></div>
                </div>
                <DashboardMockup className="!max-w-none !shadow-none !rounded-none !border-0" />
            </div>
        </div>
        <div className="bg-[#2a2a2a] h-[12px] md:h-[16px] w-[calc(100%+20px)] -ml-[10px] rounded-b-[10px] shadow-md relative z-10 border-t border-[#333]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[4px] bg-[#1a1a1a] rounded-b-md opacity-50"></div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F4ED] text-[#493C31] font-sans overflow-x-hidden selection:bg-[#32FFDC] selection:text-[#232B32]">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#F5F4ED]/90 backdrop-blur-md border-b border-[#E5E0D5] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[1rem] bg-[#32FFDC] flex items-center justify-center text-[#232B32] shadow-sm">
                 <span className="font-sans font-bold text-xl">U</span>
              </div>
              <div className="flex flex-col">
                 <span className="font-sans font-bold text-xl leading-none text-[#493C31]">Urneo</span>
                 <span className="text-[10px] font-bold text-[#84705B] uppercase tracking-[0.2em]">System 2035</span>
              </div>
           </div>
           
           <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#84705B]">
              <a href="#features" className="hover:text-[#493C31] transition-colors">Funkcje</a>
              <button onClick={() => onNavigate('bulletin-board')} className="hover:text-[#493C31] transition-colors flex items-center gap-1">
                 <ShoppingBag size={16}/> Giełda
              </button>
              <a href="#pricing" className="hover:text-[#493C31] transition-colors">Cennik</a>
              <a href="#contact" className="hover:text-[#493C31] transition-colors">Kontakt</a>
           </div>
           
           <div className="flex gap-3">
              <button onClick={() => onNavigate('auth')} className="px-6 py-3 rounded-[1rem] font-bold text-sm bg-[#493C31] text-[#F5F4ED] hover:bg-[#3a3027] shadow-lg hover:shadow-xl transition-all">
                 Zaloguj się
              </button>
           </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#32FFDC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#E5E0D5] rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse-slow delay-1000"></div>

         <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 mb-8 bg-[#FFFFFF] border border-[#E5E0D5] px-4 py-2 rounded-full shadow-sm">
               <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32FFDC] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#32FFDC]"></span>
               </span>
               <span className="text-xs font-bold text-[#493C31] tracking-wide uppercase">Nowoczesny CRM</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-sans font-bold mb-8 leading-[1.1] tracking-tight text-[#493C31]">
               Zarządzaj Zakładem <br/>
               <span className="text-[#32FFDC] drop-shadow-sm">Z Przyszłości.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#84705B] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
               Kompleksowy system operacyjny dla nowoczesnych domów pogrzebowych i krematoriów. 
               Rejestracja czasu pracy, harmonogramy i ewidencja w jednym miejscu.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-20">
               <button onClick={() => onNavigate('auth')} className="h-14 px-8 text-lg font-bold bg-[#32FFDC] text-[#232B32] hover:bg-[#20e6c5] rounded-[1.2rem] w-full md:w-auto shadow-[0_10px_30px_-10px_rgba(50,255,220,0.5)] transition-all flex items-center justify-center gap-2">
                  Rozpocznij Teraz <ArrowRight size={20}/>
               </button>
               <button onClick={() => onNavigate('bulletin-board')} className="h-14 px-8 text-lg font-bold bg-[#FFFFFF] border border-[#E5E0D5] text-[#493C31] hover:bg-[#faf9f6] rounded-[1.2rem] w-full md:w-auto shadow-sm transition-all flex items-center justify-center gap-2">
                  <ShoppingBag size={20} className="text-[#493C31]"/> Tablica Ogłoszeń
               </button>
            </div>

            {/* Main Hero Mockup Composition */}
            <div className="relative max-w-5xl mx-auto transform hover:scale-[1.01] transition-transform duration-700">
               <div className="absolute inset-0 bg-gradient-to-t from-[#F5F4ED] via-transparent to-transparent z-20 h-full w-full pointer-events-none"></div>
               <LaptopMockup />
            </div>
         </div>
      </section>

      {/* --- SHOWCASE SECTIONS (Realistic Features) --- */}
      
      {/* Feature 1: Dashboard */}
      <section id="features" className="py-24 bg-[#FFFFFF]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
               <div className="w-12 h-12 bg-[#FDD792] rounded-2xl flex items-center justify-center text-[#493C31] mb-4">
                  <LayoutDashboard size={24}/>
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-[#493C31]">Centrum dowodzenia</h2>
               <p className="text-[#84705B] text-lg leading-relaxed">
                  Główny panel administratora daje Ci błyskawiczny wgląd w status Twojej firmy. Sprawdzisz obecność pracowników, nowe wnioski urlopowe oraz nadchodzące zlecenia.
               </p>
               <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Status zespołu online/offline</li>
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Powiadomienia o wnioskach</li>
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Wielki zegar czasu lokalnego</li>
               </ul>
            </div>
            <div className="flex-1 w-full relative">
               <div className="absolute -inset-4 bg-[#FDD792] opacity-20 blur-3xl rounded-full"></div>
               <DashboardMockup />
            </div>
         </div>
      </section>

      {/* Feature 2: Employee Panel (Time Tracking) */}
      <section className="py-24 bg-[#F5F4ED] border-y border-[#E5E0D5]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
               <div className="w-12 h-12 bg-[#32FFDC] rounded-2xl flex items-center justify-center text-[#232B32] mb-4">
                  <Briefcase size={24}/>
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-[#493C31]">Panel Pracownika i RCP</h2>
               <p className="text-[#84705B] text-lg leading-relaxed">
                  Każdy pracownik otrzymuje dostęp do własnego panelu mobilnego. Mogą w nim rejestrować czas pracy jednym kliknięciem oraz sprawdzać historię przyznanych dodatków płacowych.
               </p>
               <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Start/Stop czasu pracy w telefonie</li>
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Podgląd stawki godzinowej</li>
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Historia premii i bonusów</li>
               </ul>
            </div>
            <div className="flex-1 w-full flex justify-center relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#32FFDC] opacity-20 blur-3xl rounded-full"></div>
               <MobileEmployeeMockup />
            </div>
         </div>
      </section>

      {/* Feature 3: Cremation Schedule */}
      <section className="py-24 bg-[#FFFFFF]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
               <div className="w-12 h-12 bg-[#FF6B6B] rounded-2xl flex items-center justify-center text-white mb-4">
                  <Flame size={24}/>
               </div>
               <h2 className="text-3xl md:text-4xl font-bold text-[#493C31]">Ewidencja Kremacji</h2>
               <p className="text-[#84705B] text-lg leading-relaxed">
                  Przejrzysty harmonogram dzienny dla operatorów pieców. Lista pokazuje zaplanowane spopielenia z podziałem na godziny, przypisane piece oraz wybrane opcje (np. rodzaj urny).
               </p>
               <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Kolorowe oznaczenia pieców</li>
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Statusy płatności (Opłacone/Nieopłacone)</li>
                  <li className="flex items-center gap-3 text-[#493C31] font-medium"><CheckCircle2 size={20} className="text-[#32FFDC]"/> Pełna historia edycji wpisu</li>
               </ul>
            </div>
            <div className="flex-1 w-full relative">
               <CremationListMockup />
            </div>
         </div>
      </section>

      {/* --- PRICING SECTION (Urneo Store) --- */}
      <section id="pricing" className="py-32 bg-[#F5F4ED] border-t border-[#E5E0D5]">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
               <Badge variant="primary" className="mb-2">Urneo Store</Badge>
               <h2 className="text-4xl md:text-5xl font-bold text-[#493C31]">Wybierz plan dla siebie</h2>
               <p className="text-[#84705B] max-w-xl mx-auto">
                  Funkcje systemu dostosowują się do wybranego pakietu.
                  Płatność miesięczna, bez zobowiązań długoterminowych.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
               
               {/* Plan 1: Krematorium */}
               <div className="bg-white p-8 rounded-[2rem] border border-[#E5E0D5] shadow-sm hover:shadow-xl transition-all relative group">
                  <div className="mb-6">
                     <div className="w-12 h-12 bg-[#FDD792] rounded-xl flex items-center justify-center mb-4 text-[#493C31]">
                        <Flame size={24} />
                     </div>
                     <h3 className="text-2xl font-bold text-[#493C31]">Kremacje</h3>
                     <p className="text-[#84705B] text-sm mt-2 min-h-[40px]">Dla spopielarni i firm zarządzających piecami.</p>
                  </div>
                  <div className="mb-8 pb-8 border-b border-[#E5E0D5]">
                     <span className="text-4xl font-bold text-[#493C31]">249 zł</span><span className="text-sm text-[#84705B]">/mc</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> <strong>Moduł Kremacji</strong> (harmonogram)</li>
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Zarządzanie piecami</li>
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Magazyn produktów</li>
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Panel pracownika (RCP)</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => onNavigate('auth')}>Wybierz Pakiet</Button>
               </div>

               {/* Plan 2: Dom Pogrzebowy */}
               <div className="bg-white p-8 rounded-[2rem] border border-[#E5E0D5] shadow-sm hover:shadow-xl transition-all relative group">
                  <div className="mb-6">
                     <div className="w-12 h-12 bg-[#E5E0D5] rounded-xl flex items-center justify-center mb-4 text-[#493C31]">
                        <Layers size={24} />
                     </div>
                     <h3 className="text-2xl font-bold text-[#493C31]">Pogrzeby</h3>
                     <p className="text-[#84705B] text-sm mt-2 min-h-[40px]">Dla zakładów pogrzebowych oferujących kompleksowe usługi.</p>
                  </div>
                  <div className="mb-8 pb-8 border-b border-[#E5E0D5]">
                     <span className="text-4xl font-bold text-[#493C31]">199 zł</span><span className="text-sm text-[#84705B]">/mc</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> <strong>Moduł Pogrzebowy</strong> (kreator)</li>
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Zarządzanie flotą (pojazdy)</li>
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Checklisty zadań</li>
                     <li className="flex items-start gap-3 text-sm text-[#493C31]"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Panel pracownika (RCP)</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => onNavigate('auth')}>Wybierz Pakiet</Button>
               </div>

               {/* Plan 3: PRO Business (Highlighted) */}
               <div className="bg-[#232B32] p-8 rounded-[2rem] border border-[#32FFDC] shadow-2xl relative transform md:-translate-y-4">
                  <div className="absolute top-0 right-0 bg-[#32FFDC] text-[#232B32] text-xs font-bold px-4 py-2 rounded-bl-2xl rounded-tr-2xl">NAJCZĘŚCIEJ WYBIERANY</div>
                  <div className="mb-6">
                     <div className="w-12 h-12 bg-[#32FFDC] rounded-xl flex items-center justify-center mb-4 text-[#232B32]">
                        <ShieldCheck size={24} />
                     </div>
                     <h3 className="text-2xl font-bold text-white">Urneo PRO</h3>
                     <p className="text-gray-400 text-sm mt-2 min-h-[40px]">Pełny dostęp do wszystkich funkcji systemu.</p>
                  </div>
                  <div className="mb-8 pb-8 border-b border-gray-700">
                     <span className="text-4xl font-bold text-white">399 zł</span><span className="text-sm text-gray-400">/mc</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                     <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> <strong>Wszystkie moduły</strong> (Kremacja + Pogrzeby)</li>
                     <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Generator Dokumentów (PDF)</li>
                     <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Magazyn i Powiązania produktów</li>
                     <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Zarządzanie firmami zewn.</li>
                     <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-[#32FFDC] mt-0.5 shrink-0"/> Nielimitowana liczba pracowników</li>
                  </ul>
                  <Button className="w-full bg-[#32FFDC] text-[#232B32] hover:bg-[#20e6c5] font-bold h-12" onClick={() => onNavigate('auth')}>Wybierz Pakiet PRO</Button>
               </div>

            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#FFFFFF] py-12 border-t border-[#E5E0D5]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <span className="font-sans font-bold text-xl tracking-tight text-[#493C31]">URNEO 2035</span>
               <p className="text-[#84705B] text-sm mt-2">© 2035 Urneo Systems. Wszelkie prawa zastrzeżone.</p>
            </div>
            <div className="flex gap-8 text-sm font-bold text-[#84705B]">
               <a href="#" className="hover:text-[#32FFDC] transition-colors">Polityka Prywatności</a>
               <a href="#" className="hover:text-[#32FFDC] transition-colors">Regulamin</a>
               <a href="#" className="hover:text-[#32FFDC] transition-colors">Kontakt</a>
            </div>
         </div>
      </footer>
    </div>
  );
};
