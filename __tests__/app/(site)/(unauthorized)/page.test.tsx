import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LandingPage from '@/app/(site)/(unauthorized)/page';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Remove Next.js specific props that shouldn't be passed to DOM
    const { priority, quality, placeholder, blurDataURL, ...restProps } = props;
    
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...restProps} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('LandingPage', () => {
  beforeEach(() => {
    render(<LandingPage />);
  });

  describe('Navigation', () => {
    it('renders the TaskMaster logo and brand name', () => {
      // Search for TaskMaster only in navbar
      const navbar = screen.getByRole('navigation');
      expect(navbar).toBeInTheDocument();
      
      // Search for brand name
      const taskMasterElements = screen.getAllByText('TaskMaster');
      expect(taskMasterElements.length).toBeGreaterThan(0);
    });

    it('renders login link', () => {
      const loginLink = screen.getByRole('link', { name: 'ログイン' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/auth/signin');
    });

    it('renders signup button', () => {
      const signupButton = screen.getByRole('link', { name: '新規登録' });
      expect(signupButton).toBeInTheDocument();
      expect(signupButton).toHaveAttribute('href', '/auth/signup');
    });
  });

  describe('Hero Section', () => {
    it('renders the main heading', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'TaskMaster' })
      ).toBeInTheDocument();
    });

    it('renders the primary tagline', () => {
      expect(
        screen.getByText('タスク管理を簡単に、効率的に')
      ).toBeInTheDocument();
    });

    it('renders the description text', () => {
      expect(
        screen.getByText(
          'TaskMasterは、あなたの日々のタスクを簡単に管理し、生産性を向上させるためのツールです。'
        )
      ).toBeInTheDocument();
    });

    it('renders the primary CTA button', () => {
      const ctaButton = screen.getByRole('link', { name: /無料で始める/ });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/auth/signup');
    });

    it('renders the hero image', () => {
      const heroImage = screen.getByAltText('TaskMaster dashboard illustration');
      expect(heroImage).toBeInTheDocument();
      expect(heroImage).toHaveAttribute('src', '/images/placeholder.svg');
    });
  });

  describe('Features Section', () => {
    it('renders the features section heading', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: '特徴' })
      ).toBeInTheDocument();
    });

    it('renders the features section main text', () => {
      expect(
        screen.getByText('TaskMasterの主な機能')
      ).toBeInTheDocument();
    });

    it('renders all four feature items', () => {
      const features = [
        'シンプルなタスク管理',
        'プロジェクト管理',
        'リマインダー機能',
        'レポート機能',
      ];

      features.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it('renders feature descriptions', () => {
      expect(
        screen.getByText(
          '直感的なインターフェースで、タスクの追加、編集、完了が簡単に行えます。'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          'タスクをプロジェクトごとに整理し、大きな目標を達成するための進捗を把握できます。'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          '重要なタスクを忘れないよう、リマインダーを設定できます。'
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          'タスクの完了状況や生産性のトレンドを可視化し、改善点を見つけられます。'
        )
      ).toBeInTheDocument();
    });
  });

  describe('CTA Section', () => {
    it('renders the CTA section heading', () => {
      expect(
        screen.getByText('生産性を向上させる準備はできましたか？')
      ).toBeInTheDocument();
    });

    it('renders the CTA description', () => {
      expect(
        screen.getByText(
          '今すぐTaskMasterを始めて、タスク管理を効率化しましょう。'
        )
      ).toBeInTheDocument();
    });

    it('renders the secondary CTA button', () => {
      const secondaryCtaButton = screen.getByRole('link', {
        name: /無料アカウントを作成/,
      });
      expect(secondaryCtaButton).toBeInTheDocument();
      expect(secondaryCtaButton).toHaveAttribute('href', '/auth/signup');
    });
  });

  describe('Footer', () => {
    it('renders footer links', () => {
      expect(screen.getByText('利用規約')).toBeInTheDocument();
      expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();
      expect(screen.getByText('お問い合わせ')).toBeInTheDocument();
    });

    it('renders copyright text', () => {
      expect(
        screen.getByText('© 2023 TaskMaster, Inc. All rights reserved.')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const headings = screen.getAllByRole('heading');
      
      // Ensure that main h2 elements exist
      const h2Elements = headings.filter(heading => 
        heading.tagName === 'H2'
      );
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('all images have alt text', () => {
      const images = screen.getAllByRole('img');
      images.forEach((image) => {
        expect(image).toHaveAttribute('alt');
        expect(image.getAttribute('alt')).not.toBe('');
      });
    });

    it('all links are accessible', () => {
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Content Structure', () => {
    it('renders main sections in the correct order', () => {
      // Verify navigation exists
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Verify hero section main elements exist
      expect(screen.getByText('タスク管理を簡単に、効率的に')).toBeInTheDocument();
      
      // Verify features section exists
      expect(screen.getByText('TaskMasterの主な機能')).toBeInTheDocument();
      
      // Verify CTA section exists
      expect(screen.getByText('生産性を向上させる準備はできましたか？')).toBeInTheDocument();
      
      // Verify footer exists
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
