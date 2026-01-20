export function isTokenExpired(token: string): boolean {
  try {
    const base64Payload = token.split(".")[1];
    const payload = JSON.parse(atob(base64Payload));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
