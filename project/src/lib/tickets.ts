export function getTicketCode(registrationId: string): string {
  return registrationId.replace(/-/g, '').slice(0, 8).toUpperCase();
}
