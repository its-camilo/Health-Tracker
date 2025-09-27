import Constants from 'expo-constants';
import { RUNNING_IN_CODESPACES } from './environment';

/**
 * 🔧 CONFIGURACIÓN CENTRAL - CAMBIA EL VALOR EN `environment.ts`
 *
 * Solo necesitas ajustar `RUNNING_IN_CODESPACES` en `frontend/constants/environment.ts`:
 * - false → EJECUTAR EN LOCAL (http://127.0.0.1:8000)
 * - true  → EJECUTAR EN CODESPACES (URL remota)
 */
export const CODESPACES_BACKEND_URL = 'https://fantastic-train-rxwxqr7g55xcww9v-8000.app.github.dev';
export const LOCAL_BACKEND_URL = 'http://127.0.0.1:8000';
export const LOCAL_WEB_URL = 'http://localhost:3000';
export const LOCAL_EXPO_DEVTOOLS_URL = 'http://localhost:19000';

export const DEFAULT_LOCAL_ENDPOINTS = {
  backend: LOCAL_BACKEND_URL,
  web: LOCAL_WEB_URL,
  expoDevTools: LOCAL_EXPO_DEVTOOLS_URL,
};

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

const MANUAL_BACKEND_URL = normalizeUrl(
  RUNNING_IN_CODESPACES ? CODESPACES_BACKEND_URL : LOCAL_BACKEND_URL
);

function resolveEnvBackendUrl(): string | undefined {
  const processEnvUrl =
    typeof globalThis !== 'undefined' && 'process' in globalThis
      ? (globalThis as any)?.process?.env?.EXPO_PUBLIC_BACKEND_URL
      : undefined;

  const configEnvUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;

  return processEnvUrl || configEnvUrl;
}

export function getBackendBaseUrl(): string {
  const envUrl = resolveEnvBackendUrl();

  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return normalizeUrl(envUrl);
  }

  return MANUAL_BACKEND_URL;
}

export function warnIfUsingFallback() {
  const envUrl = resolveEnvBackendUrl();
  const finalUrl = getBackendBaseUrl();
  
  console.log('🔧 [Config] Backend URL Configuration:');
  console.log('  - RUNNING_IN_CODESPACES:', RUNNING_IN_CODESPACES);
  console.log('  - Environment URL:', envUrl);
  console.log('  - Manual backend URL:', MANUAL_BACKEND_URL);
  console.log('  - Final backend URL:', finalUrl);
  
  if (!envUrl) {
    console.warn('[Config] Using manual backend URL fallback:', MANUAL_BACKEND_URL);
    console.warn('[Config] Local dev endpoints:', DEFAULT_LOCAL_ENDPOINTS);
  }
}

