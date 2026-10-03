import './globals.css';

export const metadata = {
  title: 'RTL Markdown Editor — ویرایشگر مارک‌داون راست‌چین',
  description:
    'A Markdown editor for right-to-left writers: fixes broken number/slash direction from AI output, live preview, highlighted code with copy buttons, tables, and a Persian/English/Arabic interface.',
  keywords: [
    'markdown editor',
    'RTL',
    'Persian',
    'Farsi',
    'Arabic',
    'bidi',
    'ویرایشگر مارک‌داون',
    'راست‌چین',
    'محرر ماركداون',
  ],
  authors: [{ name: 'Majid Shilehsari' }],
  openGraph: {
    title: 'RTL Markdown Editor',
    description:
      'Markdown editor for Persian, Arabic and other RTL languages — fixes AI text direction, live preview, copy buttons for code and tables.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&family=Noto+Sans+Arabic:wght@400;500;700&family=Inter:wght@400;500;700&family=Fira+Code:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
