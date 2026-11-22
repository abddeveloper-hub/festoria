// ==============================================================================
// Festoria — Pure JavaScript Supabase Client & Resilient Data Layer
// ==============================================================================

(function () {
  let client = null;

  // Initial seed data for offline / initial state (Prathibothsava 2026)
  const DEFAULT_TEAMS = [
    { id: 'TM-9639', fest_id: 'FEST-04', name: 'GUTHAKAADU', code: '0003', institution: 'MADRASA GUTHAKAADU', points: 265, gold: 14, silver: 10, bronze: 11 },
    { id: 'TM-2403', fest_id: 'FEST-04', name: 'MUKKA', code: '0001', institution: 'MADRASA MUKKA', points: 237, gold: 10, silver: 15, bronze: 7 },
    { id: 'TM-8835', fest_id: 'FEST-04', name: 'SAAG', code: '0005', institution: 'MADRASA SAAG', points: 116, gold: 6, silver: 4, bronze: 7 },
    { id: 'TM-8193', fest_id: 'FEST-04', name: 'PAKSHIKERE', code: '0004', institution: 'MADRASA PAKSHIKERE', points: 113, gold: 5, silver: 8, bronze: 4 },
    { id: 'TM-8075', fest_id: 'FEST-04', name: 'KINNIGOLI', code: '0006', institution: 'MADRASA KINNIGOLI', points: 63, gold: 2, silver: 4, bronze: 5 },
    { id: 'TM-6658', fest_id: 'FEST-04', name: 'GOLIJARA', code: '0008', institution: 'MADRASA GOLIJARA', points: 58, gold: 2, silver: 3, bronze: 4 },
    { id: 'TM-9547', fest_id: 'FEST-04', name: 'SASHIHITHLU', code: '0009', institution: 'MADRASA SASHIHITHLU', points: 35, gold: 1, silver: 2, bronze: 3 },
    { id: 'TM-1259', fest_id: 'FEST-04', name: 'MUKKA URDU', code: '0002', institution: 'MADRASA MUKKA URDU', points: 34, gold: 1, silver: 2, bronze: 2 },
    { id: 'TM-5939', fest_id: 'FEST-04', name: 'THOKUR', code: '0007', institution: 'MADRASA THOKUR', points: 26, gold: 1, silver: 1, bronze: 2 },
    { id: 'TM-0940', fest_id: 'FEST-04', name: 'S KODI', code: '0010', institution: 'MADRASA S KODI', points: 10, gold: 0, silver: 1, bronze: 1 }
  ];

  const DEFAULT_PROGRAMMES = [
    { id: 'PRG-101', code: 'LOZ-01', name: 'QURAN RECITATION', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Auditorium Hall A' },
    { id: 'PRG-102', code: 'LOZ-02', name: 'ISLAMIC SONG', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-103', code: 'LOZ-03', name: 'SPEECH KANNADA', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Auditorium Hall B' },
    { id: 'PRG-104', code: 'LOZ-04', name: 'SPEECH ENGLISH', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Auditorium Hall B' },
    { id: 'PRG-105', code: 'LOZ-05', name: 'PENCIL DRAWING', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Hall C' },
    { id: 'PRG-106', code: 'LOZ-06', name: 'WATER COLOR', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Hall C' },
    { id: 'PRG-107', code: 'LOZ-07', name: 'MEMORY TEST', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Auditorium Hall A' },
    { id: 'PRG-108', code: 'LOZ-08', name: 'ARABIC HANDWRITING', category: 'Zero zone', status: 'completed', result_published: true, venue: 'Hall C' },
    { id: 'PRG-110', code: 'GRZ-01', name: 'QURAN TILAWAT', category: 'Ground zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-111', code: 'GRZ-02', name: 'NASHEED', category: 'Ground zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-112', code: 'GRZ-03', name: 'ELOCUTION URDU', category: 'Ground zone', status: 'completed', result_published: true, venue: 'Hall B' },
    { id: 'PRG-114', code: 'GRZ-05', name: 'SONG KANNADA', category: 'Ground zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-117', code: 'GRZ-08', name: 'ARABIC READING', category: 'Ground zone', status: 'completed', result_published: true, venue: 'Hall A' },
    { id: 'PRG-118', code: 'GRZ-09', name: 'QUIZ', category: 'Ground zone', status: 'completed', result_published: true, venue: 'Auditorium' },
    { id: 'PRG-126', code: 'MIZ-02', name: 'ELOCUTION KANNADA', category: 'Mid zone', status: 'completed', result_published: true, venue: 'Hall B' },
    { id: 'PRG-129', code: 'MIZ-05', name: 'ELOCUTION MALAYALAM', category: 'Mid zone', status: 'completed', result_published: true, venue: 'Hall B' },
    { id: 'PRG-130', code: 'MIZ-06', name: 'ELOCUTION ARABIC', category: 'Mid zone', status: 'completed', result_published: true, venue: 'Hall B' },
    { id: 'PRG-132', code: 'MIZ-08', name: 'SONG MALAYALAM', category: 'Mid zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-136', code: 'MIZ-012', name: 'QUIZ', category: 'Mid zone', status: 'completed', result_published: true, venue: 'Auditorium' },
    { id: 'PRG-148', code: 'MIZ-023', name: 'GROUP SONG', category: 'Mid zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-150', code: 'HIZ-02', name: 'GROUP SONG', category: 'High zone', status: 'completed', result_published: true, venue: 'Main Stage' },
    { id: 'PRG-177', code: 'HIZ-023', name: 'BURDA', category: 'High zone', status: 'completed', result_published: true, venue: 'Main Stage' }
  ];

  const DEFAULT_RESULTS = [
    {
      id: 'RES-BURDA-1',
      fest_id: 'FEST-04',
      programme_id: 'PRG-177',
      programme_name: 'BURDA',
      category: 'High zone',
      rank: 1,
      entry_name: 'MUKKA',
      team_id: 'TM-2403',
      team_name: 'MUKKA',
      final_score: 100,
      points_awarded: 10,
      published: true,
      published_at: '2026-11-22 17:05'
    },
    {
      id: 'RES-BURDA-2',
      fest_id: 'FEST-04',
      programme_id: 'PRG-177',
      programme_name: 'BURDA',
      category: 'High zone',
      rank: 2,
      entry_name: 'PAKSHIKERE',
      team_id: 'TM-8193',
      team_name: 'PAKSHIKERE',
      final_score: 90,
      points_awarded: 7,
      published: true,
      published_at: '2026-11-22 17:05'
    },
    {
      id: 'RES-BURDA-3',
      fest_id: 'FEST-04',
      programme_id: 'PRG-177',
      programme_name: 'BURDA',
      category: 'High zone',
      rank: 3,
      entry_name: 'GUTHAKAADU',
      team_id: 'TM-9639',
      team_name: 'GUTHAKAADU',
      final_score: 80,
      points_awarded: 4,
      published: true,
      published_at: '2026-11-22 17:05'
    }
  ];

  // Initialize LocalStorage with default seeds if empty
  function initLocalStorage() {
    if (!localStorage.getItem('festoria_teams')) {
      localStorage.setItem('festoria_teams', JSON.stringify(DEFAULT_TEAMS));
    }
    if (!localStorage.getItem('festoria_programmes')) {
      localStorage.setItem('festoria_programmes', JSON.stringify(DEFAULT_PROGRAMMES));
    }
    if (!localStorage.getItem('festoria_results')) {
      localStorage.setItem('festoria_results', JSON.stringify(DEFAULT_RESULTS));
    }
    if (!localStorage.getItem('festoria_announcements')) {
      localStorage.setItem('festoria_announcements', JSON.stringify([
        {
          id: 'ANN-001',
          title: 'Official Results Ratified: BURDA',
          content: '1st: MUKKA (10 pts), 2nd: PAKSHIKERE (7 pts), 3rd: GUTHAKAADU (4 pts)',
          created_at: '2026-11-22 17:05',
          author: 'Fest Admin'
        }
      ]));
    }
  }

  // Initialize Supabase client
  function getClient() {
    if (client) return client;
    const cfg = window.SUPABASE_CONFIG;
    if (cfg && cfg.isConfigured() && window.supabase) {
      try {
        client = window.supabase.createClient(cfg.url, cfg.anonKey);
        console.log('[Supabase] Client initialized successfully.');
      } catch (err) {
        console.warn('[Supabase] Failed to initialize client:', err);
      }
    }
    return client;
  }

  // Data Access Object
  window.FestDB = {
    init: function () {
      initLocalStorage();
      getClient();
    },

    isSupabaseConnected: function () {
      return Boolean(getClient());
    },

    // Fetch Teams
    getTeams: async function () {
      const sb = getClient();
      if (sb) {
        try {
          const { data, error } = await sb
            .from('teams')
            .select('*')
            .eq('fest_id', window.SUPABASE_CONFIG.festId)
            .order('points', { ascending: false });
          if (!error && data && data.length > 0) {
            localStorage.setItem('festoria_teams', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[Supabase] getTeams query error, falling back to local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('festoria_teams') || '[]');
    },

    // Fetch Programmes
    getProgrammes: async function () {
      const sb = getClient();
      if (sb) {
        try {
          const { data, error } = await sb
            .from('programmes')
            .select('*')
            .eq('fest_id', window.SUPABASE_CONFIG.festId)
            .order('name');
          if (!error && data && data.length > 0) {
            localStorage.setItem('festoria_programmes', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[Supabase] getProgrammes error, falling back to local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('festoria_programmes') || '[]');
    },

    // Fetch Results
    getResults: async function () {
      const sb = getClient();
      if (sb) {
        try {
          const { data, error } = await sb
            .from('results')
            .select('*')
            .eq('fest_id', window.SUPABASE_CONFIG.festId)
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            localStorage.setItem('festoria_results', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[Supabase] getResults error, falling back to local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('festoria_results') || '[]');
    },

    // Fetch Announcements
    getAnnouncements: async function () {
      const sb = getClient();
      if (sb) {
        try {
          const { data, error } = await sb
            .from('announcements')
            .select('*')
            .eq('fest_id', window.SUPABASE_CONFIG.festId)
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            localStorage.setItem('festoria_announcements', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[Supabase] getAnnouncements error, falling back to local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('festoria_announcements') || '[]');
    },

    // Ratify and Publish Programme Results (Atomic, never wiped)
    publishResults: async function (programmeId, winners) {
      // winners: array of { rank, teamId, entryName, score, points }
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const programmes = await this.getProgrammes();
      const prog = programmes.find((p) => p.id === programmeId) || { name: 'Programme', category: 'General' };

      const newResults = winners.map((w, idx) => ({
        id: `RES-${programmeId}-${w.teamId || idx + 1}`,
        fest_id: window.SUPABASE_CONFIG.festId,
        programme_id: programmeId,
        programme_name: prog.name,
        category: prog.category,
        rank: w.rank || idx + 1,
        entry_name: w.entryName || w.teamName,
        team_id: w.teamId,
        team_name: w.teamName,
        final_score: Number(w.score || 0),
        points_awarded: Number(w.points || 0),
        published: true,
        published_at: now
      }));

      // 1. Always update local storage first so offline/mobile network NEVER loses it
      const currentResults = JSON.parse(localStorage.getItem('festoria_results') || '[]')
        .filter((r) => r.programme_id !== programmeId);
      const updatedResults = [...currentResults, ...newResults];
      localStorage.setItem('festoria_results', JSON.stringify(updatedResults));

      // Update programme status
      const updatedProgrammes = programmes.map((p) =>
        p.id === programmeId ? { ...p, status: 'completed', result_published: true, published_at: now } : p
      );
      localStorage.setItem('festoria_programmes', JSON.stringify(updatedProgrammes));

      // Recalculate team points in local storage
      const teams = await this.getTeams();
      const teamPointsMap = new Map();
      const teamMedalsMap = new Map();

      updatedResults.forEach((r) => {
        if (!r.team_id) return;
        const pts = teamPointsMap.get(r.team_id) || 0;
        teamPointsMap.set(r.team_id, pts + (r.points_awarded || 0));

        const medals = teamMedalsMap.get(r.team_id) || { gold: 0, silver: 0, bronze: 0 };
        if (r.rank === 1) medals.gold += 1;
        else if (r.rank === 2) medals.silver += 1;
        else if (r.rank === 3) medals.bronze += 1;
        teamMedalsMap.set(r.team_id, medals);
      });

      const updatedTeams = teams.map((t) => {
        const pts = teamPointsMap.get(t.id) ?? t.points;
        const medals = teamMedalsMap.get(t.id) ?? { gold: t.gold, silver: t.silver, bronze: t.bronze };
        return { ...t, points: pts, gold: medals.gold, silver: medals.silver, bronze: medals.bronze };
      });
      updatedTeams.sort((a, b) => b.points - a.points);
      localStorage.setItem('festoria_teams', JSON.stringify(updatedTeams));

      // 2. Persist to Supabase if connected
      const sb = getClient();
      if (sb) {
        try {
          // Delete existing results for programme
          await sb.from('results').delete().eq('programme_id', programmeId);
          // Insert new results
          await sb.from('results').insert(newResults);
          // Update programme status
          await sb.from('programmes').update({ status: 'completed', result_published: true, published_at: now }).eq('id', programmeId);
          // Update team totals
          for (const t of updatedTeams) {
            await sb.from('teams').update({ points: t.points, gold: t.gold, silver: t.silver, bronze: t.bronze }).eq('id', t.id);
          }
          console.log('[Supabase] Successfully saved results and updated standings.');
        } catch (err) {
          console.warn('[Supabase] Error writing to Supabase, local changes are preserved safely:', err);
        }
      }

      return { success: true, count: newResults.length };
    },

    // Post announcement
    addAnnouncement: async function (title, content) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const ann = {
        id: `ANN-${Date.now()}`,
        fest_id: window.SUPABASE_CONFIG.festId,
        title,
        content,
        created_at: now,
        author: 'Fest Admin'
      };

      const current = JSON.parse(localStorage.getItem('festoria_announcements') || '[]');
      const updated = [ann, ...current];
      localStorage.setItem('festoria_announcements', JSON.stringify(updated));

      const sb = getClient();
      if (sb) {
        try {
          await sb.from('announcements').insert([ann]);
        } catch (e) {
          console.warn('[Supabase] Error posting announcement:', e);
        }
      }
      return ann;
    }
  };

  // Run initial setup
  window.FestDB.init();
})();
