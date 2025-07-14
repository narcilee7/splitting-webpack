type AsyncHookHandler<T extends any[]> = (...args: T) => Promise<void> | void;

export class AsyncSeriesHook<T extends any[]> {
  private handlers: AsyncHookHandler<T>[] = [];

  tapAsync(name: string, handler: AsyncHookHandler<T>): void {
    this.handlers.push(handler);
  }

  tapPromise(name: string, handler: AsyncHookHandler<T>): void {
    this.handlers.push(handler);
  }

  async callAsync(...args: T): Promise<void> {
    for (const handler of this.handlers) {
      await handler(...args);
    }
  }

  async promise(...args: T): Promise<void> {
    return this.callAsync(...args);
  }
}