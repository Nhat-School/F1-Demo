
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarPlus, Trophy, BarChart3, FlipHorizontal2 as Flag, Box as Component, Users, Car } from 'lucide-react';
import clsx from 'clsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { label: 'Register', path: '/register', icon: CalendarPlus },
        { label: 'Results', path: '/results', icon: Trophy },
        { label: 'Standings', path: '/standings', icon: BarChart3 },
        { label: 'Races', path: '/races', icon: Flag },
        { label: 'Teams', path: '/teams', icon: Component },
        { label: 'Racers', path: '/racers', icon: Users },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <Car className="w-8 h-8 text-red-500" />
                    <h1 className="text-xl font-bold tracking-tight">F1 Manager</h1>
                </div>
                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 text-center">F1 Championship Management</p>
                </div>
            </aside>
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
