import { verifyEmailAction, resendVerificationEmailAction } from '@/app/(site)/(unauthorized)/auth/verify-email/actions';
import { AuthService } from '@/services/auth_service';
import { UserRepository } from '@/repositories/user_repository';
import { PasswordResetRepository } from '@/repositories/password_reset_repository';
import { EmailVerificationRepository } from '@/repositories/email_verification_repository';

// Mock AuthService and repositories
jest.mock('@/services/auth_service');
jest.mock('@/repositories/user_repository');
jest.mock('@/repositories/password_reset_repository');
jest.mock('@/repositories/email_verification_repository');

// Mock next-intl
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
}));

describe('verify-email actions', () => {
  let mockAuthService: jest.Mocked<AuthService>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordResetRepository: jest.Mocked<PasswordResetRepository>;
  let mockEmailVerificationRepository: jest.Mocked<EmailVerificationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthService = {
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
    } as any;

    mockUserRepository = {} as any;
    mockPasswordResetRepository = {} as any;
    mockEmailVerificationRepository = {} as any;

    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepository);
    (PasswordResetRepository as jest.MockedClass<typeof PasswordResetRepository>).mockImplementation(() => mockPasswordResetRepository);
    (EmailVerificationRepository as jest.MockedClass<typeof EmailVerificationRepository>).mockImplementation(() => mockEmailVerificationRepository);
  });

  describe('verifyEmailAction', () => {
    it('should return success when token verification succeeds', async () => {
      const token = 'valid-token';
      mockAuthService.verifyEmail.mockResolvedValue({
        success: true,
        message: 'メールアドレスの認証が完了しました。',
        code: 200,
      });

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: true,
        message: 'メールアドレスの認証が完了しました。',
        code: 200,
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should return error when token verification fails', async () => {
      const token = 'invalid-token';
      mockAuthService.verifyEmail.mockResolvedValue({
        success: false,
        message: '認証トークンが無効または期限切れです。',
        code: 400,
      });

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: false,
        message: '認証トークンが無効または期限切れです。',
        code: 400,
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should return error when service throws exception', async () => {
      const token = 'error-token';
      mockAuthService.verifyEmail.mockRejectedValue(new Error('Database error'));

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: false,
        message: '認証処理中にエラーが発生しました。',
        code: 500,
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should handle empty token', async () => {
      const token = '';
      mockAuthService.verifyEmail.mockResolvedValue({
        success: false,
        message: '認証トークンが無効または期限切れです。',
        code: 400,
      });

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: false,
        message: '認証トークンが無効または期限切れです。',
        code: 400,
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('resendVerificationEmailAction', () => {
    it('should return success when resend succeeds', async () => {
      const email = 'test@example.com';
      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: '認証メールを再送信しました。メールをご確認ください。',
        code: 200,
      });

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: true,
        message: '認証メールを再送信しました。メールをご確認ください。',
        code: 200,
      });
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(email);
    });

    it('should return error when user not found', async () => {
      const email = 'nonexistent@example.com';
      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: '認証メールを送信しました。',
        code: 200,
      });

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: true,
        message: '認証メールを送信しました。',
        code: 200,
      });
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(email);
    });

    it('should return error when service throws exception', async () => {
      const email = 'test@example.com';
      mockAuthService.resendVerificationEmail.mockRejectedValue(new Error('Email service error'));

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: false,
        message: '認証メールの再送信中にエラーが発生しました。',
        code: 500,
      });
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(email);
    });

    it('should handle invalid email format', async () => {
      const email = 'invalid-email';
      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: '認証メールを送信しました。',
        code: 200,
      });

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: true,
        message: '認証メールを送信しました。',
        code: 200,
      });
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(email);
    });

    it('should handle empty email', async () => {
      const email = '';
      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: '認証メールを送信しました。',
        code: 200,
      });

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: true,
        message: '認証メールを送信しました。',
        code: 200,
      });
      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(email);
    });
  });
}); 