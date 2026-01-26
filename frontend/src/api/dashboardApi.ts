export const fetchDashboard = async (token: string) => {
  const res = await fetch("http://127.0.0.1:8000/dashboard/", {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
  return res.json();
};

// export const fetchLiveUpdates = async (token: string) => {
//   const res = await fetch("http://127.0.0.1:8000/dashboard/live-updates/", {
//     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//   });
//   if (!res.ok) throw new Error(`Live updates fetch failed: ${res.status}`);
//   return res.json();
// };

export const fetchAnalytics = async (token: string) => {
  const res = await fetch("http://127.0.0.1:8000/dashboard/analytics/", {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
};
