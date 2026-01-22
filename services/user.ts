import { api } from "./api";

export type MeResponse = {
  name: string;
  email: string;
  provider: string;
  verified: boolean;
  userUuid: string;
  profileImage?: string | null;
  dateOfBirth?: string | null;
  alternatePhone?: string | null;
};

export const userService = {
  // ✅ GET CURRENT USER
  getMe: async (): Promise<MeResponse> => {
    const res = await api.get("/api/users/me");
    return res.data as MeResponse;
  },
};
