import './globals.css';

export const metadata = {
  title: 'ویرایشگر مارک‌داون راست‌چین (RTL Markdown Editor)',
  description:
    'ویرایشگر سریع و ساده‌ی مارک‌داون فارسی با پیش‌نمایش زنده، ساخت جدول و ابزار اصلاح متن‌های چپ‌به‌راست',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&family=Fira+Code:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
