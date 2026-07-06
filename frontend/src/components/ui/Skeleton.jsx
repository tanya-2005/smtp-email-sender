function Skeleton({ rows = 3 }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton__row" key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
