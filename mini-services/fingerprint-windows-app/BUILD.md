# Build y Deployment - FitGym Fingerprint Service

## Requisitos

- Windows 10/11 (x64)
- .NET 6.0 SDK: https://dotnet.microsoft.com/download
- Lector de huellas DigitalPersona 4500 (o compatible)

## Compilar

```bash
cd mini-services/fingerprint-windows-app
dotnet build -c Release
```

## Publicar como .exe único

```bash
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

El .exe se genera en: `bin\Release\net6.0-windows\win-x64\publish\FitGymFingerprint.exe`

## Configurar SDK DigitalPersona

1. Instala el **DigitalPersona SDK** desde: https://www.hidglobal.com/products/software/fingerprint-sdk
2. Copia estas 3 DLLs desde `C:\Program Files\DigitalPersona\SDK\bin\` a la carpeta `lib\`:
   - `DPFPDev.dll`
   - `DPFPShr.dll`
   - `DPFPCap.dll`

## Instalar en la PC con el lector

1. Copia `FitGymFingerprint.exe` a la PC destino
2. Crea la carpeta `lib` junto al .exe
3. Coloca las 3 DLLs del SDK en `lib\`
4. Ejecuta `FitGymFingerprint.exe`
5. Click en **"INICIAR SERVICIO"**

## Verificar funcionamiento

Abre en el navegador: http://localhost:3005/api/fingerprint/status

Debe mostrar:
```json
{
  "connected": true,
  "deviceName": "DigitalPersona 4500",
  "sensorReady": true,
  "mode": "hardware"
}
```

## Modo simulación

Si no copias las DLLs, el servicio funciona en modo simulación automáticamente (útil para pruebas).