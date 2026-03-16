/* ═══════════════════════════════════════
   BriskLearn — Auth & Session Management
   ═══════════════════════════════════════ */

window.Auth = (() => {
  let currentUser = null;

  function generateToken() {
    return 'tk_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function login(email, password) {
    const user = await DB.getByIndex(DB.STORES.users, 'email', email.toLowerCase().trim());
    if (!user) throw new Error('No account found with this email.');
    if (user.password !== password) throw new Error('Incorrect password.');
    if (user.status === 'pending') throw new Error('Your account is pending admin approval.');
    if (user.status === 'suspended') throw new Error('Your account has been suspended.');

    const token = generateToken();
    const session = { token, userId: user.id, role: user.role, expiresAt: Date.now() + 7 * 86400000 };
    await DB.put(DB.STORES.sessions, session);
    localStorage.setItem('bl_token', token);
    currentUser = { ...user };
    delete currentUser.password;
    return currentUser;
  }

  async function logout() {
    const token = localStorage.getItem('bl_token');
    if (token) {
      await DB.del(DB.STORES.sessions, token);
      localStorage.removeItem('bl_token');
    }
    currentUser = null;
  }

  async function restoreSession() {
    const token = localStorage.getItem('bl_token');
    if (!token) return null;
    const session = await DB.get(DB.STORES.sessions, token);
    if (!session || session.expiresAt < Date.now()) {
      localStorage.removeItem('bl_token');
      return null;
    }
    const user = await DB.get(DB.STORES.users, session.userId);
    if (!user) return null;
    currentUser = { ...user };
    delete currentUser.password;
    return currentUser;
  }

  function getUser() { return currentUser; }
  function isAdmin() { return currentUser?.role === 'admin'; }
  function isFaculty() { return currentUser?.role === 'faculty'; }
  function isStudent() { return currentUser?.role === 'student'; }

  async function changePassword(userId, newPassword) {
    const user = await DB.get(DB.STORES.users, userId);
    if (!user) throw new Error('User not found');
    user.password = newPassword;
    await DB.put(DB.STORES.users, user);
  }

  async function resetPassword(email) {
    const user = await DB.getByIndex(DB.STORES.users, 'email', email.toLowerCase().trim());
    if (!user) throw new Error('No account with that email.');
    // Generate temp password
    const tempPwd = 'Temp@' + Math.random().toString(36).slice(2,8).toUpperCase();
    user.password = tempPwd;
    user.mustChangePassword = true;
    await DB.put(DB.STORES.users, user);
    return { user, tempPwd };
  }

  return { login, logout, restoreSession, getUser, isAdmin, isFaculty, isStudent, changePassword, resetPassword };
})();
