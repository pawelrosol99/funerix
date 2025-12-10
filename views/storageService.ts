
import { User, Theme, Company, Branch, Furnace, CremationOptionGroup, CremationOption, CooperatingCompany, Driver, Cremation, CompanyTag, DocumentCategory, DocumentTemplate, CremationHistoryEntry, WarehouseCategory, WarehouseItem, Manufacturer, Vehicle, Checklist, Funeral, Relation, Invitation, WorkSession, PayrollBonus, UserBonus, Notification, UserRole } from '../types';
import { URNEO_THEME_CSS } from '../constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Helper to handle snake_case (DB) <-> camelCase (App)
const mapUserFromDB = (u: any): User => ({
  ...u,
  first_name: u.first_name,
  last_name: u.last_name,
  client_number: u.client_number,
  companyId: u.company_id,
  branchId: u.branch_id,
  companyRole: u.company_role,
  vacation_days_total: u.vacation_days_total,
  vacation_days_used: u.vacation_days_used,
  hourlyRate: u.hourly_rate,
  photoUrl: u.photo_url,
  useIcon: u.use_icon,
  created_at: u.created_at,
  preferences: typeof u.preferences === 'string' ? JSON.parse(u.preferences) : (u.preferences || { layoutMode: 'sidebar' })
});

const mapUserToDB = (u: Partial<User>) => {
  const dbUser: any = { ...u };
  if (u.companyId !== undefined) dbUser.company_id = u.companyId;
  if (u.branchId !== undefined) dbUser.branch_id = u.branchId;
  if (u.companyRole !== undefined) dbUser.company_role = u.companyRole;
  if (u.vacation_days_total !== undefined) dbUser.vacation_days_total = u.vacation_days_total;
  if (u.vacation_days_used !== undefined) dbUser.vacation_days_used = u.vacation_days_used;
  if (u.hourlyRate !== undefined) dbUser.hourly_rate = u.hourlyRate;
  if (u.photoUrl !== undefined) dbUser.photo_url = u.photoUrl;
  if (u.useIcon !== undefined) dbUser.use_icon = u.useIcon;
  delete dbUser.companyId;
  delete dbUser.branchId;
  delete dbUser.companyRole;
  delete dbUser.hourlyRate;
  delete dbUser.photoUrl;
  delete dbUser.useIcon;
  return dbUser;
};

// Generic mapping helpers
const toSnake = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// --- Initialization ---
export const initializeDatabase = async () => {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase credentials missing. App will not function correctly.");
  }
};

