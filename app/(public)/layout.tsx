import type { ReactNode } from 'react';
import { getSettings } from '@/services/publicService';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F9FB' }}>
      <Navbar siteName={settings.site_name} logoUrl={settings.site_logo} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}

