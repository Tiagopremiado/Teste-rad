import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<User>) => void;
  grantPremium: (id: string, durationInDays: number | 'lifetime') => void;
  revokePremium: (id: string) => void;
  sendNotification: (uid: string, title: string, message: string) => Promise<boolean>;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, isOpen, onClose, onSave, grantPremium, revokePremium, sendNotification }) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [premiumDuration, setPremiumDuration] = useState(30);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name,
        whatsapp: user.whatsapp,
        role: user.role,
        status: user.status,
        bio: user.bio,
      });
    }
    setFeedback(null);
    setNotificationMessage('');
    setNotificationTitle('');
  }, [user, isOpen]);

  useEffect(() => {
    if (feedback) {
        const timer = setTimeout(() => setFeedback(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!isOpen || !user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(user.id, formData);
  };

  const handleGrantPremium = (duration: number | 'lifetime') => {
    grantPremium(user.id, duration);
    setFeedback({ message: 'Acesso Premium concedido com sucesso!', type: 'success' });
    onClose(); // Close modal to reflect changes in table
  };
  
  const handleRevokePremium = () => {
    revokePremium(user.id);
    setFeedback({ message: 'Acesso Premium revogado com sucesso!', type: 'success' });
    onClose();
  };

  const handleSendNotification = async () => {
      if (!notificationTitle.trim() || !notificationMessage.trim()) {
          setFeedback({ message: 'Título e mensagem são obrigatórios.', type: 'error' });
          return;
      }
      const success = await sendNotification(user.id, notificationTitle, notificationMessage);
      if (success) {
          setFeedback({ message: 'Notificação enviada com sucesso!', type: 'success' });
          setNotificationTitle('');
          setNotificationMessage('');
      } else {
          setFeedback({ message: 'Falha ao enviar notificação.', type: 'error' });
      }
  };

  const sanitizedWhatsapp = user.whatsapp.replace(/\D/g, '');
  const fullWhatsappNumber = sanitizedWhatsapp.startsWith('55') ? sanitizedWhatsapp : `55${sanitizedWhatsapp}`;
  const welcomeMessage = encodeURIComponent(`Olá ${user.display_name}! 👋 Seja muito bem-vindo(a) ao Radar Aviator! 🚀 Meu nome é Tiago Lux, e estou aqui para te ajudar. Explore nossas ferramentas de IA 🧠 e o Co-Piloto automático 🤖 para analisar o mercado e potencializar seus ganhos. Não deixe de conferir nossa área social 'Resenha' 🔥, onde você pode trocar experiências e aprender com outros apostadores. Sua jornada para apostas mais inteligentes começa agora! 💰✈️`);
  const whatsappUrl = `https://wa.me/${fullWhatsappNumber}?text=${welcomeMessage}`;


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-lime-500/50 rounded-2xl shadow-2xl shadow-lime-500/10 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-lime-500/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-lime-300">Detalhes do Usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <img src={user.avatar_url} alt={user.display_name} className="w-20 h-20 rounded-full ring-2 ring-lime-400" />
            <div>
              <p className="text-2xl font-bold">{user.display_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-400">{user.whatsapp}</p>
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md transition-colors"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.847 6.062l-1.07 3.888 3.96-1.042z" /></svg>
                    Boas-Vindas
                  </a>
                </div>
            </div>
          </div>
          
           {user.affiliate_username && (
            <div className="bg-amber-900/50 p-3 rounded-lg border border-amber-700/50">
              <label className="block text-xs font-medium text-amber-300">NOME DE USUÁRIO (AFILIADO)</label>
              <p className="text-lg font-bold text-white">{user.affiliate_username}</p>
            </div>
          )}

          {/* Editable Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome de Exibição</label>
            <input name="display_name" value={formData.display_name || ''} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
            <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
            <textarea name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} className="w-full bg-gray-800 p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Função (Role)</label>
              <select name="role" value={formData.role || 'user'} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400">
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select name="status" value={formData.status || 'active'} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400">
                <option value="active">Ativo</option>
                <option value="pending_approval">Pendente</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>
          {/* Premium Management */}
          <div className="pt-4 border-t border-lime-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Gerenciamento Premium</h3>
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <input type="number" value={premiumDuration} onChange={e => setPremiumDuration(parseInt(e.target.value, 10))} className="w-20 bg-gray-700 p-2 rounded-lg border-2 border-gray-600 text-center" />
                <button onClick={() => handleGrantPremium(premiumDuration)} className="flex-grow bg-lime-600/50 border-2 border-lime-500 text-lime-300 hover:bg-lime-600/70 p-2 rounded-lg font-semibold">Conceder {premiumDuration} Dias</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleGrantPremium(7)} className="bg-lime-600/20 hover:bg-lime-600/40 border border-lime-500/50 p-2 rounded-lg text-xs font-semibold">7 Dias</button>
                <button onClick={() => handleGrantPremium(30)} className="bg-lime-600/20 hover:bg-lime-600/40 border border-lime-500/50 p-2 rounded-lg text-xs font-semibold">30 Dias</button>
                <button onClick={() => handleGrantPremium('lifetime')} className="bg-lime-400/20 hover:bg-lime-400/40 border border-lime-400/50 text-lime-300 p-2 rounded-lg text-xs font-semibold">Vitalício</button>
              </div>
              <button onClick={handleRevokePremium} className="w-full bg-red-600 hover:bg-red-700 p-2 rounded-lg font-semibold">Revogar Acesso</button>
            </div>
          </div>
          {/* Notification System */}
          <div className="pt-4 border-t border-lime-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Enviar Notificação para o Usuário</h3>
             <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
                <input type="text" placeholder="Título da Notificação" value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} className="w-full bg-gray-700 p-2 rounded-lg border-2 border-gray-600 focus:ring-lime-400 focus:border-lime-400" />
                <textarea placeholder="Sua mensagem aqui..." value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded-lg border-2 border-gray-600 focus:ring-lime-400 focus:border-lime-400" />
                <button onClick={handleSendNotification} className="w-full bg-lime-600 hover:bg-lime-500 text-black p-2 rounded-lg font-semibold">Enviar Notificação</button>
             </div>
          </div>
          {feedback && (
            <div className={`mt-4 p-3 rounded-lg text-center font-semibold text-sm ${feedback.type === 'success' ? 'bg-lime-900/50 text-lime-300' : 'bg-red-900/50 text-red-300'}`}>
                {feedback.message}
            </div>
           )}
        </div>
        <div className="p-4 border-t border-lime-500/30 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="bg-lime-400 hover:bg-lime-300 text-black font-bold py-2 px-4 rounded-lg animate-pulse-neon-green">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;