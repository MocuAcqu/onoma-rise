import TonnetzWorkspace from '../tonntez/pages/TonnetzWorkspace/TonnetzWorkspace';
import './Identify.css'; 

const Identify = () => {

  return (
    <div className="identify-page-container" style={{ minHeight: '100vh' }}>
      <div className="workspace-wrapper">
        <TonnetzWorkspace />
      </div>
    </div>
  );
};

export default Identify;