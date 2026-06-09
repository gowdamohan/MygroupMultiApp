import fs from 'fs';
import path from 'path';
import { deleteFile as wasabiDeleteFile } from '../services/wasabiService.js';

const isWasabiKey = (profileImg) =>
  profileImg &&
  !profileImg.startsWith('http://') &&
  !profileImg.startsWith('https://') &&
  !profileImg.startsWith('/');

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
