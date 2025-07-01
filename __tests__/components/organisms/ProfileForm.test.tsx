import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ProfileForm } from '@/components/organisms/ProfileForm';

const messages = {
  Auth: {
    name: 'Name',
    email: 'Email',
    name_placeholder: 'John Doe',
  },
  Crud: {
    save: 'Save',
    saving: 'Saving...',
  },
  Settings: {
    profile_updated: 'Profile updated successfully',
    validation: {
      name_required: 'Name is required',
      email_required: 'Email is required',
      email_invalid: 'Please enter a valid email address',
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

// updateProfile Server Actionをモック化
jest.mock('@/app/(site)/(authorized)/(app)/settings/actions', () => ({
  updateProfile: jest.fn(),
}));

const mockUpdateProfile = require('@/app/(site)/(authorized)/(app)/settings/actions').updateProfile;

describe('ProfileForm', () => {
  const defaultProps = {
    initialName: 'John Doe',
    initialEmail: 'john@example.com',
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      renderWithIntl(<ProfileForm {...defaultProps} />);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should display initial values', () => {
      renderWithIntl(<ProfileForm {...defaultProps} />);

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('should disable save button when no changes are made', () => {
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Form Interactions', () => {
    it('should enable save button when form is modified', async () => {
      const user = userEvent.setup();
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeEnabled();
    });

    it('should call updateProfile when form is submitted', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValue({ success: true, message: 'profile_updated' });
      
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'john@example.com',
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'profile_updated' }), 100)));
      
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Success Handling', () => {
    it('should call onSuccess when update is successful', async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      mockUpdateProfile.mockResolvedValue({ success: true, message: 'profile_updated' });
      
      renderWithIntl(<ProfileForm {...defaultProps} onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Profile updated successfully');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display field-specific errors', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValue({ 
        success: false, 
        error: 'email_required',
        field: 'email'
      });
      
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should display general errors', async () => {
      const user = userEvent.setup();
      mockUpdateProfile.mockResolvedValue({ 
        success: false, 
        error: 'system_error'
      });
      
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Jane Doe');

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('system_error')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty initial values', () => {
      renderWithIntl(
        <ProfileForm 
          initialName=""
          initialEmail=""
          onSuccess={jest.fn()}
        />
      );

      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
    });

    it('should handle long text values', async () => {
      const user = userEvent.setup();
      const longName = 'A'.repeat(100);
      const longEmail = 'very.long.email.address.for.testing@example.com';
      
      renderWithIntl(<ProfileForm {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      
      await user.clear(nameInput);
      await user.type(nameInput, longName);
      await user.clear(emailInput);
      await user.type(emailInput, longEmail);

      expect(nameInput).toHaveValue(longName);
      expect(emailInput).toHaveValue(longEmail);
    });
  });
}); 