
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Save, Loader2, AlertCircle, Check } from 'lucide-react';
import clsx from 'clsx';

type ResultInput = {
    racer_id: string;
    status: 'FINISHED' | 'DNF' | 'DNS';
    laps_completed: number;
    finish_time: string; // "HH:MM:SS.MS"
};

export const RaceResults: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedRace, setSelectedRace] = useState<string>('');
    const [results, setResults] = useState<Record<string, ResultInput>>({});
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

    // Fetch Registrations for Selected Race
    const { data: registrations, isLoading: loadingRegs } = useQuery({
        queryKey: ['registrations', selectedRace],
        queryFn: async () => {
            if (!selectedRace) return [];
            const { data, error } = await supabase
                .from('race_registrations')
                .select(`
          *,
          racers (id, name, code, nationality),
          teams (id, name, code)
        `)
                .eq('race_id', selectedRace)
                .order('id'); // consistent order

            if (error) throw error;
            return data;
        },
        enabled: !!selectedRace,
    });

    // Fetch Existing Results to pre-fill
    useQuery({
        queryKey: ['race_results', selectedRace],
        queryFn: async () => {
            if (!selectedRace) return null;
            const { data, error } = await supabase
                .from('race_results')
                .select('*')
                .eq('race_id', selectedRace);

            if (error) throw error;

            // Update local state with existing results
            if (data) {
                const initialResults: Record<string, ResultInput> = {};
                data.forEach(res => {
                    initialResults[res.racer_id] = {
                        racer_id: res.racer_id,
                        status: (res.status as any) || 'FINISHED',
                        laps_completed: res.laps_completed || 0,
                        finish_time: res.finish_time ? String(res.finish_time) : '',
                    };
                });
                setResults(prev => ({ ...prev, ...initialResults }));
            }
            return data;
        },
        enabled: !!selectedRace,
    });

    const handleInputChange = (racerId: string, field: keyof ResultInput, value: any) => {
        setResults(prev => ({
            ...prev,
            [racerId]: {
                ...prev[racerId] || { racer_id: racerId, status: 'FINISHED', laps_completed: 0, finish_time: '' },
                [field]: value
            }
        }));
    };

    const calculateScores = async () => {
        if (!selectedRace || !registrations) return;

        const inputs = Object.values(results);

        // Sort logic: 
        // 1. Finished racers sorted by Laps (Desc) then Time (Asc).
        // 2. DNF racers sorted by Laps (Desc).
        // 3. DNS ignored for ranking.

        const finished = inputs.filter(i => i.status === 'FINISHED');

        // Helper to parse time string "HH:MM:SS.mmm" or just comparison
        // Standard string comparison works for "HH:MM:SS" if format is strict.
        // Let's assume strict format: 01:23:45.678

        finished.sort((a, b) => {
            if (b.laps_completed !== a.laps_completed) return b.laps_completed - a.laps_completed;
            return a.finish_time.localeCompare(b.finish_time);
        });

        // Points system: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1
        const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

        const upserts = inputs.map(input => {
            let rank = null;
            let score = 0;

            if (input.status === 'FINISHED') {
                const index = finished.findIndex(f => f.racer_id === input.racer_id);
                if (index !== -1) {
                    rank = index + 1;
                    score = pointsMap[index] || 0;
                }
            }
            // DNF get 0 points, no rank (or rank after finished? Prompt says: "If the driver is in the top 10 but does not finish..., then 0 points")
            // So DNF = 0 points.

            return {
                race_id: selectedRace,
                racer_id: input.racer_id,
                status: input.status,
                laps_completed: input.laps_completed,
                finish_time: input.finish_time || null,
                rank,
                score
            };
        });

        const { error } = await supabase.from('race_results').upsert(upserts, { onConflict: 'race_id,racer_id' });
        if (error) throw error;
    };

    const saveMutation = useMutation({
        mutationFn: calculateScores,
        onSuccess: () => {
            setNotification({ type: 'success', message: 'Results updated successfully!' });
            setTimeout(() => setNotification(null), 3000);
            queryClient.invalidateQueries({ queryKey: ['race_results'] });
        },
        onError: (error: any) => {
            setNotification({ type: 'error', message: error.message || 'Failed to save results' });
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Update Results</h2>
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

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                {/* Race Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Race</label>
                    <select
                        value={selectedRace}
                        onChange={(e) => setSelectedRace(e.target.value)}
                        className="w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 py-2 border px-3"
                        disabled={loadingRaces || saveMutation.isPending}
                    >
                        <option value="">-- Select Race --</option>
                        {races?.map((race) => (
                            <option key={race.id} value={race.id}>{race.name} ({race.location})</option>
                        ))}
                    </select>
                </div>

                {/* Results Table */}
                {selectedRace && (
                    <div className="overflow-x-auto">
                        {loadingRegs ? (
                            <div className="text-center py-8"><Loader2 className="animate-spin inline-block text-gray-400" /></div>
                        ) : registrations?.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">No racers registered for this race. Go to "Register to Racing" first.</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                                        <th className="py-3 px-4">Racer</th>
                                        <th className="py-3 px-4">Team</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Laps</th>
                                        <th className="py-3 px-4">Time (HH:MM:SS.mmm)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {registrations?.map((reg: any) => {
                                        const data = results[reg.racer_id] || {
                                            racer_id: reg.racer_id,
                                            status: 'FINISHED',
                                            laps_completed: 0,
                                            finish_time: ''
                                        };

                                        return (
                                            <tr key={reg.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{reg.racers.name}</td>
                                                <td className="py-3 px-4 text-gray-500">{reg.teams.name}</td>
                                                <td className="py-3 px-4">
                                                    <select
                                                        value={data.status}
                                                        onChange={(e) => handleInputChange(reg.racer_id, 'status', e.target.value)}
                                                        className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-red-500 focus:border-red-500"
                                                    >
                                                        <option value="FINISHED">Finished</option>
                                                        <option value="DNF">DNF (Dropout)</option>
                                                        <option value="DNS">DNS</option>
                                                    </select>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        value={data.laps_completed}
                                                        onChange={(e) => handleInputChange(reg.racer_id, 'laps_completed', parseInt(e.target.value) || 0)}
                                                        className="w-20 rounded-md border-gray-300 shadow-sm text-sm focus:ring-red-500 focus:border-red-500"
                                                        disabled={data.status === 'DNS'}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="text"
                                                        placeholder="01:30:15.123"
                                                        value={data.finish_time}
                                                        onChange={(e) => handleInputChange(reg.racer_id, 'finish_time', e.target.value)}
                                                        className="w-32 rounded-md border-gray-300 shadow-sm text-sm focus:ring-red-500 focus:border-red-500"
                                                        disabled={data.status !== 'FINISHED'}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {selectedRace && registrations && registrations.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending}
                            className="px-6 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                        >
                            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Save className="w-4 h-4" /> Save Results
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
