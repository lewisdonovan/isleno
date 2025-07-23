'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Cookies from 'js-cookie';

const SuccessBadge = ({ children }: { children: React.ReactNode }) => (
  <Badge className="bg-green-500 text-white hover:bg-green-600">
    {children}
  </Badge>
);

export function MondayLinkButton() {
  const t = useTranslations('MondayLink');
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mondayLinked = urlParams.get('mondayLinked');
    const error = urlParams.get('error');

    if (mondayLinked === 'true') {
      setIsLinked(true);
      toast.success(t('linkSuccessTitle'), {
        description: t('linkSuccessDescription'),
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast.error(t('linkErrorTitle'), {
        description: t('linkErrorDescription', { error }),
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check if token exists to determine initial linked state
    // This is a simple check. A more robust solution would be to verify the token with the backend.
    fetch('/api/monday/token')
      .then((res) => {
        if (res.ok) {
          setIsLinked(true);
        }
      })
      .catch(() => {
        // We can ignore this error, as it simply means the user is not linked.
      });
  }, [toast, t]);

  const handleLink = () => {
    const state = crypto.randomUUID();
    Cookies.set('monday_oauth_state', state, { expires: 1 }); // Expires in 1 day

    const clientId = process.env.NEXT_PUBLIC_MONDAY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_MONDAY_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
        console.error("Monday client ID or redirect URI is not configured.");
        toast.error(t('configErrorTitle'), {
            description: t('configErrorDescription'),
        });
        return;
    }

    const authUrl = `https://oauth.monday.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    window.location.href = authUrl;
  };

  return (
    <div className="flex items-center gap-4">
      <Button onClick={handleLink} disabled={isLinked}>
        {isLinked ? t('relinkButton') : t('linkButton')}
      </Button>
      {isLinked ? (
        <SuccessBadge>{t('linkedStatus')}</SuccessBadge>
      ) : (
        <Badge variant="secondary">{t('notLinkedStatus')}</Badge>
      )}
    </div>
  );
} 