// --- Auth Utils (Improved) ---
export const loginUser = async (identifier: string, password: string): Promise<User | null> => {
  console.log(`[Auth] Attempting login for: ${identifier}`);
  
  // 1. Fetch user by identifier first (login OR email)
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${identifier},login.eq.${identifier}`);

  if (error) {
    console.error("[Auth] Supabase select error:", error);
    if (error.code === '42501') {
       throw new Error('RLS_ERROR'); // Permission denied
    }
    return null;
  }

  if (!users || users.length === 0) {
    console.warn("[Auth] No user found with that identifier.");
    return null;
  }

  // 2. Check password (in JS to avoid RLS/Filter issues and allow easier debugging)
  const userRecord = users.find(u => u.password === password);

  if (userRecord) {
    console.log("[Auth] User found and password matched.");
    const user = mapUserFromDB(userRecord);
    localStorage.setItem('lively_db_session', JSON.stringify({ userId: user.id }));
    return user;
  } else {
    console.warn("[Auth] User found but password incorrect.");
    return null;
  }
};

export const getCurrentSession = async (): Promise<User | null> => {
  const rememberId = localStorage.getItem('urneo_remember_token');
  if (rememberId) {
     const { data } = await supabase.from('users').select('*').eq('id', rememberId).single();
     if(data) return mapUserFromDB(data);
  }

  const session = localStorage.getItem('lively_db_session');
  if (!session) return null;
  const { userId } = JSON.parse(session);
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return data ? mapUserFromDB(data) : null;
};

export const logoutUser = () => {
  localStorage.removeItem('lively_db_session');
  localStorage.removeItem('urneo_remember_token');
};

export const registerClient = async (data: Partial<User>): Promise<User | null> => {
  const { data: users } = await supabase.from('users').select('client_number');
  const max = Math.max(...(users || []).map((u:any) => parseInt(u.client_number || '0', 10)));
  const nextClientNumber = (isNaN(max) || max < 0 ? 1 : max + 1).toString().padStart(5, '0');

  const newUser: Partial<User> = {
    ...data,
    role: 'client' as UserRole,
    client_number: nextClientNumber,
    preferences: { layoutMode: 'sidebar' },
    vacation_days_total: 0,
    vacation_days_used: 0
  };

  const dbUser = mapUserToDB(newUser);
  const { data: inserted, error } = await supabase.from('users').insert(dbUser).select().single();
  
  if (error) {
    console.error("Registration error", error);
    return null;
  }
  return mapUserFromDB(inserted);
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const { data } = await supabase.from('users').select('*').ilike('email', email).single();
  return data ? mapUserFromDB(data) : undefined;
};

// --- Notifications API ---
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId);
  if (error) { console.error(error); return []; }
  return data.map((n: any) => ({ ...n, userId: n.user_id, isRead: n.is_read }));
};

export const createNotification = async (notification: Partial<Notification> & { userId: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string }) => {
  const dbNotif = {
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    is_read: false
  };
  await supabase.from('notifications').insert(dbNotif);
};

export const markNotificationAsRead = async (id: string) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
};

export const deleteNotification = async (id: string) => {
  await supabase.from('notifications').delete().eq('id', id);
};

// --- Users API ---
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) { console.error(error); return []; }
  return data.map(mapUserFromDB);
};

export const saveUser = async (user: User) => {
  const dbUser = mapUserToDB(user);
  if (user.id) {
    await supabase.from('users').update(dbUser).eq('id', user.id);
  } else {
    await supabase.from('users').insert(dbUser);
  }
};

export const deleteUser = async (userId: string) => {
  await supabase.from('users').delete().eq('id', userId);
};

// --- Company API ---
export const getCompanies = async (): Promise<Company[]> => {
  const { data } = await supabase.from('companies').select('*');
  return (data || []).map((c: any) => ({ ...c, company_number: c.company_number, package_type: c.package_type, photo_url: c.photo_url }));
};

export const createCompany = async (data: Partial<Company>, ownerUserId: string): Promise<Company | null> => {
  const { data: comps } = await supabase.from('companies').select('company_number');
  const max = Math.max(...(comps || []).map((c:any) => parseInt(c.company_number.substring(1) || '0', 10)));
  const nextNum = 'U' + (isNaN(max) ? 1 : max + 1).toString().padStart(5, '0');

  const newCompany = {
    ...data,
    company_number: nextNum,
    package_type: data.package_type || 'basic'
  };

  const { data: inserted, error } = await supabase.from('companies').insert(newCompany).select().single();
  
  if (error || !inserted) return null;

  await supabase.from('users').update({ company_id: inserted.id, company_role: 'owner' }).eq('id', ownerUserId);

  return inserted as Company;
};

export const getCompanyById = async (companyId: string): Promise<Company | undefined> => {
  const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
  return data as Company;
};

// --- Branch API ---
export const getBranches = async (): Promise<Branch[]> => {
  const { data } = await supabase.from('branches').select('*');
  return (data || []).map((b: any) => ({ ...b, companyId: b.company_id, branch_number: b.branch_number }));
};

export const getCompanyBranches = async (companyId: string): Promise<Branch[]> => {
  const { data } = await supabase.from('branches').select('*').eq('company_id', companyId);
  return (data || []).map((b: any) => ({ ...b, companyId: b.company_id, branch_number: b.branch_number }));
};

export const createBranch = async (companyId: string, data: Partial<Branch>): Promise<Branch | null> => {
  const company = await getCompanyById(companyId);
  if (!company) return null;

  const branches = await getCompanyBranches(companyId);
  const suffixes = branches.map(b => {
    const parts = b.branch_number.split('/');
    return parts.length === 2 ? parseInt(parts[1], 10) : 0;
  });
  const max = Math.max(...suffixes, 0);
  const branchNum = `${company.company_number}/${max + 1}`;

  const newBranch = {
    company_id: companyId,
    branch_number: branchNum,
    name: data.name,
    street: data.street,
    city: data.city,
    zip_code: data.zip_code,
    phone: data.phone
  };

  const { data: inserted } = await supabase.from('branches').insert(newBranch).select().single();
  return inserted ? { ...inserted, companyId: inserted.company_id } : null;
};

export const updateBranch = async (branchId: string, data: Partial<Branch>) => {
  const dbData: any = { ...data };
  if (data.companyId) { dbData.company_id = data.companyId; delete dbData.companyId; }
  await supabase.from('branches').update(dbData).eq('id', branchId);
};

export const deleteBranch = async (branchId: string) => {
  await supabase.from('branches').delete().eq('id', branchId);
};

// --- Payroll Bonus ---
export const getPayrollBonuses = async (companyId: string): Promise<PayrollBonus[]> => {
  const { data } = await supabase.from('payroll_bonuses').select('*').eq('company_id', companyId);
  return (data || []).map((b: any) => ({ ...b, companyId: b.company_id, branchId: b.branch_id }));
};

export const savePayrollBonus = async (bonus: Partial<PayrollBonus> & { companyId: string }) => {
  const dbData = { 
    company_id: bonus.companyId,
    branch_id: bonus.branchId,
    name: bonus.name,
    amount: bonus.amount
  };
  if (bonus.id) {
    await supabase.from('payroll_bonuses').update(dbData).eq('id', bonus.id);
  } else {
    await supabase.from('payroll_bonuses').insert(dbData);
  }
};

export const deletePayrollBonus = async (id: string) => {
  await supabase.from('payroll_bonuses').delete().eq('id', id);
};

// --- User Bonus ---
export const getUserBonuses = async (userId: string): Promise<UserBonus[]> => {
  const { data } = await supabase.from('user_bonuses').select('*').eq('user_id', userId);
  return (data || []).map((b: any) => ({ ...b, userId: b.user_id, companyId: b.company_id, bonusId: b.bonus_id }));
};

export const saveUserBonus = async (bonus: Partial<UserBonus> & { userId: string, companyId: string, bonusId: string, name: string, amount: number }) => {
  const dbData = {
    user_id: bonus.userId,
    company_id: bonus.companyId,
    bonus_id: bonus.bonusId,
    name: bonus.name,
    amount: bonus.amount
  };
  await supabase.from('user_bonuses').insert(dbData);
};

// --- Work Sessions ---
export const getWorkSessions = async (companyId: string): Promise<WorkSession[]> => {
  const { data } = await supabase.from('work_sessions').select('*').eq('company_id', companyId);
  return (data || []).map(mapSessionFromDB);
};

export const getUserWorkSessions = async (userId: string): Promise<WorkSession[]> => {
  const { data } = await supabase.from('work_sessions').select('*').eq('user_id', userId);
  return (data || []).map(mapSessionFromDB);
};

const mapSessionFromDB = (s: any): WorkSession => ({
  id: s.id,
  userId: s.user_id,
  companyId: s.company_id,
  branchId: s.branch_id,
  startTime: s.start_time,
  endTime: s.end_time,
  originalStartTime: s.original_start_time,
  originalEndTime: s.original_end_time,
  editedStartTime: s.edited_start_time,
  editedEndTime: s.edited_end_time,
  status: s.status
});

export const startWorkSession = async (userId: string, companyId: string, branchId?: string): Promise<WorkSession | null> => {
  const { data: active } = await supabase.from('work_sessions').select('*').eq('user_id', userId).is('end_time', null).single();
  if (active) return mapSessionFromDB(active);

  const newSession = {
    user_id: userId,
    company_id: companyId,
    branch_id: branchId,
    start_time: new Date().toISOString(),
    status: 'active'
  };
  const { data: inserted } = await supabase.from('work_sessions').insert(newSession).select().single();
  return inserted ? mapSessionFromDB(inserted) : null;
};

export const endWorkSession = async (userId: string) => {
  const now = new Date().toISOString();
  await supabase.from('work_sessions').update({ end_time: now, status: 'completed' }).eq('user_id', userId).is('end_time', null);
};

export const requestSessionEdit = async (sessionId: string, newStart: string, newEnd?: string) => {
  const { data: session } = await supabase.from('work_sessions').select('*').eq('id', sessionId).single();
  if (session) {
    await supabase.from('work_sessions').update({
      original_start_time: session.start_time,
      original_end_time: session.end_time,
      edited_start_time: newStart,
      edited_end_time: newEnd,
      status: 'pending_approval'
    }).eq('id', sessionId);
  }
};

export const approveSessionEdit = async (sessionId: string, approved: boolean) => {
  const { data: session } = await supabase.from('work_sessions').select('*').eq('id', sessionId).single();
  if (session) {
    const updates: any = {
      status: 'completed',
      edited_start_time: null,
      edited_end_time: null,
      original_start_time: null,
      original_end_time: null
    };
    if (approved) {
      if (session.edited_start_time) updates.start_time = session.edited_start_time;
      if (session.edited_end_time) updates.end_time = session.edited_end_time;
    }
    await supabase.from('work_sessions').update(updates).eq('id', sessionId);
    
    const dateStr = new Date(updates.start_time || session.start_time).toLocaleDateString('pl-PL');
    await createNotification({
      userId: session.user_id,
      type: approved ? 'success' : 'error',
      title: approved ? 'Korekta zatwierdzona' : 'Korekta odrzucona',
      message: `Twoja prośba o zmianę czasu pracy z dnia ${dateStr} została ${approved ? 'zaakceptowana' : 'odrzucona'}.`
    });
  }
};

// --- Furnaces ---
export const getFurnaces = async (companyId: string): Promise<Furnace[]> => {
  const { data } = await supabase.from('furnaces').select('*').eq('company_id', companyId);
  return (data || []).map((f:any) => ({ ...f, companyId: f.company_id, branchId: f.branch_id }));
};

export const saveFurnace = async (furnace: Partial<Furnace> & { companyId: string }) => {
  const db = { 
    name: furnace.name, 
    color: furnace.color, 
    company_id: furnace.companyId,
    branch_id: furnace.branchId
  };
  if (furnace.id) await supabase.from('furnaces').update(db).eq('id', furnace.id);
  else await supabase.from('furnaces').insert(db);
};

export const deleteFurnace = async (id: string) => {
  await supabase.from('furnaces').delete().eq('id', id);
};

// --- Options ---
export const getOptionGroups = async (companyId: string): Promise<CremationOptionGroup[]> => {
  const { data } = await supabase.from('cremation_option_groups').select('*').eq('company_id', companyId);
  return (data || []).map((g:any) => ({ ...g, companyId: g.company_id }));
};

export const saveOptionGroup = async (group: Partial<CremationOptionGroup> & { companyId: string }) => {
  const db = { name: group.name, company_id: group.companyId };
  if (group.id) await supabase.from('cremation_option_groups').update(db).eq('id', group.id);
  else await supabase.from('cremation_option_groups').insert(db);
};

export const deleteOptionGroup = async (id: string) => {
  await supabase.from('cremation_option_groups').delete().eq('id', id);
};

export const getOptions = async (groupId: string): Promise<CremationOption[]> => {
  const { data } = await supabase.from('cremation_options').select('*').eq('group_id', groupId);
  return (data || []).map((o:any) => ({ ...o, groupId: o.group_id, companyId: o.company_id, isDefault: o.is_default }));
};

export const saveOption = async (option: Partial<CremationOption> & { groupId: string, companyId: string }) => {
  const db = {
    group_id: option.groupId,
    company_id: option.companyId,
    name: option.name,
    color: option.color,
    is_default: option.isDefault
  };
  if (option.isDefault) {
    await supabase.from('cremation_options').update({ is_default: false }).eq('group_id', option.groupId);
  }
  if (option.id) await supabase.from('cremation_options').update(db).eq('id', option.id);
  else await supabase.from('cremation_options').insert(db);
};

export const deleteOption = async (id: string) => {
  await supabase.from('cremation_options').delete().eq('id', id);
};

// --- Coop Companies ---
export const getCoopCompanies = async (companyId: string): Promise<CooperatingCompany[]> => {
  const { data } = await supabase.from('coop_companies').select('*').eq('company_id', companyId);
  return (data || []).map((c:any) => ({ ...c, companyId: c.company_id, tagId: c.tag_id }));
};

export const getCoopCompanyById = async (id: string): Promise<CooperatingCompany | null> => {
  const { data } = await supabase.from('coop_companies').select('*').eq('id', id).single();
  return data ? { ...data, companyId: data.company_id, tagId: data.tag_id } : null;
};

export const saveCoopCompany = async (company: Partial<CooperatingCompany> & { companyId: string }) => {
  const db = {
    company_id: company.companyId,
    tag_id: company.tagId,
    nip: company.nip,
    name: company.name,
    street: company.street,
    city: company.city,
    phone: company.phone,
    email: company.email
  };
  if (company.id) await supabase.from('coop_companies').update(db).eq('id', company.id);
  else await supabase.from('coop_companies').insert(db);
};

export const deleteCoopCompany = async (id: string) => {
  await supabase.from('coop_companies').delete().eq('id', id);
};

// --- Company Tags ---
export const getTags = async (companyId: string): Promise<CompanyTag[]> => {
  const { data } = await supabase.from('company_tags').select('*').eq('company_id', companyId);
  return (data || []).map((t:any) => ({ ...t, companyId: t.company_id }));
};

export const saveTag = async (tag: Partial<CompanyTag> & { companyId: string }) => {
  const db = { company_id: tag.companyId, name: tag.name, color: tag.color };
  if (tag.id) await supabase.from('company_tags').update(db).eq('id', tag.id);
  else await supabase.from('company_tags').insert(db);
};

export const deleteTag = async (id: string) => {
  await supabase.from('company_tags').delete().eq('id', id);
};

// --- Drivers ---
export const getDrivers = async (coopId: string): Promise<Driver[]> => {
  const { data } = await supabase.from('drivers').select('*').eq('cooperating_company_id', coopId);
  return (data || []).map((d:any) => ({ ...d, cooperatingCompanyId: d.cooperating_company_id }));
};

export const saveDriver = async (driver: Partial<Driver> & { cooperatingCompanyId: string }) => {
  const db = { cooperating_company_id: driver.cooperatingCompanyId, name: driver.name, phone: driver.phone };
  if (driver.id) await supabase.from('drivers').update(db).eq('id', driver.id);
  else await supabase.from('drivers').insert(db);
};

export const deleteDriver = async (id: string) => {
  await supabase.from('drivers').delete().eq('id', id);
};

// --- Vehicles ---
export const getVehicles = async (companyId: string): Promise<Vehicle[]> => {
  const { data } = await supabase.from('vehicles').select('*').eq('company_id', companyId);
  return (data || []).map((v:any) => ({ 
    ...v, 
    companyId: v.company_id, 
    branchId: v.branch_id,
    fuelType: v.fuel_type,
    photoUrl: v.photo_url,
    inspectionDate: v.inspection_date,
    technicalDate: v.technical_date,
    created_at: v.created_at 
  }));
};

export const saveVehicle = async (vehicle: Partial<Vehicle> & { companyId: string }) => {
  const db = {
    company_id: vehicle.companyId,
    branch_id: vehicle.branchId,
    model: vehicle.model,
    manufacturer: vehicle.manufacturer,
    photo_url: vehicle.photoUrl,
    fuel_type: vehicle.fuelType,
    color: vehicle.color,
    seats: vehicle.seats,
    inspection_date: vehicle.inspectionDate,
    technical_date: vehicle.technicalDate
  };
  if (vehicle.id) await supabase.from('vehicles').update(db).eq('id', vehicle.id);
  else await supabase.from('vehicles').insert(db);
};

export const deleteVehicle = async (id: string) => {
  await supabase.from('vehicles').delete().eq('id', id);
};

// --- Checklists ---
export const getChecklists = async (companyId: string): Promise<Checklist[]> => {
  const { data } = await supabase.from('checklists').select('*').eq('company_id', companyId);
  return (data || []).map((c:any) => ({ ...c, companyId: c.company_id, branchId: c.branch_id }));
};

export const saveChecklist = async (checklist: Partial<Checklist> & { companyId: string }) => {
  const db = {
    company_id: checklist.companyId,
    branch_id: checklist.branchId,
    name: checklist.name,
    items: checklist.items
  };
  if (checklist.id) await supabase.from('checklists').update(db).eq('id', checklist.id);
  else await supabase.from('checklists').insert(db);
};

export const deleteChecklist = async (id: string) => {
  await supabase.from('checklists').delete().eq('id', id);
};

// --- Manufacturers ---
export const getManufacturers = async (): Promise<Manufacturer[]> => {
  const { data } = await supabase.from('manufacturers').select('*');
  return data || [];
};

export const saveManufacturer = async (manufacturer: Partial<Manufacturer>) => {
  if (manufacturer.id) await supabase.from('manufacturers').update(manufacturer).eq('id', manufacturer.id);
  else await supabase.from('manufacturers').insert(manufacturer);
};

export const deleteManufacturer = async (id: string) => {
  await supabase.from('manufacturers').delete().eq('id', id);
};

// --- Warehouse ---
export const getWarehouseCategories = async (companyId: string, type?: string): Promise<WarehouseCategory[]> => {
  let query = supabase.from('warehouse_categories').select('*').eq('company_id', companyId);
  if (type) query = query.eq('type', type);
  const { data } = await query;
  return (data || []).map((c:any) => ({ ...c, companyId: c.company_id, parentId: c.parent_id }));
};

export const saveWarehouseCategory = async (category: Partial<WarehouseCategory> & { companyId: string }) => {
  const db = { company_id: category.companyId, type: category.type, name: category.name, parent_id: category.parentId };
  if (category.id) await supabase.from('warehouse_categories').update(db).eq('id', category.id);
  else await supabase.from('warehouse_categories').insert(db);
};

export const deleteWarehouseCategory = async (id: string) => {
  await supabase.from('warehouse_categories').delete().eq('id', id);
};

export const getWarehouseItems = async (companyId: string, type?: string): Promise<WarehouseItem[]> => {
  let query = supabase.from('warehouse_items').select('*').eq('company_id', companyId);
  if (type) query = query.eq('type', type);
  const { data } = await query;
  return (data || []).map((i:any) => ({
    ...i,
    companyId: i.company_id,
    branchId: i.branch_id,
    categoryId: i.category_id,
    subCategoryId: i.sub_category_id,
    photoUrl: i.photo_url,
    salesPrice: i.sales_price,
    purchasePrice: i.purchase_price,
    created_at: i.created_at
  }));
};

export const saveWarehouseItem = async (item: Partial<WarehouseItem> & { companyId: string }) => {
  const db = {
    company_id: item.companyId,
    branch_id: item.branchId,
    type: item.type,
    category_id: item.categoryId,
    sub_category_id: item.subCategoryId,
    name: item.name,
    photo_url: item.photoUrl,
    sales_price: item.salesPrice,
    purchase_price: item.purchasePrice,
    quantity: item.quantity,
    unit: item.unit,
    manufacturer: item.manufacturer,
    dimensions: item.dimensions
  };
  if (item.id) await supabase.from('warehouse_items').update(db).eq('id', item.id);
  else await supabase.from('warehouse_items').insert(db);
};

export const updateWarehouseStock = async (itemId: string, quantityChange: number) => {
  const { data: item } = await supabase.from('warehouse_items').select('quantity').eq('id', itemId).single();
  if (item) {
    const newQty = (item.quantity || 0) + quantityChange;
    await supabase.from('warehouse_items').update({ quantity: newQty }).eq('id', itemId);
  }
};

export const deleteWarehouseItem = async (id: string) => {
  await supabase.from('warehouse_items').delete().eq('id', id);
};

// --- Relations ---
export const getRelations = async (companyId: string): Promise<Relation[]> => {
  const { data } = await supabase.from('relations').select('*').eq('company_id', companyId);
  return (data || []).map((r:any) => ({ ...r, companyId: r.company_id, categoryIds: r.category_ids }));
};

export const saveRelation = async (relation: Partial<Relation> & { companyId: string }) => {
  const db = { company_id: relation.companyId, name: relation.name, category_ids: relation.categoryIds };
  if (relation.id) await supabase.from('relations').update(db).eq('id', relation.id);
  else await supabase.from('relations').insert(db);
};

export const deleteRelation = async (id: string) => {
  await supabase.from('relations').delete().eq('id', id);
};

// --- Cremations ---
export const getCremations = async (companyId: string): Promise<Cremation[]> => {
  const { data } = await supabase.from('cremations').select('*').eq('company_id', companyId);
  return (data || []).map((c:any) => ({
    id: c.id,
    companyId: c.company_id,
    branchId: c.branch_id,
    cremation_number: c.cremation_number,
    date: c.date,
    time: c.time,
    cooperating_company_id: c.cooperating_company_id,
    furnace_id: c.furnace_id,
    selectedOptions: c.selected_options || [],
    deceased: c.deceased,
    applicant: c.applicant,
    items: c.items,
    isPaid: c.is_paid,
    isDeleted: c.is_deleted,
    history: c.history,
    created_at: c.created_at
  }));
};

export const saveCremation = async (cremation: Partial<Cremation> & { companyId: string, branchId?: string }, user?: User) => {
  let num = cremation.cremation_number;
  if (!cremation.id) {
    const { count } = await supabase.from('cremations').select('*', { count: 'exact', head: true }).eq('company_id', cremation.companyId);
    const company = await getCompanyById(cremation.companyId);
    num = `KREM/${company?.company_number}/${(count||0) + 1}`;
  }

  const historyEntry: CremationHistoryEntry = {
    timestamp: new Date().toISOString(),
    action: cremation.id ? 'updated' : 'created',
    userId: user?.id || 'unknown',
    userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
    details: cremation.id ? 'Edycja danych' : 'Utworzenie kremacji'
  };

  let history = [historyEntry];
  if(cremation.id) {
     const { data: existing } = await supabase.from('cremations').select('history').eq('id', cremation.id).single();
     if(existing?.history) history = [...existing.history, historyEntry];
  }

  const db: any = {
    company_id: cremation.companyId,
    branch_id: cremation.branchId,
    cremation_number: num,
    date: cremation.date,
    time: cremation.time,
    cooperating_company_id: cremation.cooperatingCompanyId,
    furnace_id: cremation.furnaceId,
    selected_options: cremation.selectedOptions,
    deceased: cremation.deceased,
    applicant: cremation.applicant,
    items: cremation.items,
    is_paid: cremation.isPaid,
    is_deleted: cremation.isDeleted || false,
    history: history
  };

  if (cremation.id) await supabase.from('cremations').update(db).eq('id', cremation.id);
  else await supabase.from('cremations').insert(db);
};

export const deleteCremation = async (id: string, user?: User, restoreStock: boolean = false) => {
  await supabase.from('cremations').update({ is_deleted: true }).eq('id', id);
};

// --- Funerals ---
export const getFunerals = async (companyId: string): Promise<Funeral[]> => {
  const { data } = await supabase.from('funerals').select('*').eq('company_id', companyId);
  return (data || []).map((f:any) => ({
    id: f.id,
    companyId: f.company_id,
    branchId: f.branch_id,
    funeral_number: f.funeral_number,
    deceased_first_name: f.deceased_first_name,
    deceased_last_name: f.deceased_last_name,
    pickup_address: f.pickup_address,
    pickup_place_id: f.pickup_place_id,
    applicant_first_name: f.applicant_first_name,
    applicant_last_name: f.applicant_last_name,
    applicant_phone: f.applicant_phone,
    transport_date: f.transport_date,
    transport_time: f.transport_time,
    assigned_staff_ids: f.assigned_staff_ids,
    assigned_vehicle_id: f.assigned_vehicle_id,
    notes: f.notes,
    death_date: f.death_date,
    death_place: f.death_place,
    death_certificate_number: f.death_certificate_number,
    ceremony: f.ceremony,
    saleItems: f.sale_items,
    assignedChecklists: f.assigned_checklists,
    created_at: f.created_at,
    events: f.events
  }));
};

export const saveFuneral = async (funeral: Partial<Funeral> & { companyId: string, branchId?: string }, user?: User) => {
  let num = funeral.funeral_number;
  if (!funeral.id) {
     const { count } = await supabase.from('funerals').select('*', { count: 'exact', head: true }).eq('company_id', funeral.companyId);
     const company = await getCompanyById(funeral.companyId);
     const today = new Date().toISOString().split('T')[0];
     num = `P/${company?.company_number}/${today}/${(count||0) + 1}`;
  }

  const db: any = {
    company_id: funeral.companyId,
    branch_id: funeral.branchId,
    funeral_number: num,
    deceased_first_name: funeral.deceased_first_name,
    deceased_last_name: funeral.deceased_last_name,
    pickup_address: funeral.pickup_address,
    pickup_place_id: funeral.pickup_place_id,
    applicant_first_name: funeral.applicant_first_name,
    applicant_last_name: funeral.applicant_last_name,
    applicant_phone: funeral.applicant_phone,
    transport_date: funeral.transport_date,
    transport_time: funeral.transport_time,
    assigned_staff_ids: funeral.assigned_staff_ids,
    assigned_vehicle_id: funeral.assigned_vehicle_id,
    notes: funeral.notes,
    death_date: funeral.death_date,
    death_place: funeral.death_place,
    death_certificate_number: funeral.death_certificate_number,
    ceremony: funeral.ceremony,
    sale_items: funeral.saleItems,
    assigned_checklists: funeral.assignedChecklists
  };

  if (funeral.id) await supabase.from('funerals').update(db).eq('id', funeral.id);
  else await supabase.from('funerals').insert(db);
};

export const deleteFuneral = async (id: string) => {
  await supabase.from('funerals').delete().eq('id', id);
};

// --- Documents ---
export const getDocCategories = async (companyId: string): Promise<DocumentCategory[]> => {
  const { data } = await supabase.from('doc_categories').select('*').eq('company_id', companyId);
  return (data || []).map((c:any) => ({ ...c, companyId: c.company_id }));
};

export const saveDocCategory = async (cat: Partial<DocumentCategory> & { companyId: string }) => {
  const db = { company_id: cat.companyId, name: cat.name };
  if (cat.id) await supabase.from('doc_categories').update(db).eq('id', cat.id);
  else await supabase.from('doc_categories').insert(db);
};

export const deleteDocCategory = async (id: string) => {
  await supabase.from('doc_categories').delete().eq('id', id);
};

export const getDocTemplates = async (companyId: string): Promise<DocumentTemplate[]> => {
  const { data } = await supabase.from('doc_templates').select('*').eq('company_id', companyId);
  return (data || []).map((t:any) => ({ ...t, companyId: t.company_id, categoryId: t.category_id }));
};

export const saveDocTemplate = async (temp: Partial<DocumentTemplate> & { companyId: string }) => {
  const db = {
    company_id: temp.companyId,
    category_id: temp.categoryId,
    name: temp.name,
    orientation: temp.orientation,
    layers: temp.layers
  };
  if (temp.id) await supabase.from('doc_templates').update(db).eq('id', temp.id);
  else await supabase.from('doc_templates').insert(db);
};

export const deleteDocTemplate = async (id: string) => {
  await supabase.from('doc_templates').delete().eq('id', id);
};

// --- Invitations ---
export const getInvitations = async (): Promise<Invitation[]> => {
  const { data } = await supabase.from('invitations').select('*');
  return (data || []).map((i:any) => ({
    id: i.id,
    email: i.email,
    companyId: i.company_id,
    companyName: i.company_name,
    branchId: i.branch_id,
    branchName: i.branch_name,
    status: i.status,
    senderId: i.sender_id,
    senderName: i.sender_name,
    created_at: i.created_at
  }));
};

const sendMailjetEmail = async (toEmail: string, companyName: string, senderName: string) => {
  const apiKey = 'a147b2d1aea5c88a5144b6589d2ffe16';
  const apiSecret = '9900ceccf5eec05f8a1b786cf3fa6f1c';
  const registerLink = window.location.origin;

  const htmlContent = `
    <div style="background-color: #111827; font-family: 'Helvetica', sans-serif; padding: 40px; color: #F3F4F6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1F2937; border-radius: 16px; overflow: hidden; border: 1px solid #374151;">
        <div style="background-color: #32FFDC; padding: 20px; text-align: center;">
          <h1 style="color: #111827; margin: 0; font-size: 24px; letter-spacing: 2px;">URNEO 2035</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #ffffff; margin-top: 0;">Zaproszenie do zespołu</h2>
          <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5;">
            Cześć! <strong>${senderName}</strong> zaprasza Cię do dołączenia do firmy <strong>${companyName}</strong> w systemie Urneo.
          </p>
          <p style="color: #9CA3AF; font-size: 16px; line-height: 1.5;">
            Aby rozpocząć pracę, kliknij poniższy przycisk i utwórz swoje konto pracownicze.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registerLink}" style="background-color: #32FFDC; color: #111827; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Dołącz do Zespołu
            </a>
          </div>
          <p style="font-size: 12px; color: #6B7280; text-align: center; margin-top: 30px;">
            Jeśli to nie Ty byłeś adresatem tej wiadomości, zignoruj ją.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(apiKey + ":" + apiSecret)
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: "noreply@urneo.pl", // Mock sender as we don't know user's verify status
              Name: "Urneo System"
            },
            To: [
              {
                Email: toEmail,
                Name: "Nowy Użytkownik"
              }
            ],
            Subject: `Zaproszenie do ${companyName} - Urneo`,
            HTMLPart: htmlContent,
            TextPart: `Zostałeś zaproszony do firmy ${companyName}. Zarejestruj się tutaj: ${registerLink}`
          }
        ]
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Mailjet Error:', errorData);
    }
  } catch (error) {
    console.error('Network Error sending email:', error);
  }
};

