import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types ---
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

// --- Spinner ---
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string }> = ({ size = 'md', className = '' }) => {
    let sizeClasses = 'w-6 h-6'; // md default
    if (size === 'sm') sizeClasses = 'w-4 h-4';
    if (size === 'lg') sizeClasses = 'w-8 h-8';

    return (
        <div className={`relative ${sizeClasses} ${className}`}>
            <div className="absolute inset-0 border-2 border-zinc-200 dark:border-zinc-800 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-black dark:border-white rounded-full border-t-transparent animate-spin"></div>
        </div>
    );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon,
    className = '',
    disabled,
    ...props 
}) => {
    const baseStyle = "font-mono uppercase tracking-wider font-bold transition-all duration-200 flex items-center justify-center gap-2 rounded-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
    
    const variants = {
        primary: "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 border border-transparent shadow-sm",
        secondary: "bg-white dark:bg-black text-black dark:text-white border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/40",
        ghost: "bg-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
    };

    const sizes = {
        sm: "text-[10px] px-2 py-1 h-7",
        md: "text-xs px-4 py-2 h-10",
        lg: "text-sm px-6 py-3 h-12"
    };

    return (
        <button 
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} 
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Spinner size="sm" className={variant === 'primary' ? 'border-white dark:border-black' : ''} />}
            {!isLoading && leftIcon}
            {children}
        </button>
    );
};

// --- Badge ---
export const Badge: React.FC<{ children?: React.ReactNode, variant?: 'default' | 'outline' | 'dot', className?: string }> = ({ children, variant = 'default', className = '' }) => {
    if (variant === 'dot') {
        return (
            <span className={`flex h-2 w-2 relative ${className}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
        );
    }
    
    const styles = variant === 'outline' 
        ? "border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-transparent"
        : "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white";

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles} ${className}`}>
            {children}
        </span>
    );
};

// --- Toast System ---
interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="animate-fadeIn pointer-events-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg p-4 rounded-sm flex items-center gap-3 min-w-[300px]">
                        <div className={`w-2 h-2 rounded-full ${
                            toast.type === 'success' ? 'bg-green-500' : 
                            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <p className="text-sm font-medium text-black dark:text-white">{toast.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};