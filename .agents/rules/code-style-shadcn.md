---
trigger: always_on
---

Reglas Strictas de UI (Crew Zingy):

Componentes: Tienes acceso al MCP de shadcn. ÚSALO SIEMPRE para descubrir e instalar componentes antes de intentar escribirlos desde cero.

Estilos: Tailwind v4. PROHIBIDO usar colores quemados (bg-red-500). Usa SIEMPRE variables CSS semánticas (ej. bg-destructive, text-success, bg-warning/10).

Modales: TODO flujo interactivo móvil usa <Drawer />. El estado de apertura/cierre de los Drawers y Dialogs se maneja EXCLUSIVAMENTE mediante Zustand (src/lib/modal-store.ts). Prohibido usar useState local para esto.

Íconos: Usa Lucide React pasando el tamaño por prop estricta (ej. <Icon name="X" size={20} />), NUNCA mediante clases de Tailwind (w-5 h-5).

Asegúrate de ejecutar las herramientas del MCP dentro del directorio raíz de este proyecto.