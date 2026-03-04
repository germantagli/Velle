# Guía de Despliegue - Velle

## Infraestructura Recomendada

### Backend (AWS/GCP/Azure)
- **Compute:** ECS Fargate / Cloud Run / App Service
- **DB:** RDS PostgreSQL / Cloud SQL (réplicas para HA)
- **Cache:** ElastiCache Redis / Memorystore
- **Storage:** S3 / GCS para documentos KYC
- **Secrets:** AWS Secrets Manager / GCP Secret Manager

### App Móvil
- **Android:** Google Play Store (requiere cuenta developer)
- **iOS:** App Store (requiere cuenta Apple Developer + enrolamiento)
- **CI/CD:** Fastlane + GitHub Actions / Bitrise

## Variables de Entorno (Backend)
Ver `.env.example` en `/backend`

## Migraciones
```bash
cd backend
npm run migrate:prod
```

## Checklist Pre-Producción
- [ ] SSL/TLS configurado
- [ ] Variables sensibles en secrets manager
- [ ] Rate limiting activo
- [ ] Logs centralizados (CloudWatch, Stackdriver)
- [ ] Monitoreo y alertas
- [ ] Backups automáticos de DB
- [ ] Licencias regulatorias vigentes
