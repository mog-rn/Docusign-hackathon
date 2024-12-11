export const routes = {
    auth: {
      protected: ['/dashboard', '/profile', '/settings'],
      public: ['/login', '/register', '/forgot-password'],
      default: {
        authenticated: '/dashboard',
        unauthenticated: '/login'
      }
    }
  } as const