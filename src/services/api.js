import axios from 'axios';
import Constants from 'expo-constants';

const BASE_URL =
  Constants?.expoConfig?.extra?.apiUrl ||
  'https://prescriva-production.up.railway.app';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const fetchRecords = (phone) =>
  client.get('/my-records', { params: { phone } }).then(r => r.data.records || []);

export const PORTAL_URL = (pid, phone) =>
  `${BASE_URL}/portal/${pid}${phone ? '?phone=' + encodeURIComponent(phone) : ''}`;
