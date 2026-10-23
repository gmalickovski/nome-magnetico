import { AsyncLocalStorage } from 'node:async_hooks';
import type { McpScope } from './config.js';

export type RequestPrincipal = {
  agent: string;
  scopes: McpScope[];
  tokenHash: string;
};

export type RequestContext = {
  principal: RequestPrincipal;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCurrentPrincipal(): RequestPrincipal | undefined {
  return requestContext.getStore()?.principal;
}
