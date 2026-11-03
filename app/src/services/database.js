// The browser talks to the app server; MySQL credentials stay on that server.
const BASE = '/data';
const USER_KEY = 'settlein_se_active_user';
const TOKEN_KEY = 'settlein_se_token';

export async function managementRequest(path, method = 'GET', body) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Unable to load data');
  return data;
}

export function getProperties(filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '' && value !== 'all'));
  return managementRequest('/properties' + (params.size ? '?' + params : ''));
}
export async function getPropertyById(id) {
  return managementRequest('/properties/' + encodeURIComponent(id));
}
export const addProperty = data => managementRequest('/properties', 'POST', data);
export const updateProperty = (id, data) => managementRequest('/admin/properties/' + encodeURIComponent(id), 'PATCH', data);
export const deleteProperty = id => managementRequest('/properties/' + encodeURIComponent(id), 'DELETE');
export const createBooking = data => managementRequest('/bookings', 'POST', data);

export async function loginUser(email, password) {
  try {
    const data = await managementRequest('/users/login', 'POST', { email, password });
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return { success: true, message: 'Signed in successfully.', user: data.user };
  } catch (error) { return { success: false, message: error.message }; }
}
export async function registerUser(data) {
  try {
    await managementRequest('/users', 'POST', Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '')));
    return loginUser(data.email, data.password);
  } catch (error) { return { success: false, message: error.message }; }
}
export function getCurrentUser() {
  try { return sessionStorage.getItem(TOKEN_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)) : null; }
  catch { return null; }
}
export function logoutUser() {
  managementRequest('/users/logout', 'POST').catch(() => {});
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
const SAVED_KEY = 'settlein_se_saved_properties';
export function getSavedPropertyIds() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
}
export const isSaved = id => getSavedPropertyIds().includes(id);
export function toggleSaved(id) {
  const saved = getSavedPropertyIds();
  const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next.includes(id);
}
