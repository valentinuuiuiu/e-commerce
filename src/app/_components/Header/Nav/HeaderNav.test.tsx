import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeaderNav } from './index'; // Adjust path as necessary
import { useAuth } from '@clerk/nextjs'; // Import the actual hook path to mock it
import type { Header } from '../../../../payload/payload-types';

// Mock the useAuth hook from Clerk
jest.mock('@clerk/nextjs', () => {
  const React = jest.requireActual('react');
  // This is the mock function that our tests will control via mockReturnValue
  const mockUseAuthHook = jest.fn();

  return {
    // Allow actual Clerk consts/types to be available if needed by other parts of the module
    ...jest.requireActual('@clerk/nextjs'),
    useAuth: mockUseAuthHook, // Crucially, useAuth IS our mock function
    UserButton: () => React.createElement('div', { 'data-testid': 'user-button-mock' }, 'UserButton'),
    SignedIn: ({ children }: { children: React.ReactNode }) => {
      const { isSignedIn } = mockUseAuthHook(); // SignedIn mock uses the SAME mock function
      return isSignedIn ? React.createElement('div', { 'data-testid': 'signed-in-mock' }, children) : null;
    },
    SignedOut: ({ children }: { children: React.ReactNode }) => {
      const { isSignedIn } = mockUseAuthHook(); // SignedOut mock uses the SAME mock function
      return !isSignedIn ? React.createElement('div', { 'data-testid': 'signed-out-mock' }, children) : null;
    },
  };
});

// Mock Next.js Link component for testing purposes
jest.mock('next/link', () => {
  const React = jest.requireActual('react');
  // Simplest mock: only pass href and children. This will avoid passing `newTab` or other unexpected props.
  // className might be useful to pass if CMSLink relies on it for styling the link.
  return (props: { children: React.ReactNode; href: string; className?: string; [key: string]: any }) => {
    const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = { href: props.href };
    if (props.className) {
      anchorProps.className = props.className;
    }
    return React.createElement('a', anchorProps, props.children);
  };
});

// Mock Button component used in HeaderNav
jest.mock('../../Button', () => ({
  Button: ({ href, label, ...props }: { href?: string; label: string;[key: string]: any }) => {
    const React = jest.requireActual('react'); // Require React inside the mock factory
    return React.createElement('a', { href, ...props }, label);
  },
}));


describe('HeaderNav Component', () => {
  const mockHeaderData: Header = {
    id: '1',
    navItems: [
      {
        link: {
          type: 'custom',
          url: '/custom-link-1',
          label: 'Custom Link 1',
          newTab: false,
        },
        id: 'item1',
      },
      {
        link: {
          type: 'custom',
          url: '/custom-link-2',
          label: 'Custom Link 2',
          newTab: true,
        },
        id: 'item2',
      },
    ],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mockUseAuth = useAuth as jest.Mock; // Cast for type safety with mock

  beforeEach(() => {
    // Reset mocks before each test
    mockUseAuth.mockClear();
  });

  test('renders CMS links and Browse Ads link when logged out', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, user: null });
    render(<HeaderNav header={mockHeaderData} />);

    expect(screen.getByText('Browse Ads')).toBeInTheDocument();
    expect(screen.getByText('Custom Link 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Link 2')).toBeInTheDocument();

    // Check for SignedOut content (Login, Create Account are inside SignedOut in the actual component)
    // The HeaderNav itself was modified to show Login/Create Account directly if !user
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();

    expect(screen.queryByText('My Ads')).not.toBeInTheDocument();
    expect(screen.queryByText('Post Ad')).not.toBeInTheDocument();
    // UserButton would be inside <SignedIn>, so it shouldn't be here
    // expect(screen.queryByTestId('user-button-mock')).not.toBeInTheDocument();
  });

  test('renders CMS links, Browse Ads, My Ads, and Post Ad when logged in', () => {
    mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user_test123',
        // Other useAuth properties if needed by component
    });
    render(<HeaderNav header={mockHeaderData} />);

    expect(screen.getByText('Browse Ads')).toBeInTheDocument();
    expect(screen.getByText('Custom Link 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Link 2')).toBeInTheDocument();

    // Check for SignedIn content
    expect(screen.getByText('My Ads')).toBeInTheDocument();
    expect(screen.getByText('Post Ad')).toBeInTheDocument(); // This is a Button
    // expect(screen.getByTestId('user-button-mock')).toBeInTheDocument(); // UserButton should be present

    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
  });

  test('navItems from header prop are rendered correctly', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, user: null });
    render(<HeaderNav header={mockHeaderData} />);

    const link1 = screen.getByText('Custom Link 1').closest('a');
    expect(link1).toHaveAttribute('href', '/custom-link-1');

    const link2 = screen.getByText('Custom Link 2').closest('a');
    expect(link2).toHaveAttribute('href', '/custom-link-2');
    // For newTab, CMSLink component would handle target="_blank" internally.
    // Testing that aspect would require deeper inspection of CMSLink or its mock.
  });

  test('handles header with no navItems gracefully', () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, user: null });
    const emptyHeaderData = { ...mockHeaderData, navItems: [] };
    render(<HeaderNav header={emptyHeaderData} />);

    expect(screen.getByText('Browse Ads')).toBeInTheDocument();
    expect(screen.queryByText('Custom Link 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Custom Link 2')).not.toBeInTheDocument();
  });
});
