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
          <Avatar
            initials={profile.user_metadata?.name?.[0] || 'U'}
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: 'pointer' }}
          />
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
  );
}
