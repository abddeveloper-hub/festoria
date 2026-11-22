// ==============================================================================
// Festoria — Public Festival Portal & Live Leaderboard Application
// Pure Vanilla JavaScript (Zero Bundlers, High Reliability)
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const podiumContainer = document.getElementById('podium-container');
  const leaderboardBody = document.getElementById('leaderboard-body');
  const resultsBody = document.getElementById('results-body');
  const announcementsList = document.getElementById('announcements-list');
  const programmeSearch = document.getElementById('programme-search');
  const categoryFilter = document.getElementById('category-filter');
  const dbStatusIndicator = document.getElementById('db-status-indicator');
  const dbStatusText = document.getElementById('db-status-text');

  // State
  let allTeams = [];
  let allProgrammes = [];
  let allResults = [];
  let allAnnouncements = [];

  // Update Database Connectivity Status in UI
  function updateDbStatus() {
    if (window.FestDB && window.FestDB.isSupabaseConnected()) {
      dbStatusIndicator.className = 'dot dot-green';
      dbStatusText.textContent = 'Supabase Cloud Synchronized (Real-time)';
    } else {
      dbStatusIndicator.className = 'dot dot-amber';
      dbStatusText.textContent = 'Local High-Speed Cache (Supabase credentials pending)';
    }
  }

  // Render Podium (Top 3 Houses)
  function renderPodium(teams) {
    if (!podiumContainer) return;
    if (teams.length < 3) {
      podiumContainer.innerHTML = '<div style="text-align:center; padding:32px; grid-column:1/-1; color:var(--text-muted); font-size:0.95rem;">Awaiting championship standings & team registrations...</div>';
      return;
    }

    const t1 = teams[0]; // 1st
    const t2 = teams[1]; // 2nd
    const t3 = teams[2]; // 3rd

    // Layout in order: 2nd place, 1st place (Center/Highlighted), 3rd place
    podiumContainer.innerHTML = `
      <!-- 2ND PLACE -->
      <div class="podium-card">
        <div class="card-top-tag tag-2nd">🥈 2nd Place</div>
        <div class="podium-header">
          <div>
            <div class="podium-team-name">${t2.name}</div>
            <div class="podium-institution">${t2.institution || 'House ' + t2.code}</div>
          </div>
          <div class="podium-points">${t2.points} <span>pts</span></div>
        </div>
        <div class="podium-medals">
          <span class="medal-item">🥇 ${t2.gold || 0} Gold</span>
          <span class="medal-item">🥈 ${t2.silver || 0} Silver</span>
          <span class="medal-item">🥉 ${t2.bronze || 0} Bronze</span>
        </div>
      </div>

      <!-- 1ST PLACE CHAMPION -->
      <div class="podium-card champion">
        <div class="card-top-tag tag-champ">🏆 1st Place Champion</div>
        <div class="podium-header">
          <div>
            <div class="podium-team-name">${t1.name}</div>
            <div class="podium-institution">${t1.institution || 'House ' + t1.code}</div>
          </div>
          <div class="podium-points">${t1.points} <span>pts</span></div>
        </div>
        <div class="podium-medals">
          <span class="medal-item">🥇 ${t1.gold || 0} Gold</span>
          <span class="medal-item">🥈 ${t1.silver || 0} Silver</span>
          <span class="medal-item">🥉 ${t1.bronze || 0} Bronze</span>
        </div>
      </div>

      <!-- 3RD PLACE -->
      <div class="podium-card">
        <div class="card-top-tag tag-3rd">🥉 3rd Place</div>
        <div class="podium-header">
          <div>
            <div class="podium-team-name">${t3.name}</div>
            <div class="podium-institution">${t3.institution || 'House ' + t3.code}</div>
          </div>
          <div class="podium-points">${t3.points} <span>pts</span></div>
        </div>
        <div class="podium-medals">
          <span class="medal-item">🥇 ${t3.gold || 0} Gold</span>
          <span class="medal-item">🥈 ${t3.silver || 0} Silver</span>
          <span class="medal-item">🥉 ${t3.bronze || 0} Bronze</span>
        </div>
      </div>
    `;
  }

  // Render Full Leaderboard Table
  function renderLeaderboard(teams) {
    if (!leaderboardBody) return;
    if (teams.length === 0) {
      leaderboardBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px;">No teams registered.</td></tr>';
      return;
    }

    leaderboardBody.innerHTML = teams.map((team, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
      return `
        <tr>
          <td><span class="rank-badge ${rankClass}">#${rank}</span></td>
          <td>
            <div class="team-cell">${team.name}</div>
            <div class="team-sub">${team.code}</div>
          </td>
          <td><span style="font-size:0.84rem; color:var(--text-muted);">${team.institution || '-'}</span></td>
          <td style="font-weight:700;">${team.gold || 0}</td>
          <td style="font-weight:700;">${team.silver || 0}</td>
          <td style="font-weight:700;">${team.bronze || 0}</td>
          <td class="points-cell">${team.points || 0} pts</td>
        </tr>
      `;
    }).join('');
  }

  // Render Official Published Results
  function renderResults(results) {
    if (!resultsBody) return;
    const query = (programmeSearch ? programmeSearch.value : '').toLowerCase().trim();
    const cat = (categoryFilter ? categoryFilter.value : 'all');

    let filtered = results;
    if (cat !== 'all') {
      filtered = filtered.filter((r) => r.category === cat);
    }
    if (query) {
      filtered = filtered.filter((r) =>
        (r.programme_name && r.programme_name.toLowerCase().includes(query)) ||
        (r.entry_name && r.entry_name.toLowerCase().includes(query)) ||
        (r.team_name && r.team_name.toLowerCase().includes(query))
      );
    }

    if (filtered.length === 0) {
      resultsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No published results found matching filters.</td></tr>`;
      return;
    }

    resultsBody.innerHTML = filtered.map((res) => {
      const rankBadge = res.rank === 1 ? '🥇 1st' : res.rank === 2 ? '🥈 2nd' : res.rank === 3 ? '🥉 3rd' : `#${res.rank}`;
      return `
        <tr>
          <td style="font-weight:700;">
            ${res.programme_name}
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">${res.category || 'General'}</div>
          </td>
          <td style="font-weight:700; color:var(--text-main);">${rankBadge}</td>
          <td style="font-weight:700;">${res.entry_name || res.team_name}</td>
          <td><span style="font-size:0.84rem; font-weight:600;">${res.team_name || '-'}</span></td>
          <td style="font-weight:700;">${res.final_score ?? '-'}</td>
          <td class="points-cell">+${res.points_awarded || 0}</td>
        </tr>
      `;
    }).join('');
  }

  // Render Announcements
  function renderAnnouncements(announcements) {
    if (!announcementsList) return;
    if (announcements.length === 0) {
      announcementsList.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem;">No announcements published yet.</p>';
      return;
    }

    announcementsList.innerHTML = announcements.map((a) => `
      <div style="background:#fff; border:1px solid var(--border-color); border-radius:6px; padding:12px 16px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h4 style="font-size:0.92rem; font-weight:700; color:var(--text-main);">${a.title}</h4>
          <span style="font-size:0.72rem; color:var(--text-muted);">${a.created_at || ''}</span>
        </div>
        <p style="font-size:0.84rem; color:var(--text-main);">${a.content}</p>
      </div>
    `).join('');
  }

  // Load all data
  async function loadData() {
    updateDbStatus();
    try {
      allTeams = await window.FestDB.getTeams();
      allProgrammes = await window.FestDB.getProgrammes();
      allResults = await window.FestDB.getResults();
      allAnnouncements = await window.FestDB.getAnnouncements();

      renderPodium(allTeams);
      renderLeaderboard(allTeams);
      renderResults(allResults);
      renderAnnouncements(allAnnouncements);
    } catch (err) {
      console.error('[App] Failed to load data:', err);
    }
  }

  // Event Listeners
  if (programmeSearch) {
    programmeSearch.addEventListener('input', () => renderResults(allResults));
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => renderResults(allResults));
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      const target = e.target.getAttribute('data-target');
      if (target === 'leaderboard') {
        document.getElementById('section-leaderboard').style.display = 'block';
        document.getElementById('section-results').style.display = 'none';
      } else if (target === 'results') {
        document.getElementById('section-leaderboard').style.display = 'none';
        document.getElementById('section-results').style.display = 'block';
      }
    });
  });

  // Initial load
  await loadData();

  // Background refresh every 30 seconds
  setInterval(loadData, 30000);
});
