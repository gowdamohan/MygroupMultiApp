import fs from 'fs';
import path from 'path';
import { deleteFile as wasabiDeleteFile, getSignedReadUrl, WASABI_PUBLIC_BASE_URL } from '../services/wasabiService.js';

const isWasabiKey = (profileImg) =>
  profileImg &&
  !profileImg.startsWith('http://') &&
  !profileImg.startsWith('https://') &&
  !profileImg.startsWith('/');

export { isWasabiKey };

/** Attach a browser-loadable profile_img_url (signed Wasabi URL when applicable). */
export const attachProfileImageUrl = async (userData) => {
  const key = userData?.profile_img;
  if (!key) return;

  if (key.startsWith('http://') || key.startsWith('https://')) {
    userData.profile_img_url = key;
    return;
  }

  if (isWasabiKey(key)) {
    try {
      const { signedUrl } = await getSignedReadUrl(key, 86400);
      if (signedUrl) {
        userData.profile_img_url = signedUrl;
        return;
      }
    } catch (error) {
      console.warn('Profile image signed URL failed, using public URL:', error.message);
    }
    userData.profile_img_url = `${WASABI_PUBLIC_BASE_URL}/${key.replace(/^\/+/, '')}`;
    return;
  }

  userData.profile_img_url = key;
};

/**
 * Remove a previously stored profile image (Wasabi key or local /uploads path).
 */
export const deleteStoredProfileImage = async (profileImg) => {
  if (!profileImg) return;

  if (isWasabiKey(profileImg)) {
    try {
      await wasabiDeleteFile(profileImg);
    } catch (err) {
      console.error('Wasabi profile image delete error:', err);
    }
    return;
  }

  if (profileImg.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), 'public', profileImg.replace(/^\/+/, ''));
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error('Local profile image delete error:', err);
      }
    }
  }
};
