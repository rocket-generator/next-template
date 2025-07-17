import { verifyEmailAction, resendVerificationEmailAction } from '@/app/(site)/(unauthorized)/auth/verify-email/actions';
import { AuthService } from '@/services/auth_service';
import { UserRepository } from '@/repositories/user_repository';

// Mock AuthService
jest.mock('@/services/auth_service');
jest.mock('@/repositories/user_repository');
jest.mock('@/repositories/password_reset_repository');
jest.mock('@/repositories/email_verification_repository');

describe('verify-email actions', () => {
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthService = {
      verifyEmailToken: jest.fn(),
      sendVerificationEmail: jest.fn(),
    } as any;

    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);
  });

  describe('verifyEmailAction', () => {
    it('should return success when token verification succeeds', async () => {
      const token = 'valid-token';
      mockAuthService.verifyEmailToken.mockResolvedValue(true);

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: true,
        message: 'メールアドレスの認証が完了しました。サインインページにリダイレクトします。',
      });
      expect(mockAuthService.verifyEmailToken).toHaveBeenCalledWith(token);
    });

    it('should return error when token verification fails', async () => {
      const token = 'invalid-token';
      mockAuthService.verifyEmailToken.mockResolvedValue(false);

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: false,
        message: '認証トークンが無効または期限切れです。',
      });
      expect(mockAuthService.verifyEmailToken).toHaveBeenCalledWith(token);
    });

    it('should return error when service throws exception', async () => {
      const token = 'error-token';
      mockAuthService.verifyEmailToken.mockRejectedValue(new Error('Database error'));

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: false,
        message: '認証処理中にエラーが発生しました。',
      });
      expect(mockAuthService.verifyEmailToken).toHaveBeenCalledWith(token);
    });

    it('should handle empty token', async () => {
      const token = '';

      const result = await verifyEmailAction(token);

      expect(result).toEqual({
        success: false,
        message: '認証トークンが無効または期限切れです。',
      });
      expect(mockAuthService.verifyEmailToken).toHaveBeenCalledWith(token);
    });
  });

  describe('resendVerificationEmailAction', () => {
    beforeEach(() => {
      const mockUserRepository = {
        findByEmail: jest.fn(),
      } as any;
      
      (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepository);
    });

    it('should return success when resend succeeds', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-1', email, name: 'Test User' };
      
      const mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.sendVerificationEmail.mockResolvedValue();

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: true,
        message: '認証メールを再送信しました。メールをご確認ください。',
      });
    });

    it('should return error when user not found', async () => {
      const email = 'nonexistent@example.com';
      
      const mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: false,
        message: '指定されたメールアドレスは登録されていません。',
      });
      
      expect(mockAuthService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return error when service throws exception', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-1', email, name: 'Test User' };
      
      const mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.sendVerificationEmail.mockRejectedValue(new Error('Email service error'));

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: false,
        message: 'メールの再送信に失敗しました。',
      });
    });

    it('should handle invalid email format', async () => {
      const email = 'invalid-email';

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: false,
        message: '指定されたメールアドレスは登録されていません。',
      });
    });

    it('should handle empty email', async () => {
      const email = '';

      const result = await resendVerificationEmailAction(email);

      expect(result).toEqual({
        success: false,
        message: '指定されたメールアドレスは登録されていません。',
      });
    });
  });
}); 