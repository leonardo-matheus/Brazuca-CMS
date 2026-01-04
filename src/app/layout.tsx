import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import '@/styles/globals.css';
import { ToastContainer } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BrazucaCMS - O CMS Headless Brasileiro',
  description: 'Crie, gerencie e distribua conteúdo para qualquer plataforma com o CMS headless mais completo do Brasil.',
  keywords: ['CMS', 'headless CMS', 'content management', 'API-first', 'Brasil'],
  authors: [{ name: 'BrazucaCMS Team' }],
  openGraph: {
    title: 'BrazucaCMS - O CMS Headless Brasileiro',
    description: 'Crie, gerencie e distribua conteúdo para qualquer plataforma com o CMS headless mais completo do Brasil.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('brazuca-theme');
                  var theme = stored ? JSON.parse(stored).state.theme : 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
