function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={20} className="empty-state__icon" />}
      <span className="empty-state__title">{title}</span>
      {subtitle && <span className="empty-state__subtitle">{subtitle}</span>}
    </div>
  );
}

export default EmptyState;
