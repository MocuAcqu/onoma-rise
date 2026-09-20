import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SphereTransition from './components/SphereTransition';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingBGM from './components/FloatingBGM'; 

type SpherePosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function App() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [spherePosition, setSpherePosition] = useState<SpherePosition | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string, element: HTMLElement | null) => {
    if (!element || isTransitioning) return; 

    if (location.pathname === '/') {
      window.dispatchEvent(new Event('start-bgm'));
    }

    const rect = element.getBoundingClientRect();
    setSpherePosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    
    setIsTransitioning(true);

    setTimeout(() => {
      navigate(path);
    }, 1000); 

    setTimeout(() => {
      setIsTransitioning(false);
      setSpherePosition(null); 
    }, 1200);
  };

  const shouldShowNavbar = location.pathname !== '/' && location.pathname !== '/login';
  const shouldShowLayout = location.pathname !== '/' && location.pathname !== '/login';

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <FloatingBGM />
      <SphereTransition
        isActive={isTransitioning}
        initialPosition={spherePosition}
      />
      
      <main>
        <Outlet context={{ handleNavigate }} />
      </main>

      {shouldShowLayout && <Footer />}
    </>
  );
}

export default App;
