# Implementación Fintech - Velle

## Resumen

Se han implementado todas las funcionalidades financieras solicitadas manteniendo la arquitectura existente (NestJS + Prisma + React Native).

---

## 1. Schema de base de datos (Prisma)

### Wallet (actualizado)
- `balance_ves` - Saldo en bolívares
- `balance_usdt` - Saldo en USDT
- Se elimina `balance` y `currency` (migración automática)

### Nuevas tablas
- **Deposit**: id, user_id, amount, reference, status (PENDING | CONFIRMED | REJECTED)
- **Withdrawal**: id, user_id, amount, destination, destination_email, destination_name, status (PENDING | PROCESSING | COMPLETED | FAILED)

### Nuevos tipos de transacción
- `P2P_VES` - Transferencia P2P en bolívares
- `CONVERSION_VES_TO_USDT` - Conversión VES → USDT
- `CONVERSION_USDT_TO_VES` - Conversión USDT → VES

---

## 2. Backend - Endpoints

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| **Deposit** | POST /deposit | Crear solicitud de depósito (genera referencia) |
| | GET /deposit | Listar depósitos del usuario |
| | POST /deposit/:id/confirm | Confirmar depósito (admin) |
| | POST /deposit/:id/reject | Rechazar depósito |
| **Conversion** | GET /conversion/rate | Obtener tasa VES/USDT |
| | POST /conversion/ves-to-usdt | Convertir VES → USDT (comisión 1%) |
| | POST /conversion/usdt-to-ves | Convertir USDT → VES (comisión 1%) |
| **Transfer** | POST /transfer/p2p | P2P (body: recipientId, amount, note?, currency?: 'VES'\|'USDT') |
| **Zelle** | POST /zelle/send | Enviar a Zelle (crea withdrawal) |
| **Withdrawal** | GET /withdrawal | Listar retiros del usuario |
| **Wallet** | GET /wallet/balance | Retorna balanceVes + balanceUsdt |
| | GET /wallet/transactions | Historial (query: type?) |

---

## 3. Seguridad

- **Transacciones atómicas**: Todas las operaciones financieras usan `$transaction` de Prisma
- **Rate limit**: ThrottlerModule (100 req/min)
- **Validación de saldo**: Antes de cada débito
- **Logs**: Las transacciones quedan registradas en la tabla Transaction

---

## 4. Migración

```bash
cd backend
npx prisma migrate deploy
```

Si la base de datos ya tiene datos, la migración:
1. Añade `balance_ves` y `balance_usdt` a Wallet
2. Copia `balance` existente → `balance_usdt`
3. Elimina `balance` y `currency`
4. Crea tablas Deposit y Withdrawal

**Nota**: En PostgreSQL < 11, si falla `ALTER TYPE ... ADD VALUE` dentro de la migración, ejecuta manualmente:

```sql
ALTER TYPE "TransactionType" ADD VALUE 'P2P_VES';
ALTER TYPE "TransactionType" ADD VALUE 'CONVERSION_VES_TO_USDT';
ALTER TYPE "TransactionType" ADD VALUE 'CONVERSION_USDT_TO_VES';
```

---

## 5. Variables de entorno

Añade a `.env`:

```
VES_USDT_RATE=36
```

---

## 6. Frontend - Pantallas

| Pantalla | Descripción |
|----------|-------------|
| **HomeScreen** | Muestra balance VES y USDT, accesos a Agregar VES, Convertir, Zelle, Transferir |
| **DepositScreen** | Genera referencia de depósito en VES |
| **ConvertScreen** | Conversión VES ↔ USDT con vista previa |
| **P2PTransferScreen** | Transferir con selector de moneda (VES/USDT) |
| **ZelleSendScreen** | Enviar USDT a Zelle (email, nombre receptor) |
| **HistoryScreen** | Historial unificado con tipos VES_DEPOSIT, P2P_VES, conversiones |

---

## 7. Flujo de depósito

1. Usuario: "Agregar Bolívares" → DepositScreen
2. Introduce monto → POST /deposit
3. Sistema genera referencia (ej: DEP-1234567890-ABC123)
4. Usuario realiza pago móvil/transferencia
5. Admin confirma: POST /deposit/:id/confirm
6. `wallet.balance_ves += amount` (transacción atómica)

---

## 8. Flujo Zelle (retiros)

1. Usuario introduce email Zelle, nombre, monto USDT
2. POST /zelle/send → descuenta USDT, crea Withdrawal (PENDING)
3. Las solicitudes se procesan manualmente o con integración futura
4. Admin actualiza withdrawal.status a COMPLETED/PROCESSING/FAILED
