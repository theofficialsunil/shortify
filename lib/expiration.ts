export function getExpirationDate(expiration: string) {
  const now = new Date();

  switch (expiration) {
    case "1hour":
      return new Date(now.getTime() + 60 * 60 * 1000);

    case "1day":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);

    case "7days":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    case "30days":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    case "never":
    default:
      return null;
  }
}