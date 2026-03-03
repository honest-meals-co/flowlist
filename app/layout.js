export const metadata = {
  title: 'Flowlist — Wear Many Hats. Stay in Flow.',
  description: 'A task management app for people who juggle multiple roles.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#09090B" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#09090B' }}>
        {children}
      </body>
    </html>
  );
}
