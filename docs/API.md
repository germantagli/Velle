# API Velle - Documentación

## Base URL
```
https://api.velle.app  (producción)
http://localhost:3000  (desarrollo)
```

## Autenticación
Bearer JWT en header: `Authorization: Bearer <token>`

## Endpoints Principales

### Auth
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registro de usuario
- `POST /auth/refresh` - Renovar token

### Wallet
- `GET /wallet/balance` - Obtener saldo USDT
- `GET /wallet/transactions` - Historial de transacciones

### Zelle
- `POST /zelle/request-deposit` - Solicitar depósito desde Zelle
- `POST /zelle/send` - Enviar a cuenta Zelle

### Transferencias
- `POST /transfer/p2p` - Transferencia entre usuarios
- `POST /transfer/merchant` - Pago a comercio (QR/NFC)

### KYC
- `POST /kyc/submit` - Enviar documentos de verificación

## Swagger
Disponible en `/api/docs` cuando el servidor está corriendo.
