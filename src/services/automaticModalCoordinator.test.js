describe("automaticModalCoordinator", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const loadCoordinator = maintenanceModalEnabled => {
    jest.doMock("../enviroments/enviroments", () => ({
      Enviroments: {
        MAINTENANCE_MODAL_ENABLED: maintenanceModalEnabled,
      },
    }));

    return require("./automaticModalCoordinator");
  };

  it("libera modais automáticos somente após o aviso de manutenção", async () => {
    const coordinator = loadCoordinator(true);
    let released = false;

    const waiting = coordinator
      .waitForMaintenanceAcknowledgement()
      .then(() => {
        released = true;
      });

    await Promise.resolve();
    expect(released).toBe(false);

    coordinator.acknowledgeMaintenance();
    await waiting;

    expect(released).toBe(true);
  });

  it("mantém a liberação durante a sessão atual do app", async () => {
    const coordinator = loadCoordinator(true);

    coordinator.acknowledgeMaintenance();

    await expect(
      coordinator.waitForMaintenanceAcknowledgement()
    ).resolves.toBeUndefined();
  });

  it("libera os modais imediatamente quando o aviso está desativado", async () => {
    const coordinator = loadCoordinator(false);

    await expect(
      coordinator.waitForMaintenanceAcknowledgement()
    ).resolves.toBeUndefined();
  });
});
