# Velle - Plataforma Financiera Venezuela

Aplicación móvil nativa multiplataforma (React Native) para Android e iOS.

## 🚀 Inicio rápido con Docker (un solo comando)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Requiere [Docker](https://www.docker.com/get-started) instalado.

Esto inicia:
- **PostgreSQL** en el puerto 5432 (usuario: `velle`, contraseña: `velle123`, DB: `velle`)
- **Backend API** en el puerto 3000 (con migraciones aplicadas)

La API estará disponible en `http://localhost:3000`.

### Comandos útiles

```bash
# Iniciar todo
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down

# Reconstruir tras cambios
docker compose up -d --build
```

### Datos de prueba (opcional)

Tras el primer arranque, para crear usuario y comercio de prueba:

```bash
docker compose exec backend npx ts-node prisma/seed.ts
```

- Usuario: `test@velle.app` / `password123`
- Comercio QR: `MERCHANT-DEMO-001`

---

## Estructura

- `mobile/` - App React Native
- `backend/` - API NestJS
- `docs/` - Documentación

## App móvil

```bash
cd mobile
npm install
npx react-native run-android
```

Configura `API_URL` para apuntar a `http://10.0.2.2:3000` (Android emulador) o tu IP local.
