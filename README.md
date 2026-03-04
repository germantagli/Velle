# Velle - Plataforma Financiera Venezuela

Aplicación móvil nativa multiplataforma (React Native) para Android e iOS que funciona como plataforma financiera segura y legal para usuarios en Venezuela.

## Características Principales

- **Wallet USDT:** Saldo en USDT únicamente
- **Zelle:** Enviar y recibir dinero desde EE.UU.
- **Transferencias P2P:** Entre usuarios de la app
- **Pagos en comercios:** QR o NFC
- **Tarjetas virtuales:** Visa/Mastercard vía partner regulado
- **KYC/AML completo:** Cumplimiento regulatorio
- **AI opcional:** Soporte y detección de fraude

## Estructura del Proyecto

```
Velle/
├── mobile/                 # App React Native (Android + iOS)
├── backend/                # API REST + servicios
├── docs/                   # Documentación técnica
├── ARCHITECTURE.md         # Arquitectura del sistema
└── README.md               # Este archivo
```

## Requisitos Previos

- Node.js 18+
- npm o yarn
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS, solo macOS)
- PostgreSQL 14+
- Redis 7+

## Inicio Rápido

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npm run migrate       # Ejecutar migraciones
npm run dev           # Iniciar servidor de desarrollo
```

### App Móvil
```bash
cd mobile
npm install
npx react-native run-android   # Android
npx react-native run-ios       # iOS (solo macOS)
```

## Documentación

- [Arquitectura](./ARCHITECTURE.md)
- [Seguridad y Cumplimiento](./docs/SECURITY.md)
- [APIs](./docs/API.md)
- [Guía de Despliegue](./docs/DEPLOYMENT.md)

## Licencia

Propietario - Uso interno y comercial según términos acordados.
