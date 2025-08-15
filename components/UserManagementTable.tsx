import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import UserDetailsModal from './UserDetailsModal';

interface UserManagementTableProps {
  users: User[];
  postCounts: Map<string, number>;
  updateProfile: (id: string, updates: Partial<User>) => void;
  deleteProfile: (id: string) => void;
  grantPremium: (id: string, durationInDays: number | 'lifetime') => void;
  revokePremium: (id: string) => void;
  sendNotification: (uid: string, title: string, message: string) => Promise<boolean>;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({ users, postCounts, updateProfile, deleteProfile, grantPremium, revokePremium, sendNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const getPremiumStatus = (user: User) => {
    const storedExpiry = localStorage.getItem(`aviator_premium_expiry_${user.id}`);
    if (storedExpiry) {
      if (storedExpiry === 'Infinity') return { text: 'Vitalício', isPremium: true };
      const expiry = parseInt(storedExpiry, 10);
      if (!isNaN(expiry) && Date.now() < expiry) {
        return { text: `Expira em ${new Date(expiry).toLocaleDateString()}`, isPremium: true };
      }
    }
    return { text: 'Grátis', isPremium: false };
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const isPremium = getPremiumStatus(user).isPremium;
      const userPostCount = postCounts.get(user.id) || 0;
      
      const searchMatch = user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.whatsapp && user.whatsapp.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (user.affiliate_username && user.affiliate_username.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = statusFilter === 'all' || user.status === statusFilter;

      const activityMatch = !activityFilter || userPostCount >= parseInt(activityFilter, 10);
      
      const dateMatch = !dateFilter || new Date(user.created_at) >= new Date(dateFilter);

      return searchMatch && statusMatch && activityMatch && dateMatch;
    });
  }, [users, searchTerm, statusFilter, activityFilter, dateFilter, postCounts]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleOpenDetails = (user: User) => {
      setSelectedUser(user);
      setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setSelectedUser(null);
      setIsModalOpen(false);
  };

  const handleSaveUser = (id: string, updates: Partial<User>) => {
      updateProfile(id, updates);
      handleCloseModal();
  };

  const handleDeleteUser = (user: User) => {
      deleteProfile(user.id);
  };

  const statusConfig = {
    active: { text: 'Ativo', className: 'bg-lime-900 text-lime-300' },
    pending_approval: { text: 'Pendente', className: 'bg-yellow-900 text-yellow-300 animate-pulse' },
    suspended: { text: 'Suspenso', className: 'bg-red-900 text-red-300' },
  };

  return (
    <>
      <UserDetailsModal 
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
          grantPremium={grantPremium}
          revokePremium={revokePremium}
          sendNotification={sendNotification}
      />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Gerenciamento de Usuários</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg">
          <input
            type="text"
            placeholder="Buscar por nome, whats ou user afiliado..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 text-white placeholder-gray-400 p-2 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-lime-400 focus:border-lime-400">
            <option value="all">Todos os Status</option>
            <option value="pending_approval">Pendente</option>
            <option value="active">Ativo</option>
            <option value="suspended">Suspenso</option>
          </select>
           <input
            type="number"
            placeholder="Posts (mínimo)"
            value={activityFilter}
            onChange={e => setActivityFilter(e.target.value)}
            className="w-full bg-gray-800 text-white placeholder-gray-400 p-2 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
          />
          <input
            type="date"
            placeholder="Cadastrado após..."
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
          />
        </div>

        <div className="bg-gray-800/50 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-black/20">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Usuário</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">WhatsApp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">User Afiliado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Cadastro</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Premium</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedUsers.map(user => {
                const premiumStatus = getPremiumStatus(user);
                const userStatus = statusConfig[user.status] || { text: user.status, className: 'bg-gray-700 text-gray-300' };
                return (
                  <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt={user.display_name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.display_name}</div>
                          <div className="text-xs text-gray-400">{user.role === 'admin' ? 'Admin' : 'Usuário'}</div>
                        </div>
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.whatsapp || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-300">{user.affiliate_username || '---'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${premiumStatus.isPremium ? 'bg-lime-900 text-lime-300' : 'bg-gray-700 text-gray-300'}`}>
                        {premiumStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userStatus.className}`}>
                        {userStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenDetails(user)} className="text-lime-400 hover:text-lime-300">Detalhes</button>
                      <button onClick={() => handleDeleteUser(user)} className="text-red-400 hover:text-red-300">Deletar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {paginatedUsers.length === 0 && (
              <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado com os filtros aplicados.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-400">Página {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserManagementTable;