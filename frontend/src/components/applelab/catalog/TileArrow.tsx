/** Gradient arrow badge that slides in when a catalog tile is hovered (see .tile-go). */
export default function TileArrow() {
  return (
    <span className="tile-go" aria-hidden="true">
      <svg>
        <use href="#i-arrow" />
      </svg>
    </span>
  )
}
