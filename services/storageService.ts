
import { User, Theme, Company, Branch, Furnace, CremationOptionGroup, CremationOption, CooperatingCompany, Driver, Cremation, CompanyTag, DocumentCategory, DocumentTemplate, CremationHistoryEntry, WarehouseCategory, WarehouseItem, Manufacturer, Vehicle, Checklist, Funeral, Relation, Invitation, WorkSession, PayrollBonus, UserBonus, Notification, UserRole, LeaveRequest, BulletinAd, BulletinCategory } from '../types';
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

const mapLeaveRequestFromDB = (l: any): LeaveRequest => ({
   id: l.id,
   requestNumber: l.request_number,
   userId: l.user_id,
   companyId: l.company_id,
   branchId: l.branch_id,
   startDate: l.start_date,
   endDate: l.end_date,
   daysCount: l.days_count,
   type: l.type,
   status: l.status,
   createdAt: l.created_at,
   resolvedBy: l.resolved_by,
   resolvedByName: l.resolved_by_name,
   resolvedAt: l.resolved_at,
   user: l.users ? mapUserFromDB(l.users) : undefined
});

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
  status: s.status,
  resolvedBy: s.resolved_by,
  resolvedByName: s.resolved_by_name,
  resolvedAt: s.resolved_at
});

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
    return null;
  }

  // 2. Check password (in JS to avoid RLS/Filter issues and allow easier debugging)
  const userRecord = users.find(u => u.password === password);

  if (userRecord) {
    const user = mapUserFromDB(userRecord);
    localStorage.setItem('lively_db_session', JSON.stringify({ userId: user.id }));
    return user;
  } else {
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

// Helper to find lowest free client number (e.g. 00001, 00002, 00004 -> returns 00003)
const getLowestFreeClientNumber = async (): Promise<string> => {
   const { data } = await supabase.from('users').select('client_number');
   const numbers = (data || [])
      .map((u: any) => parseInt(u.client_number || '0', 10))
      .filter((n: number) => !isNaN(n) && n > 0)
      .sort((a: number, b: number) => a - b);

   let next = 1;
   for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] > next) {
         return next.toString().padStart(5, '0');
      }
      next = numbers[i] + 1;
   }
   return next.toString().padStart(5, '0');
};

