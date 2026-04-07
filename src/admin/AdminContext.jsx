import { createContext, useContext } from "react";
import { useIsMobile } from "./useAdminBreakpoint";

const AdminCtx = createContext({ isMobile: false });

export function AdminProvider({ children }) {
  const isMobile = useIsMobile();
  return <AdminCtx.Provider value={{ isMobile }}>{children}</AdminCtx.Provider>;
}

export function useAdmin() {
  return useContext(AdminCtx);
}
