# Instrucciones de Configuración y Despliegue — Crew Zingy

Este documento detalla cómo levantar el entorno local, configurar las variables de entorno, y desplegar en producción de forma segura.

---

## Requisitos Previos

- Node.js 20+
- Docker y Docker Compose
- npm

---

## 🔐 Seguridad: Variables de Entorno

**¡Nunca subas tu `.env` a GitHub!** El `.gitignore` ya lo excluye.

Copia el archivo de ejemplo y rellena tus datos:

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

### Base de Datos (MySQL)

```env
MYSQL_ROOT_PASSWORD=TuPasswordRootSegura!
MYSQL_DATABASE=crew_zingy_db
MYSQL_USER=crew_zingy_app
MYSQL_PASSWORD=TuPasswordApp123!
MYSQL_PORT=3307
DATABASE_URL=mysql://crew_zingy_app:TuPasswordApp123!@mysql:3306/crew_zingy_db
```

> **Nota:** En producción Docker, `DATABASE_URL` apunta a `mysql:3306` (nombre del servicio interno), NO a `localhost`.

---

## 💻 Desarrollo Local (sin Docker para Next.js)

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar solo la BD
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

## 🚀 Producción en Docker (VPS/Hostinger)

El `docker-compose.yml` levanta **3 servicios en un solo comando**:
1. `crew-zingy-mysql` — Base de datos MySQL
2. `crew-zingy-app` — App Next.js (con migración + seed automáticos al arrancar)
3. `crew-zingy-adminer` — Panel visual de BD (opcional, se puede comentar en prod)

### Pasos

```bash
# 1. Sube el código al VPS (o clona desde git)
git clone https://github.com/tu-usuario/crew-zingy.git
cd crew-zingy

# 2. Configura las variables de entorno
cp .env.example .env
nano .env    # Rellena con datos REALES de producción

# 3. Lanzar todo el stack
docker compose up -d --build
```

El contenedor **automáticamente**:
1. Espera a que MySQL esté listo
2. Sincroniza el esquema con `drizzle-kit push`
3. Crea el admin inicial (si no existe)
4. Arranca el servidor Next.js

### Proxy Inverso

Apunta tu dominio al puerto `APP_PORT` (por defecto `3001`):

```nginx
server {
    listen 80;
    server_name tudominio.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Comandos Útiles

```bash
# Ver logs en tiempo real de la app
docker compose logs -f crew-zingy-app

# Reiniciar solo la app (sin reconstruir)
docker compose restart crew-zingy-app

# Parar todo
docker compose down

# Parar y eliminar la BD (cuidado: borra datos)
docker compose down -v
```
