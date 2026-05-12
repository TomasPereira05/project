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
    list: (page = 1, size = 20) => {
      const search = new URLSearchParams({
        page: String(page),
        size: String(size),
      });
      return request<PaginatedResponse<UserSummary>>(`/users?${search.toString()}`);
    },
  }
};
