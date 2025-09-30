import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Figtree, Comfortaa } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/providers/auth-provider';
import './globals.css';

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
//   display: "swap",
// });

// const jetbrainsMono = JetBrains_Mono({
//   variable: "--font-jetbrains-mono",
//   subsets: ["latin"],
//   display: "swap",
// });

const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
  display: 'swap',
});

const comfortaa = Comfortaa({
  variable: '--font-comfortaa',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Neruvi - AI Learning Navigator',
  description:
    'Master Node.js and Python with Neruvi, your intelligent learning navigator. Get precise answers from course content with timestamp references and personalized guidance.',
  keywords: [
    'AI learning',
    'Node.js',
    'Python',
    'programming',
    'education',
    'course assistant',
    'Neruvi',
    'learning navigator',
  ],
  authors: [{ name: 'Neruvi Team' }],
  creator: 'Neruvi',
  publisher: 'Neruvi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://neruvi.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Neruvi - AI Learning Navigator',
    description:
      'Master Node.js and Python with Neruvi, your intelligent learning navigator.',
    url: 'https://neruvi.app',
    siteName: 'Neruvi',
    images: [
      {
        url: '/opengraph-image.svg',
        width: 1200,
        height: 630,
        alt: 'Neruvi - AI Learning Navigator',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neruvi - AI Learning Navigator',
    description:
      'Master Node.js and Python with Neruvi, your intelligent learning navigator.',
    images: ['/opengraph-image.svg'],
    creator: '@neruvi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#4ea674',
      },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <html
        lang='en'
        suppressHydrationWarning>
        <head>
          <link
            rel='icon'
            href='/favicon.svg'
            type='image/svg+xml'
          />
        </head>
        <body
          className={`${figtree.variable} ${comfortaa.variable} font-sans antialiased`}
          suppressHydrationWarning>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#374151',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                fontFamily: 'var(--font-figtree), system-ui, sans-serif',
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                },
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fef2f2',
                },
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                },
                iconTheme: {
                  primary: '#16a34a',
                  secondary: '#f0fdf4',
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
