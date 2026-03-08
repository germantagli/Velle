# Plan Ejecutado - USDT, Retiros USA y Compliance

## Resumen

Se ha implementado el plan completo descrito en `docs/DISENO_USDT_Y_RETIROS_USA.md`.

---

## Backend (NestJS)

### Schema Prisma (nuevas tablas y campos)

- **SystemConfig**: key, value (JSON) - feature flags y configuración
- **LimitTier**: name, dailyLimitUsdt, monthlyLimitUsdt
- **LimitUsage**: userId, periodType, periodKey, amountUsdt
- **BankAccount**: accountHolder, accountNumber, routingNumber, accountType, bankName, lastFour, externalId, status
- **Withdrawal** (extendido): bankAccountId, partnerTransferId, usdAmount, fee, etaMinutes, metadata
- **User**: limitTierId (opcional)
- **TransactionType**: USA_BANK_WITHDRAWAL

### Módulos nuevos

| Módulo | Descripción |
|--------|-------------|
| **ConfigModule** | SystemConfig, GET/PATCH config/deposit |
| **LimitsModule** | Límites diarios/mensuales, GET /limits |
| **BankAccountModule** | CRUD cuentas bancarias USA (JWT + KYC) |
| **DwollaModule** | Cliente Dwolla (sandbox si no configurado) |
| **WithdrawalUsaModule** | Retiros a EE.UU. (JWT + KYC) |
| **WebhooksModule** | POST /webhooks/dwolla |

### Cambios en módulos existentes

- **DepositService**: Conversión automática VES→USDT al confirmar (config `auto_convert_ves_on_deposit`)
- **TransferController**: KycVerifiedGuard en p2p y merchant
- **ZelleController**: KycVerifiedGuard en send

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /config/deposit | Config auto-conversión |
| PATCH | /config/deposit | Actualizar auto-conversión (admin) |
| GET | /limits | Límites del usuario |
| GET | /bank-accounts | Listar cuentas |
| POST | /bank-accounts | Añadir cuenta |
| DELETE | /bank-accounts/:id | Eliminar cuenta |
| POST | /withdrawal/usa | Crear retiro USA |
| GET | /withdrawal/usa | Listar retiros USA |
| GET | /withdrawal/usa/:id | Detalle retiro |
| POST | /webhooks/dwolla | Webhook Dwolla |

---

## Frontend (React Native)

### Pantallas nuevas

- **USAWithdrawalScreen**: Retiro a cuenta USA (selección de cuenta, monto, fees, ETA)
- **AddBankAccountScreen**: Añadir cuenta bancaria (routing, account number, tipo)

### Cambios en pantallas existentes

- **HomeScreen**: Saldo principal en USDT, botón "Retiro USA"
- **HistoryScreen**: Tipo USA_BANK_WITHDRAWAL

### API client

- limitsApi.get()
- bankAccountApi.list(), create(), delete()
- withdrawalUsaApi.create(), list(), getOne()

---

## Migración

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Variables de entorno

```env
VES_USDT_RATE=36

# Opcional - Dwolla para retiros reales
# DWOLLA_API_KEY=
# DWOLLA_API_SECRET=
# DWOLLA_SANDBOX=true
# DWOLLA_FUNDING_SOURCE_ID=
```

---

## Notas

1. **Node.js**: Se requiere Node.js 18+ (el build puede fallar en versiones antiguas por sintaxis moderna en dependencias).

2. **Dwolla**: Sin credenciales, el sistema funciona en modo sandbox (simula transferencias).

3. **KYC**: Las operaciones P2P, Zelle send, retiros USA y cuentas bancarias requieren KYC VERIFIED.

4. **Límites**: Por defecto 5000 USDT/día y 20000 USDT/mes. Se asignan mediante LimitTier al usuario.
