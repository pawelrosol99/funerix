
import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser, getCompanies, getBranches } from '../services/storageService';
import { Card, Button, Input, Badge } from '../components/UI';
import { User, Company, Branch } from '../types';
import { LayoutGrid, Table as TableIcon, Search, MoreVertical, Edit2, Trash2, X, Save, Building2, MapPin } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, c, b] = await Promise.all([getUsers(), getCompanies(), getBranches()]);
    setUsers(u);
    setCompanies(c);
    setBranches(b);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      await deleteUser(id);
      loadData();
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser({...user});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
      await saveUser(editingUser);
      loadData();
      setShowEditModal(false);
      setEditingUser(null);
    }
  };

  const getCompanyName = (id?: string) => companies.find(c => c.id === id)?.name || '-';
  const getBranchName = (id?: string) => {
     const b = branches.find(br => br.id === id);
     return b ? `${b.name} (${b.branch_number})` : '-';
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.client_number && u.client_number.includes(searchTerm))
  );

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card className="group hover:scale-[1.02] transition-transform relative">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={() => handleEdit(user)} className="p-2 bg-[var(--color-primary)] text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
            <Edit2 size={14} />
         </button>
         <button onClick={() => handleDelete(user.id)} className="p-2 bg-[var(--color-danger)] text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
            <Trash2 size={14} />
         </button>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold text-lg shadow-md">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{user.first_name} {user.last_name}</h3>
            {user.client_number && <span className="text-xs font-mono text-[var(--color-primary)]">#{user.client_number}</span>}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4 text-sm">
        <div className="text-[var(--color-text-secondary)]">
          <span className="font-bold text-[var(--color-text-main)]">Email:</span> {user.email}
        </div>
        <div className="text-[var(--color-text-secondary)]">
          <span className="font-bold text-[var(--color-text-main)]">Rola:</span> {user.role === 'super_admin' ? 'Super Admin' : 'Użytkownik'}
        </div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
           <Building2 size={14} className="text-[var(--color-text-secondary)]"/>
           <span className="font-bold">{getCompanyName(user.companyId)}</span>
        </div>
        {user.branchId && (
           <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[var(--color-text-secondary)]"/>
              <span>{getBranchName(user.branchId)}</span>
           </div>
        )}
        {user.companyRole && (
           <div className="mt-1">
              <Badge variant={user.companyRole === 'owner' ? 'primary' : 'secondary'}>
                 {user.companyRole === 'owner' ? 'Właściciel' : 'Pracownik'}
              </Badge>
           </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Użytkownicy</h2>
          <p className="text-[var(--color-text-secondary)]">Zarządzaj dostępem i danymi klientów.</p>
        </div>
        <div className="flex items-center gap-4 bg-[var(--color-surface)] p-2 rounded-2xl shadow-sm border border-[var(--color-border)]">
          <button 
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
             onClick={() => setViewMode('table')}
             className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-muted)]'}`}
          >
            <TableIcon size={20} />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]" size={20} />
        <input 
          type="text" 
          placeholder="Szukaj użytkownika..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--color-surface)] pl-12 pr-4 py-4 rounded-2xl border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all shadow-sm text-[var(--color-text-main)]"
        />
      </div>

      {loading ? <div>Ładowanie...</div> : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto p-0 border border-[var(--color-border)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)] bg-opacity-30 text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold w-24">Nr</th>
                <th className="p-4 font-semibold">Imię i Nazwisko</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Rola System</th>
                <th className="p-4 font-semibold">Firma / Oddział</th>
                <th className="p-4 font-semibold">Rola w Firmie</th>
                <th className="p-4 font-semibold text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-[var(--color-muted)] hover:bg-opacity-20 transition-colors">
                  <td className="p-4 font-mono text-sm font-bold text-[var(--color-primary)]">{user.client_number || '-'}</td>
                  <td className="p-4 font-medium text-[var(--color-text-main)]">{user.first_name} {user.last_name}</td>
                  <td className="p-4 text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                  <td className="p-4 text-sm text-[var(--color-text-secondary)] font-bold uppercase">{user.role === 'super_admin' ? 'Admin' : 'Klient'}</td>
                  <td className="p-4 text-sm">
                     <div className="font-bold">{getCompanyName(user.companyId)}</div>
                     {user.branchId && <div className="text-xs text-[var(--color-text-secondary)]">{getBranchName(user.branchId)}</div>}
                  </td>
                  <td className="p-4 text-sm">
                     {user.companyRole && (
                        <Badge variant={user.companyRole === 'owner' ? 'primary' : 'secondary'}>
                           {user.companyRole === 'owner' ? 'Właściciel' : 'Pracownik'}
                        </Badge>
                     )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-[var(--color-primary)] hover:text-white rounded-lg text-[var(--color-text-secondary)] transition-colors">
                        <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-[var(--color-danger)] hover:text-white rounded-lg text-[var(--color-text-secondary)] transition-colors">
                        <Trash2 size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in border border-[var(--color-border)] shadow-2xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--color-border)]">
                    <h3 className="text-xl font-bold">Edycja Użytkownika</h3>
                    <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-[var(--color-muted)] rounded-full"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Imię" value={editingUser.first_name} onChange={e => setEditingUser({...editingUser, first_name: e.target.value})} />
                    <Input label="Nazwisko" value={editingUser.last_name} onChange={e => setEditingUser({...editingUser, last_name: e.target.value})} />
                    <Input label="Email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                    <Input label="Telefon" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                    <Input label="Ulica" value={editingUser.address || ''} onChange={e => setEditingUser({...editingUser, address: e.target.value})} />
                    <Input label="Miasto" value={editingUser.city || ''} onChange={e => setEditingUser({...editingUser, city: e.target.value})} />
                </div>

                <div className="border-t border-[var(--color-border)] mt-6 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--color-surface-highlight)] p-4 rounded-xl">
                   <div>
                      <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Rola Systemowa</label>
                      <select 
                         className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                         value={editingUser.role}
                         onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                      >
                         <option value="client">Użytkownik / Klient</option>
                         <option value="super_admin">Super Admin</option>
                      </select>
                   </div>

                   {/* Company Assignment */}
                   <div>
                      <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Przypisana Firma</label>
                      <select 
                         className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                         value={editingUser.companyId || ''}
                         onChange={e => setEditingUser({...editingUser, companyId: e.target.value || undefined, branchId: undefined})}
                      >
                         <option value="">-- Brak / Nieprzypisany --</option>
                         {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.nip})</option>)}
                      </select>
                   </div>

                   {/* Branch Assignment (if company selected) */}
                   {editingUser.companyId && (
                      <div>
                         <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Oddział</label>
                         <select 
                            className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                            value={editingUser.branchId || ''}
                            onChange={e => setEditingUser({...editingUser, branchId: e.target.value || undefined})}
                         >
                            <option value="">-- Domyślny / Wszystkie --</option>
                            {branches.filter(b => b.companyId === editingUser.companyId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                      </div>
                   )}

                   {/* Company Role (if company selected) */}
                   {editingUser.companyId && (
                      <div>
                         <label className="text-xs uppercase font-bold text-[var(--color-text-secondary)] mb-2 block">Rola w Firmie</label>
                         <select 
                            className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] p-3 text-sm outline-none"
                            value={editingUser.companyRole || 'employee'}
                            onChange={e => setEditingUser({...editingUser, companyRole: e.target.value as any})}
                         >
                            <option value="employee">Pracownik</option>
                            <option value="owner">Właściciel / Admin</option>
                         </select>
                      </div>
                   )}
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--color-border)]">
                    <Button variant="ghost" onClick={() => setShowEditModal(false)}>Anuluj</Button>
                    <Button onClick={handleSaveEdit} className="bg-[var(--color-success)]"><Save size={18} /> Zapisz Zmiany</Button>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
};
