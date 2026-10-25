// AapdaSetu Auth Module
window.AapdaAuth = (function() {
  const STORAGE_KEY = 'aapdasetu_auth_v1';
  
  const ADMIN_WHITELIST = ['commander.ndrf@gov.in', 'admin@aapdasetu.gov.in'];
  
  function isAdminEmail(email) {
    if (!email) return false;
    const e = email.toLowerCase().trim();
    if (ADMIN_WHITELIST.includes(e)) return true;
    if (e.endsWith('.gov.in') || e.endsWith('.nic.in')) return true;
    return false;
  }
  
  function login(role, email, name) {
    const session = { role, email: email||'', name: name||getRoleName(role), loginTime: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  }
  
  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = 'login.html';
  }
  
  function getSession() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  }
  
  function requireAuth(allowedRoles) {
    const session = getSession();
    if (!session) { window.location.href = 'login.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      window.location.href = 'login.html';
      return null;
    }
    return session;
  }
  
  function getRoleName(role) {
    return {admin:'SDMA Commander', shelter:'Relief Coordinator', citizen:'Public User'}[role] || 'User';
  }
  
  return { login, logout, getSession, requireAuth, isAdminEmail, getRoleName };
})();
