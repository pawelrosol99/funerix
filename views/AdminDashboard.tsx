import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { getUsers } from '../services/storageService';
import { 
  Users, 
  Palette, 
  Clock, 
  ArrowRight, 
  Check, 
  X, 
  MoreHorizontal,
  Plus,
  Flame,
  Calendar,
  Bell
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let str = date.toLocaleDateString('pl-PL', options);
    // Capitalize first letter
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  // Mock Data matching screenshot
  const requests = [
    { id: 1, name: 'J. Kowalski', desc: 'Urlop (2 dni)', status: 'pending' },
    { id: 2, name: 'J. Kowalski', desc: 'Urlop (2 dni)', status: 'pending' },
  ];

  const upcomingFunerals = [
    { id: 1, initials: 'AN', name: 'Anna Nowak', caseId: '#2025/11/01', date: '24 Lis', time: '12:00' },
    { id: 2, initials: 'KZ', name: 'Krzysztof Zieliński', caseId: '#2025/11/02', date: '24 Lis', time: '12:00' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* TIME HEADER CARD */}
      <div className="rounded-[2rem] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] p-8 relative overflow-hidden shadow-xl">
         {/* Subtle pattern or gradient overlay */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
         
         <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)] mb-2">Czas Lokalny</div>
              <div className="text-6xl md:text-8xl font-sans font-light tracking-tighter leading-none">
                {formatTime(currentTime)}
              </div>
            </div>
            <div className="text-right">
               <div className="text-sm md:text-lg opacity-80 font-medium">{formatDate(currentTime)}</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* WNIOSKI */}
        <Card className="flex flex-col h-full">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-sans font-bold text-xl">Wnioski</h3>
              <Badge variant="warning">3 nowe</Badge>
           </div>
           
           <div className="space-y-3">
              {requests.map(req => (
                 <div key={req.id} className="flex items-center justify-between p-4 bg-[var(--color-secondary)] rounded-[1rem]">
                    <div>
                       <div className="font-bold text-sm">{req.name}</div>
                       <div className="text-xs text-[var(--color-text-secondary)]">{req.desc}</div>
                    </div>
                    <div className="flex gap-2">
                       <button className="w-8 h-8 rounded-full border border-green-500 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors">
                          <Check size={14} strokeWidth={3} />
                       </button>
                       <button className="w-8 h-8 rounded-full border border-red-500 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                          <X size={14} strokeWidth={3} />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </Card>

        {/* STATUS ZESPOŁU */}
        <Card className="flex flex-col h-full">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-sans font-bold text-xl">Status Zespołu</h3>
           </div>
           <div className="flex flex-wrap gap-4">
              {[
                { img: 'https://i.pravatar.cc/150?u=1', status: 'online' },
                { img: 'https://i.pravatar.cc/150?u=2', status: 'online' },
                { img: 'https://i.pravatar.cc/150?u=3', status: 'online' },
                { img: 'https://i.pravatar.cc/150?u=4', status: 'busy' },
                { img: 'https://i.pravatar.cc/150?u=5', status: 'offline' }
              ].map((member, i) => (
                <div key={i} className="relative">
                   <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[var(--color-surface)] shadow-md">
                      <img src={member.img} alt="User" className="w-full h-full object-cover" />
                   </div>
                   <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--color-surface)] ${
                      member.status === 'online' ? 'bg-[var(--color-accent)]' : 
                      member.status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                   }`}></div>
                </div>
              ))}
           </div>
        </Card>

      </div>

      {/* OŚ CZASU */}
      <Card>
         <h3 className="font-sans font-bold text-xl mb-8">Oś czasu</h3>
         <div className="relative pt-4 pb-8 px-2">
            {/* Base Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--color-border)] rounded-full -translate-y-1/2"></div>
            
            {/* Progress/Active Line - Mocked */}
            <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-[var(--color-border)] rounded-full -translate-y-1/2 overflow-hidden">
               <div className="w-full h-full bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-text-secondary)] opacity-20"></div>
            </div>

            {/* Events */}
            <div className="relative flex justify-between text-xs font-medium text-[var(--color-text-secondary)]">
               <div className="text-center transform -translate-x-1/2 pl-4">8:00</div>
               <div className="text-center transform -translate-x-1/2">10:00</div>
               
               {/* Event Marker 1 */}
               <div className="absolute left-[30%] top-1/2 -translate-y-[calc(50%+24px)] flex flex-col items-center group cursor-pointer">
                  <div className="p-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl shadow-lg mb-2 group-hover:scale-110 transition-transform">
                     <Clock size={16} />
                  </div>
                  <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full border-2 border-[var(--color-surface)] relative z-10"></div>
                  <div className="absolute top-full mt-2 text-xs font-bold text-[var(--color-text-main)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                     Spotkanie z klientem
                  </div>
               </div>

               <div className="text-center transform -translate-x-1/2">12:00</div>
               <div className="text-center transform -translate-x-1/2">14:00</div>
               
               {/* Event Marker 2 */}
               <div className="absolute left-[65%] top-1/2 -translate-y-[calc(50%+24px)] flex flex-col items-center group cursor-pointer">
                  <div className="p-2 bg-[var(--color-chart-2)] text-[var(--color-text-main)] rounded-xl shadow-lg mb-2 group-hover:scale-110 transition-transform">
                     <Bell size={16} />
                  </div>
                  <div className="w-3 h-3 bg-[var(--color-chart-2)] rounded-full border-2 border-[var(--color-surface)] relative z-10"></div>
                  <div className="absolute top-full mt-2 text-xs font-bold text-[var(--color-text-main)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                     Odbiór dokumentów
                  </div>
               </div>

               <div className="text-center transform -translate-x-1/2">16:00</div>
               <div className="text-center transform -translate-x-1/2 pr-4">18:00</div>
            </div>
         </div>
      </Card>

      {/* NAJBLIŻSZE POGRZEBY */}
      <Card className="min-h-[300px]">
         <div className="flex justify-between items-center mb-6">
             <h3 className="font-sans font-bold text-xl">Najbliższe pogrzeby</h3>
             <button className="text-[var(--color-accent)] hover:underline flex items-center gap-1 text-sm font-bold">
                Wszystkie <ArrowRight size={14} />
             </button>
         </div>

         <div className="space-y-3">
            {upcomingFunerals.map(item => (
               <div key={item.id} className="group flex items-center justify-between p-4 bg-[var(--color-secondary)] hover:bg-[var(--color-surface)] border border-transparent hover:border-[var(--color-border)] hover:shadow-md rounded-[1.2rem] transition-all duration-300">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] text-[var(--color-text-main)] font-bold flex items-center justify-center shadow-sm text-lg">
                        {item.initials}
                     </div>
                     <div>
                        <div className="font-bold text-base">{item.name}</div>
                        <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider font-medium">SPRAWA {item.caseId}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="font-bold text-sm">{item.date}</div>
                     <div className="text-xs text-[var(--color-text-secondary)]">{item.time}</div>
                  </div>
               </div>
            ))}
         </div>
      </Card>

      {/* KREMACJE */}
      <div className="flex items-center justify-between p-2">
         <div className="flex items-center gap-2 text-[var(--color-chart-2)] font-bold">
            <Flame size={20} />
            <span>Kremacje</span>
         </div>
         <Button variant="warning" className="rounded-full px-6">+ Dodaj</Button>
      </div>

    </div>
  );
};
