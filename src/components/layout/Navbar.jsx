import { useState } from 'react';
import Avatar from '../ui/Avatar';
import UserMenuDropdown from './UserMenuDropdown';
import { COLORS } from '../../utils/constants';

export default function Navbar({
  currentPage,
  setCurrentPage,
  session,
  profile,
  onLogout,
  onRoleSwitch,
  currentRole
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .user-name-desktop {
            display: inline !important;
          }
        }
      `}</style>
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: '#fff',
        borderBottom: '1px solid #e0e0e0'
      }}>
      <div 
        onClick={() => setCurrentPage('home')}
        style={{ cursor: 'pointer', fontSize: 20 }}
      >
        🎂 <strong>cumpleanitos</strong>
      </div>
      
      {session && profile && (
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              cursor: 'pointer',
              padding: '6px 12px 6px 6px',
              borderRadius: 50,
              transition: 'background 0.2s',
              background: showDropdown ? COLORS.bg : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!showDropdown) e.currentTarget.style.background = COLORS.bg;
            }}
            onMouseLeave={(e) => {
              if (!showDropdown) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Avatar
              initials={profile.user_metadata?.name?.[0] || 'U'}
            />
            <span style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: COLORS.text,
              display: 'none'
            }}
            className="user-name-desktop">
              {(profile.name || profile.user_metadata?.name || 'Usuario').split(' ')[0]}
            </span>
          </div>
          {showDropdown && (
            <UserMenuDropdown
              profile={profile}
              currentRole={currentRole}
              onLogout={onLogout}
              onRoleSwitch={onRoleSwitch}
              onClose={() => setShowDropdown(false)}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      )}
    </nav>
    </>
  );
}
