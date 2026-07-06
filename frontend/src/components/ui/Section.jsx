function Section({ icon: Icon, title, action, children }) {
  return (
    <div className="section">
      <div className="section__header">
        <div className="section__title">
          {Icon && <Icon size={16} className="section__icon" />}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      <div className="section__body">{children}</div>
    </div>
  );
}

export default Section;
