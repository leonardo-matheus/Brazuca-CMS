'use client';

import React, { useEffect, useState } from 'react';
import {
  Instagram,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { toast } from '@/stores/toast.store';
import {
  SocialMediaAccount,
  SocialMediaPost,
  getInstagramAccounts,
  publishToInstagram,
} from '@/services/social-media.service';

interface PublishToInstagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: number;
  entryTitle: string;
  entryDescription?: string;
  entryImageUrl?: string;
}

export default function PublishToInstagramModal({
  isOpen,
  onClose,
  entryId,
  entryTitle,
  entryDescription,
  entryImageUrl,
}: PublishToInstagramModalProps) {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPost, setPublishedPost] = useState<SocialMediaPost | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      // Pre-fill caption from entry
      const defaultCaption = entryDescription 
        ? `${entryTitle}\n\n${entryDescription}`.substring(0, 2200)
        : entryTitle;
      setCaption(defaultCaption);
      setMediaUrl(entryImageUrl || '');
      setPublishedPost(null);
    }
  }, [isOpen, entryTitle, entryDescription, entryImageUrl]);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await getInstagramAccounts();
      setAccounts(data.filter(a => a.status === 'ACTIVE' && a.tokenValid));
      if (data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedAccountId) {
      toast.error('Please select an Instagram account');
      return;
    }
    if (!caption.trim()) {
      toast.error('Caption is required');
      return;
    }
    if (!mediaUrl.trim()) {
      toast.error('Image URL is required');
      return;
    }

    try {
      setIsPublishing(true);
      const post = await publishToInstagram({
        socialAccountId: selectedAccountId,
        caption: caption.trim(),
        mediaUrl: mediaUrl.trim(),
        mediaType: 'IMAGE',
        entryId,
      });
      setPublishedPost(post);
      toast.success('Published to Instagram!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Publish to Instagram" size="lg">
      <div className="p-6">
        {publishedPost ? (
          // Success State
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Published Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your post is now live on Instagram.
            </p>
            {publishedPost.permalink && (
              <a
                href={publishedPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-green-600 hover:underline"
              >
                View on Instagram <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <div className="mt-6">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : accounts.length === 0 ? (
          // No Accounts
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Instagram className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Instagram Account Connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect your Instagram Business account first.
            </p>
            <Button
              onClick={() => {
                onClose();
                window.location.href = '/dashboard/settings/social';
              }}
            >
              Connect Instagram
            </Button>
          </div>
        ) : (
          // Publish Form
          <div className="space-y-6">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instagram Account
              </label>
              <div className="flex flex-wrap gap-3">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      selectedAccountId === account.id
                        ? 'border-brand-green-500 bg-brand-green-50 dark:bg-brand-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {account.profilePictureUrl ? (
                      <img
                        src={account.profilePictureUrl}
                        alt={account.accountUsername}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      @{account.accountUsername}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Media URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                />
                {mediaUrl && (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Image must be publicly accessible. Supported: JPEG, PNG
              </p>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Caption *
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.substring(0, 2200))}
                rows={6}
                placeholder="Write your caption..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-green-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  You can use hashtags and mentions
                </p>
                <p className={`text-xs ${caption.length > 2000 ? 'text-orange-500' : 'text-gray-500'}`}>
                  {caption.length}/2,200
                </p>
              </div>
            </div>

            {/* Preview */}
            {mediaUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-sm">
                  {/* Instagram-like header */}
                  <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                    {selectedAccount?.profilePictureUrl ? (
                      <img
                        src={selectedAccount.profilePictureUrl}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300" />
                    )}
                    <span className="font-semibold text-sm">
                      {selectedAccount?.accountUsername || 'username'}
                    </span>
                  </div>
                  {/* Image */}
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Invalid+URL';
                    }}
                  />
                  {/* Caption preview */}
                  <div className="p-3">
                    <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                      <span className="font-semibold">{selectedAccount?.accountUsername}</span>{' '}
                      {caption.substring(0, 150)}
                      {caption.length > 150 && '...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !mediaUrl || !caption}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4 mr-2" />
                    Publish to Instagram
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
