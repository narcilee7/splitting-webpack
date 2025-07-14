type SyncHookHandler<T extends any[]> = (...args: T) => void;

export class SyncHook<T extends any[]> {
  private handlers: SyncHookHandler<T>[] = [];

  tap(name: string, handler: SyncHookHandler<T>): void {
    this.handlers.push(handler);
  }

  call(...args: T): void {
    for (const handler of this.handlers) {
      handler(...args);
    }
  }
}
