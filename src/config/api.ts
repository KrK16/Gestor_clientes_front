// Configuración centralizada de la API
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000',
  ENDPOINTS: {
    COMPRAS: '/compras',
    CLIENTES: '/clientes',
    ABONOS: '/abonos',
  }
};

// Helper para construir URLs
export const createApiUrl = (endpoint: string, path?: string) => {
  const baseUrl = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullPath = path ? `${cleanEndpoint}/${path}` : cleanEndpoint;
  return `${baseUrl}${fullPath}`;
};