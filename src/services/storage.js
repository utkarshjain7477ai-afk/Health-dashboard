import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = ['px_name','px_phone','px_blood_group','px_allergies','px_comorbidities','px_family','px_history','px_lang','px_gender','px_city'];

export const getProfile = async () => {
  const vals = await AsyncStorage.multiGet(['px_name','px_phone','px_blood_group','px_allergies','px_comorbidities','px_lang']);
  const obj = Object.fromEntries(vals.map(([k,v]) => [k, v || '']));
  try { obj.px_comorbidities = JSON.parse(obj.px_comorbidities || '[]'); } catch { obj.px_comorbidities = []; }
  return obj;
};

export const saveProfile = async (profile) => {
  const pairs = Object.entries(profile).map(([k,v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v||'')]);
  await AsyncStorage.multiSet(pairs);
};

export const getFamily = async () => {
  try { return JSON.parse(await AsyncStorage.getItem('px_family') || '[]'); } catch { return []; }
};

export const saveFamily = async (arr) => AsyncStorage.setItem('px_family', JSON.stringify(arr));

export const getHistory = async () => {
  try { return JSON.parse(await AsyncStorage.getItem('px_history') || '[]'); } catch { return []; }
};

export const getLang = async () => (await AsyncStorage.getItem('px_lang')) || 'en';
export const setLang = async (l) => AsyncStorage.setItem('px_lang', l);
