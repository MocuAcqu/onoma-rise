import { useRef } from 'react';
import './LandingPage.css';
import { useOutletContext } from 'react-router-dom';

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

        <div className="title-container">
            <h1 className="main-title">音擬而起</h1>
            <p className="subtitle">OnomaRise</p>
        </div>
        </div>
    );
};

export default LandingPage;