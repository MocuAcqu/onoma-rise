import { useRef } from 'react';
import './LandingPage.css';
import { useOutletContext } from 'react-router-dom';
import mainLogoImage from '../assets/images/main-logo.png';

type AppContext = {
  handleNavigate: (path: string, element: HTMLElement | null) => void;
};

const LandingPage = () => { 
    const { handleNavigate } = useOutletContext<AppContext>();

    const sphereRef = useRef<HTMLDivElement>(null);
    
    const handleClick = () => {
        handleNavigate('/login', sphereRef.current);
    };

    return (
        <div className="landing-container">
        <p className="prompt-text">點擊我, 開始創造音樂</p>
        
        <div className="circle-wrapper" ref={sphereRef} onClick={handleClick}>
            <div className="breathing-circle">
            </div>
        </div>

        <div className="main-logo-container">
            <img src={mainLogoImage} alt="音擬而起 OnomaRise" className="main-logo-img-start" />
        </div>
        </div>
    );
};

export default LandingPage;