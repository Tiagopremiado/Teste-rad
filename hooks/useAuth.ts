import { useState, useCallback, useEffect } from 'react';
import type { User } from '../types';
import { getCodeDuration } from '../services/premiumService';
import { supabase } from '../services/supabase';

const CURRENT_PROFILE_ID_KEY = 'radar_aviator_current_profile_id';
const ADMIN_CODE = '84081447';

const createInitialProfile = (name: string, whatsapp: string): Omit<User, 'id' | 'created_at'> => ({
    display_name: name,
    whatsapp: whatsapp,
    role: 'user',
    status: 'pending_approval',
    avatar_url: `https://i.pravatar.cc/150?u=${name}`,
    cover_photo_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    bio: "Explorando os céus do Aviator!",
    risk_profile: 'Moderado',
    registration_pending: true,
    followers_count: 0,
    following_count: 0,
    is_lifetime: false,
    premium_expiry: null,
    used_codes: [],
});


export const useAuth = () => {
    const [profiles, setProfiles] = useState<User[]>([]);
    const [currentProfile, setCurrentProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all profiles on initial load
    useEffect(() => {
        const fetchProfiles = async () => {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) {
                console.error("Error fetching profiles:", error);
            } else {
                setProfiles(data as User[]);
            }
        };
        fetchProfiles();
    }, []);

    // Set current profile based on localStorage ID
    useEffect(() => {
        if (profiles.length > 0) {
            const currentId = localStorage.getItem(CURRENT_PROFILE_ID_KEY);
            if (currentId) {
                const profile = profiles.find(p => p.id === currentId);
                setCurrentProfile(profile || null);
            } else {
                setCurrentProfile(null);
            }
        }
    }, [profiles]);

    const createProfile = useCallback(async (name: string, whatsapp: string, premiumCode?: string): Promise<{ success: boolean; message: string }> => {
        const newProfileData = createInitialProfile(name, whatsapp);
        let premiumData: Partial<User> = {};

        if (premiumCode) {
            const durationInDays = getCodeDuration(premiumCode);
            if (durationInDays === null) {
                return { success: false, message: "Código de ativação inválido." };
            }
            if (premiumCode === ADMIN_CODE) {
                newProfileData.role = 'admin';
                newProfileData.display_name = 'Admin';
                newProfileData.status = 'active';
                newProfileData.registration_pending = false;
            }

            if (durationInDays === Infinity) {
                premiumData.is_lifetime = true;
                premiumData.premium_expiry = null;
            } else {
                premiumData.is_lifetime = false;
                const expiryDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);
                premiumData.premium_expiry = expiryDate.toISOString();
            }
            premiumData.used_codes = [premiumCode];
        }

        const finalProfileData = { ...newProfileData, ...premiumData };
        
        const { data, error: insertError } = await supabase
            .from('profiles')
            .insert([finalProfileData])
            .select();

        if (insertError) {
            console.error("Error creating profile:", insertError);
            return { success: false, message: `Falha ao criar perfil: ${insertError.message}` };
        }
        
        const createdProfile = data?.[0] as User;
        if (createdProfile) {
            setProfiles(prev => [...prev, createdProfile]);
            setCurrentProfile(createdProfile);
            localStorage.setItem(CURRENT_PROFILE_ID_KEY, createdProfile.id);
            return { success: true, message: "Perfil criado com sucesso!" };
        }

        return { success: false, message: "Falha ao obter dados do perfil criado." };
    }, []);

    const selectProfile = useCallback((id: string) => {
        const profileToSelect = profiles.find(p => p.id === id);
        if (profileToSelect) {
            setCurrentProfile(profileToSelect);
            localStorage.setItem(CURRENT_PROFILE_ID_KEY, id);
        }
    }, [profiles]);

    const deleteProfile = useCallback(async (id: string) => {
        if (window.confirm("Tem certeza que deseja deletar este perfil? Todos os dados associados (histórico, etc.) serão perdidos permanentemente.")) {
            const { error: deleteError } = await supabase.from('profiles').delete().eq('id', id);
            if (deleteError) {
                console.error("Error deleting profile:", deleteError);
                return;
            }
            
            // TODO: Delete associated data in other tables (posts, history, etc.)
            
            setProfiles(prev => prev.filter(p => p.id !== id));
            if (currentProfile?.id === id) {
                setCurrentProfile(null);
                localStorage.removeItem(CURRENT_PROFILE_ID_KEY);
            }
        }
    }, [currentProfile]);

    const logout = useCallback(() => {
        setCurrentProfile(null);
        localStorage.removeItem(CURRENT_PROFILE_ID_KEY);
    }, []);

    const updateProfile = useCallback(async (id: string, updates: Partial<User>) => {
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (updateError) {
            console.error("Error updating profile:", updateError);
            return;
        }

        const updatedProfile = data?.[0] as User;
        if (updatedProfile) {
            setProfiles(prev => prev.map(p => (p.id === id ? updatedProfile : p)));
            if (currentProfile?.id === id) {
                setCurrentProfile(updatedProfile);
            }
        }
    }, [currentProfile]);
    
    const activatePremium = useCallback(async (code: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        if (!currentProfile) {
            setError("Nenhum perfil selecionado. Não é possível ativar o código.");
            setIsLoading(false);
            return false;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const durationInDays = getCodeDuration(code);
            if (durationInDays === null) throw new Error("Código de ativação inválido.");

            const usedCodes = currentProfile.used_codes || [];
            if (usedCodes.includes(code)) throw new Error("Este código já foi utilizado neste perfil.");

            let updates: Partial<User> = { used_codes: [...usedCodes, code] };
            if (durationInDays === Infinity) {
                updates.is_lifetime = true;
                updates.premium_expiry = null;
            } else {
                const currentExpiryMs = currentProfile.premium_expiry ? new Date(currentProfile.premium_expiry).getTime() : Date.now();
                const newExpiryDate = new Date(currentExpiryMs + durationInDays * 24 * 60 * 60 * 1000);
                updates.premium_expiry = newExpiryDate.toISOString();
                updates.is_lifetime = false;
            }
            
            await updateProfile(currentProfile.id, updates);
            setIsLoading(false);
            return true;
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
            return false;
        }
    }, [currentProfile, updateProfile]);

    const grantPremium = useCallback(async (id: string, durationInDays: number | 'lifetime') => {
        const targetProfile = profiles.find(p => p.id === id);
        if (!targetProfile) return;
        
        const usedCodes = targetProfile.used_codes || [];
        const adminGrantCode = `ADMIN_GRANT_${new Date().toISOString()}`;
        
        let updates: Partial<User> = { used_codes: [...usedCodes, adminGrantCode] };
        if (durationInDays === 'lifetime') {
            updates.is_lifetime = true;
            updates.premium_expiry = null;
        } else {
            updates.premium_expiry = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000).toISOString();
            updates.is_lifetime = false;
        }
        await updateProfile(id, updates);
    }, [profiles, updateProfile]);

    const revokePremium = useCallback(async (id: string) => {
        await updateProfile(id, { is_lifetime: false, premium_expiry: null });
    }, [updateProfile]);
    
    const submitAffiliateUsername = useCallback(async (id: string, username: string) => {
        const updates = { 
            registration_pending: false, 
            affiliate_username: username,
            status: 'pending_approval' as const
        };
        await updateProfile(id, updates);
    }, [updateProfile]);

    return { 
        profiles, 
        currentProfile, 
        createProfile,
        selectProfile, 
        deleteProfile,
        logout,
        updateProfile,
        grantPremium,
        revokePremium,
        submitAffiliateUsername,
        activatePremium,
        isPremiumLoading: isLoading,
        premiumError: error,
    };
};