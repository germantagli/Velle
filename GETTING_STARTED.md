# Inicio Rápido - Velle

## Opción A: Proyecto React Native desde cero

Para generar las carpetas nativas `android/` e `ios/`, ejecuta desde la raíz:

```bash
npx @react-native-community/cli init VelleTemp --directory mobile-native --skip-install
```

Luego copia el contenido de `mobile/` (App, src, package.json ajustado) a `mobile-native/` y elimina `mobile-native` si prefieres usar `mobile/` como carpeta principal.

## Opción B: Usar la estructura actual

1. **Inicializar la app móvil:**
   ```bash
   cd mobile
   npm install
   npx react-native init Velle --directory . --skip-git-init
   ```
   ⚠️ Esto puede sobrescribir algunos archivos. Si ocurre, restaura `App.tsx`, `src/` y `package.json` desde el repositorio.

2. **Alternativa recomendada:** Crear proyecto nuevo y migrar:
   ```bash
   npx react-native init Velle --template react-native-template-typescript
   cd Velle
   # Copiar src/, App.tsx, y agregar dependencias del package.json de mobile/
   npm install
   npx react-native run-android
   ```

## Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con DATABASE_URL real
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

## Integraciones Pendientes

- **Zelle:** Contratar partner con licencia (ej. fintech con cuenta corporativa)
- **USDT:** Integrar Tether, Fireblocks o custodia regulada
- **VES→USDT:** Proveedor P2P autorizado o exchange
- **Tarjetas:** Marqeta, Galileo u otro emisor regulado
- **KYC:** Onfido, Jumio o similar

Estas integraciones requieren contratos comerciales y API keys. El código tiene placeholders listos para conectarlos.
