export function generateUsernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");
  return base || "user";
}

export async function generateUniqueUsername(
  baseUsername: string,
  exists: (username: string) => Promise<boolean>
) {
  let username = baseUsername;
  let counter = 1;

  while (await exists(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}