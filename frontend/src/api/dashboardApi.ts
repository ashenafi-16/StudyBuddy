import api from './apiClient';

export const fetchDashboard = async (_token?: string) => {
  const res = await api.get("/dashboard/");
  return res.data;
};

export const fetchAnalytics = async (_token?: string) => {
  const res = await api.get("/dashboard/analytics/");
  return res.data;
};
