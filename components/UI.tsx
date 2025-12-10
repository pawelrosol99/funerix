import React from 'react';

// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'normal' | 'glass' | 'outline' | 'flat';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'normal', ...props }) => {
  const baseStyle = "rounded-[var(--radius-card)] p-6 transition-all duration-300 relative overflow-hidden";
  
  const variants = {
    normal: "bg-[var(--color-surface)] shadow-[var(--shadow)] text-[var(--color-text-main)]",
    flat: "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-main)]",
    glass: "bg-[var(--color-surface)] bg-opacity-80 backdrop-blur-xl border border-[var(--color-border)] shadow-[var(--shadow-sm)]",
    outline: "border-2 border-[var(--color-border)] bg-transparent text-[var(--color-text-main)]"
  };

  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', size = 'md', ...props }) => {
  const baseStyle = "rounded-[var(--radius-button)] font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
    icon: "w-10 h-10 p-0"
  };

  const variantsStyle = {
    primary: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] hover:opacity-90",
    secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-opacity-80",
    ghost: "bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-secondary)]",
    danger: "bg-[var(--color-danger)] text-[var(--color-destructive-foreground)] hover:opacity-90",
    outline: "border border-[var(--color-border)] bg-transparent text-[var(--color-text-main)] hover:bg-[var(--color-secondary)]",
    warning: "bg-[var(--color-chart-2)] text-[var(--color-primary-foreground)] hover:opacity-90"
  };

  return (
    <button className={`${baseStyle} ${sizes[size]} ${variantsStyle[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] font-bold ml-1">{label}</label>}
      <input 
        className={`bg-[var(--color-input)] border-2 border-transparent rounded-[var(--radius-input)] px-4 py-3 text-[var(--color-text-main)] placeholder-[var(--color-text-secondary)] placeholder-opacity-70 focus:outline-none focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] transition-all duration-200 font-medium ${className}`}
        {...props} 
      />
    </div>
  );
};

// --- Badge ---
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const colors = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
    secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
    success: 'bg-[var(--color-success)] text-white', // Using chart-2 (greenish) normally but chart-2 is orange in Urneo. Overriding for now.
    warning: 'bg-[var(--color-chart-2)] text-[var(--color-foreground)]',
    danger: 'bg-[var(--color-danger)] text-white'
  };

  // Allow custom overrides via className or strict variant colors if needed
  // For Urneo, 'success' is mint (accent), warning is orange (chart-2)
  const urneoColors = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
    secondary: 'bg-[var(--color-secondary)] text-[var(--color-text-secondary)]',
    success: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
    warning: 'bg-[var(--color-chart-2)] text-black',
    danger: 'bg-[var(--color-danger)] text-white'
  };

  return (
    <span className={`${urneoColors[variant]} text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${className}`} {...props}>
      {children}
    </span>
  );
};