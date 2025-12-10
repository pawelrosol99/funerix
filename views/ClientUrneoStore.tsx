
import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { User, Company } from '../types';
import { createCompany } from '../services/storageService';
import { Check, Store, ShieldCheck, Flame, Layers, Cross, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ClientUrneoStoreProps {
  user: User;
  onCompanyCreated: () => void;
}

type PackageType = 'cremation' | 'funerals' | 'full';

export const ClientUrneoStore: React.FC<ClientUrneoStoreProps> = ({ user, onCompanyCreated }) => {
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('funerals');
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    street: '',
    city: '',
    zip_code: '',
    phone: '',
    photo_url: '',
  });

  const handleSelectPackage = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setStep('form');
    toast.info(`Wybrano pakiet: ${pkg.toUpperCase()}`);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
           if(ev.target?.result) {
              setFormData(prev => ({ ...prev, photo_url: ev.target!.result as string }));
           }
        };
        reader.readAsDataURL(file);
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Nazwa firmy jest wymagana');
    
    // Simulate Payment...
    toast.promise(
       // Wrapper promise for async operations
       (async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Payment Delay
          
          const newCompany = await createCompany({
             ...formData,
             package_type: selectedPackage
          }, user.id);

          if (!newCompany) throw new Error("Nie udało się utworzyć firmy.");
          return newCompany;
       })(), 
       {
          loading: 'Przetwarzanie płatności i konfiguracja systemu...',
          success: () => {
             // Delay callback slightly to allow toast to show
             setTimeout(onCompanyCreated, 500);
             return 'Firma, oddział i konto właściciela skonfigurowane!';
          },
          error: 'Wystąpił błąd podczas tworzenia firmy'
       }
    );
  };

  if (step === 'selection') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="primary" className="mb-4">Urneo Store</Badge>
          <h2 className="text-4xl font-bold">Wybierz pakiet dla swojej firmy</h2>
          <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Rozpocznij transformację swojego zakładu pogrzebowego z systemem Urneo 2035.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Cremation */}
          <Card className="flex flex-col relative border-2 border-transparent hover:border-[var(--color-border)] transition-all">
             <div className="mb-6">
              <div className="w-12 h-12 bg-[var(--color-chart-2)] rounded-xl flex items-center justify-center mb-4 text-[var(--color-text-main)]">
                <Flame size={24} />
              </div>
              <h3 className="text-2xl font-bold">Kremacje</h3>
              <p className="text-[var(--color-text-secondary)] mt-2">Dedykowany moduł kremacyjny.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold">249 zł</span><span className="text-sm text-[var(--color-text-secondary)]">/mc</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Ewidencja kremacji</li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Certyfikaty online</li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Statusy live</li>
            </ul>
            <Button onClick={() => handleSelectPackage('cremation')} variant="outline" className="w-full">Wybierz Kremacje</Button>
          </Card>

          {/* Funerals */}
          <Card className="flex flex-col relative border-2 border-transparent hover:border-[var(--color-border)] transition-all">
            <div className="mb-6">
              <div className="w-12 h-12 bg-[var(--color-secondary)] rounded-xl flex items-center justify-center mb-4 text-[var(--color-text-main)]">
                <Cross size={24} />
              </div>
              <h3 className="text-2xl font-bold">Pogrzeby</h3>
              <p className="text-[var(--color-text-secondary)] mt-2">Zarządzanie tradycyjnym domem pogrzebowym.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold">199 zł</span><span className="text-sm text-[var(--color-text-secondary)]">/mc</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Zarządzanie flotą</li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Kalendarz pogrzebów</li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Check listy</li>
            </ul>
            <Button onClick={() => handleSelectPackage('funerals')} variant="outline" className="w-full">Wybierz Pogrzeby</Button>
          </Card>

          {/* Full */}
          <Card className="flex flex-col relative border-2 border-[var(--color-primary)] shadow-xl transform scale-105 z-10">
            <div className="absolute top-0 right-0 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold px-3 py-1 rounded-bl-xl">POLECANY</div>
             <div className="mb-6">
              <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center mb-4 text-[var(--color-primary-foreground)]">
                <Layers size={24} />
              </div>
              <h3 className="text-2xl font-bold">Pro Business</h3>
              <p className="text-[var(--color-text-secondary)] mt-2">Kompletne rozwiązanie dla domu pogrzebowego.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-bold">399 zł</span><span className="text-sm text-[var(--color-text-secondary)]">/mc</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16} className="text-[var(--color-primary)]"/> Moduł Pogrzebowy</li>
              <li className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={16} className="text-[var(--color-primary)]"/> Moduł Kremacji</li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Dedykowany opiekun</li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--color-primary)]"/> Własna domena</li>
            </ul>
            <Button onClick={() => handleSelectPackage('full')} className="w-full">Wybierz Pełny Pakiet</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
       <Button variant="ghost" onClick={() => setStep('selection')} className="mb-6">Wróć do wyboru pakietu</Button>
       
       <Card>
          <div className="mb-8 border-b border-[var(--color-border)] pb-6">
             <h2 className="text-2xl font-bold mb-2">Konfiguracja Zakładu Pogrzebowego</h2>
             <p className="text-[var(--color-text-secondary)]">Wybrano pakiet: <strong className="uppercase text-[var(--color-primary)]">{selectedPackage}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             {/* Logo Upload Section */}
             <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 bg-[var(--color-secondary)] rounded-2xl flex items-center justify-center border-2 border-dashed border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition-all overflow-hidden group">
                   {formData.photo_url ? (
                      <img src={formData.photo_url} alt="Logo" className="w-full h-full object-cover" />
                   ) : (
                      <div className="text-center text-[var(--color-text-secondary)]">
                         <ImageIcon size={32} className="mx-auto mb-2 opacity-50"/>
                         <span className="text-xs font-bold">Wgraj Logo</span>
                      </div>
                   )}
                   <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                   />
                   {formData.photo_url && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white text-xs font-bold">Zmień</span>
                      </div>
                   )}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="NIP" name="nip" value={formData.nip} onChange={handleFormChange} />
                <Input label="Nazwa Firmy (Wymagane)" name="name" value={formData.name} onChange={handleFormChange} required />
                <Input label="Ulica" name="street" value={formData.street} onChange={handleFormChange} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Kod Pocztowy" name="zip_code" value={formData.zip_code} onChange={handleFormChange} />
                   <Input label="Miasto" name="city" value={formData.city} onChange={handleFormChange} />
                </div>
                <Input label="Telefon" name="phone" value={formData.phone} onChange={handleFormChange} />
             </div>

             <div className="p-4 bg-[var(--color-secondary)] rounded-xl mt-6 flex items-start gap-3">
                <ShieldCheck className="text-[var(--color-text-main)] shrink-0" />
                <div className="text-sm text-[var(--color-text-secondary)]">
                   Klikając "Zapłać i Utwórz", akceptujesz regulamin usługi Urneo. System automatycznie utworzy główny oddział firmy i przypisze Ci rolę właściciela.
                </div>
             </div>

             <Button type="submit" className="w-full h-14 text-lg font-bold mt-4">
                Zapłać i Utwórz Zakład
             </Button>
          </form>
       </Card>
    </div>
  );
};
