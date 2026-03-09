import { COLORS } from "../../utils/constants";

/**
 * Componente Textarea para input de texto largo
 */
function Textarea({
  placeholder,
  value,
  onChange,
  rows = 3,
  style = {},
  disabled = false,
  ...props
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        fontSize: 15,
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
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
  );
}

export default Textarea;
