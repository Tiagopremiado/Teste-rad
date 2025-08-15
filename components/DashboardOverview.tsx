import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, Sector } from 'recharts';
import type { User, SocialPost } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; onClick?: () => void; }> = ({ title, value, icon, onClick }) => {
    const isClickable = !!onClick;
    const baseClasses = "bg-gray-800/50 p-6 rounded-xl flex items-center gap-4";
    const interactiveClasses = isClickable ? "cursor-pointer hover:bg-gray-800 transition-colors hover:ring-2 hover:ring-lime-400/50" : "";

    const content = (
        <>
            <div className="bg-gray-900/50 p-3 rounded-full">{icon}</div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </>
    );

    if (isClickable) {
        return <button onClick={onClick} className={`${baseClasses} ${interactiveClasses} w-full text-left`}>{content}</button>;
    }

    return <div className={baseClasses}>{content}</div>;
};

const getPremiumStatus = (user: User) => {
    if (user.is_lifetime) return true;
    if (user.premium_expiry) {
        return new Date(user.premium_expiry).getTime() > Date.now();
    }
    return false;
};

const COLORS = ['#a3e635', '#4b5563']; // lime-400, gray-600
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="font-bold text-sm">
            {`${payload.name} (${(percent * 100).toFixed(0)}%)`}
        </text>
    );
};

interface DashboardOverviewProps {
    allUsers: User[];
    allPosts: SocialPost[];
    userMap: Map<string, User>;
    onNavigate: (tab: 'users' | 'moderation') => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ allUsers, allPosts, userMap, onNavigate }) => {

    const stats = useMemo(() => {
        const premiumUsersCount = allUsers.filter(u => getPremiumStatus(u)).length;
        return {
            totalUsers: allUsers.length,
            premiumUsers: premiumUsersCount,
            totalPosts: allPosts.length,
        };
    }, [allUsers, allPosts]);

    const userGrowthData = useMemo(() => {
        const countsByDate: { [date: string]: number } = {};
        allUsers.forEach(user => {
            const date = new Date(user.created_at).toISOString().split('T')[0];
            countsByDate[date] = (countsByDate[date] || 0) + 1;
        });

        return Object.entries(countsByDate)
            .map(([date, count]) => ({ date, Novos: count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30); // Last 30 days of activity
    }, [allUsers]);

    const premiumDistributionData = useMemo(() => {
        const freeUsers = stats.totalUsers - stats.premiumUsers;
        return [
            { name: 'Premium', value: stats.premiumUsers },
            { name: 'Grátis', value: freeUsers },
        ];
    }, [stats]);
    
    const recentActivity = useMemo(() => {
        const userActivities = allUsers.map(u => ({
            type: 'user' as const,
            id: u.id,
            timestamp: new Date(u.created_at).getTime(),
            user: u,
            message: 'se cadastrou na plataforma.'
        }));
        const postActivities = allPosts.map(p => ({
            type: 'post' as const,
            id: p.id,
            timestamp: new Date(p.timestamp).getTime(),
            user: userMap.get(p.author_id),
            message: `criou um post: "${p.text.substring(0, 30)}..."`
        }));

        return [...userActivities, ...postActivities]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 7); // Last 7 activities
    }, [allUsers, allPosts, userMap]);

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total de Usuários" 
                    value={stats.totalUsers} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                    onClick={() => onNavigate('users')}
                />
                <StatCard 
                    title="Assinantes Premium" 
                    value={`${stats.premiumUsers} (${(stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0).toFixed(0)}%)`} 
                    icon={<span className="text-2xl">👑</span>}
                    onClick={() => onNavigate('users')}
                />
                <StatCard 
                    title="Total de Posts" 
                    value={stats.totalPosts} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    onClick={() => onNavigate('moderation')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-gray-800/50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Crescimento de Usuários (Últimos 30 dias)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1}/>
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} />
                            <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4b5563' }} />
                            <Bar dataKey="Novos" fill="#a3e635" name="Novos Usuários"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4 text-center">Distribuição de Planos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={premiumDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {premiumDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4b5563' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4">Atividade Recente</h3>
                <div className="space-y-3">
                    {recentActivity.map(activity => (
                         <button 
                             key={`${activity.type}-${activity.id}`} 
                             onClick={() => onNavigate(activity.type === 'user' ? 'users' : 'moderation')}
                             className="w-full text-left flex items-center gap-3 bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                         >
                            <img src={activity.user?.avatar_url} alt={activity.user?.display_name} className="w-8 h-8 rounded-full" />
                            <p className="text-sm text-gray-300">
                                <strong className="text-white">{activity.user?.display_name || 'Usuário'}</strong> {activity.message}
                            </p>
                            <span className="ml-auto text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString('pt-BR', {timeStyle: 'short'})}</span>
                         </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;