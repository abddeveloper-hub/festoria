// ==============================================================================
// Festoria — Pure JavaScript Supabase Client & Resilient Data Layer
// Clean Slate (Zero Pre-loaded Data)
// ==============================================================================

(function () {
  let client = null;

  // Enforce clean slate on first load of clean version
  function ensureCleanSlate() {
    if (localStorage.getItem('festoria_clean_reset_v2') !== 'true') {
      localStorage.setItem('festoria_teams', '[]');
      localStorage.setItem('festoria_programmes', '[]');
      localStorage.setItem('festoria_results', '[]');
      localStorage.setItem('festoria_announcements', '[]');
      localStorage.setItem('festoria_clean_reset_v2', 'true');
    }
  }

  // Initialize LocalStorage if empty
  function initLocalStorage() {
    ensureCleanSlate();
    if (!localStorage.getItem('festoria_teams')) {
      localStorage.setItem('festoria_teams', '[]');
    }
    if (!localStorage.getItem('festoria_programmes')) {
      localStorage.setItem('festoria_programmes', '[]');
    }
    if (!localStorage.getItem('festoria_results')) {
      localStorage.setItem('festoria_results', '[]');
    }
    if (!localStorage.getItem('festoria_announcements')) {
      localStorage.setItem('festoria_announcements', '[]');
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

    // Completely wipe all local data
    clearAllData: async function () {
      localStorage.setItem('festoria_teams', '[]');
      localStorage.setItem('festoria_programmes', '[]');
      localStorage.setItem('festoria_results', '[]');
      localStorage.setItem('festoria_announcements', '[]');

      const sb = getClient();
      if (sb) {
        try {
          const fid = window.SUPABASE_CONFIG.festId;
          await sb.from('results').delete().eq('fest_id', fid);
          await sb.from('announcements').delete().eq('fest_id', fid);
          await sb.from('programmes').delete().eq('fest_id', fid);
          await sb.from('teams').delete().eq('fest_id', fid);
          console.log('[Supabase] Cleared all data from Supabase tables for fest', fid);
        } catch (e) {
          console.warn('[Supabase] Clear error:', e);
        }
      }
      return true;
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
          if (!error && Array.isArray(data)) {
            localStorage.setItem('festoria_teams', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[Supabase] getTeams query error, falling back to local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('festoria_teams') || '[]');
    },

    // Add New Team
    addTeam: async function (name, code, institution) {
      const newTeam = {
        id: `TM-${Date.now().toString().slice(-4)}`,
        fest_id: window.SUPABASE_CONFIG.festId,
        name: name.trim().toUpperCase(),
        code: code.trim(),
        institution: institution ? institution.trim() : '',
        points: 0,
        gold: 0,
        silver: 0,
        bronze: 0
      };

      const teams = JSON.parse(localStorage.getItem('festoria_teams') || '[]');
      teams.push(newTeam);
      localStorage.setItem('festoria_teams', JSON.stringify(teams));

      const sb = getClient();
      if (sb) {
        try {
          await sb.from('teams').insert([newTeam]);
        } catch (e) {
          console.warn('[Supabase] Error adding team:', e);
        }
      }
      return newTeam;
    },

    // Delete Team
    deleteTeam: async function (teamId) {
      let teams = JSON.parse(localStorage.getItem('festoria_teams') || '[]');
      teams = teams.filter((t) => t.id !== teamId);
      localStorage.setItem('festoria_teams', JSON.stringify(teams));

      const sb = getClient();
      if (sb) {
        try {
          await sb.from('teams').delete().eq('id', teamId);
        } catch (e) {
          console.warn('[Supabase] Error deleting team:', e);
        }
      }
      return true;
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
          if (!error && Array.isArray(data)) {
            localStorage.setItem('festoria_programmes', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[Supabase] getProgrammes error, falling back to local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('festoria_programmes') || '[]');
    },

    // Add New Programme
    addProgramme: async function (code, name, category, venue) {
      const newProg = {
        id: `PRG-${Date.now().toString().slice(-4)}`,
        fest_id: window.SUPABASE_CONFIG.festId,
        code: code.trim().toUpperCase(),
        name: name.trim().toUpperCase(),
        category: category.trim(),
        venue: venue ? venue.trim() : 'Main Stage',
        status: 'scheduled',
        result_published: false
      };

      const progs = JSON.parse(localStorage.getItem('festoria_programmes') || '[]');
      progs.push(newProg);
      localStorage.setItem('festoria_programmes', JSON.stringify(progs));

      const sb = getClient();
      if (sb) {
        try {
          await sb.from('programmes').insert([newProg]);
        } catch (e) {
          console.warn('[Supabase] Error adding programme:', e);
        }
      }
      return newProg;
    },

    // Delete Programme
    deleteProgramme: async function (progId) {
      let progs = JSON.parse(localStorage.getItem('festoria_programmes') || '[]');
      progs = progs.filter((p) => p.id !== progId);
      localStorage.setItem('festoria_programmes', JSON.stringify(progs));

      const sb = getClient();
      if (sb) {
        try {
          await sb.from('programmes').delete().eq('id', progId);
        } catch (e) {
          console.warn('[Supabase] Error deleting programme:', e);
        }
      }
      return true;
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
          if (!error && Array.isArray(data)) {
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
          if (!error && Array.isArray(data)) {
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
          await sb.from('results').delete().eq('programme_id', programmeId);
          await sb.from('results').insert(newResults);
          await sb.from('programmes').update({ status: 'completed', result_published: true, published_at: now }).eq('id', programmeId);
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
