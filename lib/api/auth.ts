import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

export const authApi = {
  login: async (data: any) => {
    const res = await api.post('/api/v1/auth/login', data);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/api/v1/auth/register', data);
    return res.data;
  },
  verifyOtp: async (data: any) => {
    const res = await api.post('/api/v1/auth/register/verify', data);
    return res.data;
  }
};
