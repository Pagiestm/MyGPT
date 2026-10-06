export {
  useChangeEmail,
  useChangePassword,
  useDeleteAccount,
  useForgotPassword,
  usePasswordRecovery,
  useResetPassword,
  useUpdatePreferences,
  useUpdatePseudo,
} from './composables/useAccount';
export {
  changeEmailSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type ChangeEmailInput,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from './types';
export { accountRoutes } from './routes';
