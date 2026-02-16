export const metadata = {
  title: 'MESCO Trust CMS',
  description: 'MESCO Educational and Social Cultural Organisation - Admin',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
