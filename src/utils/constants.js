/**
 * Constantes globales de la aplicación
 */

export const COLORS = {
  primary: "#7C3AED",
  primaryLight: "#F3EEFF",
  primaryDark: "#6D28D9",
  accent: "#F59E0B",
  accentLight: "#FEF3C7",
  ink: "#1a1a2e",
  inkSoft: "#4B5563",
  inkMuted: "#9CA3AF",
  bg: "#FAFAFA",
  borderSoft: "#F3F4F6",
  card: "#FFFFFF",
  text: "#1F2937",
  textLight: "#6B7280",
  border: "#EAEAEA",
  borderLight: "#E5E7EB",
  success: "#10B981",
  successLight: "#D1FAE5",
  danger: "#EF4444",
  error: "#EF4444",
};

export const GIFT_AMOUNTS = [500, 1000, 2000, 5000];

export const ROLES = {
  BIRTHDAY_PERSON: "birthday_person",
  GIFT_MANAGER: "gift_manager",
};

export const PAYMENT_METHODS = [
  { id: "mercadopago", label: "Mercado Pago", icon: "💳", placeholder: "alias@mercadopago" },
  { id: "bank", label: "Transferencia Bancaria", icon: "🏦", placeholder: "CBU o Alias" },
  { id: "wallet", label: "Billetera Digital", icon: "📱", placeholder: "Usuario o número" },
  { id: "other", label: "Otro", icon: "💰", placeholder: "Especifica el método" },
];

export const PROFILE_COMPLETION_ITEMS = [
  { key: "bio", label: "Bio/Descripción", icon: "📝" },
  { key: "avatar", label: "Foto de Perfil", icon: "📸" },
  { key: "payment_alias", label: "Alias de Pago", icon: "💳" },
  { key: "wishlist", label: "Lista de Deseos", icon: "🎁" },
  { key: "shared_link", label: "Link Compartible", icon: "🔗" },
];

export const ALERT_TYPES = {
  ERROR: "error",
  SUCCESS: "success",
  WARNING: "warning",
  INFO: "info",
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
