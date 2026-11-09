import { Outlet } from 'react-router-dom';
import Footer from '@/components/Footer';
import { SkipLink } from '@/components/ds/SkipLink';
import PublicHeader from '@/components/layout/PublicHeader';

// Public pages get the footer too: its "Verträge hier kündigen" link must be
// reachable from every page (§ 312k BGB).
const PublicLayout = () => (
  <div className="flex min-h-dvh flex-col">
    <SkipLink />
    <PublicHeader />
    <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
