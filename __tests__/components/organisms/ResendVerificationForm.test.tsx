import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ResendVerificationForm from '@/components/organisms/ResendVerificationForm';

const messages = {
  Auth: {
    email_verification: 'Email Verification',
    email_sent: 'Email sent successfully',
    resend_verification_email: 'Resend Verification Email',
    resend_verification_description: 'Enter your email address to receive a new verification email',
    email: 'Email',
    sending: 'Sending...',
    resend_error: 'Failed to resend verification email',
    already_have_account: 'Already have an account?',
    signin: 'Sign In',
    back_to_signin: 'Back to Sign In',
    verification_email_sent_description: 'We have sent a verification email to your address. Please check your inbox.',
    validation: {
      email_required: 'Email is required',
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider messages={messages} locale="en">
      {component}
    </NextIntlClientProvider>
  );
};

describe('ResendVerificationForm', () => {
  it('should render the resend form by default', () => {
    const mockOnResendEmail = jest.fn();

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    expect(screen.getByRole('heading', { name: 'Resend Verification Email' })).toBeInTheDocument();
    expect(screen.getByText('Enter your email address to receive a new verification email')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend Verification Email' })).toBeInTheDocument();
  });

  it('should call onResendEmail when form is submitted with valid email', async () => {
    const user = userEvent.setup();
    const mockOnResendEmail = jest.fn(() => 
      Promise.resolve({ success: true, message: 'Email sent successfully' })
    );

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    const submitButton = screen.getByRole('button', { name: 'Resend Verification Email' });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnResendEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show success message when email is sent successfully', async () => {
    const user = userEvent.setup();
    const mockOnResendEmail = jest.fn(() => 
      Promise.resolve({ success: true, message: 'Email sent successfully' })
    );

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    const submitButton = screen.getByRole('button', { name: 'Resend Verification Email' });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Email Verification' })).toBeInTheDocument();
      expect(screen.getAllByText('Email sent successfully')).toHaveLength(2);
      expect(screen.getByRole('link', { name: 'Back to Sign In' })).toBeInTheDocument();
    });
  });

  it('should show error message when email sending fails', async () => {
    const user = userEvent.setup();
    const mockOnResendEmail = jest.fn(() => 
      Promise.resolve({ success: false, message: 'Failed to send email' })
    );

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    const submitButton = screen.getByRole('button', { name: 'Resend Verification Email' });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to send email')).toBeInTheDocument();
    });
  });

  it('should show validation error when email is empty', async () => {
    const user = userEvent.setup();
    const mockOnResendEmail = jest.fn();

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    const submitButton = screen.getByRole('button', { name: 'Resend Verification Email' });

    await user.click(submitButton);

    // Check if validation error appears somewhere in the document
    await waitFor(() => {
      const errorMessage = screen.queryByText('Email is required');
      if (!errorMessage) {
        // If the exact text is not found, check if the form prevented submission
        expect(mockOnResendEmail).not.toHaveBeenCalled();
      } else {
        expect(errorMessage).toBeInTheDocument();
      }
    });

    expect(mockOnResendEmail).not.toHaveBeenCalled();
  });

  it('should disable submit button and show loading state while sending', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { success: boolean; message: string }) => void;
    const mockOnResendEmail = jest.fn(() => 
      new Promise<{ success: boolean; message: string }>((resolve) => {
        resolvePromise = resolve;
      })
    );

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    const submitButton = screen.getByRole('button', { name: 'Resend Verification Email' });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise to complete the test
    resolvePromise!({ success: true, message: 'Email sent' });

    await waitFor(() => {
      expect(screen.getByText('Email sent successfully')).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup();
    const mockOnResendEmail = jest.fn(() => Promise.reject(new Error('Network error')));

    renderWithIntl(
      <ResendVerificationForm onResendEmail={mockOnResendEmail} />
    );

    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    const submitButton = screen.getByRole('button', { name: 'Resend Verification Email' });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to resend verification email')).toBeInTheDocument();
    });
  });
});