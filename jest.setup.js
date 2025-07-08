// In your own jest-setup.js (or any other name)
import '@testing-library/jest-dom'

// Optional: You can add other global setup here if needed.
// For example, mocking global objects or functions:
// global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

// If you need to set up environment variables for tests that are usually in .env
// require('dotenv').config({ path: '.env.test' }); // if you have a specific .env.test
// Or load from .env.example if suitable for tests
// For Clerk, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY might be needed for some client-side components/hooks
// process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_your_test_key_here';
// process.env.CLERK_SECRET_KEY = 'sk_test_your_test_secret_here';

// Mock Next.js router if not using a specific Next.js testing library that handles it
// jest.mock('next/router', () => ({
//   useRouter() {
//     return {
//       route: '/',
//       pathname: '',
//       query: '',
//       asPath: '',
//       push: jest.fn(),
//       events: {
//         on: jest.fn(),
//         off: jest.fn(),
//       },
//       beforePopState: jest.fn(() => null),
//       prefetch: jest.fn(() => null),
//     };
//   },
// }));

// jest.mock('next/navigation', () => ({
//   useRouter: () => ({
//     push: jest.fn(),
//     replace: jest.fn(),
//     refresh: jest.fn(),
//     // ... other router properties/methods you use
//   }),
//   usePathname: () => '/',
//   useSearchParams: () => new URLSearchParams(),
//   redirect: jest.fn(),
//   notFound: jest.fn(),
// }));


// Mock Clerk's hooks for frontend tests
// This is a basic example. You might need to adjust based on what your components use.
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }) => <div data-testid="clerk-provider">{children}</div>,
  SignedIn: ({ children }) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button">UserButton Mock</div>,
  useAuth: jest.fn(() => ({
    isSignedIn: false,
    userId: null,
    sessionId: null,
    getToken: jest.fn().mockResolvedValue('mock-jwt-token')
  })),
  useUser: jest.fn(() => ({
    isSignedIn: false,
    user: null
  })),
  SignIn: () => <div data-testid="sign-in-mock">SignIn Mock</div>,
  SignUp: () => <div data-testid="sign-up-mock">SignUp Mock</div>,
}));

// If Clerk's server-side authMiddleware or getAuth is used in API routes or server components being tested directly:
// jest.mock('@clerk/nextjs/server', () => ({
//   authMiddleware: jest.fn((opts) => (req, res) => { /* mock behavior */ }),
//   getAuth: jest.fn(() => ({ userId: null, sessionId: null, claims: null, getToken: jest.fn() })), // Default no auth
//   clerkClient: {
//       users: {
//           getUser: jest.fn().mockResolvedValue({ id: 'test_user_id', firstName: 'Test', lastName: 'User', primaryEmailAddress: { emailAddress: 'test@example.com'}})
//       }
//   }
// }));


// You might need a __mocks__ directory for more complex mocks (e.g. fileMock.js)
// console.log('jest.setup.js loaded');
