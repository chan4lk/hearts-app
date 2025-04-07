"use client";

import React from "react";
import { SessionProvider as Provider } from "next-auth/react";

export function SessionProvider({ children, session }: any) {
  return <Provider session={session}>{children}</Provider>;
} 