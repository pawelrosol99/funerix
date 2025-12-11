
import React from 'react';
import { Card, Button } from '../components/UI';
import { X, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface DatabaseInstructionsProps {
  onClose: () => void;
}

export const DatabaseInstructions: React.FC<DatabaseInstructionsProps> = ({ onClose }) => {
  const sqlSchema = `
-- ==========================================
-- 0. RESET SCHEMATU (CZYSZCZENIE BAZY)
-- ==========================================
-- UWAGA: To usunie WSZYSTKIE dane! Używaj tylko na początku developmentu.
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ==========================================
-- 1. STRUKTURA FIRMY I UŻYTKOWNICY
-- ==========================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number TEXT NOT NULL,
  nip TEXT NOT NULL,
  name TEXT NOT NULL,
  street TEXT,
  city TEXT,
  zip_code TEXT,
  phone TEXT,
  photo_url TEXT,
  package_type TEXT DEFAULT 'basic',
  bulletin_config JSONB DEFAULT '{"enabled": false, "displayCategories": []}', 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_number TEXT NOT NULL,
  name TEXT NOT NULL,
  street TEXT,
  city TEXT,
  zip_code TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_number TEXT,
  role TEXT NOT NULL, -- 'super_admin', 'client'
  company_role TEXT, -- 'owner', 'employee'
  login TEXT,
  password TEXT, 
  first_name TEXT, 
  last_name TEXT, 
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  photo_url TEXT,
  use_icon BOOLEAN DEFAULT FALSE,
  vacation_days_total INT DEFAULT 0,
  vacation_days_used INT DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  preferences JSONB DEFAULT '{"layoutMode": "sidebar"}',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  client_number TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  branch_name TEXT,
  status TEXT DEFAULT 'pending',
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT, 
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. KADRY I PŁACE
-- ==========================================

CREATE TABLE work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  original_start_time TIMESTAMPTZ,
  original_end_time TIMESTAMPTZ,
  edited_start_time TIMESTAMPTZ,
  edited_end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'active', 
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL, 
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL,
  type TEXT DEFAULT 'vacation', 
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE payroll_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC DEFAULT 0
);

CREATE TABLE user_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  bonus_id UUID REFERENCES payroll_bonuses(id) ON DELETE SET NULL,
  name TEXT,
  amount NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. MAGAZYN I PRODUKTY
-- ==========================================

CREATE TABLE manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip TEXT,
  name TEXT NOT NULL,
  city TEXT,
  street TEXT,
  phone TEXT,
  email TEXT
);

CREATE TABLE warehouse_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT, -- 'product', 'service'
  name TEXT NOT NULL,
  parent_id UUID REFERENCES warehouse_categories(id) ON DELETE CASCADE
);

CREATE TABLE warehouse_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  type TEXT,
  category_id UUID REFERENCES warehouse_categories(id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES warehouse_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  sales_price NUMERIC DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  quantity INT DEFAULT 0,
  unit TEXT,
  manufacturer TEXT,
  dimensions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_ids JSONB DEFAULT '[]'
);

-- ==========================================
-- 4. LOGISTYKA I KONTRAHENCI
-- ==========================================

CREATE TABLE coop_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tag_id UUID, 
  nip TEXT,
  name TEXT NOT NULL,
  street TEXT,
  city TEXT,
  phone TEXT,
  email TEXT
);

CREATE TABLE company_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperating_company_id UUID REFERENCES coop_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  manufacturer TEXT,
  photo_url TEXT,
  fuel_type TEXT,
  color TEXT,
  seats INT,
  inspection_date TEXT, 
  technical_date TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. KREMACJE I POGRZEBY
-- ==========================================

CREATE TABLE furnaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT
);

CREATE TABLE cremation_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE cremation_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES cremation_option_groups(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE cremations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  cremation_number TEXT NOT NULL,
  date TEXT,
  time TEXT,
  cooperating_company_id UUID REFERENCES coop_companies(id) ON DELETE SET NULL,
  furnace_id UUID REFERENCES furnaces(id) ON DELETE SET NULL,
  selected_options JSONB DEFAULT '[]',
  deceased JSONB, 
  applicant JSONB, 
  items JSONB DEFAULT '[]', 
  is_paid BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE funerals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  funeral_number TEXT NOT NULL,
  deceased_first_name TEXT,
  deceased_last_name TEXT,
  death_date TEXT,
  death_place TEXT,
  death_certificate_number TEXT,
  pickup_address TEXT,
  pickup_place_id UUID REFERENCES coop_companies(id) ON DELETE SET NULL,
  transport_date TEXT,
  transport_time TEXT,
  applicant_first_name TEXT,
  applicant_last_name TEXT,
  applicant_phone TEXT,
  assigned_staff_ids JSONB DEFAULT '[]',
  assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  ceremony JSONB, 
  sale_items JSONB DEFAULT '[]',
  assigned_checklists JSONB DEFAULT '[]',
  notes TEXT,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. POZOSTAŁE (DOKUMENTY, GIEŁDA, MOTYWY)
-- ==========================================

CREATE TABLE doc_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE doc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES doc_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  orientation TEXT DEFAULT 'portrait',
  layers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bulletin_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES bulletin_categories(id) ON DELETE CASCADE
);

CREATE TABLE bulletin_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_number TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES bulletin_categories(id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES bulletin_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  price NUMERIC DEFAULT 0,
  phone TEXT,
  email TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  css_vars JSONB NOT NULL
);

-- ==========================================
-- 7. WYŁĄCZENIE ZABEZPIECZEŃ (DLA TESTÓW)
-- ==========================================
-- Wyłączamy Row Level Security na wszystkich tabelach dla łatwiejszego developmentu
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY'; 
    END LOOP; 
END $$;

-- Nadanie uprawnień
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ==========================================
-- SEED DATA (DANE STARTOWE)
-- ==========================================

-- 1. Tworzenie SUPER ADMINA
INSERT INTO users (
  role, 
  login, 
  password, 
  first_name, 
  last_name, 
  email, 
  preferences
) VALUES (
  'super_admin', 
  'admin', 
  'admin123', 
  'Główny', 
  'Administrator', 
  'admin@urneo.pl', 
  '{"layoutMode": "sidebar"}'
);

-- 2. Opcjonalnie: Przykładowa Firma dla testów
WITH new_company AS (
  INSERT INTO companies (company_number, nip, name, street, city, zip_code, package_type)
  VALUES ('U00001', '1234567890', 'Zakład Pogrzebowy "Wieczność"', 'ul. Cicha 1', 'Warszawa', '00-001', 'full')
  RETURNING id
),
new_branch AS (
  INSERT INTO branches (company_id, branch_number, name, street, city, zip_code)
  SELECT id, 'U00001/1', 'Siedziba Główna', 'ul. Cicha 1', 'Warszawa', '00-001' FROM new_company
  RETURNING id
)
INSERT INTO users (role, company_role, login, password, first_name, last_name, email, company_id, branch_id)
SELECT 'client', 'owner', 'wlasciciel', 'wlasciciel123', 'Jan', 'Kowalski', 'jan@wiecznosc.pl', new_company.id, new_branch.id
FROM new_company, new_branch;
  `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    toast.success('Skopiowano SQL do schowka');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col p-0 border-2 border-[var(--color-primary)] animate-fade-in relative">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[var(--color-primary)] rounded-lg text-[var(--color-primary-foreground)]">
                <Terminal size={20}/>
             </div>
             <div>
                <h3 className="text-xl font-bold">Inicjalizacja Bazy Danych</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Wymagane do działania aplikacji</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-[#1e1e1e] text-gray-300 font-mono text-sm custom-scrollbar relative">
          <div className="mb-6 bg-[var(--color-surface-highlight)] text-[var(--color-text-main)] p-4 rounded-lg border border-[var(--color-primary)] font-sans shadow-lg">
            <h4 className="font-bold text-[var(--color-primary)] mb-2 flex items-center gap-2">🚀 Instrukcja Instalacji</h4>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Skopiuj poniższy kod SQL przyciskiem na dole.</li>
              <li>Otwórz panel Supabase swojego projektu i przejdź do zakładki <strong>SQL Editor</strong>.</li>
              <li>Wklej kod i kliknij <strong>Run</strong>.</li>
              <li>Po wykonaniu skryptu zaloguj się danymi:</li>
            </ol>
            <div className="mt-3 p-3 bg-black/20 rounded border border-[var(--color-border)] font-mono text-xs">
               <div>Login: <strong className="text-[var(--color-primary)]">admin</strong></div>
               <div>Hasło: <strong className="text-[var(--color-primary)]">admin123</strong></div>
            </div>
          </div>
          <pre className="whitespace-pre-wrap select-all">{sqlSchema}</pre>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-end">
           <Button 
             onClick={copyToClipboard}
             className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-bold shadow-lg hover:brightness-110"
           >
             <Copy size={18} className="mr-2"/> Skopiuj Kod SQL
           </Button>
        </div>
      </Card>
    </div>
  );
};
