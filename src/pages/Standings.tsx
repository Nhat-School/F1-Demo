
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Loader2, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';

type RacerStat = {
    id: string;
    name: string;
    nationality: string;
    teamName: string;
    totalScore: number;
    totalTimeMs: number;
    results: any[];
};

type TeamStat = {
    id: string;
    name: string;
    brand: string;
    totalScore: number;
    totalTimeMs: number;
    results: any[];
};

export const Standings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'racers' | 'teams'>('racers');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const { data: rawResults, isLoading } = useQuery({
        queryKey: ['standings_data'],
        queryFn: async () => {
            // Fetch all results with relations
            const { data, error } = await supabase
                .from('race_results')
                .select(`
          *,
          races (id, name, created_at, code),
          racers (
            id, name, nationality, team_id,
            teams (id, name, brand)
          )
        `);

            if (error) throw error;
            return data;
        },
    });

    const stats = useMemo(() => {
        if (!rawResults) return { racers: [], teams: [] };

        const racerMap: Record<string, RacerStat> = {};
        const teamMap: Record<string, TeamStat> = {};

        rawResults.forEach((res: any) => {
            const racer = res.racers;
            // racer.teams should be an object due to FK, but safeguard it
            const teamData = (racer.teams) || { name: 'Unknown', id: 'unknown', brand: 'Unknown' };

            // Helper to parse time
            // Assume Format "HH:MM:SS.mmm"
            let timeMs = 0;
            if (res.finish_time && res.status === 'FINISHED') {
                const [h, m, s] = res.finish_time.split(':');
                const [sec, ms] = (s || '0').split('.');
                timeMs = (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec)) * 1000 + (parseInt(ms || '0'));
            }

            // Racer Stats
            if (!racerMap[racer.id]) {
                racerMap[racer.id] = {
                    id: racer.id,
                    name: racer.name,
                    nationality: racer.nationality || '',
                    teamName: teamData.name,
                    totalScore: 0,
                    totalTimeMs: 0,
                    results: []
                };
            }
            racerMap[racer.id].totalScore += (res.score || 0);
            racerMap[racer.id].totalTimeMs += timeMs;
            racerMap[racer.id].results.push({ ...res, raceName: res.races.name });

            // Team Stats
            if (!teamMap[teamData.id]) {
                teamMap[teamData.id] = {
                    id: teamData.id,
                    name: teamData.name,
                    brand: teamData.brand,
                    totalScore: 0,
                    totalTimeMs: 0,
                    results: [] // Will aggregate stages here? 
                    // Requirement: "system displays detailed results for each stage of that racing team"
                    // "each stage on 1 line: race name, total score, total time of the 2 racers"
                };
            }
            teamMap[teamData.id].totalScore += (res.score || 0);
            teamMap[teamData.id].totalTimeMs += timeMs;

            // Group team results by race?
            // We push individual result now, aggregate later for detail view
            teamMap[teamData.id].results.push({ ...res, raceName: res.races.name });
        });

        const sortedRacers = Object.values(racerMap).sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.totalTimeMs - b.totalTimeMs;
        });

        const sortedTeams = Object.values(teamMap).sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.totalTimeMs - b.totalTimeMs;
        });

        return { racers: sortedRacers, teams: sortedTeams };
    }, [rawResults]);

    // Helper to format Ms to Time
    const formatMs = (ms: number) => {
        if (ms === 0) return '00:00:00.000'; // Or "-"
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const msec = ms % 1000;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(msec).padStart(3, '0')}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Standings</h2>
                <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                        onClick={() => setActiveTab('racers')}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'racers' ? "bg-red-50 text-red-700" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Driver Standings
                    </button>
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'teams' ? "bg-red-50 text-red-700" : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        Team Standings
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-red-600 w-8 h-8" /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="py-3 px-6 w-16">Pos</th>
                                {activeTab === 'racers' ? (
                                    <>
                                        <th className="py-3 px-6">Driver</th>
                                        <th className="py-3 px-6">Nationality</th>
                                        <th className="py-3 px-6">Team</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="py-3 px-6">Team</th>
                                        <th className="py-3 px-6">Brand/Owner</th>
                                    </>
                                )}
                                <th className="py-3 px-6 text-right">Points</th>
                                <th className="py-3 px-6 text-right">Total Time</th>
                                <th className="py-3 px-6 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(activeTab === 'racers' ? stats.racers : stats.teams).map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedItem({ type: activeTab, data: item })}
                                >
                                    <td className="py-3 px-6 font-semibold text-gray-700">{idx + 1}</td>
                                    <td className="py-3 px-6 font-medium text-gray-900">{item.name}</td>
                                    {activeTab === 'racers' ? (
                                        <>
                                            <td className="py-3 px-6 text-gray-500">{(item as RacerStat).nationality}</td>
                                            <td className="py-3 px-6 text-gray-500">{(item as RacerStat).teamName}</td>
                                        </>
                                    ) : (
                                        <td className="py-3 px-6 text-gray-500">{(item as TeamStat).brand}</td>
                                    )}
                                    <td className="py-3 px-6 text-right font-bold text-gray-900">{item.totalScore}</td>
                                    <td className="py-3 px-6 text-right text-gray-500 font-mono text-xs">{formatMs(item.totalTimeMs)}</td>
                                    <td className="py-3 px-6"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-900">
                                Performance History: {selectedItem.data.name}
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-gray-200 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-0 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-gray-500 bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-6">Race</th>
                                        {selectedItem.type === 'racers' && <th className="py-3 px-6">Rank</th>}
                                        <th className="py-3 px-6 text-right">Points</th>
                                        <th className="py-3 px-6 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedItem.type === 'racers' ? (
                                        // Racer Detail
                                        (selectedItem.data as RacerStat).results.map((res, i) => (
                                            <tr key={i}>
                                                <td className="py-3 px-6">{res.raceName}</td>
                                                <td className="py-3 px-6">{res.rank ? `#${res.rank}` : res.status}</td>
                                                <td className="py-3 px-6 text-right font-medium">{res.score}</td>
                                                <td className="py-3 px-6 text-right font-mono text-xs">{res.finish_time || 'DNF'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Team Detail: Aggregate by Race
                                        // We need to group flat results by race_id
                                        Object.values((selectedItem.data as TeamStat).results.reduce((acc: any, curr: any) => {
                                            if (!acc[curr.race_id]) {
                                                acc[curr.race_id] = {
                                                    raceName: curr.raceName,
                                                    score: 0,
                                                    timeMs: 0
                                                };
                                            }
                                            acc[curr.race_id].score += (curr.score || 0);
                                            // Time sum logic
                                            // Same logic as main calc
                                            let timeMs = 0;
                                            if (curr.finish_time && curr.status === 'FINISHED') {
                                                const [h, m, s] = curr.finish_time.split(':');
                                                const [sec, ms] = (s || '0').split('.');
                                                timeMs = (parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(sec)) * 1000 + (parseInt(ms || '0'));
                                            }
                                            acc[curr.race_id].timeMs += timeMs;
                                            return acc;
                                        }, {})).map((raceStats: any, i) => (
                                            <tr key={i}>
                                                <td className="py-3 px-6">{raceStats.raceName}</td>
                                                <td className="py-3 px-6 text-right font-medium">{raceStats.score}</td>
                                                <td className="py-3 px-6 text-right font-mono text-xs">{formatMs(raceStats.timeMs)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
