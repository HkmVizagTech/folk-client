
const PETALS = [0, 45, 90, 135, 180, 225, 270, 315];

/** Decorative line-art mandala; colour and size come from the parent. */
const Mandala = ({ className = '', ...props }) => (
  <svg viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="0.6" className={className} {...props}>
    <circle cx="100" cy="100" r="30" />
    <circle cx="100" cy="100" r="52" />
    <circle cx="100" cy="100" r="74" />
    <circle cx="100" cy="100" r="94" strokeDasharray="1.5 3" />
    {PETALS.map((deg) => (
      <ellipse key={deg} cx="100" cy="62" rx="12" ry="26" transform={`rotate(${deg} 100 100)`} />
    ))}
    {PETALS.map((deg) => (
      <ellipse key={`o${deg}`} cx="100" cy="30" rx="7" ry="16" transform={`rotate(${deg + 22.5} 100 100)`} />
    ))}
  </svg>
);

export default Mandala;
