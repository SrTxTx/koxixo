// Fix para tipos do NextAuth
declare module "next-auth/react" {
  interface SessionContextValue {
    update(data?: any): Promise<Session | null>
  }
}

export {}