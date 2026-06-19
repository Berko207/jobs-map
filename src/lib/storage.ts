import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface CompanyUserState {
  saved: boolean;
  applied: boolean;
}

export type CompanyStates = Record<string, CompanyUserState>;

const STORAGE_KEY = "hermosillo-jobs-map-states";

function hasSupabaseEnv(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseClient;
}

export function loadFromLocalStorage(): CompanyStates {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CompanyStates;
  } catch {
    return {};
  }
}

export function saveToLocalStorage(states: CompanyStates): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

export async function loadFromSupabase(): Promise<CompanyStates> {
  const supabase = getSupabase();
  if (!supabase) return {};

  const { data, error } = await supabase.from("user_companies").select("*");
  if (error || !data) return {};

  const states: CompanyStates = {};
  for (const row of data) {
    states[row.company_id] = {
      saved: row.saved ?? false,
      applied: row.applied ?? false,
    };
  }
  return states;
}

export async function upsertSupabaseState(
  companyId: string,
  saved: boolean,
  applied: boolean,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("user_companies").upsert(
    {
      company_id: companyId,
      saved,
      applied,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
}

export async function loadCompanyStates(): Promise<CompanyStates> {
  if (hasSupabaseEnv()) {
    return loadFromSupabase();
  }
  return loadFromLocalStorage();
}

export function persistCompanyStates(states: CompanyStates): void {
  if (!hasSupabaseEnv()) {
    saveToLocalStorage(states);
  }
}

export async function syncStateToBackend(
  companyId: string,
  saved: boolean,
  applied: boolean,
): Promise<void> {
  if (hasSupabaseEnv()) {
    await upsertSupabaseState(companyId, saved, applied);
  }
}

export function isSupabaseEnabled(): boolean {
  return hasSupabaseEnv();
}
