/** The moving background: four blurred colour fields (styles in globals.css, .aurora). */
export function Aurora() {
  return (
    <div className="aurora" aria-hidden>
      <div className="layer">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
      </div>
    </div>
  );
}
