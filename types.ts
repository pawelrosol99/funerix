
export type UserRole = 'super_admin' | 'client';
export type CompanyRole = 'owner' | 'employee' | null;

export interface UserPreferences {
  layoutMode: 'sidebar' | 'topbar';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  companyId: string;
  companyName: string;
  branchId?: string;
  branchName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  senderId?: string;
  senderName?: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  requestNumber: string; // Format URL/2023/1
  userId: string;
  companyId: string;
  branchId?: string;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  daysCount: number;
  type: 'vacation' | 'sick' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  
  // Audit fields
  resolvedBy?: string; // Admin ID
  resolvedByName?: string; // Admin Name Snapshot
  resolvedAt?: string; // ISO Date

  user?: User; // For admin view display join
}

export interface Company {
  id: string;
  company_number: string; // Format U00001
  nip: string;
  name: string;
  street: string;
  city: string;
  zip_code: string;
  phone: string;
  photo_url?: string;
  package_type: 'basic' | 'cremation' | 'funerals' | 'full'; // Added 'funerals'
  
  // Bulletin Board Configuration
  bulletinConfig?: {
    enabled: boolean;
    displayCategories: string[]; // List of Category IDs to show on dashboard
  };

  created_at: string;
}

export interface Branch {
  id: string;
  companyId: string;
  branch_number: string; // Format U00001/1
  name: string;
  street: string;
  city: string;
  zip_code: string;
  phone: string;
  created_at: string;
}

// --- Payroll ---
export interface PayrollBonus {
  id: string;
  companyId: string;
  branchId?: string; // Optional if specific to branch
  name: string;
  amount: number;
}

export interface UserBonus {
  id: string;
  userId: string;
  companyId: string;
  bonusId: string; // Reference to PayrollBonus definition
  name: string; // Snapshot of name
  amount: number; // Snapshot of amount
  timestamp: string; // ISO Date
}

// --- Work Sessions ---
export interface WorkSession {
  id: string;
  userId: string;
  companyId: string;
  branchId?: string;
  
  startTime: string; // ISO String
  endTime?: string; // ISO String
  
  // Edit Request logic
  originalStartTime?: string;
  originalEndTime?: string;
  editedStartTime?: string;
  editedEndTime?: string;
  
  status: 'active' | 'completed' | 'pending_approval'; 
  // pending_approval means user edited times and admin needs to confirm
  
  // Audit fields for session edits
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: string;

  user?: User; // Joined for admin view
}

// --- New Modules Types ---

export interface Furnace {
  id: string;
  companyId: string;
  branchId?: string; // Optional linkage to specific branch
  name: string;
  color: string;
}

export interface CremationOptionGroup {
  id: string;
  companyId: string;
  name: string;
}

export interface CremationOption {
  id: string;
  groupId: string;
  companyId: string; // Denormalized for easier access
  name: string;
  color: string;
  isDefault: boolean;
}

export interface CompanyTag {
  id: string;
  companyId: string;
  name: string;
  color?: string; // Added color for UI styling
}

export interface Driver {
  id: string;
  cooperatingCompanyId: string;
  name: string; // First and Last name in one field
  phone: string;
}

export interface CooperatingCompany {
  id: string;
  companyId: string; // Owner company
  tagId?: string; // Optional Tag Link
  nip: string;
  name: string;
  street: string;
  city: string;
  phone: string;
  email: string;
}

export interface DeceasedData {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  date_of_death?: string;
  pesel?: string;
}

export interface ApplicantData {
  first_name: string;
  last_name: string;
  phone: string;
  relation?: string;
}

export interface CremationHistoryEntry {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored';
  userId: string;
  userName: string;
  details?: string;
}

export interface CremationItem {
  id: string; // Unique ID within the cremation list
  warehouseItemId: string; // Reference to original item
  type: 'product' | 'service';
  name: string;
  photoUrl?: string;
  price: number; // Price at the moment of addition (editable)
  quantity: number;
}

export interface Cremation {
  id: string;
  companyId: string;
  branchId?: string;
  cremation_number: string; // Format KREM/U00001/1
  
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  
  cooperatingCompanyId: string;
  furnaceId: string;
  
  // Array of selected Option IDs
  selectedOptions: string[];
  
  deceased?: DeceasedData;
  applicant?: ApplicantData;
  
  // Financials & Products
  items?: CremationItem[];
  isPaid?: boolean;
  
  created_at: string;
  isDeleted?: boolean; // Soft delete flag
  
  history?: CremationHistoryEntry[];
}

export interface User {
  id: string;
  client_number?: string; // Format 00001
  role: UserRole;
  login?: string; // Optional for clients registering via email
  password?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  
  // Profile Customization
  photoUrl?: string; 
  useIcon?: boolean; // If true, display icon instead of photo

  // Employment Data
  vacation_days_total?: number;
  vacation_days_used?: number;
  hourlyRate?: number;

  preferences: UserPreferences;
  created_at: string;
  
  // Company Association
  companyId?: string;
  companyRole?: CompanyRole;
  
  // Branch Association (Optional - if user belongs to a specific branch)
  branchId?: string;
}

export interface ThemeCssVars {
  [key: string]: string;
}

export interface Theme {
  id: string;
  name: string;
  cssVars: {
    light: ThemeCssVars;
    dark: ThemeCssVars;
  };
}

// --- Document Editor Types ---

export interface DocumentCategory {
  id: string;
  companyId: string;
  name: string;
}

export type LayerType = 'text' | 'image' | 'shape';

export interface DocumentLayer {
  id: string;
  type: LayerType;
  content: string; // Text content or Image URL
  x: number;
  y: number;
  width?: number;
  height?: number;
  
