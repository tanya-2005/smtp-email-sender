function SegmentedControl({ options, value, onChange }) {
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div className="segmented" role="tablist">
      <div
        className="segmented__indicator"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
        }}
      />
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`segmented__option${active ? ' active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {Icon && <Icon size={15} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
