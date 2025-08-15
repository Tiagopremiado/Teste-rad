import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User, SocialPost, AuditLogEntry, Suggestion, SuggestionStatus, AdminNotification, AdminNotificationSettings as AdminNotificationSettingsType } from '../types';
import UserManagementTable from './UserManagementTable';
import ContentModeration from './ContentModeration';
import DashboardOverview from './DashboardOverview';
import MassNotificationSender from './MassNotificationSender';
import SystemHealth from './SystemHealth';
import AuditLog from './AuditLog';
import { getModerationFlags } from '../services/aiOrchestrator';
import ManualSignalSender from './ManualSignalSender';
import CommunityHub from './CommunityHub';
import AdminNotificationBell from './AdminNotificationBell';
import AdminNotificationSettings from './AdminNotificationSettings';
import { supabase } from '../services/supabase';

interface AdminDashboardProps {
  allUsers: User[];
  currentUser: User;
  onExit: () => void;
  updateProfile: (id: string, updates: Partial<User>) => void;
  deleteProfile: (id: string) => void;
  grantPremium: (id: string, durationInDays: number | 'lifetime') => void;
  revokePremium: (id: string) => void;
  allPosts: SocialPost[];
  deletePost: (postId: string) => void;
  userMap: Map<string, User>;
  sendNotification: (uid: string, title: string, message: string) => Promise<boolean>;
  suggestions: Suggestion[];
  updateSuggestion: (id: string, status: SuggestionStatus) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 font-medium rounded-t-lg transition-all text-sm relative ${active ? 'bg-gray-900 text-lime-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
    >
        {children}
        {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 shadow-[0_0_8px_theme(colors.lime.400)]"></div>}
    </button>
);

enum Tab {
  Overview = 'overview',
  Users = 'users',
  Moderation = 'moderation',
  Community = 'community',
  Communication = 'communication',
  ManualSignals = 'manualSignals',
  System = 'system',
  Audit = 'audit',
  Settings = 'settings',
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    allUsers, currentUser, onExit, updateProfile, deleteProfile, grantPremium, revokePremium,
    allPosts, deletePost, userMap, sendNotification, suggestions, updateSuggestion
}) => {
    const ADMIN_NOTIFICATIONS_KEY = `radar_aviator_admin_notifications_${currentUser.id}`;
    const ADMIN_NOTIFICATION_SETTINGS_KEY = `radar_aviator_admin_settings_${currentUser.id}`;
    
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Overview);
    const [flaggedPosts, setFlaggedPosts] = useState<{ postId: string; reason: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    
    const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
        try {
            const stored = localStorage.getItem(ADMIN_NOTIFICATIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const [settings, setSettings] = useState<AdminNotificationSettingsType>(() => {
        const stored = localStorage.getItem(ADMIN_NOTIFICATION_SETTINGS_KEY);
        return stored ? JSON.parse(stored) : {
            newUser: true,
            expiringPlans: true,
            newPost: true,
            newSuggestion: true,
        };
    });

    const notifiedIdsRef = useRef({
        users: new Set(allUsers.map(u => u.id)),
        posts: new Set(allPosts.map(p => p.id)),
        suggestions: new Set(suggestions.map(s => s.id)),
    });
    
    useEffect(() => {
        const fetchAuditLog = async () => {
            const { data, error } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(200);
            if (error) console.error('Error fetching audit log:', error);
            else setAuditLog(data as AuditLogEntry[]);
        };
        fetchAuditLog();
    }, []);

    
    useEffect(() => {
        localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem(ADMIN_NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    // --- Notification Generation Effects ---
    useEffect(() => {
        if (!settings.newUser) return;
        const newPendingUsers = allUsers.filter(user => !notifiedIdsRef.current.users.has(user.id) && user.status === 'pending_approval');
        if (newPendingUsers.length > 0) {
            const newNotifs = newPendingUsers.map(user => {
                notifiedIdsRef.current.users.add(user.id);
                return {
                    id: crypto.randomUUID(), type: 'new_user' as const,
                    message: `Novo usuário aguardando aprovação: ${user.display_name}`,
                    timestamp: new Date().toISOString(), read: false, targetId: user.id,
                };
            });
            setNotifications(prev => [...newNotifs, ...prev]);
        }
    }, [allUsers, settings.newUser]);

    useEffect(() => {
        if (!settings.newPost) return;
        const newPosts = allPosts.filter(post => !notifiedIdsRef.current.posts.has(post.id));
        if (newPosts.length > 0) {
            const newNotifs = newPosts.map(post => {
                notifiedIdsRef.current.posts.add(post.id);
                return {
                    id: crypto.randomUUID(), type: 'new_post' as const,
                    message: `Novo post de ${userMap.get(post.author_id)?.display_name || 'usuário'}: "${post.text.substring(0, 20)}..."`,
                    timestamp: new Date().toISOString(), read: false, targetId: post.id,
                };
            });
            setNotifications(prev => [...newNotifs, ...prev]);
        }
    }, [allPosts, settings.newPost, userMap]);

    useEffect(() => {
        if (!settings.newSuggestion) return;
        const newSuggestions = suggestions.filter(s => !notifiedIdsRef.current.suggestions.has(s.id));
        if (newSuggestions.length > 0) {
            const newNotifs = newSuggestions.map(s => {
                notifiedIdsRef.current.suggestions.add(s.id);
                return {
                    id: crypto.randomUUID(), type: 'new_suggestion' as const,
                    message: `Nova sugestão de ${userMap.get(s.author_id)?.display_name || 'usuário'}.`,
                    timestamp: new Date().toISOString(), read: false, targetId: s.id,
                };
            });
            setNotifications(prev => [...newNotifs, ...prev]);
        }
    }, [suggestions, settings.newSuggestion, userMap]);

     useEffect(() => {
        if (!settings.expiringPlans) return;
        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        const expiringUsers: { user: User; daysLeft: number }[] = [];
        const existingExpiringNotifs = new Set(notifications.filter(n => n.type === 'expiring_plan').map(n => n.targetId));

        allUsers.forEach(user => {
            if (user.premium_expiry && !user.is_lifetime) {
                const expiry = new Date(user.premium_expiry).getTime();
                const timeLeft = expiry - now;
                if (timeLeft > 0 && timeLeft <= threeDays && !existingExpiringNotifs.has(user.id)) {
                    expiringUsers.push({ user, daysLeft: Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) });
                }
            }
        });

        if (expiringUsers.length > 0) {
            const newNotifs = expiringUsers.map(({ user, daysLeft }) => ({
                id: crypto.randomUUID(), type: 'expiring_plan' as const,
                message: `Plano de ${user.display_name} expira em ${daysLeft} dia(s).`,
                timestamp: new Date().toISOString(), read: false, targetId: user.id,
            }));
            setNotifications(prev => [...newNotifs, ...prev]);
        }
    }, [allUsers, settings.expiringPlans, notifications]);

    // --- Handlers ---
    const logAction = async (action: Omit<AuditLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => {
        const newEntry: Omit<AuditLogEntry, 'id'> = {
            ...action, timestamp: new Date().toISOString(),
            adminId: currentUser.id, adminName: currentUser.display_name,
        };
        const { data, error } = await supabase.from('audit_log').insert(newEntry).select();
        if (error) {
            console.error("Error logging action:", error);
        } else if (data) {
            setAuditLog(prev => [data[0] as AuditLogEntry, ...prev]);
        }
    };
    
    const handleNotificationClick = (notification: AdminNotification) => {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        const typeToTabMap: Record<AdminNotification['type'], Tab> = {
            'new_user': Tab.Users,
            'expiring_plan': Tab.Users,
            'new_post': Tab.Moderation,
            'new_suggestion': Tab.Community,
        };
        setActiveTab(typeToTabMap[notification.type]);
    };
    const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const handleClearAll = () => setNotifications([]);

    const handleGrantPremium = (id: string, durationInDays: number | 'lifetime') => {
        grantPremium(id, durationInDays);
        logAction({
            action: 'GRANT_PREMIUM', targetType: 'user', targetId: id,
            details: `Concedeu ${durationInDays === 'lifetime' ? 'acesso vitalício' : `${durationInDays} dias`} para ${userMap.get(id)?.display_name || id}.`
        });
    };

    const handleRevokePremium = (id: string) => {
        revokePremium(id);
        logAction({
            action: 'REVOKE_PREMIUM', targetType: 'user', targetId: id,
            details: `Revogou o acesso premium de ${userMap.get(id)?.display_name || id}.`
        });
    };
    
    const handleDeletePost = (postId: string) => {
        const post = allPosts.find(p => p.id === postId);
        deletePost(postId);
        logAction({
            action: 'DELETE_POST', targetType: 'post', targetId: postId,
            details: `Deletou o post de ${userMap.get(post?.author_id || '')?.display_name || 'usuário desconhecido'}.`
        });
    };
    
    const handleDeleteProfile = (id: string) => {
        const user = allUsers.find(u => u.id === id);
        deleteProfile(id);
         logAction({
            action: 'DELETE_USER', targetType: 'user', targetId: id,
            details: `Deletou o perfil de ${user?.display_name || 'usuário desconhecido'}.`
        });
    };

    const handleSendMassNotification = async (targetGroup: 'all' | 'premium' | 'free', title: string, message: string) => {
        const targetUsers = allUsers.filter(user => {
            if (targetGroup === 'all') return true;
            const isPremium = user.is_lifetime || (user.premium_expiry && new Date(user.premium_expiry) > new Date());
            return targetGroup === 'premium' ? isPremium : !isPremium;
        });

        const sendPromises = targetUsers.map(user => sendNotification(user.id, title, message));
        await Promise.all(sendPromises);
        
        logAction({
            action: 'SEND_MASS_NOTIFICATION', targetType: 'notification_mass', targetId: targetGroup,
            details: `Enviou notificação para ${targetUsers.length} usuários (${targetGroup}) com o título: "${title}".`
        });

        return targetUsers.length;
    };

    const handleAnalyzePosts = async () => {
        setIsAnalyzing(true);
        try {
            const postsToAnalyze = allPosts.map(p => ({ id: p.id, text: p.text, authorId: p.author_id }));
            const userPostsToAnalyze = postsToAnalyze.filter(p => userMap.get(p.authorId)?.role !== 'admin');
            if (userPostsToAnalyze.length > 0) {
                 const { flaggedPosts: flags } = await getModerationFlags(userPostsToAnalyze);
                 setFlaggedPosts(flags);
            } else {
                setFlaggedPosts([]);
            }
        } catch (error) {
            console.error("Error analyzing posts:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const postCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const post of allPosts) {
            counts.set(post.author_id, (counts.get(post.author_id) || 0) + 1);
        }
        return counts;
    }, [allPosts]);

    const renderContent = () => {
        switch (activeTab) {
            case Tab.Overview: return <DashboardOverview allUsers={allUsers} allPosts={allPosts} userMap={userMap} onNavigate={(tab) => setActiveTab(tab as Tab)} />;
            case Tab.Users: return <UserManagementTable users={allUsers} postCounts={postCounts} updateProfile={updateProfile} deleteProfile={handleDeleteProfile} grantPremium={handleGrantPremium} revokePremium={handleRevokePremium} sendNotification={sendNotification} />;
            case Tab.Moderation: return <ContentModeration posts={allPosts} userMap={userMap} deletePost={handleDeletePost} flaggedPosts={flaggedPosts} onAnalyzePosts={handleAnalyzePosts} isAnalyzing={isAnalyzing} />;
            case Tab.Community: return <CommunityHub suggestions={suggestions} updateSuggestion={updateSuggestion} userMap={userMap} allUsers={allUsers} />;
            case Tab.Communication: return <MassNotificationSender onSend={handleSendMassNotification} />;
            case Tab.ManualSignals: return <ManualSignalSender currentUser={currentUser} logAction={logAction} />;
            case Tab.System: return <SystemHealth />;
            case Tab.Audit: return <AuditLog log={auditLog} />;
            case Tab.Settings: return <AdminNotificationSettings settings={settings} onSettingsChange={setSettings} />;
            default: return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 font-sans flex flex-col">
            <header className="bg-black/50 backdrop-blur-lg border-b border-gray-800 shadow-lg sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <h1 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="text-2xl">🛡️</span> Painel do Administrador
                    </h1>
                    <div className="flex items-center gap-4">
                        <AdminNotificationBell 
                            notifications={notifications}
                            onNotificationClick={handleNotificationClick}
                            onMarkAllRead={handleMarkAllRead}
                            onClearAll={handleClearAll}
                        />
                        <button onClick={onExit} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm">Sair do Painel</button>
                    </div>
                </div>
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 border-b border-gray-800 overflow-x-auto">
                        {Object.values(Tab).map(tab => (
                            <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
                            </TabButton>
                        ))}
                    </div>
                </div>
            </header>
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-gray-900 rounded-xl shadow-xl border border-lime-500/30">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;