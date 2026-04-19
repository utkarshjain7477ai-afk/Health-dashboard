import axios from 'axios';

const BASE_URL = 'https://prescriva-production.up.railway.app';

export const fetchRecords = (phone) =>
  axios.get(`${BASE_URL}/my-records`, { params: { phone } }).then(r => r.data.records || []);

export const PORTAL_URL = (pid, phone) =>
  `${BASE_URL}/portal/${pid}${phone ? '?phone=' + encodeURIComponent(phone) : ''}`;
