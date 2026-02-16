export const metadata = {
  title: 'Mesco Trust CMS',
  description: 'Mesco Trust CMS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