export const registerClient = async (data: Partial<User>): Promise<User | null> => {
  const clientNumber = await getLowestFreeClientNumber();

  const newUser: Partial<User> = {
    ...data,
    role: 'client' as UserRole,
    client_number: clientNumber,
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

export const activateUser = async (userId: string, data: { first_name: string, last_name: string, phone: string, password: string }): Promise<User | null> => {
   const { data: updated, error } = await supabase.from('users').update({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      password: data.password
   }).eq('id', userId).select().single();

   if(error) {
      console.error("Activation error", error);
      return null;
   }
   return mapUserFromDB(updated);
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
  return (data || []).map((c: any) => ({ 
     ...c, 
     company_number: c.company_number, 
     package_type: c.package_type, 
     photo_url: c.photo_url,
     bulletinConfig: c.bulletin_config
  }));
};

export const createCompany = async (data: Partial<Company>, ownerUserId: string): Promise<Company | null> => {
  // 1. Generate Company Number (Prefix U + 5 digits)
  const { data: comps } = await supabase.from('companies').select('company_number');
  const max = Math.max(...(comps || []).map((c:any) => parseInt(c.company_number.substring(1) || '0', 10)));
  const nextNum = 'U' + (isNaN(max) ? 1 : max + 1).toString().padStart(5, '0');

  const newCompanyData = {
    ...data,
    company_number: nextNum,
    package_type: data.package_type || 'basic',
    bulletin_config: { enabled: false, displayCategories: [] }
  };

  // 2. Create Company
  const { data: insertedCompany, error: compError } = await supabase.from('companies').insert(newCompanyData).select().single();
  if (compError || !insertedCompany) return null;

  // 3. Create Default Branch (Same address, Number Uxxxxx/1)
  const branchNum = `${nextNum}/1`;
  const defaultBranchData = {
     company_id: insertedCompany.id,
     branch_number: branchNum,
     name: data.name || 'Siedziba Główna',
     street: data.street,
     city: data.city,
     zip_code: data.zip_code,
     phone: data.phone
  };

  const { data: insertedBranch, error: branchError } = await supabase.from('branches').insert(defaultBranchData).select().single();
  if (branchError) console.error("Error creating default branch", branchError);

  // 4. Assign User to Company AND Branch as Owner
  const updateData: any = { 
     company_id: insertedCompany.id, 
     company_role: 'owner'
  };
  if (insertedBranch) {
     updateData.branch_id = insertedBranch.id;
  }

  await supabase.from('users').update(updateData).eq('id', ownerUserId);

  return insertedCompany as Company;
};

export const updateCompany = async (companyId: string, data: Partial<Company>) => {
  const { id, company_number, created_at, bulletinConfig, ...updates } = data as any; 
  // Map bulletinConfig to DB column name
  if (bulletinConfig) {
     updates.bulletin_config = bulletinConfig;
  }
  await supabase.from('companies').update(updates).eq('id', companyId);
};

export const deleteCompany = async (companyId: string) => {
  await supabase.from('companies').delete().eq('id', companyId);
};

export const getCompanyById = async (companyId: string): Promise<Company | undefined> => {
  const { data } = await supabase.from('companies').select('*').eq('id', companyId).single();
  if(!data) return undefined;
  
  return {
     ...data,
     company_number: data.company_number,
     package_type: data.package_type,
     photo_url: data.photo_url,
     bulletinConfig: data.bulletin_config
  };
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
  // Join users table to get name for admin view
  const { data } = await supabase
    .from('work_sessions')
    .select('*, users(*)')
    .eq('company_id', companyId);
    
  return (data || []).map(s => ({
     ...mapSessionFromDB(s),
     user: s.users ? mapUserFromDB(s.users) : undefined
  }));
};

export const getUserWorkSessions = async (userId: string): Promise<WorkSession[]> => {
  const { data } = await supabase.from('work_sessions').select('*').eq('user_id', userId);
  return (data || []).map(mapSessionFromDB);
};

export const getActiveWorkSession = async (userId: string): Promise<WorkSession | null> => {
  const { data } = await supabase.from('work_sessions').select('*').eq('user_id', userId).is('end_time', null).single();
  return data ? mapSessionFromDB(data) : null;
}

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
  
  // Notify App to update UI immediately
  window.dispatchEvent(new Event('work-session-updated'));
  
  return inserted ? mapSessionFromDB(inserted) : null;
};

export const endWorkSession = async (userId: string) => {
  const now = new Date().toISOString();
  await supabase.from('work_sessions').update({ end_time: now, status: 'completed' }).eq('user_id', userId).is('end_time', null);
  
  // Notify App to update UI immediately
  window.dispatchEvent(new Event('work-session-updated'));
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

export const approveSessionEdit = async (sessionId: string, approved: boolean, adminUser?: User) => {
  const { data: session } = await supabase.from('work_sessions').select('*').eq('id', sessionId).single();
  if (session) {
    const updates: any = {
      status: 'completed',
      edited_start_time: null,
      edited_end_time: null,
      original_start_time: null,
      original_end_time: null,
      resolved_by: adminUser?.id,
      resolved_by_name: adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : undefined,
      resolved_at: new Date().toISOString()
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

// --- Leave Requests (Wnioski Urlopowe) ---

export const getLeaveRequests = async (companyId: string): Promise<LeaveRequest[]> => {
   const { data } = await supabase
      .from('leave_requests')
      .select('*, users(*)')
      .eq('company_id', companyId);
   
   return (data || []).map(mapLeaveRequestFromDB);
};

export const getUserLeaveRequests = async (userId: string): Promise<LeaveRequest[]> => {
   const { data } = await supabase.from('leave_requests').select('*').eq('user_id', userId);
   return (data || []).map(mapLeaveRequestFromDB);
};

export const createLeaveRequest = async (request: Partial<LeaveRequest>) => {
   // Generate Request Number (URL/YYYY/N)
   const year = new Date().getFullYear();
   const { count } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', request.companyId);
   
   const nextNum = (count || 0) + 1;
   const requestNumber = `URL/${year}/${nextNum}`;

   const dbRequest = {
      request_number: requestNumber,
      user_id: request.userId,
      company_id: request.companyId,
      branch_id: request.branchId,
      start_date: request.startDate,
      end_date: request.endDate,
      days_count: request.daysCount,
      type: request.type,
      status: 'pending'
   };
   await supabase.from('leave_requests').insert(dbRequest);
};

export const deleteLeaveRequest = async (id: string) => {
   await supabase.from('leave_requests').delete().eq('id', id);
};

export const respondToLeaveRequest = async (requestId: string, approved: boolean, adminUser?: User) => {
   const { data: request } = await supabase.from('leave_requests').select('*').eq('id', requestId).single();
   
   if(request) {
      // Update Request Status
      await supabase.from('leave_requests').update({ 
         status: approved ? 'approved' : 'rejected',
         resolved_by: adminUser?.id,
         resolved_by_name: adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : undefined,
         resolved_at: new Date().toISOString()
      }).eq('id', requestId);

      // If Approved, deduct days from User
      if (approved) {
         // Get current user stats
         const { data: user } = await supabase.from('users').select('vacation_days_used').eq('id', request.user_id).single();
         if (user) {
            const newUsed = (user.vacation_days_used || 0) + request.days_count;
            await supabase.from('users').update({ vacation_days_used: newUsed }).eq('id', request.user_id);
         }
      }

      // Notify User
      await createNotification({
         userId: request.user_id,
         type: approved ? 'success' : 'error',
         title: approved ? 'Wniosek zaakceptowany' : 'Wniosek odrzucony',
         message: `Twój wniosek urlopowy (${request.days_count} dni od ${request.start_date}) został ${approved ? 'zaakceptowany' : 'odrzucony'}.`
      });
   }
};

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

const sendMailjetEmail = async (toEmail: string, companyName: string, senderName: string, invitationId: string, isActivation: boolean = false, activationLink: string = '') => {
  // ... existing code ... (unchanged)
  return Promise.resolve();
};

export const sendInvitation = async (email: string, companyId: string, branchId?: string, sender?: User) => {
  // ... existing code ... (unchanged)
};

export const respondToInvitation = async (invitationId: string, accept: boolean) => {
  await supabase.from('invitations').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', invitationId);
  // ... existing code ... (unchanged)
};

export const deleteInvitation = async (id: string) => {
  await supabase.from('invitations').delete().eq('id', id);
};

export const getThemes = async (): Promise<Theme[]> => {
  const { data } = await supabase.from('themes').select('*');
  if (!data || data.length === 0) return [URNEO_THEME_CSS];
  return data.map((t:any) => ({ id: t.id, name: t.name, cssVars: t.css_vars }));
};

export const saveTheme = async (theme: Theme) => {
  const db = { id: theme.id, name: theme.name, css_vars: theme.cssVars };
  await supabase.from('themes').upsert(db);
};

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

export const getCompanyUsers = async (companyId: string): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*').eq('company_id', companyId);
  return (data || []).map(mapUserFromDB);
};

export const getBranchUsers = async (branchId: string): Promise<User[]> => {
  const { data } = await supabase.from('users').select('*').eq('branch_id', branchId);
  return (data || []).map(mapUserFromDB);
};

// --- BULLETIN BOARD API ---

export const getBulletinCategories = async (): Promise<BulletinCategory[]> => {
   const { data } = await supabase.from('bulletin_categories').select('*');
   return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id
   }));
};

export const saveBulletinCategory = async (category: Partial<BulletinCategory>) => {
   const db = {
      name: category.name,
      parent_id: category.parentId
   };
   if (category.id) await supabase.from('bulletin_categories').update(db).eq('id', category.id);
   else await supabase.from('bulletin_categories').insert(db);
};

export const deleteBulletinCategory = async (id: string) => {
   await supabase.from('bulletin_categories').delete().eq('id', id);
};

export const getBulletinAds = async (): Promise<BulletinAd[]> => {
   const { data } = await supabase
      .from('bulletin_ads')
      .select('*, users(first_name, last_name)');
   
   return (data || []).map((ad: any) => ({
      id: ad.id,
      adNumber: ad.ad_number,
      userId: ad.user_id,
      categoryId: ad.category_id,
      subCategoryId: ad.sub_category_id,
      title: ad.title,
      content: ad.content,
      price: ad.price,
      phone: ad.phone,
      email: ad.email,
      location: ad.location,
      status: ad.status,
      createdAt: ad.created_at,
      userName: ad.users ? `${ad.users.first_name} ${ad.users.last_name}` : 'Nieznany'
   }));
};

export const getUserAds = async (userId: string): Promise<BulletinAd[]> => {
   const { data } = await supabase
      .from('bulletin_ads')
      .select('*')
      .eq('user_id', userId);
   
   return (data || []).map((ad: any) => ({
      id: ad.id,
      adNumber: ad.ad_number,
      userId: ad.user_id,
      categoryId: ad.category_id,
      subCategoryId: ad.sub_category_id,
      title: ad.title,
      content: ad.content,
      price: ad.price,
      phone: ad.phone,
      email: ad.email,
      location: ad.location,
      status: ad.status,
      createdAt: ad.created_at
   }));
};

export const saveBulletinAd = async (ad: Partial<BulletinAd>, userId: string) => {
   let adNumber = ad.adNumber;
   
   if (!ad.id) {
      // Generate unique Ad Number: OG/YYYY/0001
      const year = new Date().getFullYear();
      const { count } = await supabase.from('bulletin_ads').select('*', { count: 'exact', head: true });
      const nextNum = (count || 0) + 1;
      adNumber = `OG/${year}/${nextNum.toString().padStart(4, '0')}`;
   }

   const db = {
      ad_number: adNumber,
      user_id: userId,
      category_id: ad.categoryId,
      sub_category_id: ad.subCategoryId,
      title: ad.title,
      content: ad.content,
      price: ad.price,
      phone: ad.phone,
      email: ad.email,
      location: ad.location,
      status: ad.status || 'active'
   };

   if (ad.id) await supabase.from('bulletin_ads').update(db).eq('id', ad.id);
   else await supabase.from('bulletin_ads').insert(db);
};

export const deleteBulletinAd = async (id: string) => {
   await supabase.from('bulletin_ads').delete().eq('id', id);
};
