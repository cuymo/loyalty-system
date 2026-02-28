/**
 * Toast stub — no-op para mantener compatibilidad sin librería de toasts.
 * Todas las llamadas a toast.success(), toast.error(), etc. se ignoran silenciosamente.
 */

const noop = (..._args: any[]) => { };

export const toast = Object.assign(noop, {
    success: noop,
    error: noop,
    info: noop,
    warning: noop,
    loading: noop,
    promise: noop,
    dismiss: noop,
    message: noop,
    custom: noop,
});
