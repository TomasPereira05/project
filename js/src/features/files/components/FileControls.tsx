import { FileText, Upload } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
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
  publicImage?: boolean;
};

export function FileAvatar({ alt, children, className, kind, ownerId, ownerType, publicImage = false }: FileAvatarProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<StoredFile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!ownerId) return;
    listFiles(ownerType, ownerId, kind)
      .then((files) => {
        if (!ignore) setFile(files[0] ?? null);
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
      setFile(saved);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const src = file ? (publicImage ? publicAthletePhotoUrl(file.fileId) : fileContentUrl(file.fileId)) : null;

  return (
    <div className={`${className} file-avatar-control`}>
      {src ? <img src={src} alt={alt} className="file-avatar-image" /> : children}
      {ownerId && (
        <label className="file-avatar-action" title={t("files.actions.uploadPhoto")}>
          <Upload size={16} />
          <input accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={handleChange} type="file" />
        </label>
      )}
    </div>
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
