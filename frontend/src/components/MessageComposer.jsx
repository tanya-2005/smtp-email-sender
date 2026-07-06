import { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Paperclip, Smile, Underline } from 'lucide-react';
import EmojiPicker from './ui/EmojiPicker';

function MessageComposer({ value, onChange, onFocus, textareaRef, onFormat, onEmoji, onAttachClick }) {
  const [showEmoji, setShowEmoji] = useState(false);

  function format(type) {
    return (event) => {
      event.preventDefault();
      onFormat(type);
    };
  }

  return (
    <div className="composer">
      <div className="composer__toolbar">
        <button type="button" className="composer__tool" onMouseDown={format('bold')} aria-label="Bold" title="Bold">
          <Bold size={15} />
        </button>
        <button type="button" className="composer__tool" onMouseDown={format('italic')} aria-label="Italic" title="Italic">
          <Italic size={15} />
        </button>
        <button
          type="button"
          className="composer__tool"
          onMouseDown={format('underline')}
          aria-label="Underline"
          title="Underline"
        >
          <Underline size={15} />
        </button>
        <span className="composer__divider" />
        <button
          type="button"
          className="composer__tool"
          onMouseDown={format('bullet')}
          aria-label="Bullet list"
          title="Bullet list"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className="composer__tool"
          onMouseDown={format('number')}
          aria-label="Numbered list"
          title="Numbered list"
        >
          <ListOrdered size={15} />
        </button>
        <span className="composer__divider" />
        <button
          type="button"
          className="composer__tool"
          onClick={onAttachClick}
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip size={15} />
        </button>
        <div className="composer__emoji-wrapper">
          <button
            type="button"
            className="composer__tool"
            onClick={() => setShowEmoji((prev) => !prev)}
            aria-label="Insert emoji"
            title="Insert emoji"
          >
            <Smile size={15} />
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={(emoji) => {
                onEmoji(emoji);
                setShowEmoji(false);
              }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>
      </div>
      <textarea
        id="message"
        name="message"
        rows={9}
        placeholder="Write your message here..."
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        aria-label="Email message"
        ref={textareaRef}
        required
      />
    </div>
  );
}

export default MessageComposer;
