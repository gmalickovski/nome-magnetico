import { AsyncLocalStorage } from 'node:async_hooks';

export type ClientPrincipal = {
  tokenHash: string;
  userId: string;
  subscriptionId?: string;
  remainingQuota?: number;
};

const storage = new AsyncLocalStorage<ClientPrincipal>();

export function runWithClientPrincipal<T>(principal: ClientPrincipal, fn: () => T): T {
  return storage.run(principal, fn);
}

export function getCurrentClientPrincipal(): ClientPrincipal | undefined {
  return storage.getStore();
}