  // Style properties
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string; // 'bold' | 'normal'
  fontStyle?: string; // 'italic' | 'normal'
  textDecoration?: string; // 'underline' | 'none'
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  zIndex: number;
}

export interface DocumentTemplate {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  orientation: 'portrait' | 'landscape';
  layers: DocumentLayer[];
  created_at: string;
}

// --- Warehouse Types ---

export type WarehouseItemType = 'product' | 'service';
export type ServiceUnit = 'hour' | 'day' | 'km' | 'piece';

export interface WarehouseCategory {
  id: string;
  companyId: string;
  type: WarehouseItemType;
  name: string;
  parentId?: string; // If present, it's a subcategory
}

export interface WarehouseItem {
  id: string;
  companyId: string;
  branchId?: string; // Optional link to specific branch
  type: WarehouseItemType;
  
  categoryId: string;
  subCategoryId?: string;
  
  name: string;
  photoUrl?: string; // Base64 or URL
  
  // Pricing
  salesPrice: number; // Gross price usually
  
  // Product Specifics
  manufacturer?: string; // ID of manufacturer or name
  dimensions?: string; // e.g. "20x30x40"
  purchasePrice?: number;
  quantity?: number;
  
  // Service Specifics
  unit?: ServiceUnit;
  
  created_at: string;
}

export interface Manufacturer {
  id: string;
  nip: string;
  name: string;
  city: string;
  street: string;
  phone: string;
  email: string;
}

// --- Funeral Module Types ---

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg';

export interface Vehicle {
  id: string;
  companyId: string;
  branchId?: string;
  
  model: string;
  manufacturer?: string;
  photoUrl?: string;
  fuelType?: FuelType;
  color?: string;
  seats?: number;
  
  inspectionDate?: string; // Data przeglądu
  technicalDate?: string; // Badanie techniczne
  
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isChecked?: boolean; // used in runtime, usually false in template
}

export interface Checklist {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  items: ChecklistItem[];
  created_at: string;
}

// New Entity: Relation (Powiązanie)
export interface Relation {
   id: string;
   companyId: string;
   name: string;
   // List of Category IDs (can include Subcategories) that belong to this relation
   categoryIds: string[]; 
}

// New Entity: Funeral Sale Item (Product/Service in Funeral context)
export interface FuneralSaleItem {
   id: string; // unique instance id
   warehouseItemId: string; // link to stock item
   relationId?: string; // optional link to which relation it came from
   name: string;
   type: WarehouseItemType;
   photoUrl?: string;
   quantity: number;
   price: number; // Editable price for this specific funeral
}

// -- Ceremony Types --

export type FuneralType = 'burial' | 'cremation';
export type GraveType = 'single_new' | 'double_new' | 'quad_new' | 'deepening' | 'from_top';
export type GraveServiceSource = 'us' | 'cemetery';

export interface FuneralCeremony {
   type: FuneralType;
   
   // Cremation Details (if type is cremation)
   cremation?: {
      date?: string;
      time?: string;
      placeId?: string; // CooperatingCompany ID
      placeName?: string; // Fallback text
      isFamilyPresent: boolean;
      isConfirmed: boolean;
      assignedStaffIds?: string[];
      assignedVehicleId?: string;
   };

   // Farewell / Pożegnanie (Optional)
   farewell?: {
      active: boolean;
      date?: string;
      time?: string;
      placeId?: string;
      placeName?: string;
   };

   // Mass / Msza (Optional)
   mass?: {
      active: boolean;
      date?: string;
      time?: string;
      placeId?: string;
      placeName?: string;
   };

   // Cemetery / Pogrzeb
   cemetery?: {
      active: boolean;
      date?: string;
      time?: string;
      placeId?: string;
      placeName?: string;
      
      // Location
      graveLocation?: {
         quarter?: string;
         row?: string;
         place?: string;
      };
      
      graveType?: GraveType;
      serviceSource?: GraveServiceSource; // Obsługa grobu
   };
}

export interface FuneralChecklistInstance {
   originalId: string; // ID of the template
   name: string;
   items: {
      id: string;
      label: string;
      isChecked: boolean;
   }[];
}

export interface Funeral {
  id: string;
  companyId: string;
  branchId?: string;
  funeral_number: string; // Format P/BranchNum/Date/Index
  
  // Tab 1: Wyjazd (Transport)
  deceased_first_name: string;
  deceased_last_name: string;
  pickup_address: string; // Adres odbioru ciała
  pickup_place_id?: string; // Optional reference to company
  
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_phone: string;
  
  transport_date: string; // YYYY-MM-DD
  transport_time: string; // HH:mm
  
  assigned_staff_ids: string[];
  assigned_vehicle_id?: string;
  
  // Important Notes
  notes?: string;

  // Tab 2: Dane (Details)
  death_date?: string;
  death_place?: string;
  death_certificate_number?: string;
  
  // Tab 3: Ceremonia
  ceremony?: FuneralCeremony;

  // Tab 4: Products (New)
  saleItems?: FuneralSaleItem[];

  // Tab 5: Checklisty
  assignedChecklists?: FuneralChecklistInstance[];

  created_at: string;
  events?: CremationHistoryEntry[]; // Reusing generic history entry
}

// --- BULLETIN BOARD TYPES ---

export interface BulletinCategory {
  id: string;
  name: string;
  parentId?: string; // Null for root categories
}

export interface BulletinAd {
  id: string;
  adNumber: string; // OG/2023/001
  userId: string;
  categoryId: string;
  subCategoryId?: string;
  
  title: string;
  content: string;
  price: number;
  phone: string;
  email: string;
  
  // Location
  location: string; // Voivodeship
  
  status: 'active' | 'closed';
  createdAt: string;
  
  // Joined
  userName?: string; // Display name of creator
}
