import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { IconArrowRight } from './Icons';

export default function AnnouncementBar() {
  const { settings } = useStore();

  const announcementText = (settings?.announcement || '').trim();
  if (!announcementText) {
    return null;
  }

  return (
    <div className="announcement-bar">
      <div className="container announcement-content">
        <span>
          <span className="announcement-badge">NEW</span>{' '}
          {announcementText}{' '}
          <Link to="/education" className="announcement-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <span>Explore School Solutions</span>
            <IconArrowRight size={13} />
          </Link>
        </span>
      </div>
    </div>
  );
}
