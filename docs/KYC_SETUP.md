# Configuración KYC con Sumsub

Verificación de identidad automatizada (documentos + selfie con liveness) sin revisión manual.

## 1. Crear cuenta Sumsub

1. Regístrate en [Sumsub](https://sumsub.com/)
2. Accede al [Dashboard](https://cockpit.sumsub.com/) (sandbox gratis para pruebas)
3. Crea un **App Token** en: Integrations → API → App Tokens

## 2. Variables de entorno (backend)

Añade a tu `.env`:

```env
SUMSUB_APP_TOKEN=sbx:xxxxxxxx...
SUMSUB_SECRET_KEY=xxxxxxxx...
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=basic-kyc-level
```

- **Sandbox**: Los tokens que empiezan por `sbx:` son de prueba
- **Producción**: Usa tokens de producción cuando estés listo

## 3. Webhook (producción)

En Sumsub Dashboard → Webhooks → Add Webhook:

- **URL**: `https://tu-dominio.com/webhooks/sumsub`
- **Eventos**: Marca `applicantReviewed`
- **Secret**: Opcional, para verificar firma `X-Payload-Digest`

Cuando un usuario complete la verificación, Sumsub enviará el resultado y actualizaremos automáticamente `kycStatus` a `VERIFIED` o `REJECTED`.

## 4. Nivel de verificación

Por defecto usamos `basic-kyc-level`. En Sumsub puedes crear niveles personalizados con:

- Documento de identidad (DNI, cédula, pasaporte)
- Selfie con verificación en vivo (liveness)
- Coincidencia facial (documento vs selfie)

## 5. Almacenamiento S3 (recomendado para Railway)

En Railway el disco es efímero. Para que los documentos KYC persistan, configura AWS S3:

1. Crea un bucket en [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Crea un usuario IAM con permisos `s3:PutObject` y `s3:GetObject`
3. Añade las variables en Railway:

```env
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=velle-kyc-docs
```

Sin S3, los archivos se guardan en disco local (se pierden al reiniciar en Railway).

## 6. Migración de base de datos

```bash
cd backend
npx prisma migrate deploy
```

## Flujo (subida manual con cámara)

1. Usuario abre pantalla KYC
2. Pulsa "Iniciar verificación"
3. Backend crea applicant en Sumsub y devuelve access token
4. App abre WebView con Sumsub Web SDK
5. Usuario captura documento y selfie
6. Sumsub procesa automáticamente (OCR, liveness, face match)
7. Sumsub envía webhook → backend actualiza `kycStatus`
8. Usuario recibe confirmación
