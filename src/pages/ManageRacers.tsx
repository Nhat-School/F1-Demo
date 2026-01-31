
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, X, Loader2, Users } from 'lucide-react';

type Racer = {
    id: string;
    code: string;
    name: string;
    nationality: string | null;
    dob: string | null;
    biography: string | null;
    team_id: string | null;
    teams?: { name: string } | null;
};

export const ManageRacers: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRacer, setEditingRacer] = useState<Racer | null>(null);
    const [formData, setFormData] = useState<Partial<Racer>>({
        code: '', name: '', nationality: '', dob: '', biography: '', team_id: ''
    });

    const { data: racers, isLoading: loadingRacers } = useQuery({
        queryKey: ['racers_admin'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('racers')
                .select('*, teams(name)')
                .order('name');
            if (error) throw error;
            return data;
        },
    });

    const { data: teams } = useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
            const { data, error } = await supabase.from('teams').select('id, name').order('name');
            if (error) throw error;
            return data;
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (data: Partial<Racer>) => {
            // Clean up team_id and dob if empty string -> null
            const payload = {
                ...data,
                team_id: data.team_id || null,
                dob: data.dob || null
            };

            if (editingRacer) {
                const { error } = await supabase.from('racers').update(payload).eq('id', editingRacer.id);
                if (error) throw error;
            } else {
                const newRacer = {
                    ...payload,
                    code: payload.code as string,
                    name: payload.name as string
                };
                const { error } = await supabase.from('racers').insert([newRacer]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['racers_admin'] });
            closeModal();
        },
        onError: (error) => {
            alert('Error saving racer: ' + error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('racers').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['racers_admin'] });
        },
    });

    const openModal = (racer?: Racer) => {
        if (racer) {
            setEditingRacer(racer);
            setFormData({
                code: racer.code,
                name: racer.name,
                nationality: racer.nationality || '',
                dob: racer.dob ? new Date(racer.dob).toISOString().slice(0, 10) : '',
                biography: racer.biography || '',
                team_id: racer.team_id || ''
            });
        } else {
            setEditingRacer(null);
            setFormData({ code: '', name: '', nationality: '', dob: '', biography: '', team_id: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRacer(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-red-600" /> Manage Racers
                </h2>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Racer
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loadingRacers ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="py-3 px-6">Code</th>
                                <th className="py-3 px-6">Name</th>
                                <th className="py-3 px-6">Nationality</th>
                                <th className="py-3 px-6">Team</th>
                                <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {racers?.map((racer: any) => (
                                <tr key={racer.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-6 font-mono text-xs font-semibold">{racer.code}</td>
                                    <td className="py-3 px-6 font-medium text-gray-900">{racer.name}</td>
                                    <td className="py-3 px-6 text-gray-500">{racer.nationality}</td>
                                    <td className="py-3 px-6 text-gray-500">{racer.teams?.name || '-'}</td>
                                    <td className="py-3 px-6 flex justify-end gap-2">
                                        <button onClick={() => openModal(racer)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Delete this racer?')) deleteMutation.mutate(racer.id) }}
                                            className="p-1 hover:bg-red-50 rounded text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold mb-4">{editingRacer ? 'Edit Racer' : 'Add New Racer'}</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                    <input
                                        required
                                        maxLength={3}
                                        className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm uppercase"
                                        value={formData.code || ''}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                                    <input
                                        className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                        value={formData.nationality || ''}
                                        onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    required
                                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                <select
                                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                    value={formData.team_id || ''}
                                    onChange={e => setFormData({ ...formData, team_id: e.target.value })}
                                >
                                    <option value="">-- No Team --</option>
                                    {teams?.map((team) => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                    rows={2}
                                    value={formData.biography || ''}
                                    onChange={e => setFormData({ ...formData, biography: e.target.value })}
                                    placeholder="Biography..."
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    {saveMutation.isPending ? 'Saving...' : 'Save Racer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
