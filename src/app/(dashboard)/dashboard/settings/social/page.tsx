'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Users,
  Image as ImageIcon
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { toast } from '@/stores/toast.store';
import {
  SocialMediaAccount,
  getConnectedAccounts,
  getInstagramOAuthUrl,
  connectInstagramAccount,
  disconnectAccount,
  refreshAccountToken,
  getPlatformInfo,
} from '@/services/social-media.service';

export default function SocialMediaSettingsPage() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Failed to connect Instagram: ' + (searchParams.get('error_description') || error));
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code) {
      handleOAuthCallback(code);
    }
  }, [searchParams]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await getConnectedAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard/settings/social`;
      const account = await connectInstagramAccount({ code, redirectUri });
      toast.success(`Instagram account @${account.accountUsername} connected!`);
      await loadAccounts();
      window.history.replaceState({}, '', window.location.pathname);
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect Instagram account');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      const redirectUri = `${window.location.origin}/dashboard/settings/social`;
      const oauthUrl = await getInstagramOAuthUrl(redirectUri);
      window.location.href = oauthUrl;
    } catch (error) {
      toast.error('Failed to start Instagram connection');
    }
  };

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    try {
      await disconnectAccount(accountId);
      toast.success('Account disconnected');
      await loadAccounts();
    } catch (error) {
      toast.error('Failed to disconnect account');
    }
  };

  const handleRefreshToken = async (accountId: number) => {
    try {
      await refreshAccountToken(accountId);
      toast.success('Token refreshed');
      await loadAccounts();
    } catch (error) {
      toast.error('Failed to refresh token');
    }
  };

  const getStatusBadge = (account: SocialMediaAccount) => {
    if (account.status === 'ACTIVE' && account.tokenValid) {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</Badge>;
    }
    if (account.status === 'TOKEN_EXPIRED' || !account.tokenValid) {
      return <Badge variant="warning" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Token Expired</Badge>;
    }
    if (account.status === 'DISCONNECTED') {
      return <Badge variant="secondary">Disconnected</Badge>;
    }
    return <Badge variant="danger" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</Badge>;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-6 h-6" style={{ color: '#E4405F' }} />;
      case 'FACEBOOK':
        return <Facebook className="w-6 h-6" style={{ color: '#1877F2' }} />;
      case 'TWITTER':
        return <Twitter className="w-6 h-6" style={{ color: '#1DA1F2' }} />;
      case 'LINKEDIN':
        return <Linkedin className="w-6 h-6" style={{ color: '#0A66C2' }} />;
      default:
        return null;
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-green-600" />
          <p className="text-gray-600 dark:text-gray-400">Connecting Instagram account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Social Media
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your social media accounts to publish content directly from your CMS.
          </p>
        </div>
      </div>

      {/* Connect New Account */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connect Account
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Instagram */}
          <button
            onClick={handleConnectInstagram}
            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Instagram</p>
              <p className="text-sm text-gray-500">Business Account</p>
            </div>
            <Plus className="w-5 h-5 text-gray-400 ml-auto" />
          </button>

          {/* Facebook - Coming Soon */}
          <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <Facebook className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">Facebook</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
          </div>

          {/* Twitter - Coming Soon */}
          <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
              <Twitter className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">X (Twitter)</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
          </div>

          {/* LinkedIn - Coming Soon */}
          <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center">
              <Linkedin className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">LinkedIn</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Connected Accounts
        </h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Instagram className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              No accounts connected yet.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Connect your Instagram Business account to start publishing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {account.profilePictureUrl ? (
                    <img
                      src={account.profilePictureUrl}
                      alt={account.accountUsername}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                      {getPlatformIcon(account.platform)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        @{account.accountUsername}
                      </p>
                      {getStatusBadge(account)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {account.followersCount?.toLocaleString() || 0} followers
                      </span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        {account.totalPosts} posts via CMS
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {account.status === 'TOKEN_EXPIRED' || !account.tokenValid ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshToken(account.id)}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh Token
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          ℹ️ Requirements for Instagram Integration
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• You need an <strong>Instagram Business</strong> or <strong>Creator</strong> account</li>
          <li>• Your Instagram must be connected to a <strong>Facebook Page</strong></li>
          <li>• Images must be publicly accessible URLs (hosted on your CDN or cloud storage)</li>
          <li>• Maximum caption length: 2,200 characters</li>
          <li>• Supported formats: JPEG, PNG for images; MP4 for videos</li>
        </ul>
      </Card>
    </div>
  );
}
