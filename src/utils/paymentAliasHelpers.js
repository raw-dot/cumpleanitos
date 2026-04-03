/**
 * Helpers para trabajar con payment_alias que puede ser:
 * - Un string simple: "alias.mp"
 * - Un JSON con configuración visual: {"cx":50,"cy":50,...,"_alias":"alias.mp"}
 */

/**
 * Extrae el alias real del campo payment_alias
 * @param {string} paymentAlias - El valor crudo de payment_alias
 * @returns {string} - El alias limpio para mostrar
 */
export function getRealAlias(paymentAlias) {
  try {
    if (!paymentAlias) return "";
    // Si empieza con "{", es un JSON con config visual
    if (paymentAlias.startsWith("{")) {
      const parsed = JSON.parse(paymentAlias);
      return parsed._alias || "";
    }
    // Si no, es un alias directo
    return paymentAlias;
  } catch {
    // Si falla el parse, devolver el original
    return paymentAlias || "";
  }
}

/**
 * Parsea la configuración visual del payment_alias
 * @param {string} paymentAlias - El valor crudo de payment_alias
 * @returns {object} - Objeto con cx, cy, cs, ax, ay, as, coverGrad, _alias
 */
export function parseVisualConfig(paymentAlias) {
  try {
    if (!paymentAlias) return {};
    if (paymentAlias.startsWith("{")) {
      return JSON.parse(paymentAlias);
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Serializa la configuración visual + alias en un string JSON
 * @param {string} alias - El alias real (ej: "alias.mp")
 * @param {object} visual - Objeto con cx, cy, cs, ax, ay, as, coverGrad
 * @returns {string} - JSON string con toda la config
 */
export function serializeVisualConfig(alias, visual) {
  const orig = (alias && !alias.startsWith("{")) ? alias : null;
  return JSON.stringify({ ...visual, _alias: orig });
}
