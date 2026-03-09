import { COLORS, ROLES } from '../../utils/constants';

export default function UserMenuDropdown({
  profile,
  currentRole,
  onLogout,
  onRoleSwitch,
  onClose,
  setCurrentPage
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      padding: '12px',
      minWidth: '200px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000
    }}>
      <div style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${COLORS.border}` }}>
        <strong>{profile?.user_metadata?.name || 'Usuario'}</strong>
        <div style={{ fontSize: '12px', color: '#999' }}>
          @{profile?.user_metadata?.username || 'username'}
        </div>
      </div>

      <button 
        onClick={() => { setCurrentPage('myprofile'); onClose(); }}
        style={{ width: '100%', textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '4px' }}
      >
        📱 Mi perfil
      </button>

      {currentRole === ROLES.GIFT_MANAGER && (
        <button 
          onClick={() => { setCurrentPage('friends'); onClose(); }}
          style={{ width: '100%', textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '4px' }}
        >
          👥 Mis amigos
        </button>
      )}

      <button 
        onClick={() => { setCurrentPage('settings'); onClose(); }}
        style={{ width: '100%', textAlign: 'left', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '8px' }}
      >
        ⚙️ Configuración
      </button>

      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>Rol:</div>
        <label style={{ display: 'block', marginBottom: '4px' }}>
          <input 
            type="radio" 
            checked={currentRole === ROLES.BIRTHDAY_PERSON}
            onChange={() => onRoleSwitch(ROLES.BIRTHDAY_PERSON)}
          />
          {' '}Cumpleañero
        </label>
        <label>
          <input 
            type="radio" 
            checked={currentRole === ROLES.GIFT_MANAGER}
            onChange={() => onRoleSwitch(ROLES.GIFT_MANAGER)}
          />
          {' '}Gestor de regalos
        </label>
      </div>

      <button 
        onClick={() => { onLogout(); onClose(); }}
        style={{ width: '100%', padding: '8px', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        🚪 Logout
      </button>
    </div>
  );
}
