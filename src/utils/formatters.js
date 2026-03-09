/**
 * Funciones de formato y transformación de datos
 */

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales en mayúsculas (máximo 2 caracteres)
 */
export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formatea un nombre de usuario (username)
 * @param {string} username - Nombre de usuario
 * @returns {string} Usuario formateado (minúsculas, sin caracteres especiales)
 */
export function formatUsername(username) {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Formatea un número de teléfono básicamente
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono con formato (solo dígitos)
 */
export function formatPhone(phone) {
  return phone.replace(/\D/g, "");
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un teléfono (mínimo 10 dígitos)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si el teléfono es válido
 */
export function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

/**
 * Capitaliza la primera letra de una string
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Trunca un string con elipsis
 * @param {string} str - String a truncar
 * @param {number} length - Longitud máxima
 * @returns {string} String truncado
 */
export function truncate(str, length = 50) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Formatea un número de moneda
 * @param {number} amount - Cantidad
 * @param {string} currency - Símbolo de moneda (default $)
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount, currency = "$") {
  if (!amount) return currency + "0";
  return currency + amount.toLocaleString("es-AR");
}

/**
 * Convierte un objeto a query string
 * @param {object} obj - Objeto con parámetros
 * @returns {string} Query string (sin el ?)
 */
export function objectToQueryString(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

/**
 * Convierte un query string a objeto
 * @param {string} queryString - Query string (sin el ?)
 * @returns {object} Objeto con parámetros
 */
export function queryStringToObject(queryString) {
  const obj = {};
  queryString.split("&").forEach(pair => {
    const [key, value] = pair.split("=");
    obj[decodeURIComponent(key)] = decodeURIComponent(value);
  });
  return obj;
}
