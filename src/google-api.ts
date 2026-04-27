/**
 * Google OAuth & Calendar API - Client-side only
 * Uses Google Identity Services (GIS) for OAuth2
 * Calls Google Calendar REST API directly with access tokens
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const USERINFO_API = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Storage keys
const STORAGE_TOKEN_KEY = 'wt_google_tokens';
const STORAGE_USER_KEY = 'wt_google_user';
const STORAGE_SETTINGS_KEY = 'wt_settings';

// ============= Types =============

export interface GoogleTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  /** Timestamp (ms) when token was obtained */
  obtained_at: number;
}

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status: string;
  colorId?: string;
  description?: string;
}

export interface AppSettings {
  ratePerHour: number;
  targetSalary: number;
  /** Event filter keywords (case-insensitive) — events matching any keyword are included */
  filterKeywords: string[];
  /** Google OAuth Client ID */
  clientId: string;
  /** Auto-sync interval in minutes (0 = off) */
  autoSyncMinutes: number;
}

// ============= Default Settings =============

export const DEFAULT_SETTINGS: AppSettings = {
  ratePerHour: 25500,
  targetSalary: 4000000,
  filterKeywords: ['💼', 'work', 'timezone pac'],
  clientId: '',
  autoSyncMinutes: 5,
};

// ============= Storage Helpers =============

export function loadTokens(): GoogleTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (!raw) return null;
    const tokens: GoogleTokens = JSON.parse(raw);
    // Check if token is expired (with 5min buffer)
    const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;
    if (Date.now() > expiresAt - 5 * 60 * 1000) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: GoogleTokens): void {
  localStorage.setItem(STORAGE_TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function loadUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: GoogleUser): void {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

// ============= Google Identity Services OAuth =============

/**
 * Initiates Google OAuth2 login using Google Identity Services.
 * Opens a popup for the user to select their Google account.
 */
export function initiateGoogleLogin(clientId: string): Promise<GoogleTokens> {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error('Google Client ID chưa được cấu hình. Vui lòng nhập Client ID trong Settings.'));
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services chưa được tải. Vui lòng refresh trang.'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      prompt: 'select_account',
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        const tokens: GoogleTokens = {
          access_token: response.access_token,
          token_type: response.token_type,
          expires_in: response.expires_in,
          scope: response.scope,
          obtained_at: Date.now(),
        };
        saveTokens(tokens);
        resolve(tokens);
      },
      error_callback: (error: any) => {
        reject(new Error(error.message || 'Đăng nhập bị hủy.'));
      },
    });

    tokenClient.requestAccessToken();
  });
}

// ============= API Calls =============

async function apiCall<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearTokens();
      throw new Error('TOKEN_EXPIRED');
    }
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Fetch user profile information
 */
export async function fetchUserInfo(token: string): Promise<GoogleUser> {
  const data = await apiCall<any>(USERINFO_API, token);
  const user: GoogleUser = {
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
  saveUser(user);
  return user;
}

// ============= Calendar List =============

interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  selected?: boolean;
  backgroundColor?: string;
}

/**
 * List all calendars the user has access to
 */
export async function fetchCalendarList(token: string): Promise<CalendarListEntry[]> {
  const data = await apiCall<{ items?: CalendarListEntry[] }>(
    `${CALENDAR_API_BASE}/users/me/calendarList`,
    token
  );
  return data.items || [];
}

/**
 * Fetch calendar events for a specific month from ALL user calendars.
 * Merges and deduplicates by event ID.
 */
export async function fetchCalendarEvents(
  token: string,
  year: number,
  month: number // 0-indexed
): Promise<CalendarEvent[]> {
  const timeMin = new Date(year, month, 1).toISOString();
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  // 1. Get all calendars
  let calendars: CalendarListEntry[];
  try {
    calendars = await fetchCalendarList(token);
    console.log(`[WorkTrackify] Found ${calendars.length} calendars:`);
    calendars.forEach(c => console.log(`  📆 "${c.summary}" ${c.primary ? '(primary)' : ''} [${c.id}]`));
  } catch {
    // Fallback to primary only
    calendars = [{ id: 'primary', summary: 'Primary' }];
  }

  // 2. Fetch events from each calendar in parallel
  const allEvents: CalendarEvent[] = [];
  const seen = new Set<string>();

  const fetchPromises = calendars.map(async (cal) => {
    try {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const data = await apiCall<{ items?: CalendarEvent[] }>(
        `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
        token
      );

      const events = data.items || [];
      console.log(`[WorkTrackify] Calendar "${cal.summary}": ${events.length} events`);
      return events;
    } catch (err) {
      console.warn(`[WorkTrackify] Failed to fetch from calendar "${cal.summary}":`, err);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);

  // 3. Merge & deduplicate
  for (const events of results) {
    for (const event of events) {
      if (!seen.has(event.id)) {
        seen.add(event.id);
        allEvents.push(event);
      }
    }
  }

  console.log(`[WorkTrackify] Total merged events: ${allEvents.length}`);
  return allEvents;
}
