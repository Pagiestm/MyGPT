export const PASSWORD_HASHER = Symbol('PasswordHasher');

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  matches(plain: string, hash: string): Promise<boolean>;
}
