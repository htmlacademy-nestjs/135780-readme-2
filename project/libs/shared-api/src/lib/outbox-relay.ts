export const OUTBOX_SETTINGS = {
  batchSize: 50,
  retryInterval: 5000,
  deliveryTimeout: 3000,
} as const;

export class OutboxRelay {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  public constructor(private readonly deliverBatch: () => Promise<void>) {}

  public onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.flush();
    }, OUTBOX_SETTINGS.retryInterval);
    this.timer.unref();
    void this.flush();
  }

  public onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  public async flush(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      await this.deliverBatch();
    } catch {
      return;
    } finally {
      this.running = false;
    }
  }
}
