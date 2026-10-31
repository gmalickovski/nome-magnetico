import React from 'react';

export interface UserBubbleProps {
  content: string;
  onEdit?: () => void;
  className?: string;
}

export function UserBubble({ content, onEdit, className = '' }: UserBubbleProps) {
  return (
    <div className="flex flex-col items-end w-full my-2 animate-fade-in group">
      <div
        className={`relative flex items-center gap-2 max-w-[75%] rounded-2xl bg-gold px-4 py-2.5 text-dark-deeper font-medium font-inter text-[15px] leading-snug shadow-md ${className}`}
      >
        <span>{content}</span>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            title="Editar esta resposta"
            aria-label="Editar esta resposta"
            className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dark-deeper"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default UserBubble;
