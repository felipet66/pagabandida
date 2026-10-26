import { Enviroments } from "../enviroments/enviroments";

let maintenanceAcknowledged = !Enviroments.MAINTENANCE_MODAL_ENABLED;
let acknowledgementResolvers = [];

export const acknowledgeMaintenance = () => {
  if (maintenanceAcknowledged) return;

  maintenanceAcknowledged = true;
  acknowledgementResolvers.forEach(resolve => resolve());
  acknowledgementResolvers = [];
};

export const waitForMaintenanceAcknowledgement = () => {
  if (maintenanceAcknowledged) return Promise.resolve();

  return new Promise(resolve => {
    acknowledgementResolvers.push(resolve);
  });
};
