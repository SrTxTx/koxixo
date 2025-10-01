"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
