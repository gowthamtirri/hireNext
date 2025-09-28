// User roles matching backend
export type UserRole = "candidate" | "recruiter" | "vendor";

// User interface matching backend response
export interface User {
  id: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

// Authentication request/response types
export interface SignupRequest {
  email: string;
  password: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  contact_name?: string;
}

export interface SignupResponse {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Auth context types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  signup: (data: SignupRequest) => Promise<SignupResponse>;
  verifyOTP: (data: VerifyOTPRequest) => Promise<LoginResponse>;
  resendOTP: (data: ResendOTPRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshToken: () => Promise<string>;

  // Utilities
  clearAuth: () => void;
  setUser: (user: User) => void;
}

// Error types
export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

// OTP verification states
export interface OTPVerificationState {
  email: string;
  isVerifying: boolean;
  canResend: boolean;
  timeLeft: number;
}
