# Crew Zingy — Plataforma de Fidelización Digital

**Crew Zingy** es una plataforma de loyalty digital para comercios. Reemplaza las tarjetas de sellos físicas por una experiencia completamente digital basada en códigos QR, WhatsApp y puntos.

## 🗂️ Stack Tecnológico

| Componente   | Tecnología                                 |
|---|---|
| Framework    | Next.js 16 (App Router + React 19)         |
| Base de Datos| MySQL 8 (vía Drizzle ORM)                  |
| Auth Admin   | NextAuth v5                                |
| Auth Cliente | JWT firmado (jose)                         |
| UI           | shadcn/ui + Tailwind v4                    |
| Push Notifs  | Web Push API (VAPID)                       |
| Webhooks     | HTTP POST hacia n8n u otros               |
| Despliegue   | Docker + Docker Compose                    |

---

## ⚡ Inicio Rápido (Desarrollo Local)

```bash
# 1. Clonar el repo
git clone https://github.com/tu-usuario/crew-zingy.git
cd crew-zingy

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus datos reales

# 3. Instalar dependencias
npm install

# 4. Levantar base de datos
docker compose -f docker-compose.db.yml up -d

# 5. Sincronizar esquema
npm run db:push

# 6. Crear admin inicial
npm run db:seed

# 7. Iniciar app
npm run dev
```

Accede a:
- **App:** http://localhost:3000
- **Adminer (BD):** http://localhost:8081

---

## 🚀 Producción en Docker (VPS)

```bash
# 1. Configura .env con tus datos de producción
cp .env.example .env
nano .env

# 2. Levantar todo el stack (MySQL + App + Adminer)
docker compose up -d --build
```

El contenedor de la app automáticamente:
1. Sincroniza el esquema de BD con `drizzle-kit push`
2. Crea el admin inicial con `seed.ts`
3. Arranca Next.js en el puerto 3000 (mapeado al `APP_PORT` en `.env`)

Configura tu Nginx / Traefik apuntando a `http://localhost:$APP_PORT`.

---

## 🔐 Variables de Entorno

Ver [`INSTRUCCIONES.md`](./INSTRUCCIONES.md) para la guía completa.

### Variables críticas:
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a MySQL |
| `NEXTAUTH_SECRET` | Clave para cookies de sesión admin |
| `CLIENT_JWT_SECRET` | Clave para tokens JWT de clientes |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clave pública VAPID (push notifications) |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (push notifications) |
| `INITIAL_ADMIN_EMAIL` | Email del admin (solo primer arranque) |
| `INITIAL_ADMIN_PASSWORD` | Password del admin (solo primer arranque) |

---

## 📋 Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run start      # Servidor de producción (post-build)
npm run lint       # Linter ESLint
npm run db:push    # Sincronizar esquema Drizzle con BD
npm run db:seed    # Crear admin inicial
```