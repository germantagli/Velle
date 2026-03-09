# Configuración Face ID / Touch ID (iOS)

Para que la autenticación biométrica funcione en iOS, agrega esta clave a tu `Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Usamos Face ID para iniciar sesión de forma segura</string>
```

Si usas solo Touch ID (huella), no es estrictamente necesario, pero Face ID sí lo requiere.
