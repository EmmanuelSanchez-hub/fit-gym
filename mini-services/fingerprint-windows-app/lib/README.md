# DigitalPersona 4500 SDK - DLLs

Coloca aquí las DLLs del SDK de DigitalPersona para habilitar la captura real de huellas.

## Archivos requeridos

Copia los siguientes archivos desde la carpeta de instalación del SDK a esta carpeta `lib/`:

```
lib/
├── DPFPDev.dll      # Dispositivo - comunicación con el lector
├── DPFPShr.dll      # Funciones compartidas
└── DPFPCap.dll      # Captura de huellas
```

## Cómo obtener el SDK

### DigitalPersona SDK (Oficial)
El SDK oficial es de **HID Global** (antes DigitalPersona / Crossmatch).

1. Ve a: https://www.hidglobal.com/products/software/fingerprint-sdk
2. Descarga el **DigitalPersona SDK** para Windows (x64)
3. Instala el SDK en la PC con el lector conectado
4. Las DLLs se instalan en: `C:\Program Files\DigitalPersona\SDK\bin\`
5. Copia las 3 DLLs a esta carpeta `lib/`

### Modo simulación (sin SDK)
Si no tienes el SDK ni un lector compatible:
- No copies ninguna DLL
- El servicio funcionará en **modo simulación** automáticamente
- Las capturas serán simuladas (útiles para pruebas)

## Verificar instalación

Después de copiar las DLLs, compila el proyecto:

```bash
dotnet build
```

Si hay errores de compilación, verifica que:
- Las DLLs sean de 64-bit (x64)
- Las DLLs correspondan a tu modelo de lector
- El SDK esté correctamente instalado

## Notas

- Las DLLs son de 64-bit (x64). Asegúrate de usar la versión correcta.
- Si las DLLs no están presentes, el servicio funcionará en **modo simulación** automáticamente.
- Al publicar el .exe con `dotnet publish`, estas DLLs se incluirán automáticamente gracias a la configuración en el `.csproj`.
- El servicio detecta automáticamente si el SDK está disponible y usa captura real, o cae a simulación si no.
