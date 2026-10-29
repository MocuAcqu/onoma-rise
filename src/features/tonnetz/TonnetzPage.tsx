import TonnetzWorkspace from './workspace/TonnetzWorkspace';

const TonnetzPage = () => {
  return (
    <div className="identify-page-container" style={{ minHeight: '100vh' }}>
      <div className="workspace-wrapper">
        <TonnetzWorkspace />
      </div>
    </div>
  );
};

export default TonnetzPage;
