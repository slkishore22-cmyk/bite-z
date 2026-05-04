const KEYS = {
  user: 'bitez_user_session',
  seller: 'bitez_seller_session',
  admin: 'bitez_admin_session',
};

export function saveUserSession(data) {
  localStorage.setItem(
    KEYS.user,
    JSON.stringify({ ...data, role: 'user', savedAt: Date.now() }),
  );
}

export function saveSellerSession(data) {
  localStorage.setItem(
    KEYS.seller,
    JSON.stringify({ ...data, role: 'seller', savedAt: Date.now() }),
  );
}

export function saveAdminSession() {
  localStorage.setItem(
    KEYS.admin,
    JSON.stringify({ role: 'master_admin', authenticated: true, savedAt: Date.now() }),
  );
}

export function getUserSession() {
  try {
    const r = localStorage.getItem(KEYS.user);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

export function getSellerSession() {
  try {
    const r = localStorage.getItem(KEYS.seller);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

export function getAdminSession() {
  try {
    const r = localStorage.getItem(KEYS.admin);
    if (!r) return null;
    const s = JSON.parse(r);
    if (Date.now() - s.savedAt > 8 * 60 * 60 * 1000) {
      localStorage.removeItem(KEYS.admin);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearUserSession() {
  localStorage.removeItem(KEYS.user);
}
export function clearSellerSession() {
  localStorage.removeItem(KEYS.seller);
}
export function clearAdminSession() {
  localStorage.removeItem(KEYS.admin);
}

export function getUserName() {
  const s = getUserSession();
  if (!s) return 'there';
  const name = s.full_name || s.name || '';
  return name ? name.split(' ')[0] : 'there';
}

export function getActiveSession() {
  if (getAdminSession()) return { role: 'master_admin' };
  if (getSellerSession()) return { role: 'seller' };
  if (getUserSession()) return { role: 'user' };
  return null;
}