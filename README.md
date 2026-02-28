# Crew Zingy — Plataforma de Fidelización Digital

**Crew Zingy** es una plataforma de loyalty digital para comercios. Reemplaza las tarjetas de sellos físicas por una experiencia completamente digital basada en códigos QR, WhatsApp y puntos.

## 🗂️ Stack Tecnológico

| Componente   | Tecnología                                 |
|---|---|
| Framework    | Next.js 16 (App Router + React 19)         |
| Base de Datos| PostgreSQL (vía Drizzle ORM)                  |
| Auth Admin   | NextAuth v5                                |
| Auth Cliente | JWT firmado (jose)                         |
| UI           | shadcn/ui + Tailwind v4                    |
| Push Notifs  | Web Push API (VAPID)                       |
| Webhooks     | HTTP POST hacia n8n u otros               |
| Despliegue   | Dockerfile + **Dokploy**                   |

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

# 4. Levantar base de datos local
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

## 🚀 Producción Centralizada (VPS Dokploy)

Crew Zingy está altamente optimizado para ser desplegado en plataformas PaaS auto-alojadas como **Dokploy**. 

El repositorio contiene un `Dockerfile` *multi-stage* robusto, equipado con un `start.sh` que se encarga automáticamente de sincronizar tu base de datos y crear el usuario de inicialización sin esfuerzo manual por consola CLI.

### Resumen Rápido (Ver `INSTRUCCIONES.md` para detalles)
1. **Instancia un PostgreSQL** en tu panel de Dokploy.
2. **Crea una nueva App** conectando a este Repositorio GitHub. Modo de construcción `Dockerfile`.
3. **Agrega las Variables de Entorno** (Asegurándote que el `DATABASE_URL` apunte al "Internal Host" que Dokploy generó para PostgreSQL).
4. Dale al botón de **Deploy**. Dokploy configurará SSL mediante Traefik automáticamente.

---

## 🔐 Variables de Entorno

Ver [`INSTRUCCIONES.md`](./INSTRUCCIONES.md) para la guía completa.

### Variables críticas:
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
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