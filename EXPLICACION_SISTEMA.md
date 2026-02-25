# Crew Zingy - Explicación General del Sistema

**1. ¿Qué es Crew Zingy?**
Es una plataforma digital de fidelización de clientes (Loyalty System). Está diseñada para que comercios (o el negocio dueño) puedan recompensar a sus clientes frecuentes otorgándoles "puntos" por sus compras o interacciones. Estos puntos pueden luego ser canjeados por premios o descuentos. El sistema está pensado para reemplazar las clásicas "tarjetas de sellos" de cartón por una experiencia completamente digital y automatizada mediante tarjetas físicas que contienen códigos QR únicos.

**2. ¿Cómo Funciona el Ciclo de Uso (User Journey)?**
El ciclo de vida del sistema, desde la perspectiva del cliente, es muy simple:
- **Adquisición:** El negocio le entrega al cliente una tarjeta física que contiene un código QR tras realizar una compra o asistir al local.
- **Registro/Ingreso (Fricción Cero):** El cliente escanea el QR con la cámara de su celular. Esto abre una aplicación web. Para entrar, el sistema le pide *únicamente* su número celular (no hay contraseñas). En segundos, recibe un código de 6 dígitos (OTP) por WhatsApp para validar su identidad de forma totalmente segura.
- **Acumulación de Puntos:** Una vez dentro del sistema, la plataforma lee el código QR que escaneó en la URL y automáticamente le suma los puntos correspondientes a su perfil. Inmediatamente, ese código de la tarjeta queda "quemado" o inutilizable para evitar fraudes.
- **Canje de Premios:** El cliente, al juntar los puntos necesarios, puede navegar por el catálogo digital de premios desde su celular. Si le alcanza el saldo, puede solicitar el canje allí mismo. Al hacerlo, la aplicación le genera un **Ticket Digital Único**.
- **Validación Final:** El cliente muestra ese Ticket Digital (o da su número de teléfono) en la caja del local. El cajero, desde su panel de administración, busca el ticket, lo aprueba, se le descuentan los puntos al cliente y se le hace entrega de su premio o descuento físico.

---

**3. Componentes y Módulos Principales**

El sistema está dividido en dos grandes "caras" u aplicaciones separadas, ambas conviviendo bajo el mismo techo.

**A. Aplicación para Clientes (PWA - Optimizada para celulares):**
Es la vista que usan los clientes finales. Funciona como una aplicación moderna, sin necesidad de descargar nada desde la App Store o Play Store.
- **Autenticación (Login/Registro):** Módulo de entrada usando el número celular + código de WhatsApp. En su primer ingreso, el cliente escoge un Nombre de Usuario y elige un Avatar (ícono de perfil).
- **Inicio / Dashboard:** Pantalla principal donde el cliente ve sus puntos actuales e historial reciente.
- **Escáner (Scan):** Módulo que permite ingresar códigos QR directamente en la app si el cliente no los escaneó con su cámara externa.
- **Premios (Rewards):** Un catálogo 100% digital donde el cliente visualiza todos los premios, descuentos, y la cantidad de puntos que le falta para obtenerlos.
- **Perfil (Profile):** Registro detallado de la historia del cliente (cuándo ganó puntos, cuándo reclamó premios) y gestión de su avatar.
- **Notificaciones In-App:** Un sistema interno de campanitas para alertar al cliente de nuevos premios, puntos a punto de expirar o mensajes del negocio.

**B. Panel de Administración (CRM - Usado por los dueños/cajeros):**
Es el "cerebro" de la operación. Solo tienen acceso personas autorizadas mediante una contraseña tradicional y un correo electrónico. Cuenta con los siguientes módulos de trabajo:
- **Dashboard:** Un panel de métricas general para ver al instante cómo le está yendo al programa de fidelización (usuarios nuevos, puntos generados, canjes pendientes).
- **Clientes (Clients) y Antifraude:** Un CRM en toda regla. Es un listado de todos los clientes registrados. Incluye información de contacto directo de WhatsApp. Además, funciona como el **Comprobador de Canjes**: el lugar donde el administrador digita el Ticket del cliente para constatar y auditar centralizadamente que el canje es legítimo y no ha sido cobrado doble.
- **Premios (Rewards):** El editor del catálogo de recompensas. Aquí se crean los premios, se suben sus imágenes, se les asigna un valor en puntos y se activan o pausan a voluntad.
- **Códigos (Codes):** El centro logístico. Aquí el administrador crea "lotes" masivos de códigos QR vírgenes. Literalmente le dice al sistema: "Гenérame 500 códigos nuevos que valgan 2 puntos cada uno". El sistema los crea en la base de datos y permite exportarlos para mandarlos a imprimir físicamente.
- **Reportes (Reports):** Analíticas más profundas y avanzadas.
- **Integraciones (Integrations / Webhooks):** Módulo de conexiones. Permite definir qué pasa cuando un cliente interactúa. Por ejemplo, se coordina para mandar "Webhooks" (mensajes internos) a plataformas como **n8n** cada vez que un cliente se registra para que el sistema le mande el WhatsApp automático. También permite integrar un chatbot de asistencia llamado **Typebot**.
- **Configuraciones (Settings):** Parámetros globales de la app y panel para las cuentas de administradores.

---

**4. Arquitectura Invisible (Lo que hace que todo sea seguro)**
- **Transacciones Estrictas (ACID):** Todas las operaciones que suben o bajan puntos actúan como transacciones bancarias. Si el internet se corta exactamente después de marcar un código como usado pero antes de sumarte el punto, la base de datos "revierte el tiempo" para que ni el negocio pierda el código ni el cliente pierda sus puntos, evitando por completo los fraudes por caídas de red o ataques simultáneos.
- **App de Carga Rápida y Fricción Cero:** A diferencia de las apps pesadas de grandes negocios, entrar aquí escaneando un QR es casi instantáneo, elevando inmensamente el porcentaje de personas dispuestas a registrarse.
- **Arquitectura Event-Driven (Orientada a Eventos):** Cuando el cliente realiza una acción grave o importante, la plataforma entera "grita un suceso". Por lo tanto, si en el futuro se quiere conectar otra plataforma que le dé un regalo de cumpleaños por correo al cliente, el sistema ya está preparado para enviarle la notificación sin rehacer toda la programación.
