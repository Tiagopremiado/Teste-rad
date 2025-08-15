import React, { useState, useRef } from 'react';
import type { User } from '../types';

interface ProfileEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Pick<User, 'display_name' | 'avatar_url' | 'bio' | 'cover_photo_url'>) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(user.cover_photo_url);
  const [bio, setBio] = useState(user.bio);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setter(event.target.result as string);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
    onSave({ display_name: displayName, avatar_url: avatarUrl, bio, cover_photo_url: coverPhotoUrl });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold">Editar Perfil</h2>
        </div>
        
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="relative h-32 rounded-lg bg-gray-700/50 flex items-center justify-center">
             <img src={coverPhotoUrl} alt="Prévia da Capa" className="absolute inset-0 w-full h-full object-cover rounded-lg"/>
             <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="relative bg-black/50 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-black/70 transition-colors"
             >
                Alterar Capa
             </button>
             <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleFileChange(e, setCoverPhotoUrl)} className="hidden" />
          </div>
           <div className="flex items-center gap-4">
                <div className="relative">
                    <img src={avatarUrl} alt="Prévia do Avatar" className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-600"/>
                     <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-black/60 text-white p-1.5 rounded-full text-xs hover:bg-black/80 transition-colors"
                        title="Alterar foto de perfil"
                     >
                        ✏️
                     </button>
                    <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => handleFileChange(e, setAvatarUrl)} className="hidden" />
                </div>
                <div className="flex-grow">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">Nome de Exibição</label>
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-lime-500"
                    />
                </div>
           </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={150}
              className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-lime-500"
            />
          </div>
        </form>

        <div className="p-4 border-t border-gray-700 text-right flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSave}
            className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;