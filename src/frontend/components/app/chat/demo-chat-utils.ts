/** Rotas de demo local (`/demo-chat`) — sem persistência de perfil nem auth. */
export function isDemoChatUser(userId: string | undefined): boolean {
  return Boolean(userId?.startsWith('demo-'));
}
