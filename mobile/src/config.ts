/**
 * Configuración de la app - cambiar según entorno
 * Railway (producción): https://velle-developd.up.railway.app
 * Local: http://10.0.2.2:3000 (Android emulator) o http://localhost:3000 (iOS sim)
 */
export const API_URL = 'https://velle-developd.up.railway.app';

/** Google Places API key para autocompletado de direcciones.
 * Obtener en: https://console.cloud.google.com/
 * Habilitar: "Places API" (o "Places API (New)") en APIs y servicios.
 * Dejar vacío para usar input manual sin autocompletado. */
export const GOOGLE_PLACES_API_KEY = '';

// Para desarrollo local del backend, cambiar a:
// export const API_URL = 'http://10.0.2.2:3000';  // Android emulator
// export const API_URL = 'http://localhost:3000'; // iOS simulator
