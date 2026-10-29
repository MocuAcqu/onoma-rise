import './SphereTransition.css';

type SpherePosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type SphereTransitionProps = {
  isActive: boolean;
  initialPosition: SpherePosition | null;
};

const SphereTransition = ({ isActive, initialPosition }: SphereTransitionProps) => {
  if (!initialPosition) {
    return null;
  }

  const style = {
    top: `${initialPosition.top}px`,
    left: `${initialPosition.left}px`,
    width: `${initialPosition.width}px`,
    height: `${initialPosition.height}px`,
  };

  const transitionClassName = `sphere-transition ${isActive ? 'active' : ''}`;

  return (
    <div
      className={transitionClassName}
      style={style}
    ></div>
  );
};

export default SphereTransition;