import { BASE_URL } from "../../shared/config/config";
import { HttpError } from "../../shared/types/HttpError";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

type PaginatedResponse<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};

export type UserSummary = {
  userId: number;
  email: string;
  username: string;
  role: string;
  activeMemberId: number | null;
};

export type UserRole = "ADMIN" | "SECRETARIA" | "NORMAL";

export type UserMemberAssociation = {
  memberId: number;
  memberNumber: number;
  completeName: string;
  email: string;
  status: string;
};

export type UserAthleteAssociation = {
  athleteId: number;
  memberId: number;
  teamCategory: string;
  season: string | null;
  active: boolean;
};

export type UserSponsorAssociation = {
  sponsorId: number;
  name: string;
  email: string;
  phone: string;
  nif: string;
};

export type UserAssociations = {
  member: UserMemberAssociation | null;
  athlete: UserAthleteAssociation | null;
  sponsors: UserSponsorAssociation[];
};

export const api = {
  auth: {
    login: async (identifier: string, password: string) => {
      const data = await request<{
        userId: number;
        email: string;
        username: string;
        role: string;
        activeMemberId: number | null;
        token: string;
      }>("/users/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      return {
        id: data.userId,
        email: data.email,
        username: data.username,
        role: data.role,
        activeMemberId: data.activeMemberId,
        token: data.token,
      };
    },
    
    register: async (username: string, email: string, password: string) => {
      const data = await request<any>("/users", {
        method: "POST",
        body: JSON.stringify({
          email,
          username,
          password,
          role: "NORMAL",
        }),
      });
      return data;
    },
    
    logout: async () => {
      return request<void>("/users/logout", {
        method: "POST",
      });
    },
    
    getMe: async () => {
      try {
        const data = await request<any>("/users/me");
        return {
          id: data.userId, 
          email: data.email,
          username: data.username,
          role: data.role,
          activeMemberId: data.activeMemberId
        };
      } catch (error) {
        return null;
      }
    }
  },
  users: {
    getById: (userId: number) => request<UserSummary>(`/users/${userId}`),
    getAssociations: (userId: number) => request<UserAssociations>(`/users/${userId}/associations`),
    updateRole: (userId: number, role: UserRole) =>
      request<UserSummary>(`/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    updateActiveMember: (userId: number, memberId: number | null) =>
      request<UserSummary>(`/users/${userId}/active-member`, {
        method: "PUT",
        body: JSON.stringify({ memberId }),
      }),
    list: (page = 1, size = 20, filters: { search?: string; role?: UserRole | "" } = {}) => {
      const search = new URLSearchParams({
        page: String(page),
        size: String(size),
      });
      if (filters.search?.trim()) {
        search.set("search", filters.search.trim());
      }
      if (filters.role) {
        search.set("role", filters.role);
      }
      return request<PaginatedResponse<UserSummary>>(`/users?${search.toString()}`);
    },
  }
};
