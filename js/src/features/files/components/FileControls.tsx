import { Camera, FileText, Upload, UserRoundCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  deleteFile,
  fileContentUrl,
  listFiles,
  publicAthletePhotoUrl,
  uploadFile,
  type FileKind,
  type FileOwnerType,
  type StoredFile,
} from "../api";

type OwnerProps = {
  ownerType: FileOwnerType;
  ownerId: number | null | undefined;
  kind: FileKind;
};

type FileAvatarProps = OwnerProps & {
  alt: string;
  children: ReactNode;
  className: string;
  editable?: boolean;
  fallback?: OwnerProps;
  useFallbackLabel?: string;
  uploadLabel?: string;
  publicImage?: boolean;
};

export function FileAvatar({
  alt,
  children,
  className,
  editable = true,
  fallback,
  kind,
  ownerId,
  ownerType,
  publicImage = false,
  useFallbackLabel,
  uploadLabel,
}: FileAvatarProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<StoredFile | null>(null);
  const [fallbackFile, setFallbackFile] = useState<StoredFile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setFile(null);
    if (!ownerId) {
      return;
    }
    listFiles(ownerType, ownerId, kind)
      .then((files) => {
        if (!ignore) setFile(files[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [kind, ownerId, ownerType]);

  useEffect(() => {
    let ignore = false;
    setFallbackFile(null);
    if (!fallback?.ownerId) {
      return;
    }
    listFiles(fallback.ownerType, fallback.ownerId, fallback.kind)
      .then((files) => {
        if (!ignore) setFallbackFile(files[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [fallback?.kind, fallback?.ownerId, fallback?.ownerType]);

  async function handleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selected = event.target.files?.[0];
    if (!selected || !ownerId) return;
    setUploading(true);
    try {
      const saved = await uploadFile(ownerType, ownerId, kind, selected);
      setFile(saved);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleUseFallback() {
    if (!file) return;
    setUploading(true);
    try {
      await deleteFile(file.fileId);
      setFile(null);
    } finally {
      setUploading(false);
    }
  }

  const displayFile = file ?? fallbackFile;
  const src = displayFile ? (publicImage ? publicAthletePhotoUrl(displayFile.fileId) : fileContentUrl(displayFile.fileId)) : null;

  return (
    <div className="file-avatar-block">
      <div className={className}>
        {src ? <img src={src} alt={alt} className="file-avatar-image" /> : children}
      </div>
      {editable && ownerId && (
        <div className="file-avatar-actions">
          {fallback?.ownerId && (
            <button className="file-avatar-button-secondary" disabled={uploading || !file} onClick={handleUseFallback} type="button">
              <UserRoundCheck size={16} />
              <span>{useFallbackLabel ?? t("files.actions.useMemberPhoto")}</span>
            </button>
          )}
          <label className="file-avatar-button" title={t("files.actions.uploadPhoto")}>
            <Camera size={16} />
            <span>{uploading ? t("files.actions.uploading") : uploadLabel ?? t("files.actions.changePhoto")}</span>
            <input
              accept="image/png,image/jpeg,image/webp"
              disabled={uploading}
              onChange={handleChange}
              type="file"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function ProfilePhoto({
  activeMemberId,
  alt,
  className,
  userId,
  children,
}: {
  activeMemberId?: number | null;
  alt: string;
  className: string;
  userId?: number | null;
  children: ReactNode;
}) {
  return (
    <FileAvatar
      alt={alt}
      className={className}
      editable={false}
      fallback={activeMemberId ? { ownerType: "MEMBER", ownerId: activeMemberId, kind: "MEMBER_PHOTO" } : undefined}
      kind="USER_PROFILE_PHOTO"
      ownerId={userId}
      ownerType="USER"
    >
      {children}
    </FileAvatar>
  );
}

type FileUploadListProps = OwnerProps & {
  title: string;
  accept: string;
};

export function FileUploadList({ accept, kind, ownerId, ownerType, title }: FileUploadListProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!ownerId) return;
    listFiles(ownerType, ownerId, kind)
      .then((items) => {
        if (!ignore) setFiles(items);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [kind, ownerId, ownerType]);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected || !ownerId) return;
    setUploading(true);
    try {
      const saved = await uploadFile(ownerType, ownerId, kind, selected);
      setFiles([saved]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="file-list-card">
      <div className="file-list-header">
        <div className="file-list-title">
          <FileText size={18} />
          <span>{title}</span>
        </div>
        <label className="file-upload-button">
          <Upload size={16} />
          {uploading ? t("files.actions.uploading") : t("files.actions.upload")}
          <input accept={accept} disabled={uploading || !ownerId} onChange={handleChange} type="file" />
        </label>
      </div>
      {files.length > 0 ? (
        <div className="file-list-items">
          {files.map((file) => (
            <a href={fileContentUrl(file.fileId)} key={file.fileId} target="_blank" rel="noreferrer">
              {file.originalName}
            </a>
          ))}
        </div>
      ) : (
        <p className="file-empty-text">{t("files.empty")}</p>
      )}
    </div>
  );
}
