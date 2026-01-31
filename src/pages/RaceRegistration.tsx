
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Calendar, Users, Check, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const RaceRegistration: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedRace, setSelectedRace] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedRacers, setSelectedRacers] = useState<string[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Fetch Races
    const { data: races, isLoading: loadingRaces } = useQuery({
        queryKey: ['races'],
        queryFn: async () => {
            const { data, error } = await supabase.from('races').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    // Fetch Teams
    const { data: teams, isLoading: loadingTeams } = useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
            const { data, error } = await supabase.from('teams').select('*').order('name');
            if (error) throw error;
            return data;
        },
    });

    // Fetch Racers for Selected Team
    const { data: racers, isLoading: loadingRacers } = useQuery({
        queryKey: ['racers', selectedTeam],
        queryFn: async () => {
            if (!selectedTeam) return [];
            const { data, error } = await supabase
                .from('racers')
                .select('*')
                .eq('team_id', selectedTeam)
                .order('name');
            if (error) throw error;
            return data;
        },
        enabled: !!selectedTeam,
    });

    // Register Mutation
    const registerMutation = useMutation({
        mutationFn: async () => {
            if (!selectedRace || selectedRacers.length !== 2) throw new Error('Invalid selection');

            // Prepare inserts
            const inserts = selectedRacers.map(racerId => ({
                race_id: selectedRace,
                team_id: selectedTeam,
                racer_id: racerId
            }));

            // We should check if they are already registered or just upsert?
            // For simplicity, let's just insert. If unique constraint hits, it will error.
            const { error } = await supabase.from('race_registrations').insert(inserts);
            if (error) throw error;
        },
        onSuccess: () => {
            setNotification({ type: 'success', message: 'Registration saved successfully!' });
            setSelectedRacers([]);
            setSelectedTeam('');
            setSelectedRace('');
            setTimeout(() => setNotification(null), 3000);
            queryClient.invalidateQueries({ queryKey: ['race_registrations'] });
        },
        onError: (error: any) => {
            setNotification({ type: 'error', message: error.message || 'Failed to register' });
        }
    });

    const handleRacerToggle = (racerId: string) => {
        setSelectedRacers(prev => {
            if (prev.includes(racerId)) {
                return prev.filter(id => id !== racerId);
            }
            if (prev.length >= 2) {
                return prev;
            }
            return [...prev, racerId];
        });
    };

    const isSubmitDisabled = !selectedRace || !selectedTeam || selectedRacers.length !== 2 || registerMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Register to Racing</h2>
            </div>

            {notification && (
                <div className={clsx(
                    "p-4 rounded-lg flex items-center gap-3",
                    notification.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                    {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selection Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Race Selection
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Race</label>
                        <select
                            value={selectedRace}
                            onChange={(e) => setSelectedRace(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-2 border px-3"
                            disabled={loadingRaces || registerMutation.isPending}
                        >
                            <option value="">-- Select Race --</option>
                            {races?.map((race) => (
                                <option key={race.id} value={race.id}>{race.name} ({race.location})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Team</label>
                        <select
                            value={selectedTeam}
                            onChange={(e) => {
                                setSelectedTeam(e.target.value);
                                setSelectedRacers([]); // Reset selection on team change
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-2 border px-3"
                            disabled={loadingTeams || registerMutation.isPending}
                        >
                            <option value="">-- Select Team --</option>
                            {teams?.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Racers List Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Select Racers (2 Required)
                    </h3>

                    {!selectedTeam ? (
                        <div className="text-gray-400 text-center py-8">Please select a team first</div>
                    ) : loadingRacers ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : racers?.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">No racers found for this team</div>
                    ) : (
                        <div className="space-y-2">
                            {racers?.map((racer) => {
                                const isSelected = selectedRacers.includes(racer.id);
                                const isDisabled = !isSelected && selectedRacers.length >= 2;
                                return (
                                    <label
                                        key={racer.id}
                                        className={clsx(
                                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                            isSelected ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50",
                                            isDisabled && "opacity-50 cursor-not-allowed hover:bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                                                checked={isSelected}
                                                onChange={() => handleRacerToggle(racer.id)}
                                                disabled={isDisabled}
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{racer.name}</p>
                                                <p className="text-xs text-gray-500">{racer.nationality}</p>
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-red-600" />}
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => registerMutation.mutate()}
                            disabled={isSubmitDisabled}
                            className={clsx(
                                "px-4 py-2 rounded-md text-white font-medium transition-colors flex items-center gap-2",
                                isSubmitDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {registerMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Registration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
