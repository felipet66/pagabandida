import { createContext, useContext } from "react";

export const MaintenanceNoticeContext = createContext({
  maintenanceAcknowledged: true,
});

export const useMaintenanceNotice = () => useContext(MaintenanceNoticeContext);
