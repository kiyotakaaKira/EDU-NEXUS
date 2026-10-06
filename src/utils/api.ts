const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getToken = () => localStorage.getItem('sentinel_token') || '';

export async function loginAPI(userId: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password })
  });
  return res.json();
}

export async function aiChatAPI(systemPrompt: string, userMessage: string, token: string) {
  const res = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ systemPrompt, userMessage })
  });
  return res.json();
}

export async function dropoutAnalysisAPI(studentData: any, token: string) {
  const res = await fetch(`${API_URL}/api/ai/dropout-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ studentData })
  });
  return res.json();
}

export async function saveInterventionAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/interventions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function sendParentAlertAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/alerts/parent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function createEscalationAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/escalations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getEscalationsAPI(token: string) {
  const res = await fetch(`${API_URL}/api/escalations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function resolveEscalationAPI(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/escalations/${id}/resolve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function acknowledgeEscalationAPI(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/escalations/${id}/acknowledge`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function scheduleMeetingAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function sendInterventionPlanAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/interventions/send-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function getNotificationsAPI(token: string) {
  const res = await fetch(`${API_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function generateReportAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return res.json();
}
