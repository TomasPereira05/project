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
  const params = new URLSearchParams({ ownerType, ownerId: String(ownerId) });
  if (kind) params.set("kind", kind);
  const response = await fetch(`${BASE_URL}/files?${params.toString()}`, {
    credentials: "include",
  });
  return parseResponse<StoredFile[]>(response);
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
  return parseResponse<StoredFile>(response);
}

export async function deleteFile(fileId: number) {
  const response = await fetch(`${BASE_URL}/files/${fileId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseResponse<void>(response);
}
