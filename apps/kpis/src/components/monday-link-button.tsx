'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import Cookies from 'js-cookie';
import { OAuthService } from '@/lib/services/oauthService';

const SuccessBadge = ({ children }: { children: React.ReactNode }) => (
  <Badge className="bg-green-500 text-white hover:bg-green-600">
    {children}
  </Badge>
);

export function MondayLinkButton() {
  const t = useTranslations('MondayLink');
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const result = OAuthService.processOAuthCallback();
      
      if (result?.success) {
        setIsLinked(true);
        toast.success(t('linkSuccessTitle'), {
          description: t('linkSuccessDescription'),
        });
        OAuthService.cleanupUrl();
      } else if (result?.error) {
        toast.error(t('linkErrorTitle'), {
          description: t('linkErrorDescription', { error: result.message || 'Unknown error' }),
        });
        OAuthService.cleanupUrl();
      }

      // Check if token exists to determine initial linked state
      const hasToken = await OAuthService.checkMondayToken();
      setIsLinked(hasToken);
    };

    handleOAuthCallback();
  }, [t]);

  const handleLink = () => {
    try {
      OAuthService.initiateOAuthFlow();
    } catch {
      console.error("Monday client ID or redirect URI is not configured.");
      toast.error(t('configErrorTitle'), {
        description: t('configErrorDescription'),
      });
    }
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