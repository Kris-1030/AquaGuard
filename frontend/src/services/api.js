import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const fetchHealth = () => api.get('/health').then((r) => r.data);
export const fetchDashboard = () => api.get('/dashboard').then((r) => r.data);
export const fetchModels = () => api.get('/models').then((r) => r.data);
export const fetchModelPerformance = () => api.get('/model-performance').then((r) => r.data);
export const fetchFeatureImportance = () => api.get('/feature-importance').then((r) => r.data);
export const fetchEDA = () => api.get('/eda').then((r) => r.data);
export const fetchStandards = () => api.get('/standards').then((r) => r.data);

export const predictSingle = (payload) =>
  api.post('/predict', payload).then((r) => r.data);

export const predictBulk = (file, modelName) => {
  const formData = new FormData();
  formData.append('file', file);
  if (modelName) formData.append('model_name', modelName);
  return api
    .post('/predict/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const fetchHistory = (params = {}) =>
  api.get('/history', { params }).then((r) => r.data);

export const fetchHistoryItem = (id) =>
  api.get(`/history/${id}`).then((r) => r.data);

export const getReportUrl = (id) => `${API_BASE}/report/${id}`;
export const getBulkTemplateUrl = () => `${API_BASE}/bulk/template`;

export default api;
