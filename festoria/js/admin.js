// ==============================================================================
// Festoria — Admin Management & Results Ratification Application
// Pure Vanilla JavaScript (Rock-solid, Guaranteed Zero-loss Persistence)
// ==============================================================================

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const authGate = document.getElementById('admin-auth-gate');
  const adminContent = document.getElementById('admin-content');
  const passcodeForm = document.getElementById('passcode-form');
  const passcodeInput = document.getElementById('admin-passcode');

  const supabaseUrlInput = document.getElementById('sb-url');
  const supabaseKeyInput = document.getElementById('sb-key');
  const saveSbBtn = document.getElementById('btn-save-sb');

  const progSelect = document.getElementById('select-programme');
  const publishForm = document.getElementById('publish-results-form');

  const firstTeamSelect = document.getElementById('first-team');
  const secondTeamSelect = document.getElementById('second-team');
  const thirdTeamSelect = document.getElementById('third-team');

  const adminTeamsBody = document.getElementById('admin-teams-body');
  const adminResultsBody = document.getElementById('admin-results-body');
  const announcementForm = document.getElementById('announcement-form');
  const exportBtn = document.getElementById('btn-export-backup');

  // State
  let allTeams = [];
  let allProgrammes = [];
  let allResults = [];

  // Check login
  const isLoggedIn = sessionStorage.getItem('festoria_admin_logged_in') === 'true';
  if (isLoggedIn) {
    if (authGate) authGate.style.display = 'none';
    if (adminContent) adminContent.style.display = 'block';
  } else {
    if (authGate) authGate.style.display = 'flex';
    if (adminContent) adminContent.style.display = 'none';
  }

  // Handle Passcode login
  if (passcodeForm) {
    passcodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = passcodeInput.value.trim();
      if (code === (window.SUPABASE_CONFIG.adminPasscode || 'fest2026')) {
        sessionStorage.setItem('festoria_admin_logged_in', 'true');
        authGate.style.display = 'none';
        adminContent.style.display = 'block';
        showToast('Admin authenticated successfully');
        loadAdminData();
      } else {
        showToast('Invalid passcode. Please try again.', 'error');
      }
    });
  }

  // Supabase Config setup
  if (supabaseUrlInput && supabaseKeyInput) {
    supabaseUrlInput.value = window.SUPABASE_CONFIG.url || '';
    supabaseKeyInput.value = window.SUPABASE_CONFIG.anonKey || '';

    saveSbBtn.addEventListener('click', () => {
      const u = supabaseUrlInput.value.trim();
      const k = supabaseKeyInput.value.trim();
      window.SUPABASE_CONFIG.saveCredentials(u, k);
      window.FestDB.init();
      showToast('Supabase configuration saved! Testing connection...');
      setTimeout(() => {
        if (window.FestDB.isSupabaseConnected()) {
          showToast('Connected to Supabase cloud successfully!', 'success');
        } else {
          showToast('Saved locally. Ensure URL & anon key are valid.', 'warning');
        }
        loadAdminData();
      }, 500);
    });
  }

  // Populate Dropdowns
  function populateSelects() {
    if (!progSelect) return;

    // Programmes
    progSelect.innerHTML = '<option value="">-- Choose Programme --</option>' +
      allProgrammes.map((p) => `
        <option value="${p.id}">
          ${p.code ? p.code + ' : ' : ''}${p.name} (${p.category}) ${p.result_published ? '✓ [Published]' : ''}
        </option>
      `).join('');

    // Teams
    const teamOptions = '<option value="">-- Choose House/Team --</option>' +
      allTeams.map((t) => `<option value="${t.id}">${t.name} (${t.code})</option>`).join('');

    if (firstTeamSelect) firstTeamSelect.innerHTML = teamOptions;
    if (secondTeamSelect) secondTeamSelect.innerHTML = teamOptions;
    if (thirdTeamSelect) thirdTeamSelect.innerHTML = teamOptions;
  }

  // Render Admin Teams Table
  function renderAdminTeams() {
    if (!adminTeamsBody) return;
    adminTeamsBody.innerHTML = allTeams.map((t, idx) => `
      <tr>
        <td style="font-weight:700;">#${idx + 1}</td>
        <td style="font-weight:800; color:var(--maroon);">${t.name} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(${t.code})</span></td>
        <td style="font-weight:700;">${t.gold || 0}</td>
        <td style="font-weight:700;">${t.silver || 0}</td>
        <td style="font-weight:700;">${t.bronze || 0}</td>
        <td class="points-cell">${t.points || 0} pts</td>
      </tr>
    `).join('');
  }

  // Render Admin Recent Results Table
  function renderAdminResults() {
    if (!adminResultsBody) return;
    if (allResults.length === 0) {
      adminResultsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">No results published yet.</td></tr>';
      return;
    }

    adminResultsBody.innerHTML = allResults.slice(0, 15).map((r) => `
      <tr>
        <td style="font-weight:700;">${r.programme_name}</td>
        <td style="font-weight:800; color:var(--maroon);">${r.rank === 1 ? '🥇 1st' : r.rank === 2 ? '🥈 2nd' : '🥉 3rd'}</td>
        <td style="font-weight:700;">${r.entry_name || r.team_name}</td>
        <td>${r.team_name || '-'}</td>
        <td class="points-cell">+${r.points_awarded}</td>
      </tr>
    `).join('');
  }

  // Handle Results Publishing
  if (publishForm) {
    publishForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const programmeId = progSelect.value;
      if (!programmeId) {
        showToast('Please select a programme first.', 'error');
        return;
      }

      const t1Id = firstTeamSelect.value;
      const t1Name = firstTeamSelect.options[firstTeamSelect.selectedIndex]?.text.split(' (')[0] || '';
      const t1Score = document.getElementById('first-score').value || 10;
      const t1Points = document.getElementById('first-points').value || 10;

      const t2Id = secondTeamSelect.value;
      const t2Name = secondTeamSelect.options[secondTeamSelect.selectedIndex]?.text.split(' (')[0] || '';
      const t2Score = document.getElementById('second-score').value || 7;
      const t2Points = document.getElementById('second-points').value || 7;

      const t3Id = thirdTeamSelect.value;
      const t3Name = thirdTeamSelect.options[thirdTeamSelect.selectedIndex]?.text.split(' (')[0] || '';
      const t3Score = document.getElementById('third-score').value || 4;
      const t3Points = document.getElementById('third-points').value || 4;

      if (!t1Id) {
        showToast('1st place winner is required.', 'error');
        return;
      }

      const winners = [
        { rank: 1, teamId: t1Id, teamName: t1Name, entryName: t1Name, score: t1Score, points: t1Points }
      ];

      if (t2Id) {
        winners.push({ rank: 2, teamId: t2Id, teamName: t2Name, entryName: t2Name, score: t2Score, points: t2Points });
      }

      if (t3Id) {
        winners.push({ rank: 3, teamId: t3Id, teamName: t3Name, entryName: t3Name, score: t3Score, points: t3Points });
      }

      const submitBtn = publishForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Publishing...';

      try {
        await window.FestDB.publishResults(programmeId, winners);
        showToast('Results ratified & published successfully!', 'success');
        publishForm.reset();
        await loadAdminData();
      } catch (err) {
        console.error('Publish error:', err);
        showToast('Error publishing results. Checked local storage backup.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ratify & Publish Official Results';
      }
    });
  }

  // Handle Announcement
  if (announcementForm) {
    announcementForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('ann-title').value.trim();
      const content = document.getElementById('ann-content').value.trim();

      if (!title || !content) {
        showToast('Title and content are required.', 'error');
        return;
      }

      await window.FestDB.addAnnouncement(title, content);
      showToast('Announcement posted successfully!');
      announcementForm.reset();
    });
  }

  // Handle Backup Export
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const backup = {
        exportedAt: new Date().toISOString(),
        festId: window.SUPABASE_CONFIG.festId,
        teams: allTeams,
        programmes: allProgrammes,
        results: allResults
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `festoria-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup downloaded to your computer!');
    });
  }

  // Load data
  async function loadAdminData() {
    allTeams = await window.FestDB.getTeams();
    allProgrammes = await window.FestDB.getProgrammes();
    allResults = await window.FestDB.getResults();

    populateSelects();
    renderAdminTeams();
    renderAdminResults();
  }

  if (isLoggedIn) {
    await loadAdminData();
  }
});
