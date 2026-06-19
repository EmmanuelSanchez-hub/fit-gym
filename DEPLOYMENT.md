# 🏋️ FitGym Pro - Guía de Despliegue en Producción

## 📋 Requisitos Previos

Antes de empezar, necesitas tener:

1. ✅ **Un servidor VPS** — DigitalOcean, AWS, Google Cloud, etc.
2. ✅ **Tu dominio** — `cabfi.qzz.io` (ya configurado)
3. ✅ **GitHub** — [Crear cuenta gratis](https://github.com) si no tienes una
4. ✅ **Código fuente** — Tu proyecto FitGym Pro listo en tu computadora

---

## 📑 Tabla de Contenidos

- [Paso 1: Preparar el Proyecto](#paso-1-preparar-el-proyecto)
- [Paso 2: Subir a GitHub](#paso-2-subir-a-github)
- [Paso 3: Crear un Droplet en DigitalOcean](#paso-3-crear-un-droplet-en-digitalocean)
- [Paso 4: Configurar el Servidor por SSH](#paso-4-configurar-el-servidor-por-ssh)
- [Paso 5: Configurar el Dominio](#paso-5-configurar-el-dominio)
- [Paso 6: Instalar Docker en el Servidor](#paso-6-instalar-docker-en-el-servidor)
- [Paso 7: Clonar y Desplegar la App](#paso-7-clonar-y-desplegar-la-app)
- [Paso 8: Configurar HTTPS con Caddy](#paso-8-configurar-https-con-caddy)
- [Paso 9: Verificar que Todo Funciona](#paso-9-verificar-que-todo-funciona)
- [Paso 10: Acceso desde PC, Tablet y Móvil](#paso-10-acceso-desde-pc-tablet-y-móvil)
- [Preguntas Frecuentes](#-preguntas-frecuentes)
  - [🤔 ¿La base de datos también va en el Droplet?](#-la-base-de-datos-también-va-en-el-droplet)
  - [🤔 ¿El lector de huellas (Fingerprint) funciona en el Droplet?](#-el-lector-de-huellas-fingerprint-funciona-en-el-droplet)
  - [🤔 ¿Qué pasa si apago el Droplet? ¿Se pierde la base de datos?](#-qué-pasa-si-apago-el-droplet-se-pierde-la-base-de-datos)
- [Solución de Problemas](#solucion-de-problemas)
- [Comandos Útiles](#comandos-utiles)

---

## Paso 1: Preparar el Proyecto

### 1.1 Abrir terminal en la carpeta del proyecto

```bash
cd c:\Users\EMMANUEL\Downloads\CaboFit
```

### 1.2 Crear archivo `.env` para producción

```bash
# Copiar el archivo de ejemplo
copy .env.example .env.production
```

Abre el archivo `.env.production` con el Bloc de notas y pégalo con estos valores:

```env
# BASE DE DATOS
DATABASE_URL="file:./db/custom.db"

# NEXT-AUTH (cambia estos valores)
NEXTAUTH_URL="https://cabfi.qzz.io"
NEXTAUTH_SECRET="AQUI_VA_TU_SECRETO"

# SERVICIOS INTERNOS
WHATSAPP_SERVICE_URL="http://localhost:3004"
FINGERPRINT_SERVICE_URL="http://localhost:3005"

# MODO PRODUCCIÓN
NODE_ENV=production
PORT=3000
```

### 1.3 Generar el secreto para NEXTAUTH_SECRET

Abre PowerShell y ejecuta:

```powershell
# Generar un secreto seguro
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Copia el resultado y pégalo en `.env.production` donde dice `AQUI_VA_TU_SECRETO`.

Guardar el archivo.

---

## Paso 2: Subir a GitHub

### 2.1 Crear un repositorio en GitHub

1. Ve a [https://github.com/new](https://github.com/new)
2. Nombre del repositorio: `CaboFit`
3. Visibilidad: **Private** (recomendado) o **Public**
4. Haz clic en **"Create repository"**
5. **NO** marques "Add a README", "Add .gitignore" ni "Choose a license"

### 2.2 Subir el código desde tu computadora

Abre PowerShell en la carpeta del proyecto:

```powershell
# Configurar tu usuario de Git (solo la primera vez)
git config --global user.name "TuNombre"
git config --global user.email "tu-email@ejemplo.com"

# Inicializar Git y subir
git init
git add .
git commit -m "Primer commit - FitGym Pro"

# Conectar con GitHub (reemplaza "TU_USUARIO" con tu nombre de usuario)
git remote add origin https://github.com/TU_USUARIO/CaboFit.git
git branch -M main
git push -u origin main
```

📌 **Importante:** Te pedirá usuario y contraseña de GitHub. Usa un **Personal Access Token**:
1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" → Marca `repo` → Generate
3. Copia el token y úsalo como contraseña

---

## Paso 3: Crear un Droplet en DigitalOcean

### 3.1 Iniciar sesión en DigitalOcean

1. Ve a [https://cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Inicia sesión o crea una cuenta

### 3.2 Crear un Droplet

1. Haz clic en **"Create"** → **"Droplets"**
2. **Elegir imagen:** Selecciona **"Docker"**
   - Esto ya viene con Docker preinstalado, te ahorras pasos
   - Si no ves "Docker", selecciona **"Ubuntu 22.04 LTS"**
3. **Plan:**
   - 💰 **$4/mes** → 1 CPU, 512MB RAM, 10GB SSD (suficiente para empezar)
   - 💰 **$6/mes** → 1 CPU, 1GB RAM, 25GB SSD (recomendado)
   - 💰 **$12/mes** → 2 CPU, 2GB RAM, 50GB SSD (si tienes muchos clientes)
4. **Datacenter region:** Elige el más cercano a tu país:
   - Para Perú/Latam: **New York** o **San Francisco**
   - Para España: **Frankfurt** o **Amsterdam**
5. **Authentication:**
   - ✅ **Password** — Más fácil, te enviarán la contraseña por email
   - ✅ **SSH Key** — Más seguro (si sabes cómo configurarlo)
6. **Hostname:** `fitgym-server`
7. Haz clic en **"Create Droplet"**

### 3.3 Esperar a que se cree

⏳ Espera 30-60 segundos hasta que el Droplet aparezca con una IP.
Ejemplo de IP: `167.99.123.456`

📌 **Anota esta IP**, la usarás en los siguientes pasos.

---

## Paso 4: Configurar el Servidor por SSH

### 4.1 Conectarse al servidor

Abre PowerShell y ejecuta:

```powershell
ssh root@167.99.123.456
```

🔄 Reemplaza `167.99.123.456` con la IP de tu Droplet.
Te pedirá la contraseña que te envió DigitalOcean por email.

### 4.2 Actualizar el sistema

```bash
# Ya estás dentro del servidor como root
apt update && apt upgrade -y
```

### 4.3 Instalar Git (si no está)

```bash
apt install -y git
```

### 4.4 Instalar Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash
apt-get install -y nodejs
```

### 4.5 Configurar firewall

```bash
# Solo abrir los puertos necesarios
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Verificar
ufw status
```

✅ Deberías ver:
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 4.6 Verificar que Docker está instalado

```bash
docker --version
docker compose version
```

Si ves versiones, está listo. Si no, instálalo:

```bash
curl -fsSL https://get.docker.com | bash
```

---

## Paso 5: Configurar el Dominio

### 5.1 Comprar un dominio (si no tienes uno)

Puedes comprar en:
- **Namecheap** — Desde $8.88/año (recomendado)
- **Cloudflare** — Precio de costo (solo transfiere)
- **GoDaddy** — Desde $0.99 el primer año

Ejemplos de dominios:
- `tugimnasio.com`
- `fitgym.pe`
- `clubfitnes.online` (.online cuesta ~$2)

### 5.2 Configurar DNS

Ve a donde compraste el dominio y busca "DNS Settings" o "Zone Editor":

1. **Añadir un registro A:**
   - **Type:** A
   - **Name:** @ (o dejarlo vacío)
   - **Value:** `167.99.123.456` (la IP de tu Droplet)
   - **TTL:** 3600 (o el mínimo)

2. **Añadir un registro CNAME para "www":**
   - **Type:** CNAME
   - **Name:** www
   - **Value:** `tugimnasio.com`
   - **TTL:** 3600

3. Guardar los cambios.

⏳ **Espera 5-30 minutos** para que el DNS se propague.

### 5.3 Verificar que el dominio apunta al servidor

En tu computadora local abre PowerShell:

```powershell
ping cabfi.qzz.io
```

Si responde con `167.99.123.456`, está funcionando.

---

## Paso 6: Instalar Docker en el Servidor

Ya debería estar instalado si elegiste la imagen "Docker". Verifica:

```bash
docker --version
docker compose version
```

Si no está instalado:

```bash
curl -fsSL https://get.docker.com | bash
```

✅ **Verificar que funciona:**

```bash
docker run hello-world
```

Debe mostrar un mensaje de éxito.

---

## Paso 7: Clonar y Desplegar la App

### 7.1 Clonar el repositorio

```bash
cd /root
git clone https://github.com/TU_USUARIO/CaboFit.git
cd CaboFit
```

🔄 Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

### 7.2 Configurar variables de entorno

```bash
# Copiar el archivo de producción
cp .env.example .env
nano .env
```

Edita el archivo con estos valores:

```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="https://tugimnasio.com"
NEXTAUTH_SECRET="PEGA_AQUI_TU_SECRETO_GENERADO"
WHATSAPP_SERVICE_URL="http://localhost:3004"
FINGERPRINT_SERVICE_URL="http://localhost:3005"
NODE_ENV=production
PORT=3000
```

Para guardar en nano: `Ctrl+X` → `Y` → `Enter`

### 7.3 Iniciar la aplicación con Docker

```bash
# Construir e iniciar todos los servicios
docker compose up -d --build
```

### 7.4 Verificar que la app está corriendo

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs
docker compose logs -f app
```

⏳ Espera 10-20 segundos hasta que veas:
```
app-1  | ✅ WhatsApp service started
app-1  | ✓ Listening on port 3000
```

Presiona `Ctrl+C` para salir de los logs.

### 7.5 Probar que la app responde localmente

```bash
curl -s http://localhost:3000 | head -5
```

Deberías ver el HTML de la página.

---

## Paso 8: Configurar HTTPS con Caddy

### 8.1 Crear archivo de configuración de Caddy

```bash
# Crear directorio para Caddy
mkdir -p /etc/caddy

# Crear archivo de configuración
cat > /etc/caddy/Caddyfile << 'EOF'
# Configuración global
{
    email admin@tugimnasio.com
}

# Tu dominio principal
tugimnasio.com {
    # Proxy a Next.js
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }

    # Compresión
    encode gzip zstd

    # Headers de seguridad
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-XSS-Protection "1; mode=block"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
    }
}
EOF
```

🔄 Reemplaza `tugimnasio.com` con tu dominio real en todas partes.

💡 **Nota sobre el email:** Pon cualquier correo tuyo, Caddy lo usa para notificaciones de SSL.

### 8.2 Iniciar Caddy con Docker Compose

Agrega Caddy al `docker-compose.yml`:

```bash
cat > docker-compose.yml << 'EOF'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./db:/app/db
      - ./public:/app/public
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./db/custom.db
      - NEXTAUTH_URL=https://tugimnasio.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - WHATSAPP_SERVICE_URL=http://whatsapp:3004
      - FINGERPRINT_SERVICE_URL=http://fingerprint:3005
      - NEXT_TELEMETRY_DISABLED=1
    env_file:
      - .env
    restart: unless-stopped

  whatsapp:
    build:
      context: ./mini-services/whatsapp-service
      dockerfile: Dockerfile
    ports:
      - "3004:3004"
    volumes:
      - ./mini-services/whatsapp-service/state.json:/app/state.json
      - ./mini-services/whatsapp-service/session:/app/session
    environment:
      - PORT=3004
      - NODE_ENV=production
    restart: unless-stopped

  fingerprint:
    build:
      context: ./mini-services/fingerprint-service
      dockerfile: Dockerfile
    ports:
      - "3005:3005"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://0.0.0.0:3005
      - Fingerprint__SimulationMode=false
    restart: unless-stopped
    profiles:
      - fingerprint

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - /etc/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped
    depends_on:
      - app

volumes:
  caddy_data:
  caddy_config:

networks:
  default:
    name: fitgym-network
EOF
```

🔄 Reemplaza `tugimnasio.com` con tu dominio real.

### 8.3 Reiniciar todos los servicios

```bash
# Detener servicios actuales
docker compose down

# Iniciar todo con Caddy incluido
docker compose up -d --build
```

### 8.4 Verificar que todo está corriendo

```bash
docker compose ps
```

Debes ver 4 servicios (o 3 si no tienes fingerprint):

```
NAME                     IMAGE                    PORTS
fitgym-pro-app-1         fitgym-pro-app          0.0.0.0:3000->3000/tcp
fitgym-pro-whatsapp-1    fitgym-pro-whatsapp     0.0.0.0:3004->3004/tcp
fitgym-pro-caddy-1       caddy:2-alpine          0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### 8.5 Verificar los logs de Caddy

```bash
docker compose logs -f caddy
```

⏳ Espera 10-20 segundos. Deberías ver algo como:

```
caddy-1  | {"level":"info","msg":"using provided configuration","config_file":"/etc/caddy/Caddyfile"}
caddy-1  | {"level":"info","msg":"successfully installed certificate","domain":"tugimnasio.com"}
```

🎉 **¡SSL funcionando!** Presiona `Ctrl+C` para salir.

---

## Paso 9: Verificar que Todo Funciona

### 9.1 Probar desde el servidor

```bash
# Probar la app localmente
curl -s http://localhost:3000 | head -5

# Probar Caddy
curl -s http://localhost | head -5
```

### 9.2 Probar desde tu navegador

Abre cualquier navegador en tu computadora o teléfono y ve a:

```
https://cabfi.qzz.io
```

✅ Deberías ver la pantalla de **inicio de sesión** de FitGym Pro.

🔒 El candado en la barra de direcciones debe aparecer **verde/cerrado** (SSL activo).

### 9.3 Verificar el login

1. Si ejecutaste `npm run db:seed`, deberías poder iniciar sesión con:
   - **Email:** `admin@gym.com`
   - **Contraseña:** `admin123`

2. Si no hay datos, ve a `https://tugimnasio.com/api/setup` para crear el usuario inicial.

### 9.4 Verificar los health checks

Desde el servidor:

```bash
# Ver todos los servicios
docker compose ps

# Ver logs (sin errores)
docker compose logs --tail=50 app
docker compose logs --tail=50 whatsapp
docker compose logs --tail=50 caddy
```

---

## Paso 10: Acceso desde PC, Tablet y Móvil

### Desde PC (Escritorio)
```
https://tugimnasio.com
```
✅ Dashboard completo con sidebar, tablas, gráficos.

### Desde Tablet (iPad, Android)
```
https://tugimnasio.com
```
✅ Layout adaptativo automático. Menú colapsable.

### Desde Celular (iPhone, Android)
```
https://tugimnasio.com
```
✅ Diseño responsive. Cards y botones adaptados para touch.

### Instalar como App (PWA) en el teléfono

**En Android (Chrome):**
1. Abrir `https://tugimnasio.com`
2. Tocar el menú ⋮ (tres puntos)
3. Seleccionar **"Instalar aplicación"** o **"Agregar a pantalla de inicio"**
4. Aparecerá como una app nativa con su propio icono

**En iPhone/iPad (Safari):**
1. Abrir `https://tugimnasio.com`
2. Tocar el ícono **Compartir** 📤
3. Desplazarse hacia abajo y tocar **"Agregar a pantalla de inicio"**
4. Tocar **"Agregar"** (arriba a la derecha)
5. La app aparecerá en tu pantalla de inicio sin la barra del navegador

---

---

## ⚙️ Paso 11: Configurar el Lector de Huellas (Fingerprint Local)

**Este paso es adicional y solo si tienes un lector DigitalPersona 4500 conectado a una PC del gimnasio.**

### 📐 Arquitectura Final del Sistema

```
┌─────────────────────────────────────────────────┐
│            INTERNET (HTTPS)                      │
│   Accedes desde cualquier PC, Tablet o Móvil     │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────▼────────┐
          │   DIGITALOCEAN  │
          │   (Servidor)    │
          │                 │
          │  App FitGym Pro │
          │  (Next.js)      │
          │  WhatsApp       │
          │  Caddy (SSL)    │
          └─────────────────┘
                   ▲
                   │ (solo desde la PC
                   │  donde está el lector)
                   │
┌──────────────────┴──────────────────────────────┐
│            PC DE RECEPCIÓN DEL GIMNASIO          │
│                                                  │
│  🔵 Chrome abierto en: https://tugimnasio.com   │
│                                                  │
│  🟢 Fingerprint Service corriendo en:            │
│     http://localhost:3005                         │
│                                                  │
│  🔌 Lector DigitalPersona 4500 conectado por USB │
└─────────────────────────────────────────────────┘
```

### ✅ ¿Cómo funciona?

La magia está en que el **navegador** ejecuta el JavaScript. Cuando estás en la PC con el lector:

1. Abres `https://tugimnasio.com` en Chrome (la web está en DigitalOcean)
2. Das click en "Capturar huella" en la web
3. El navegador hace `fetch("http://localhost:3005/api/fingerprint/capture")`
4. **Esa petición va a tu PC local** (no a DigitalOcean), porque `localhost` es donde está el navegador
5. El fingerprint service que tienes corriendo responde con la huella
6. La web recibe la huella y la guarda en DigitalOcean

### 🛠️ Pasos para configurarlo

#### En la PC con el lector (Windows):

**Paso 1: Instalar .NET 6**
- Descargar e instalar desde: https://dotnet.microsoft.com/en-us/download/dotnet/6.0
- Elegir: **"Download .NET SDK v6.0"** para Windows

**Paso 2: Descargar el código del fingerprint service**
```powershell
# Opción A: Si tienes Git
git clone https://github.com/TU_USUARIO/CaboFit.git
cd CaboFit\mini-services\fingerprint-service

# Opción B: Solo copia la carpeta fingerprint-service desde tu proyecto
```

**Paso 3: Iniciar el fingerprint service**
```powershell
# Abrir PowerShell como Administrador
cd C:\Users\EMMANUEL\Downloads\CaboFit\mini-services\fingerprint-service

# Iniciar el servicio
dotnet run
```

Deberías ver:
```
╔═══════════════════════════════════════════════════════╗
║         HuellApp - Fingerprint Service                ║
║         DigitalPersona 4500 Integration               ║
║                                                       ║
║  API: http://localhost:3005/api/fingerprint           ║
║  Swagger: http://localhost:3005/swagger               ║
║  Status: http://localhost:3005/api/fingerprint/status ║
╚═══════════════════════════════════════════════════════╝
```

**Paso 4: Verificar que funciona**

Abre Chrome en la MISMA PC y ve a:
```
http://localhost:3005/api/fingerprint/status
```

Debería responder: `{"connected": true, "deviceModel": "DigitalPersona 4500", ...}`

**Paso 5: Probar desde la web en DigitalOcean**

1. Abre `https://tugimnasio.com` en la misma PC (Chrome)
2. Ve a la sección **Clientes**
3. Haz click en **"Nuevo Cliente"**
4. Verás el botón **"Capturar huella"** 🟢
5. Pon el dedo en el lector y presiona el botón
6. ✅ ¡La huella se captura y se guarda!

### ⚠️ IMPORTANTE: Reglas de uso

| Regla | Explicación |
|-------|-------------|
| ✅ **Solo funciona en la PC con el lector** | Desde el celular o tablet no capturarás huellas (no hay lector) |
| ✅ **El fingerprint service debe estar corriendo** | Si cierras la terminal, deja de funcionar |
| ✅ **Usa Chrome** | Es el navegador más compatible |
| ✅ **localhost siempre funciona** | El navegador entiende que localhost es su propia PC |
| ❌ **No cierres la terminal** | Mientras la terminal esté abierta, el servicio funciona |

### 📝 Hacer que el servicio arranque automáticamente (opcional)

Para no tener que abrir la terminal cada vez:

```powershell
# Crear un archivo .bat en el escritorio
notepad C:\Users\EMMANUEL\Desktop\IniciarFingerprint.bat
```

Pega esto:
```bat
@echo off
cd /d C:\Users\EMMANUEL\Downloads\CaboFit\mini-services\fingerprint-service
dotnet run
pause
```

Guarda el archivo. Ahora solo das doble click en `IniciarFingerprint.bat` cada vez que enciendas la PC.

### ❌ ¿Pasa algo si NO hay lector conectado?

**No pasa nada.** El fingerprint service simplemte muestra "disconnected" y la web oculta los botones de huella. El resto de la app (clientes, membresías, accesos con código, WhatsApp, promociones) funciona al 100%.

---

## ❓ Preguntas Frecuentes

### 🤔 ¿La base de datos también va en el Droplet?

**✅ Sí, la base de datos SQLite se almacena dentro del Droplet**, específicamente en el volumen de Docker.

**¿Dónde está el archivo?**
Dentro del Droplet:
```
/root/CaboFit/db/custom.db  ← Este es el archivo de la base de datos
```

Dentro del contenedor Docker está mapeado a:
```
/app/db/custom.db  ← El contenedor lo ve así (es el mismo archivo)
```

**¿Cómo funciona?**
Cuando ejecutas `docker compose up -d`, el archivo `db/custom.db` de tu repositorio se monta dentro del contenedor. Todos los datos que guardes (clientes, membresías, accesos, etc.) se escriben directamente en ese archivo.

**¿Se pierde la base de datos si reinicio el contenedor?**
**NO.** Los datos persisten porque el volumen `./db:/app/db` mantiene el archivo en el disco del servidor. Puedes reiniciar, detener y volver a iniciar los contenedores sin perder nada.

**¿Se pierde la base de datos si elimino el contenedor?**
**NO.** Mientras no borres la carpeta `/root/CaboFit/db/`, los datos están seguros.

**¿Se pierde la base de datos si destruyo el Droplet?**
**SÍ.** Si eliminas el Droplet desde DigitalOcean, se borra todo el disco y la base de datos se pierde. Por eso es importante:
1. ✅ **Configurar backups automáticos** (explicado en la sección de Mantenimiento)
2. ✅ **Descargar backups manualmente** a tu PC de vez en cuando:
   ```bash
   # Desde tu computadora local (PowerShell)
   scp root@167.99.123.456:/root/CaboFit/db/custom.db C:\Users\EMMANUEL\Desktop\backup-fitgym.db
   ```
   (reemplaza la IP con la de tu Droplet)

**¿Puedo usar otra base de datos en lugar de SQLite?**
Sí, la app usa **Prisma ORM** que soporta PostgreSQL, MySQL, MariaDB y SQLite. Si prefieres una base de datos externa:
1. Crea una base de datos en DigitalOcean Managed Databases (PostgreSQL desde $15/mes)
2. Cambia `DATABASE_URL` en `.env` a la URL de tu base de datos externa
3. Ejecuta `docker compose exec app npx prisma db push`
4. ¡Listo!

Pero para empezar, SQLite es perfecto y no requiere configuración adicional.

---

### 🤔 ¿El lector de huellas (Fingerprint) funciona en el Droplet?

**❌ NO, el servicio de huellas digitales NO funciona en un Droplet de DigitalOcean** a menos que tenga un lector físico conectado.

**¿Por qué?**
El servicio `fingerprint-service` (FingerprintService) está diseñado para conectarse a un **lector de huellas digitales USB** (como el DigitalPersona 4500 o similares). En un servidor remoto en la nube no hay un lector USB conectado físicamente.

**¿Qué hacer si NO tengo lector de huellas?**
La app **funciona perfectamente sin el lector**. Puedes ignorar el fingerprint service. Cuando ejecutes `docker compose up -d`, por defecto el fingerprint NO se inicia porque está en un perfil separado. Solo se inicia si ejecutas:

```bash
docker compose --profile fingerprint up -d
```

**¿Qué alternativas tengo para el acceso sin huella?**
La app ya tiene estos métodos de acceso alternativos:
1. 📱 **Código de acceso** — Cada cliente tiene un código único para entrar
2. 👤 **Registro manual** — El recepcionista puede registrar la entrada manualmente
3. 📋 **Búsqueda por nombre** — Buscar al cliente y registrar su acceso

**¿Dónde SÍ funciona el lector de huellas?**
- **En una PC local con Windows** conectada al lector USB → Puedes ejecutar el fingerprint service en esa PC
- **En una Raspberry Pi o máquina física** conectada al lector → Funciona
- **En un servidor dedicado** donde puedas conectar hardware USB → Funciona

**¿En el Droplet puedo usar huella aunque no haya lector?**
Sí, el servicio fingerprint tiene un **modo simulación** que puedes activar para probar:
```env
Fingerprint__SimulationMode=true   ← Modo simulación (no necesita lector físico)
```

Pero en producción real, si no tienes lector, simplemente omite el fingerprint service. No afecta en nada al resto de la aplicación.

---

### 🤔 ¿Qué pasa si apago el Droplet? ¿Se pierde la base de datos?

**Si APAGAS el Droplet (desde DigitalOcean):**
- ❌ La página web deja de cargar
- ❌ WhatsApp se desconecta
- ✅ **La base de datos NO se pierde** (está en el disco)
- ✅ Puedes encenderlo de nuevo y todo vuelve a funcionar

**Si DESTRUYES el Droplet (lo eliminas):**
- ❌ Se borra TODO, incluida la base de datos
- ❌ Solo puedes recuperarte si tienes un backup

**Si solo reinicias el servidor:**
- ✅ Temporalmente deja de funcionar (1-2 minutos)
- ✅ Docker reinicia automáticamente todos los servicios
- ✅ No se pierde ningún dato

**Siempre ten un backup reciente**, especialmente antes de hacer cambios grandes.

---

## Mantenimiento Diario

### Ver estado de los servicios
```bash
ssh root@167.99.123.456
cd /root/CaboFit
docker compose ps
```

### Ver logs en tiempo real
```bash
docker compose logs -f app
docker compose logs -f caddy
```

### Actualizar la aplicación
```bash
# Conectarse al servidor
ssh root@167.99.123.456
cd /root/CaboFit

# Descargar cambios
git pull origin main

# Reconstruir y reiniciar
docker compose down
docker compose up -d --build
```

### Configurar Backups Automáticos
```bash
# Crear script de backup
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup de la base de datos
cp /root/CaboFit/db/custom.db "$BACKUP_DIR/custom_$DATE.db"
echo "Backup completado: custom_$DATE.db"
EOF

chmod +x /root/backup.sh

# Backup diario a las 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup.sh") | crontab -
```

---

## Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| ❌ **No puedo conectarme por SSH** | Firewall bloqueando | Verificar que el Droplet esté encendido en DigitalOcean |
| ❌ **Página no carga en el navegador** | DNS no propagado | Esperar 5-30 min, verificar con `ping tudominio.com` |
| ❌ **SSL no funciona (candado rojo)** | Dominio mal configurado | Revisar que el registro A apunte a la IP correcta |
| ❌ **Error "Port 3000 already in use"** | Otro proceso usando el puerto | `docker compose down && docker compose up -d` |
| ❌ **Error de conexión a base de datos** | Prisma no generado | `cd /root/CaboFit && docker compose exec app npx prisma generate` |
| ❌ **WhatsApp no se conecta** | Servicio no iniciado | `docker compose logs whatsapp` |
| ❌ **Error 502 Bad Gateway** | Caddy no conecta con app | `docker compose restart caddy app` |
| ❌ **No puedo hacer git push** | Token expirado | Generar nuevo token en GitHub Settings |

---

## Comandos Útiles

```bash
# Conectarse al servidor
ssh root@167.99.123.456

# Ver todos los servicios
docker compose ps

# Ver logs
docker compose logs -f app
docker compose logs -f caddy
docker compose logs -f whatsapp

# Reiniciar servicios
docker compose restart app
docker compose restart caddy

# Apagar todo
docker compose down

# Encender todo
docker compose up -d

# Reconstruir después de cambios
docker compose up -d --build

# Ver espacio usado
df -h

# Ver uso de RAM
free -h

# Ver CPU
top
```

---

## 📊 Costos Mensuales Estimados

| Servicio | Costo | Notas |
|----------|-------|-------|
| DigitalOcean Droplet (1GB RAM) | **$6 USD/mes** | Hosting principal |
| Dominio (.com) | **~$10 USD/año** (<$1/mes) | Namecheap o Cloudflare |
| **Total** | **~$7 USD/mes** | ✅ Muy económico |

---

## 🎯 Checklist Final

- [ ] Dominio comprado y configurado (DNS apuntando al servidor)
- [ ] Droplet creado en DigitalOcean con Docker
- [ ] Código subido a GitHub
- [ ] SSH funciona correctamente
- [ ] Docker y Docker Compose instalados
- [ ] Repositorio clonado en el servidor
- [ ] Variables de entorno configuradas (.env)
- [ ] `NEXTAUTH_SECRET` generado con openssl
- [ ] App corriendo con `docker compose up -d`
- [ ] Caddy configurado y SSL funcionando
- [ ] Página carga en `https://tugimnasio.com`
- [ ] Login funciona correctamente
- [ ] WhatsApp conectado (opcional)
- [ ] Prueba en PC, Tablet y Móvil
- [ ] PWA instalable desde el teléfono

---

## 🎉 ¡Felicidades!

Tu **FitGym Pro** ya está en línea y funcionando en DigitalOcean.

**URL de acceso:** `https://tugimnasio.com`

> 💡 **Tip:** Si quieres actualizar la app en el futuro, solo haz `git push` desde tu PC y luego en el servidor ejecuta los comandos de actualización (sección "Actualizar la aplicación" arriba).

---

## ❓ ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa la tabla de Solución de Problemas
2. Ejecuta `docker compose logs` para ver errores específicos
3. Verifica que el dominio esté apuntando a la IP correcta
4. Asegúrate de que los puertos 80 y 443 estén abiertos en el firewall