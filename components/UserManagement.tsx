import React, { useState, useMemo } from 'react';
import { User, UserRole, NotificationType, Toast } from '../types';
import UserFormModal from './UserFormModal';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, SearchIcon } from './icons';
import ConfirmModal from './ConfirmModal';
import { supabase } from '../services/supabaseClient';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  createNotification: (userId: string, type: NotificationType, message: string) => void;
  addToast: (message: string, type: Toast['type']) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, createNotification, addToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const [confirmModalState, setConfirmModalState] = useState<{isOpen: boolean; onConfirm: () => void}>({
    isOpen: false,
    onConfirm: () => {},
  });

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'approved') return user.approved;
        if (statusFilter === 'pending') return !user.approved;
        return true;
      })
      .filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [users, searchQuery, statusFilter]);

  const handleOpenModal = (user?: User) => {
    setEditingUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (user: User, password?: string) => {
    if (editingUser) { // Update existing user
        const { error } = await supabase.from('users').update({ name: user.name }).eq('id', editingUser.id);
        if (error) {
            addToast(`Error updating user: ${error.message}`, 'error');
            throw error;
        }
        if (password) {
            addToast("For security, admin cannot change passwords here. Please advise user to use 'Forgot Password'.", 'info');
        }
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: user.name } : u));
        addToast('User updated successfully.', 'success');
        handleCloseModal();
    } else { // Create new user
        if (!password) {
            addToast('Password is required for new users.', 'error');
            throw new Error('Password is required');
        }
        
        // --- FIX START: Preserve admin session during new user creation ---

        // 1. Get the current admin's session to restore it later.
        const { data: { session: adminSession } } = await supabase.auth.getSession();
        if (!adminSession) {
            addToast('Admin session expired. Please log in again.', 'error');
            throw new Error('Admin session not found');
        }

        // 2. Create the new user. This temporarily signs out the admin and signs in the new user.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: user.email,
            password: password,
            options: { data: { name: user.name } }
        });

        // 3. Immediately restore the admin's session. This is critical.
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });

        if (sessionError) {
             addToast('Could not restore admin session. Please refresh and try again.', 'error');
             throw sessionError;
        }

        // Now handle the outcome of the signUp process
        if (signUpError) {
            addToast(signUpError.message, 'error');
            throw signUpError; // Propagate error to modal to stop loading spinner
        }

        if (signUpData.user) {
            // 4. Now authenticated as the admin again, approve the new user.
            const { error: updateError } = await supabase.from('users').update({ approved: true }).eq('id', signUpData.user.id);
            if (updateError) {
                addToast(`User created but failed to approve: ${updateError.message}`, 'error');
            }

            // 5. Fetch the new user's full profile to add to the local state.
            const { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', signUpData.user.id).single();
            if (profileError || !profile) {
                addToast('User created, but failed to refresh user list.', 'error');
            } else {
                setUsers(prev => [...prev, profile]);
                addToast('User created and approved successfully!', 'success');
            }
        }
        // --- FIX END ---
        
        handleCloseModal();
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    setConfirmModalState({
      isOpen: true,
      onConfirm: async () => {
        // Note: This only deletes the public user profile. The auth user remains.
        // For a production app, use a server-side Edge Function to delete the auth user.
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) {
            addToast(`Error deleting user: ${error.message}`, 'error');
            return;
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        addToast('User deleted successfully.', 'success');
      },
    });
  };

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase.from('users').update({ approved: true }).eq('id', userId);
    if (error) {
        addToast(`Error approving user: ${error.message}`, 'error');
        return;
    }
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        createNotification(userId, NotificationType.APPROVAL, "Welcome to the platform! Your registration has been approved.");
        return { ...u, approved: true };
      }
      return u;
    }));
    addToast('User approved.', 'success');
  };

  const FilterButton: React.FC<{ filter: 'all' | 'approved' | 'pending'; label: string }> = ({ filter, label }) => (
    <button
      onClick={() => setStatusFilter(filter)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
        statusFilter === filter
          ? 'bg-zamzam-teal-600 text-white shadow'
          : 'bg-white text-slate-700 hover:bg-zamzam-teal-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">User Management</h2>
            <p className="text-lg text-slate-600">Add, edit, and manage employee accounts.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-zamzam-teal-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-zamzam-teal-700 transition shadow-md self-start md:self-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Employee
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 bg-white rounded-xl shadow">
        <div className="relative w-full md:w-1/3">
          <input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-zamzam-teal-500 bg-white"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-full">
          <FilterButton filter="all" label="All" />
          <FilterButton filter="approved" label="Approved" />
          <FilterButton filter="pending" label="Pending" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Points</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'Admin' ? 'bg-zamzam-teal-100 text-zamzam-teal-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                            {user.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-semibold">{user.points}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {user.approved ? 'Approved' : 'Pending'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {!user.approved && user.role !== 'Admin' && (
                         <button onClick={() => handleApproveUser(user.id)} className="flex items-center text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full text-xs transition">
                            <CheckCircleIcon className="h-4 w-4 mr-1"/> Approve
                        </button>
                      )}
                      <button onClick={() => handleOpenModal(user)} className="text-zamzam-teal-600 hover:text-zamzam-teal-800 p-2 rounded-full hover:bg-zamzam-teal-100 transition" disabled={user.role === 'Admin'}>
                        <PencilIcon className={`h-5 w-5 ${user.role === 'Admin' && 'text-slate-300'}`}/>
                      </button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition" disabled={user.role === 'Admin'}>
                        <TrashIcon className={`h-5 w-5 ${user.role === 'Admin' && 'text-slate-300'}`}/>
                      </button>
                    </td>
                  </tr>
                ))}
                 {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 px-6 text-slate-500">
                        No users found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>

      
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          user={editingUser}
          addToast={addToast}
        />
      

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, onConfirm: () => {} })}
        onConfirm={confirmModalState.onConfirm}
        title="Confirm Deletion"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
};

export default UserManagement;