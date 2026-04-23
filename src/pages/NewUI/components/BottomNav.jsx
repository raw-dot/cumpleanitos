import React from 'react';
import { Home, Users, Cake, Calendar, Gift } from 'lucide-react';
import { C } from '../theme';

export default function BottomNav({ active, onChange }) {
  const items = [
    { id: 'inicio', icon: Home, label: 'Inicio' },
    { id: 'amigos', icon: Users, label: 'Amigos' },
    { id: 'micumple', icon: Cake, label: 'Mi cumple' },
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'organizador', icon: Gift, label: 'Organizador' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: `1px solid ${C.borderSoft}`,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 4px 22px', zIndex: 11,
    }}>
      {items.map(it => {
        const isActive = active === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id} onClick={() => onChange(it.id)}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 2px', flex: 1,
              color: isActive ? C.primary : C.inkMuted,
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
