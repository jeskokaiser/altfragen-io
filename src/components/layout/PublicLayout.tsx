import { Outlet } from 'react-router-dom';
import Footer from '@/components/Footer';

// Public pages get the footer too: its "Verträge hier kündigen" link must be
// reachable from every page (§ 312k BGB).
const PublicLayout = () => (
  <>
    <Outlet />
    <Footer />
  </>
);

export default PublicLayout;
