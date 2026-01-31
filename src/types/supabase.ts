
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            race_registrations: {
                Row: {
                    created_at: string | null
                    id: string
                    race_id: string
                    racer_id: string
                    team_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    race_id: string
                    racer_id: string
                    team_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    race_id?: string
                    racer_id?: string
                    team_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "race_registrations_race_id_fkey"
                        columns: ["race_id"]
                        isOneToOne: false
                        referencedRelation: "races"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "race_registrations_racer_id_fkey"
                        columns: ["racer_id"]
                        isOneToOne: false
                        referencedRelation: "racers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "race_registrations_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            race_results: {
                Row: {
                    created_at: string | null
                    finish_time: unknown | null
                    id: string
                    laps_completed: number | null
                    race_id: string
                    racer_id: string
                    rank: number | null
                    score: number | null
                    status: string | null
                }
                Insert: {
                    created_at?: string | null
                    finish_time?: unknown | null
                    id?: string
                    laps_completed?: number | null
                    race_id: string
                    racer_id: string
                    rank?: number | null
                    score?: number | null
                    status?: string | null
                }
                Update: {
                    created_at?: string | null
                    finish_time?: unknown | null
                    id?: string
                    laps_completed?: number | null
                    race_id?: string
                    racer_id?: string
                    rank?: number | null
                    score?: number | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "race_results_race_id_fkey"
                        columns: ["race_id"]
                        isOneToOne: false
                        referencedRelation: "races"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "race_results_racer_id_fkey"
                        columns: ["racer_id"]
                        isOneToOne: false
                        referencedRelation: "racers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            racers: {
                Row: {
                    biography: string | null
                    code: string
                    created_at: string | null
                    dob: string | null
                    id: string
                    name: string
                    nationality: string | null
                    team_id: string | null
                }
                Insert: {
                    biography?: string | null
                    code: string
                    created_at?: string | null
                    dob?: string | null
                    id?: string
                    name: string
                    nationality?: string | null
                    team_id?: string | null
                }
                Update: {
                    biography?: string | null
                    code?: string
                    created_at?: string | null
                    dob?: string | null
                    id?: string
                    name?: string
                    nationality?: string | null
                    team_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "racers_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            races: {
                Row: {
                    code: string
                    created_at: string | null
                    description: string | null
                    id: string
                    laps: number | null
                    location: string | null
                    name: string
                    time: string | null
                }
                Insert: {
                    code: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    laps?: number | null
                    location?: string | null
                    name: string
                    time?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    laps?: number | null
                    location?: string | null
                    name?: string
                    time?: string | null
                }
                Relationships: []
            }
            teams: {
                Row: {
                    brand: string | null
                    code: string
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                }
                Insert: {
                    brand?: string | null
                    code: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                }
                Update: {
                    brand?: string | null
                    code?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
