# Instrucciones de Configuración y Despliegue — Crew Zingy

Este documento detalla cómo levantar el entorno local, configurar las variables de entorno, y desplegar en producción de forma segura utilizando Dokploy.

---

## Requisitos Previos

- Node.js 20+
- Docker y Docker Compose (Para BD Local)
- npm

---

## 🔐 Seguridad: Variables de Entorno

**¡Nunca subas tu `.env` a GitHub!** El `.gitignore` ya lo excluye.

Copia el archivo de ejemplo y rellena tus datos para desarrollo local:

```bash
cp .env.example .env
```

### Variables Críticas

| Variable | Descripción | Cómo Generar |
|---|---|---|
| `NEXTAUTH_SECRET` | Cookie de sesión admin | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLIENT_JWT_SECRET` | Token JWT de clientes PWA | Mismo comando |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notifications (pública) | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Push notifications (privada) | Incluida al generar VAPID keys |
| `INITIAL_ADMIN_EMAIL` | Email del admin para seed inicial | Tu email del negocio |
| `INITIAL_ADMIN_PASSWORD` | Contraseña inicial del admin | Mínimo 8 chars + número |

### Base de Datos (MySQL Local)

```env
MYSQL_ROOT_PASSWORD=TuPasswordRootSegura!
MYSQL_DATABASE=crew_zingy_db
MYSQL_USER=crew_zingy_app
MYSQL_PASSWORD=TuPasswordApp123!
MYSQL_PORT=3307
DATABASE_URL=mysql://crew_zingy_app:TuPasswordApp123!@localhost:3307/crew_zingy_db
```

---

## 💻 Desarrollo Local (sin Docker para Next.js)

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar solo la BD local
docker compose -f docker-compose.db.yml up -d

# 3. Sincronizar esquema
npm run db:push

# 4. Crear admin inicial (solo primera vez)
npm run db:seed

# 5. Iniciar la app
npm run dev
```

- App: http://localhost:3000
- Adminer (gestor BD): http://localhost:8081

---

## 🚀 Producción Simplificada con Dokploy

Olvídate de comandos por terminal en el VPS y de archivos `docker-compose.yml`. Todo se gestiona visualmente a través del panel de Dokploy.

### 1. Base de Datos
1. En Dokploy, crea una base de datos **MySQL**.
2. Anota el nombre del *Internal Host* (ej. `databases-localmysqldb-89ffp2`), el usuario, la contraseña y el nombre de la BD.

### 2. Creación de la Aplicación
1. En Dokploy, crea un servicio tipo **Application**.
2. Vincula tu repositorio de GitHub (ej. `cuymo/cuymo-loyalty-system`).
3. En la sección **Build Type**, selecciona **Dockerfile**.

### 3. Variables de Entorno (¡CRÍTICO!)
Ve a la pestaña **Environment** de tu aplicación en Dokploy y agrega TODAS las variables críticas.

**Ajustes específicos para Dokploy:**
- `DATABASE_URL`: Debe apuntar al *Internal Host* de la BD que creaste en el paso 1.
  *Ejemplo:* `mysql://tu_usuario:tu_pass@databases-localmysqldb-89ffp2:3306/tu_bd`
- `APP_PORT`: Ponlo explícitamente en `3001` (o el puerto interno que expone tu Dockerfile, Next.js por defecto usa el `3000` internamente, pero el `APP_PORT` expuesto puede variar si se lo configuras a Traefik. En este `Dockerfile` se expone internamente el 3000. Asi que define `APP_PORT=3000` si sobreescribes puertos de entrada, o simplemente no lo pongas y ajusta el puerto en la pestaña 'Ports' de Dokploy apuntando al contenedor local `3000`).
- No te olvides de: `NEXTAUTH_SECRET`, `CLIENT_JWT_SECRET`, las variables `VAPID`, y el `INITIAL_ADMIN*`.

### 4. Despliegue Automático y SSL
1. Guarda la configuración y haz clic en **Deploy**.
2. En la pestaña **Domains**, añade tu dominio real (ej. `club.tudominio.com`).
3. Dokploy, gracias a Traefik, asignará automáticamente el certificado **SSL (HTTPS)**.
4. Listo. El contenedor `Dockerfile` ejecutará automáticamente las migraciones (`drizzle-kit push`) y la semilla (`seed.ts`) cada vez que se levante.
