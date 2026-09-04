import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Footer } from './footer';
import '../public-theme.css';

export function PublicLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}