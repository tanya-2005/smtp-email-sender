import { useEffect, useRef } from 'react';

const EMOJIS = [
  '😀', '😄', '😊', '🙂', '😉', '😍', '🤔', '😎',
  '👍', '👏', '🙌', '🎉', '🚀', '✅', '⭐', '🔥',
  '❤️', '💡', '📅', '📎', '📧', '👋', '🙏', '💼',
];

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="emoji-picker" ref={ref}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="emoji-picker__item"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default EmojiPicker;
