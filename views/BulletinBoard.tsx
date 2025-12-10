
import React, { useState, useEffect } from 'react';
import { BulletinAd, BulletinCategory, User } from '../types';
import { getBulletinAds, getBulletinCategories, saveBulletinAd, deleteBulletinAd } from '../services/storageService';
import { Card, Button, Input, Badge } from '../components/UI';
import { Search, MapPin, Tag, Plus, Phone, Mail, Clock, Filter, X, ChevronRight, User as UserIcon, AlertCircle, ShoppingBag, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface BulletinBoardProps {
  user: User | null;
  onNavigate: (view: string) => void;
}

const VOIVODESHIPS = [
   'Dolnośląskie', 'Kujawsko-pomorskie', 'Lubelskie', 'Lubuskie', 'Łódzkie', 
   'Małopolskie', 'Mazowieckie', 'Opolskie', 'Podkarpackie', 'Podlaskie', 
   'Pomorskie', 'Śląskie', 'Świętokrzyskie', 'Warmińsko-mazurskie', 'Wielkopolskie', 'Zachodniopomorskie'
];

export const BulletinBoard: React.FC<BulletinBoardProps> = ({ user, onNavigate }) => {
  const [ads, setAds] = useState<BulletinAd[]>([]);
  const [categories, setCategories] = useState<BulletinCategory[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Main Cat
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Add Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAd, setNewAd] = useState<Partial<BulletinAd>>({ location: 'Mazowieckie' });

  // Details Modal
  const [selectedAd, setSelectedAd] = useState<BulletinAd | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setAds(await getBulletinAds());
    setCategories(await getBulletinCategories());
  };

  const handleSaveAd = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return toast.error('Musisz być zalogowany');
     if (!newAd.title || !newAd.categoryId || !newAd.price || !newAd.phone) {
        return toast.error('Wypełnij wymagane pola');
     }

     await saveBulletinAd({
        ...newAd,
        email: user.email, // Auto-fill email from user
        status: 'active'
     }, user.id);

     setShowAddModal(false);
     setNewAd({ location: 'Mazowieckie' });
     loadData();
     toast.success('Ogłoszenie dodane!');
  };

  const rootCategories = categories.filter(c => !c.parentId);
  const subCategories = selectedCategory ? categories.filter(c => c.parentId === selectedCategory) : [];

  const filteredAds = ads.filter(ad => {
     const matchesSearch = ad.title.toLowerCase().includes(search.toLowerCase()) || ad.content?.toLowerCase().includes(search.toLowerCase());
     const matchesCat = selectedCategory ? ad.categoryId === selectedCategory : true;
     const matchesSub = selectedSubCategory ? ad.subCategoryId === selectedSubCategory : true;
     const matchesLoc = selectedLocation ? ad.location === selectedLocation : true;
     return matchesSearch && matchesCat && matchesSub && matchesLoc && ad.status === 'active';
  });

  return (
    <div className="min-h-screen bg-[#F5F4ED] pb-20">
       
       {/* HEADER */}
       <div className="bg-[#FFFFFF] border-b border-[#E5E0D5] sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
                <div className="w-10 h-10 bg-[#32FFDC] rounded-xl flex items-center justify-center font-bold text-[#232B32]">U</div>
                <h1 className="text-xl font-bold text-[#493C31]">Tablica Ogłoszeń</h1>
             </div>

             <div className="flex-1 max-w-2xl w-full flex gap-2">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84705B]" size={18}/>
                   <input 
                      className="w-full pl-10 pr-4 py-3 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5] outline-none focus:border-[#32FFDC] transition-all"
                      placeholder="Szukaj ogłoszeń (np. Karawan, Urny...)"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                   />
                </div>
                <div className="relative w-48 hidden md:block">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84705B]" size={18}/>
                   <select 
                      className="w-full pl-10 pr-8 py-3 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5] outline-none appearance-none cursor-pointer"
                      value={selectedLocation}
                      onChange={e => setSelectedLocation(e.target.value)}
                   >
                      <option value="">Cała Polska</option>
                      {VOIVODESHIPS.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                </div>
             </div>

             <div>
                {user ? (
                   <Button onClick={() => setShowAddModal(true)} className="bg-[#32FFDC] text-[#232B32] hover:bg-[#20E6C5] shadow-md font-bold px-6">
                      <Plus size={18} className="mr-2"/> Dodaj Ogłoszenie
                   </Button>
                ) : (
                   <Button onClick={() => onNavigate('auth')} variant="outline">
                      Zaloguj się, aby dodać
                   </Button>
                )}
             </div>
          </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTERS */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
             <div className="bg-white p-4 rounded-xl border border-[#E5E0D5] shadow-sm">
                <h3 className="font-bold text-[#493C31] mb-4 flex items-center gap-2"><Tag size={18}/> Kategorie</h3>
                <div className="space-y-1">
                   <button 
                      onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-[#32FFDC] text-[#232B32] font-bold' : 'hover:bg-[#F5F4ED] text-[#84705B]'}`}
                   >
                      Wszystkie
                   </button>
                   {rootCategories.map(cat => (
                      <button 
                         key={cat.id}
                         onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory(null); }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-[#232B32] text-white' : 'hover:bg-[#F5F4ED] text-[#493C31]'}`}
                      >
                         {cat.name}
                      </button>
                   ))}
                </div>
             </div>

             {/* Subcategories (if selected) */}
             {selectedCategory && subCategories.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-[#E5E0D5] shadow-sm animate-fade-in">
                   <h3 className="font-bold text-[#493C31] mb-4 text-sm uppercase">Podkategorie</h3>
                   <div className="space-y-1">
                      {subCategories.map(sub => (
                         <button 
                            key={sub.id}
                            onClick={() => setSelectedSubCategory(sub.id === selectedSubCategory ? null : sub.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${selectedSubCategory === sub.id ? 'bg-[#FDD792] text-[#493C31]' : 'hover:bg-[#F5F4ED] text-[#84705B]'}`}
                         >
                            {sub.name}
                         </button>
                      ))}
                   </div>
                </div>
             )}
          </div>

          {/* MAIN GRID */}
          <div className="flex-1">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#493C31]">
                   {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Wszystkie Ogłoszenia'}
                   <span className="text-sm font-normal text-[#84705B] ml-2">({filteredAds.length} wyników)</span>
                </h2>
                {/* Mobile Filter Toggle could go here */}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAds.map(ad => (
                   <Card key={ad.id} className="hover:shadow-xl transition-all cursor-pointer group border-[#E5E0D5] flex flex-col" onClick={() => setSelectedAd(ad)}>
                      <div className="aspect-[4/3] bg-[#F5F4ED] rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                         <ShoppingBag size={48} className="text-[#E5E0D5]"/>
                         <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-[#493C31] shadow-sm">
                            {categories.find(c => c.id === ad.categoryId)?.name}
                         </div>
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold flex items-center gap-1"><MapPin size={12}/> {ad.location}</span>
                         </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                         <h3 className="font-bold text-lg mb-1 line-clamp-1">{ad.title}</h3>
                         <div className="text-2xl font-bold text-[#32FFDC] mb-2 drop-shadow-sm" style={{textShadow: '0px 1px 1px rgba(0,0,0,0.1)'}}>
                            {ad.price.toLocaleString()} PLN
                         </div>
                         <p className="text-xs text-[#84705B] line-clamp-2 mb-4 flex-1">{ad.content}</p>
                         
                         <div className="border-t border-[#F5F4ED] pt-3 flex justify-between items-center text-xs text-[#84705B]">
                            <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
                            <span className="font-mono bg-[#F5F4ED] px-2 py-0.5 rounded">{ad.adNumber}</span>
                         </div>
                      </div>
                   </Card>
                ))}
                {filteredAds.length === 0 && (
                   <div className="col-span-full py-20 text-center text-[#84705B]">
                      <LayoutGrid size={48} className="mx-auto mb-4 opacity-20"/>
                      <p>Brak ogłoszeń spełniających kryteria.</p>
                   </div>
                )}
             </div>
          </div>
       </div>

       {/* ADD MODAL */}
       {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-bold">Nowe Ogłoszenie</h3>
                   <button onClick={() => setShowAddModal(false)}><X/></button>
                </div>
                
                <form onSubmit={handleSaveAd} className="space-y-6">
                   <Input label="Tytuł Ogłoszenia" value={newAd.title || ''} onChange={e => setNewAd({...newAd, title: e.target.value})} required placeholder="np. Sprzedam Karawan Mercedes" />
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-[#84705B] uppercase mb-2 block">Kategoria</label>
                         <select className="w-full p-3 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5] outline-none" value={newAd.categoryId || ''} onChange={e => setNewAd({...newAd, categoryId: e.target.value, subCategoryId: undefined})}>
                            <option value="">Wybierz...</option>
                            {rootCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-[#84705B] uppercase mb-2 block">Podkategoria</label>
                         <select className="w-full p-3 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5] outline-none" value={newAd.subCategoryId || ''} onChange={e => setNewAd({...newAd, subCategoryId: e.target.value})} disabled={!newAd.categoryId}>
                            <option value="">Wybierz...</option>
                            {newAd.categoryId && categories.filter(c => c.parentId === newAd.categoryId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <Input label="Cena (PLN)" type="number" value={newAd.price || ''} onChange={e => setNewAd({...newAd, price: parseFloat(e.target.value)})} required />
                      <div>
                         <label className="text-xs font-bold text-[#84705B] uppercase mb-2 block">Lokalizacja</label>
                         <select className="w-full p-3 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5] outline-none" value={newAd.location} onChange={e => setNewAd({...newAd, location: e.target.value})}>
                            {VOIVODESHIPS.map(v => <option key={v} value={v}>{v}</option>)}
                         </select>
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-[#84705B] uppercase mb-2 block">Opis</label>
                      <textarea className="w-full p-3 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5] outline-none min-h-[120px]" value={newAd.content || ''} onChange={e => setNewAd({...newAd, content: e.target.value})} placeholder="Opisz przedmiot..." />
                   </div>

                   <div className="p-4 bg-[#F5F4ED] rounded-xl border border-[#E5E0D5]">
                      <h4 className="font-bold text-sm mb-3">Dane Kontaktowe</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <Input label="Telefon" value={newAd.phone || ''} onChange={e => setNewAd({...newAd, phone: e.target.value})} required />
                         <div className="opacity-50 pointer-events-none">
                            <Input label="Email (Pobierany z profilu)" value={user?.email || ''} readOnly />
                         </div>
                      </div>
                   </div>

                   <Button type="submit" className="w-full h-12 bg-[#32FFDC] text-[#232B32] font-bold text-lg hover:bg-[#20E6C5]">Opublikuj Ogłoszenie</Button>
                </form>
             </Card>
          </div>
       )}

       {/* DETAILS MODAL */}
       {selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
             <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in p-0 relative">
                <button onClick={() => setSelectedAd(null)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-10"><X/></button>
                
                <div className="flex flex-col md:flex-row">
                   <div className="md:w-1/2 bg-[#F5F4ED] p-8 flex items-center justify-center">
                      <ShoppingBag size={120} className="text-[#E5E0D5]"/>
                   </div>
                   
                   <div className="md:w-1/2 p-8">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-[#84705B] uppercase tracking-wider">{new Date(selectedAd.createdAt).toLocaleDateString()}</span>
                         <Badge variant="secondary">{selectedAd.adNumber}</Badge>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-[#493C31] mb-2">{selectedAd.title}</h2>
                      <div className="text-4xl font-bold text-[#32FFDC] mb-6 drop-shadow-sm" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
                         {selectedAd.price.toLocaleString()} PLN
                      </div>

                      <div className="flex items-center gap-2 mb-6 text-sm">
                         <Badge variant="primary">{categories.find(c => c.id === selectedAd.categoryId)?.name}</Badge>
                         <span className="flex items-center gap-1 text-[#84705B]"><MapPin size={14}/> {selectedAd.location}</span>
                      </div>

                      <div className="border-t border-[#E5E0D5] py-6 mb-6">
                         <h4 className="font-bold text-sm mb-2 text-[#493C31]">Opis</h4>
                         <p className="text-[#84705B] whitespace-pre-wrap">{selectedAd.content}</p>
                      </div>

                      <div className="bg-[#232B32] p-6 rounded-xl text-white">
                         <h4 className="font-bold text-lg mb-4">Kontakt ze sprzedającym</h4>
                         <div className="space-y-3">
                            <div className="flex items-center gap-3">
                               <UserIcon size={18} className="text-[#32FFDC]"/>
                               <span>{selectedAd.userName || 'Użytkownik Urneo'}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                               <Phone size={18} className="text-[#32FFDC]"/>
                               {user ? (
                                  <span className="font-bold text-xl tracking-wide">{selectedAd.phone}</span>
                               ) : (
                                  <div className="flex items-center gap-2">
                                     <span className="text-lg tracking-wide blur-sm">500 100 200</span>
                                     <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 hover:bg-white/10 text-white" onClick={() => onNavigate('auth')}>Zaloguj, aby odkryć</Button>
                                  </div>
                               )}
                            </div>

                            <div className="flex items-center gap-3 opacity-80">
                               <Mail size={18} className="text-[#32FFDC]"/>
                               <span>{selectedAd.email}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
       )}

    </div>
  );
};
