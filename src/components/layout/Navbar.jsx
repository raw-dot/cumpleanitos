import { useState } from "react";
import { COLORS } from "../../utils/constants";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import UserMenuDropdown from "../roles/UserMenuDropdown";
import { getInitials } from "../../utils/formatters";

/**
 * Navbar refactorizado con dropdown al clickear avatar
 */
function Navbar({
  currentPage,
  setCurrentPage,
  setSelectedUser,
  session,
  profile,
  currentRole,
  onLogout,
  onRoleSwitch,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setShowUserMenu(false);
  };

  const handleLogoClick = () => {
    setCurrentPage("home");
    setSelectedUser(null);
    setShowUserMenu(false);
  };

  // Logo component
  const Logo = () => (
    <div
      onClick={handleLogoClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        🎂
      </div>
      <span
        style={{
          fontSize: 19.6,
          fontWeight: 700,
          color: COLORS.text,
          letterSpacing: -0.5,
        }}
      >
        cumpleanitos
      </span>
    </div>
  );

  return (
    <nav
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "12px 0",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo a la izquierda */}
        <Logo />

        {/* Botones y Avatar a la derecha */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            variant={currentPage === "explore" ? "primary" : "ghost"}
            size="sm"
            onClick={() => handleNavigate("explore")}
          >
            Explorar
          </Button>

          {session ? (
            <>
              <Button
                variant={currentPage === "dashboard" ? "accent" : "ghost"}
                size="sm"
                onClick={() => handleNavigate("dashboard")}
              >
                Mi cuenta
              </Button>

              {/* Avatar clickeable con dropdown */}
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    cursor: "pointer",
                    borderRadius: "50%",
                    padding: 4,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar
                    initials={profile ? getInitials(profile.name) : "?"}
                    size={32}
                    src={profile?.avatar_url}
                  />
                </div>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <UserMenuDropdown
                    profile={profile}
                    currentRole={currentRole}
                    onProfileClick={() => handleNavigate("myprofile")}
                    onFriendsClick={() => handleNavigate("friends")}
                    onSettingsClick={() => handleNavigate("settings")}
                    onRoleSwitch={(newRole) => {
                      if (onRoleSwitch) {
                        onRoleSwitch(newRole);
                      }
                    }}
                    onLogout={() => {
                      setShowUserMenu(false);
                      if (onLogout) {
                        onLogout();
                      }
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigate("login")}
              >
                Iniciar sesión
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={() => handleNavigate("register")}
              >
                Registrarse
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
