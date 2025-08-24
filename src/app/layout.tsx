import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Figtree } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'FlowMind - AI-Powered Learning Assistant',
  description:
    'Master Node.js and Python with FlowMind, your intelligent learning companion. Get precise answers from course content with timestamp references and interactive guidance.',
  keywords: [
    'AI learning',
    'Node.js',
    'Python',
    'programming',
    'education',
    'course assistant',
    'FlowMind',
  ],
  authors: [{ name: 'FlowMind Team' }],
  creator: 'FlowMind',
  publisher: 'FlowMind',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://flowmind.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FlowMind - AI-Powered Learning Assistant',
    description:
      'Master Node.js and Python with FlowMind, your intelligent learning companion.',
    url: 'https://flowmind.app',
    siteName: 'FlowMind',
    images: [
      {
        url: '/favicon.svg',
        width: 512,
        height: 512,
        alt: 'FlowMind - AI-Powered Learning Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowMind - AI-Powered Learning Assistant',
    description:
      'Master Node.js and Python with FlowMind, your intelligent learning companion.',
    images: ['/favicon.svg'],
    creator: '@flowmind',
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
        color: '#8B5CF6',
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
    <ClerkProvider>
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
          className={`${figtree.variable} font-sans antialiased`}
          suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
