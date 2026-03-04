# Deploy en Railway - Velle Backend

## 1. Crear proyecto en Railway

1. Entra en [railway.app](https://railway.app) y crea un proyecto.
2. **New** → **GitHub Repo** y elige el repo de Velle (o sube el código).
3. En **Settings** del servicio, pon **Root Directory** = `backend` (si el repo es la raíz del monorepo).

## 2. Añadir PostgreSQL

1. En el proyecto Railway: **New** → **Database** → **PostgreSQL**.
2. Railway crea la variable **DATABASE_URL** y la inyecta en tu servicio. No hace falta copiarla a mano.

## 3. Variables de entorno

En el servicio del backend, **Variables** y añade:

| Variable       | Valor                          | Requerido |
|----------------|--------------------------------|-----------|
| `DATABASE_URL` | (lo pone Railway con la DB)   | Sí        |
| `JWT_SECRET`   | Una cadena larga y aleatoria  | Sí        |
| `PORT`         | (Railway lo asigna)           | No        |
| `CORS_ORIGINS` | `https://tudominio.com`       | Opcional  |

Ejemplo de `JWT_SECRET` (genera uno distinto):

```
openssl rand -base64 32
```

## 4. Deploy

- Con **Git**: cada push a la rama conectada hace un nuevo deploy.
- **Build**: Railway usa `nixpacks` (o tu Dockerfile). Se ejecuta `npm ci`, `prisma generate`, `npm run build`.
- **Start**: `npx prisma migrate deploy && node dist/src/main.js`.

## 5. Si sigue crasheando

1. **Logs**: en Railway → servicio → **Deployments** → último deploy → **View Logs**.
2. **Prisma**: si ves error de “Query Engine” o OpenSSL, en `prisma/schema.prisma` ya están `binaryTargets` con `debian-openssl-3.0.x` y `rhel-openssl-3.0.x`.
3. **Migraciones**: comprueba que `DATABASE_URL` es la de la base de datos del mismo proyecto y que las migraciones en `backend/prisma/migrations` están commiteadas.
4. **Health**: la ruta `GET /health` debe devolver `{"status":"ok"}`. Úsala en **Health Check** del servicio si lo configuras.

## 6. Dominio

En el servicio → **Settings** → **Networking** → **Generate Domain** para obtener una URL pública (ej. `https://velle-backend-production.up.railway.app`).
