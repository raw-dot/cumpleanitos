import React, { useState } from 'react';
import { ChevronDown, Gift, Share2, Settings } from 'lucide-react';
import { C } from '../theme';

export default function MenuMiCumple({ activeTab, onNavigate, isMobile }) {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { id: 'misregalos', label: '🎁 Mis regalos', icon: Gift },
    { id: 'gestionar', label: '📋 Gestionar', icon: Settings },
    { id: 'compartir', label: '🔗 Compartir', icon: Share2 },
  ];

  const currentItem = items.find(it => it.id === activeTab) || items[0];

  const handleSelect = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  if (isMobile) {
    // En mobile, tabs simples
    return (
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {items.map(it => (
          <button
            key={it.id}
            onClick={() => handleSelect(it.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              background: activeTab === it.id ? C.ink : 'white',
              color: activeTab === it.id ? 'white' : C.ink,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeTab === it.id ? `2px solid ${C.ink}` : `1px solid ${C.border}`,
              whiteSpace: 'nowrap',
            }}
          >
            {it.label.split(' ')[0]} {it.label.split(' ')[1]}
          </button>
        ))}
      </div>
    );
  }

  // En desktop, dropdown
  return (
    <div style={{ marginBottom: 24, position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: 'white',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          color: C.ink,
        }}
      >
        {currentItem.label}
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'white',
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            minWidth: 200,
          }}
        >
          {items.map(it => (
            <button
              key={it.id}
              onClick={() => handleSelect(it.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: activeTab === it.id ? C.primaryLight : 'transparent',
                color: activeTab === it.id ? C.primary : C.ink,
                fontSize: 14,
                fontWeight: activeTab === it.id ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
