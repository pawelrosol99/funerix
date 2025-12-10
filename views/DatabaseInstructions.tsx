
import React from 'react';
import { Card, Button } from '../components/UI';
import { X, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DatabaseInstructionsProps {
  onClose: () => void;
}

export const DatabaseInstructions: React.FC<DatabaseInstructionsProps> = ({ onClose }) => {
  const sqlSchema = `
-- ==========================================
-- 0. RESET SCHEMATU (CZYZCZENIE BAZY)
-- ==========================================
-- UWAGA: Poniższe polecenia usuną wszystkie dane z bazy!
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ==========================================
-- TWORZENIE TABEL
-- ==========================================

-- 1. Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number TEXT NOT NULL, -- Unikalny numer U00001
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

-- 2. Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_number TEXT NOT NULL, -- Format U00001/1
  name TEXT NOT NULL,
  street TEXT,
  city TEXT,
  zip_code TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_number TEXT, -- Indywidualny numer klienta
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
  hourly_rate NUMERIC,
  preferences JSONB DEFAULT '{"layoutMode": "sidebar"}',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  client_number TEXT, -- ZAREZERWOWANY NUMER KLIENTA
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  branch_name TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT, 
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Work Sessions
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

-- 7. Leave Requests (Wnioski Urlopowe)
-- UPEWNIJ SIĘ, ŻE TE KOLUMNY ISTNIEJĄ DLA POPRAWNEGO DZIAŁANIA STATUSÓW
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
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_by_name TEXT,
  resolved_at TIMESTAMPTZ
);

-- 8. Themes
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  css_vars JSONB NOT NULL
);

-- 9. Manufacturers
CREATE TABLE manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip TEXT,
  name TEXT NOT NULL,
  city TEXT,
  street TEXT,
  phone TEXT,
  email TEXT
);

-- 10. Warehouse Categories
CREATE TABLE warehouse_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT, -- 'product', 'service'
  name TEXT NOT NULL,
  parent_id UUID REFERENCES warehouse_categories(id) ON DELETE CASCADE
);

-- 11. Warehouse Items
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

-- 12. Relations (Product Bundles)
CREATE TABLE relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_ids JSONB DEFAULT '[]'
);

-- 13. Cooperating Companies
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

-- 14. Company Tags
CREATE TABLE company_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT
);

-- 15. Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperating_company_id UUID REFERENCES coop_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT
);

-- 16. Vehicles
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

-- 17. Furnaces
CREATE TABLE furnaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT
);

-- 18. Cremation Option Groups & Options
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

-- 19. Cremations
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

-- 20. Checklists
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Funerals
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

-- 22. Documents
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

-- 23. Payroll Bonuses
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

-- 24. Bulletin Board
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

-- ==========================================
-- WYŁĄCZENIE RLS
-- ==========================================
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE coop_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE furnaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE cremation_option_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE cremation_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE cremations DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE funerals DISABLE ROW LEVEL SECURITY;
ALTER TABLE doc_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE doc_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_bonuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_bonuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_ads DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ==========================================
-- SEED DATA
-- ==========================================
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
  'jogi', 
  'jogi123', 
  'Jogi', 
  'Admin', 
  'jogi@urneo.pl', 
  '{"layoutMode": "sidebar"}'
);
  `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    toast.success('Skopiowano SQL do schowka');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col p-0 border-2 border-[var(--color-primary)] animate-fade-in relative">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
          <h3 className="text-xl font-bold">Aktualizacja Bazy Danych (Supabase)</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full"><X size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-[#1e1e1e] text-gray-300 font-mono text-sm custom-scrollbar relative">
          <div className="mb-4 bg-[var(--color-surface-highlight)] text-[var(--color-text-main)] p-4 rounded-lg border border-[var(--color-primary)] font-sans">
            <h4 className="font-bold text-[var(--color-primary)] mb-2">Wymagana Aktualizacja!</h4>
            <p className="mb-2">Aby funkcje statusów wniosków i numeracji klientów działały poprawnie, musisz zaktualizować schemat bazy.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Skopiuj poniższy kod SQL.</li>
              <li>Wklej go w zakładce <strong>SQL Editor</strong> w Supabase.</li>
              <li>Uruchom (Run). <strong>Uwaga: To usunie stare dane!</strong></li>
            </ol>
          </div>
          <pre className="whitespace-pre-wrap">{sqlSchema}</pre>
          
          <Button 
            onClick={copyToClipboard}
            className="fixed bottom-8 right-8 shadow-2xl z-50 bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          >
            <Copy size={18} className="mr-2"/> Skopiuj SQL
          </Button>
        </div>
      </Card>
    </div>
  );
};
