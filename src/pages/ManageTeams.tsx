
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, X, Loader2, Box as Component } from 'lucide-react';

type Team = {
    id: string;
    code: string;
    name: string;
    brand: string | null;
    description: string | null;
};

export const ManageTeams: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [formData, setFormData] = useState<Partial<Team>>({
        code: '', name: '', brand: '', description: ''
    });

    const { data: teams, isLoading } = useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
            const { data, error } = await supabase.from('teams').select('*').order('name');
            if (error) throw error;
            return data;
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (data: Partial<Team>) => {
            if (editingTeam) {
                const { error } = await supabase.from('teams').update(data).eq('id', editingTeam.id);
                if (error) throw error;
            } else {
                const newTeam = {
                    ...data,
                    code: data.code as string,
                    name: data.name as string
                };
                const { error } = await supabase.from('teams').insert([newTeam]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('teams').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
    });

    const openModal = (team?: Team) => {
        if (team) {
            setEditingTeam(team);
            setFormData({
                code: team.code,
                name: team.name,
                brand: team.brand || '',
                description: team.description || ''
            });
        } else {
            setEditingTeam(null);
            setFormData({ code: '', name: '', brand: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTeam(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Component className="w-6 h-6 text-red-600" /> Manage Teams
                </h2>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Team
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="py-3 px-6">Code</th>
                                <th className="py-3 px-6">Name</th>
                                <th className="py-3 px-6">Brand</th>
                                <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {teams?.map((team) => (
                                <tr key={team.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-6 font-mono text-xs font-semibold">{team.code}</td>
                                    <td className="py-3 px-6 font-medium text-gray-900">{team.name}</td>
                                    <td className="py-3 px-6 text-gray-500">{team.brand}</td>
                                    <td className="py-3 px-6 flex justify-end gap-2">
                                        <button onClick={() => openModal(team)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Delete this team?')) deleteMutation.mutate(team.id) }}
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
                        <h3 className="text-xl font-bold mb-4">{editingTeam ? 'Edit Team' : 'Add New Team'}</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    required
                                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input
                                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                    value={formData.brand || ''}
                                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                                    rows={2}
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                    {saveMutation.isPending ? 'Saving...' : 'Save Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
