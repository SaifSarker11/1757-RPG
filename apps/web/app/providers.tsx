"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@repo/ui/theme/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider initialTheme="lemonade">
      {children}
    </ThemeProvider>
  );
}
