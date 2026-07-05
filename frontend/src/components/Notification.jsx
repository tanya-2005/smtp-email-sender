function Notification({ type, message, onDismiss }) {
  if (!message) return null;

  return (
    <div className={`notification notification--${type}`} role="alert">
      <span className="notification__message">{message}</span>
      <button
        type="button"
        className="notification__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}

export default Notification;
