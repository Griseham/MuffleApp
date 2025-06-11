import React from 'react';
import { useSpring, animated } from '@react-spring/web';

function AnimatedDeckSnippet({ item, index, side }) {
  // side = 'left' or 'right'
  // position them in a slight vertical offset
  // e.g. each snippet is 40px lower than the previous
  const verticalOffset = index * 40;

  // if side = left, maybe x = -200
  // if side = right, maybe x = +200
  const xTarget = side === 'left' ? -300 : 300;

  const [styles, api] = useSpring(() => ({
    x: xTarget,
    y: verticalOffset,
    scale: 0.9,
    config: { tension: 210, friction: 20 },
  }));

  // We might want to animate from an off-screen position if you want a fancier effect

  return (
    <animated.div
      className="deck-snippet"
      style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: styles.x.to((xx) => `translate(${xx}px, ${styles.y.get()}px) scale(${styles.scale.get()})`),
      }}
    >
      <div className="deck-snippet-content">
        <p>{item.track.title}</p>
        <small>Zone: {item.zone}</small>
      </div>
    </animated.div>
  );
}

export default AnimatedDeckSnippet;