export const sendInvitation = async (email: string, companyId: string, branchId?: string, sender?: User) => {
  const company = await getCompanyById(companyId);
  const db = {
    email,
    company_id: companyId,
    company_name: company?.name,
    branch_id: branchId,
    status: 'pending',
    sender_id: sender?.id,
    sender_name: sender ? `${sender.first_name} ${sender.last_name}` : undefined
  };
  
  await supabase.from('invitations').insert(db);

  const existing = await getUserByEmail(email);
  if(existing) {
    await createNotification({
      userId: existing.id,
      type: 'info',
      title: 'Nowe Zaproszenie',
      message: `Otrzymałeś zaproszenie do firmy ${company?.name}.`
    });
  } else {
    // Send external email via Mailjet
    const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Administrator';
    await sendMailjetEmail(email, company?.name || 'Urneo', senderName);
  }
};

export const respondToInvitation = async (invitationId: string, accept: boolean) => {
  await supabase.from('invitations').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', invitationId);
};

export const deleteInvitation = async (id: string) => {
  await supabase.from('invitations').delete().eq('id', id);
};

// --- Themes ---
export const getThemes = async (): Promise<Theme[]> => {
  const { data } = await supabase.from('themes').select('*');
  if (!data || data.length === 0) return [URNEO_THEME_CSS];
  return data.map((t:any) => ({ id: t.id, name: t.name, cssVars: t.css_vars }));
};

