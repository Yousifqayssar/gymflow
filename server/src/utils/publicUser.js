// Returns the user data that is safe to send to clients.
// The password hash must never leave the server.
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}
