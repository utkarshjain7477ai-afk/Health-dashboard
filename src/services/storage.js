import * as SecureStore from 'expo-secure-store';

const get = (key) => SecureStore.getItemAsync(key);
const set = (key, value) => SecureStore.setItemAsync(key, value);

export const getProfile = async () => {
  const keys = ['px_name', 'px_phone', 'px_blood_group', 'px_allergies', 'px_comorbidities', 'px_lang'];
  const vals = await Promise.all(keys.map(get));
  const obj = Object.fromEntries(keys.map((k, i) => [k, vals[i] || '']));
  try { obj.px_comorbidities = JSON.parse(obj.px_comorbidities || '[]'); } catch { obj.px_comorbidities = []; }
  return obj;
};

export const saveProfile = async (profile) => {
  await Promise.all(
    Object.entries(profile).map(([k, v]) =>
      set(k, typeof v === 'object' ? JSON.stringify(v) : String(v || ''))
    )
  );
};

export const getFamily = async () => {
  try { return JSON.parse((await get('px_family')) || '[]'); } catch { return []; }
};

export const saveFamily = async (arr) => set('px_family', JSON.stringify(arr));

export const getHistory = async () => {
  try { return JSON.parse((await get('px_history')) || '[]'); } catch { return []; }
};

export const getLang = async () => (await get('px_lang')) || 'en';
export const setLang = async (l) => set('px_lang', l);

export const getAuthToken = async () => get('px_auth_token');
export const setAuthToken = async (token) => set('px_auth_token', token);