export const saveTheme = async (theme: Theme) => {
  const db = { id: theme.id, name: theme.name, css_vars: theme.cssVars };
  await supabase.from('themes').upsert(db);
};

// --- GUS Mock ---
const mockFetchGusData = (cleanNip: string): Promise<Partial<CooperatingCompany>> => {
   return new Promise((resolve) => {
      setTimeout(() => {
         const lastDigit = parseInt(cleanNip[9]);
         const city = lastDigit % 2 === 0 ? 'Warszawa' : 'Wrocław';
         const street = lastDigit % 2 === 0 ? 'Aleje Jerozolimskie' : 'ul. Piłsudskiego';
         const number = cleanNip.substring(6, 8);
         const suffix = cleanNip.substring(3, 6);

         resolve({
            name: `P.H.U. "Partner" Sp. z o.o. [NIP: ${cleanNip}]`,
            street: `${street} ${number}`,
            city: city,
            email: `biuro${suffix}@partner.pl`,
            phone: `+48 500 ${suffix} ${number}`
         } as any);
      }, 800);
   });
};

export const fetchGusData = async (nip: string): Promise<Partial<CooperatingCompany>> => {
  const cleanNip = nip.replace(/[^0-9]/g, '');
  if (cleanNip.length !== 10) return Promise.reject(new Error("Nieprawidłowy NIP"));
  return mockFetchGusData(cleanNip);
};

// --- Helpers ---
export const getCompanyUsers = async (companyId: string): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*').eq('company_id', companyId);
  return (data || []).map(mapUserFromDB);
};

export const getBranchUsers = async (branchId: string): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*').eq('branch_id', branchId);
  return (data || []).map(mapUserFromDB);
};
