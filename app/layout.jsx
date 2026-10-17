import '../src/styles.css';

export const metadata = {
  title: 'WebMusic',
  description: 'Discover sounds that move you.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
