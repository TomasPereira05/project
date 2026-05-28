import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";

export type FileOwnerType = "USER" | "MEMBER" | "ATHLETE";

export type FileKind =
  | "USER_PROFILE_PHOTO"
  | "MEMBER_PHOTO"
  | "ATHLETE_PHOTO"
  | "ATHLETE_ID_CARD"
  | "ATHLETE_MEDICAL_EXAM";

export type StoredFile = {
  fileId: number;
  ownerType: FileOwnerType;
  ownerId: number;
  kind: FileKind;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: number;
};

const fileListCache = new Map<string, Promise<StoredFile[]>>();

function fileListCacheKey(ownerType: FileOwnerType, ownerId: number, kind?: FileKind) {
  return `${ownerType}:${ownerId}:${kind ?? "ALL"}`;
}

function invalidateFileListCache(ownerType: FileOwnerType, ownerId: number, kind?: FileKind) {
  fileListCache.delete(fileListCacheKey(ownerType, ownerId, kind));
  fileListCache.delete(fileListCacheKey(ownerType, ownerId));
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json() as Promise<T>;
}

export function fileContentUrl(fileId: number) {
  return `${BASE_URL}/files/${fileId}/content`;
}

export function publicAthletePhotoUrl(fileId: number) {
  return `${BASE_URL}/files/${fileId}/public-athlete-photo`;
}

export async function listFiles(ownerType: FileOwnerType, ownerId: number, kind?: FileKind) {
  const cacheKey = fileListCacheKey(ownerType, ownerId, kind);
  const cached = fileListCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({ ownerType, ownerId: String(ownerId) });
  if (kind) params.set("kind", kind);
  const request = fetch(`${BASE_URL}/files?${params.toString()}`, {
    credentials: "include",
  })
    .then((response) => parseResponse<StoredFile[]>(response))
    .catch((error) => {
      fileListCache.delete(cacheKey);
      throw error;
    });

  fileListCache.set(cacheKey, request);
  return request;
}

export async function uploadFile(ownerType: FileOwnerType, ownerId: number, kind: FileKind, file: File) {
  const form = new FormData();
  form.set("ownerType", ownerType);
  form.set("ownerId", String(ownerId));
  form.set("kind", kind);
  form.set("file", file);

  const response = await fetch(`${BASE_URL}/files`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const saved = await parseResponse<StoredFile>(response);
  invalidateFileListCache(ownerType, ownerId, kind);
  return saved;
}

export async function deleteFile(fileId: number) {
  const response = await fetch(`${BASE_URL}/files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });
  fileListCache.clear();
  return parseResponse<void>(response);
}
