interface PlainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function PlainButton({ onClick, className = '', children, disabled }: PlainButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center transition-opacity duration-200 hover:cursor-pointer hover:opacity-70 active:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
