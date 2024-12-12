export interface LoginRequest {
    email: string
    password: string
    organizationId: string
  }
  
  export interface RegisterRequest {
    email: string
    password: string
    firstName: string
    lastName: string
    organizationId?: string
  }
  
  export interface User {
    userId: string
    email: string
    firstName: string
    lastName: string
    organizationId: string
    roles: string[]
  }
  
  export interface AuthResponse {
    accessToken: string
    refreshToken: string
    user: User
  }