// ==============================================================================
// Festoria — Supabase Project Configuration
// Fill in your Supabase project details from: https://app.supabase.com
// -> Project Settings -> API
// ==============================================================================

window.SUPABASE_CONFIG = {
  // Your Supabase Project URL (e.g., "https://abcdefghijklmnopqrst.supabase.co")
  url: window.localStorage.getItem('festoria_supabase_url') || '',

  // Your Supabase Public "anon" key
  anonKey: window.localStorage.getItem('festoria_supabase_anon_key') || '',

  // Default active festival ID
  festId: 'FEST-04',

  // Admin access passcode for local admin portal ratification
  adminPasscode: 'fest2026',

  // Helper to check if credentials are set
  isConfigured: function () {
    return (
      Boolean(this.url) &&
      Boolean(this.anonKey) &&
      this.url.startsWith('https://') &&
      this.anonKey.length > 20
    );
  },

  // Save new credentials dynamically
  saveCredentials: function (url, key) {
    if (url) {
      this.url = url.trim();
      localStorage.setItem('festoria_supabase_url', this.url);
    }
    if (key) {
      this.anonKey = key.trim();
      localStorage.setItem('festoria_supabase_anon_key', this.anonKey);
    }
  }
};
