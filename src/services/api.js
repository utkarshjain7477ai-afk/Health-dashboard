import axios from 'axios';
import Constants from 'expo-constants';
import { getAuthToken } from './storage';

export const BASE_URL =
  Constants?.expoConfig?.extra?.apiUrl ||
  'https://prescriva-production.up.railway.app';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const sendOtp = (phone) =>
  client.post('/api/otp/send', { phone }).then(r => r.data);

export const verifyOtp = (phone, otp) =>
  client.post('/api/otp/verify', { phone, otp }).then(r => r.data);

export const fetchRecords = async (phone) => {
  const token = await getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return client
    .get('/my-records', { params: token ? {} : { phone }, headers })
    .then(r => r.data.records || []);
};

export const PORTAL_URL = (pid) => `${BASE_URL}/portal/${pid}`;
