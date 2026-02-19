export const metadata = {
  title: 'Mescotrust CMS',
  description: 'Fresh project',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
