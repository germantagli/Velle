# Guía de despliegue y pruebas - Velle

## Backend (Railway)

### Deploy automático
- **Rama conectada:** `develop`
- Cada **push** a `develop` dispara un nuevo deploy en Railway
- URL: https://velle-developd.up.railway.app

### Cómo hacer deploy
```bash
git add .
git commit -m "tu mensaje"
git push origin develop
```

### Verificar el deploy
- **Health:** https://velle-developd.up.railway.app/health
- **Swagger:** https://velle-developd.up.railway.app/api/docs
- Logs: Railway Dashboard → Velle → Deploy Logs

---

## App móvil (React Native)

### Probar contra el backend en Railway
La app está configurada para usar `https://velle-developd.up.railway.app` por defecto.

### Ejecutar la app
```bash
cd mobile
npm install
npm start
```

En otra terminal:
- **Android:** `npm run android`
- **iOS:** `npm run ios` (solo en Mac)

### Cambiar URL de la API
Editar `mobile/src/config.ts`:
- **Railway (producción):** `API_URL = 'https://velle-developd.up.railway.app'`
- **Backend local (Android emulator):** `API_URL = 'http://10.0.2.2:3000'`
- **Backend local (iOS simulator):** `API_URL = 'http://localhost:3000'`

### Build de producción (distribución)
Para generar APK/IPA para testers:
- **Android:** `cd mobile && npx react-native run-android --variant=release`
- **iOS:** Requiere Xcode y cuenta Apple Developer
- Alternativa: [EAS Build](https://docs.expo.dev/build/introduction/) si migras a Expo

---

## Flujo recomendado

1. **Desarrollar** → Cambiar `config.ts` a local si trabajas en el backend
2. **Push a develop** → Deploy automático en Railway
3. **Probar** → Ejecutar la app móvil (usa Railway por defecto)
4. **Verificar** → Health check y Swagger para confirmar que el backend responde
