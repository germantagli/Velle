# Seguridad y Cumplimiento - Velle

## 1. Encriptación

- **Tránsito:** TLS 1.3 obligatorio para todas las comunicaciones API
- **Reposo:** AES-256 para datos sensibles (documentos KYC, datos personales)
- **Claves:** AWS KMS / GCP KMS o HSM para claves de wallet y tokens

## 2. Autenticación

- JWT con expiración corta (24h) + refresh tokens
- MFA obligatorio para operaciones de alto valor
- Límites de intentos de login (bloqueo tras 5 fallos)

## 3. KYC/AML

- Verificación de identidad con proveedor regulado (Onfido, Jumio, etc.)
- Listas OFAC, PEP, sanciones
- Documentos: cédula/pasaporte, selfie, comprobante de domicilio
- Re-verificación periódica según políticas

## 4. Auditoría

- Logs de todas las transacciones (quién, qué, cuándo, IP)
- Retention mínima 5 años para AML
- Logs inmutables (append-only)

## 5. Cumplimiento Regulatorio

### EE.UU. (si aplica)
- Registro MSB con FinCEN
- Licencias Money Transmission por estado
- SARs (Suspicious Activity Reports) cuando proceda

### Venezuela
- Buenas prácticas financieras
- Separación estricta de fondos (nunca cuentas personales)
- Custodia institucional para USDT

## 6. Prevención de Fraude

- Reglas de negocio (límites por usuario, velocidades)
- Alertas por patrones anómalos
- IA opcional para scoring de transacciones sospechosas
