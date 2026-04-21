export type AuthUser = {
  created_at: string;
  cycle: string;
  email: string;
  filiere: string;
  full_name: string;
  id: number;
  role: string;
  student_id: string;
  year: number;
};

export type AuthTokenResponse = {
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  token_type: "bearer";
};
