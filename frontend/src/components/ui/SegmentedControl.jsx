import { useEffect, useLayoutEffect, useRef, useState } from 'react';

function SegmentedControl({ options, value, onChange }) {
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, transform: 'translateX(0)' });

  function measure() {
    const activeIndex = options.findIndex((option) => option.value === value);
    const btn = buttonRefs.current[activeIndex];
    if (!btn) return;
    setIndicatorStyle({
      width: `${btn.offsetWidth}px`,
      transform: `translateX(${btn.offsetLeft}px)`,
    });
  }

  // Measure before paint so the indicator never flashes in the wrong spot.
  useLayoutEffect(measure, [value, options]);

  // Button widths can change with viewport size (variable-length labels),
  // so re-measure on resize rather than assuming equal-width segments.
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  return (
    <div className="segmented" role="tablist">
      <div className="segmented__indicator" style={indicatorStyle} />
      {options.map((option, index) => {
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
            ref={(el) => (buttonRefs.current[index] = el)}
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
