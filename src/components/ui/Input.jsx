import { COLORS } from "../../utils/constants";

/**
 * Componente Input reutilizable
 */
function Input({
  placeholder,
  value,
  onChange,
  type = "text",
  style = {},
  showPassword,
  togglePassword,
  disabled = false,
  ...props
}) {
  const isPassword = type === "password";

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type={isPassword && showPassword ? "text" : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "12px 16px",
          paddingRight: isPassword ? 48 : 16,
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          fontSize: 15,
          outline: "none",
          transition: "border 0.2s",
          boxSizing: "border-box",
          background: COLORS.bg,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
          ...style,
        }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
        {...props}
      />
      {isPassword && (
        <button
          onClick={togglePassword}
          type="button"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: COLORS.textLight,
            fontSize: 20,
            padding: 4,
          }}
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      )}
    </div>
  );
}

export default Input;
