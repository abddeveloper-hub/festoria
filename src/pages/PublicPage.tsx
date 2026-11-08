import React, { useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { FestoriaHomePage } from './public/FestoriaHomePage';
import { PublicFestPage } from './public/PublicFestPage';
import { InvitationAcceptPage } from './public/InvitationAcceptPage';

export const PublicPage: React.FC = () => {
  const { activeFestId, fests } = useFest();

  // Detect if route is for Invitation acceptance: e.g. /invite, ?token=..., or ?invite=...
  const isInviteRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    return pathname.includes('/invite') || search.has('token') || search.has('invite');
  }, []);

  // Detect if route is pointing to a specific individual fest: e.g. /f/:festId, ?fest=:festId, or #/f/:festId
  const targetedFestId = useMemo(() => {
    if (typeof window === 'undefined') return null;

    const pathname = window.location.pathname;
    if (pathname.includes('/f/')) {
      const parts = pathname.split('/f/');
      if (parts[1]) {
        const id = parts[1].split('/')[0].split('?')[0].split('#')[0];
        if (id) return id;
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const queryFest = searchParams.get('fest') || searchParams.get('festId');
    if (queryFest) return queryFest;

    const hash = window.location.hash;
    if (hash.includes('/f/')) {
      const hashParts = hash.split('/f/');
      if (hashParts[1]) {
        const id = hashParts[1].split('/')[0].split('?')[0];
        if (id) return id;
      }
    }

    return null;
  }, []);

  // If an invitation token is accessed, render the secure token validation and claim page
  if (isInviteRoute) {
    return <InvitationAcceptPage />;
  }

  // If a specific fest is targeted (/f/{festId}), render that fest's public page with admin-managed media
  if (targetedFestId) {
    return <PublicFestPage festId={targetedFestId} />;
  }

  // Otherwise, render the Central Festoria Homepage (STRICTLY NO PHOTOS, NO VIDEOS, pure modern typography and vector styling)
  return <FestoriaHomePage />;
};
