'use client';

import { useState, useCallback } from 'react';

// ── Local types ──────────────────────────────────────────────────────────────

type MediaType = 'IMAGE' | 'VIDEO' | 'VOICE' | 'DOCUMENT';

interface MediaInfo {
  id: string;
  messageId: string;
  encryptedBlobUrl: string;
  encryptedKeySender: string;
  encryptedKeyRecipient: string;
  iv: string;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
  uploadedAt: string;
  expiresAt: string;
  expired: boolean;
}

interface UseMediaDownloadReturn {
  downloadSingle: (mediaInfo: MediaInfo) => Promise<void>;
  downloadSelected: (mediaInfos: MediaInfo[]) => Promise<void>;
  downloadAll: (mediaInfos: MediaInfo[]) => Promise<void>;
  isDownloading: boolean;
  progress: number;
  currentFile: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFileName(mediaInfo: MediaInfo): string {
  if (mediaInfo.originalName) return mediaInfo.originalName;

  const extensionMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'application/pdf': 'pdf',
  };

  const ext = extensionMap[mediaInfo.mimeType] ?? 'bin';
  return `${mediaInfo.type.toLowerCase()}-${mediaInfo.id.slice(0, 8)}.${ext}`;
}

async function fetchMediaBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.status}`);
  }
  return response.blob();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMediaDownload(): UseMediaDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const downloadSingle = useCallback(async (mediaInfo: MediaInfo) => {
    setIsDownloading(true);
    setProgress(0);
    const fileName = getFileName(mediaInfo);
    setCurrentFile(fileName);

    try {
      const blob = await fetchMediaBlob(mediaInfo.encryptedBlobUrl);
      setProgress(80);

      const { saveAs } = await import('file-saver');
      saveAs(blob, fileName);
      setProgress(100);
    } finally {
      setIsDownloading(false);
      setProgress(0);
      setCurrentFile(null);
    }
  }, []);

  const downloadMultiple = useCallback(
    async (mediaInfos: MediaInfo[]) => {
      if (mediaInfos.length === 0) return;

      if (mediaInfos.length === 1) {
        const first = mediaInfos[0];
        if (first) await downloadSingle(first);
        return;
      }

      setIsDownloading(true);
      setProgress(0);
      setCurrentFile(null);

      try {
        const JSZip = (await import('jszip')).default;
        const { saveAs } = await import('file-saver');

        const zip = new JSZip();
        const total = mediaInfos.length;

        for (let i = 0; i < total; i++) {
          const mediaInfo = mediaInfos[i];
          if (!mediaInfo) continue;
          const fileName = getFileName(mediaInfo);
          setCurrentFile(fileName);

          const blob = await fetchMediaBlob(mediaInfo.encryptedBlobUrl);
          zip.file(fileName, blob);

          setProgress(Math.round(((i + 1) / total) * 90));
        }

        setCurrentFile('Creating archive...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setProgress(100);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        saveAs(zipBlob, `haven-media-${timestamp}.zip`);
      } finally {
        setIsDownloading(false);
        setProgress(0);
        setCurrentFile(null);
      }
    },
    [downloadSingle],
  );

  const downloadSelected = useCallback(
    async (mediaInfos: MediaInfo[]) => {
      await downloadMultiple(mediaInfos);
    },
    [downloadMultiple],
  );

  const downloadAll = useCallback(
    async (mediaInfos: MediaInfo[]) => {
      await downloadMultiple(mediaInfos);
    },
    [downloadMultiple],
  );

  return {
    downloadSingle,
    downloadSelected,
    downloadAll,
    isDownloading,
    progress,
    currentFile,
  };
}
