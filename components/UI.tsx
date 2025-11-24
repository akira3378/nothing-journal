import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Types ---
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

// --- Icons (SVG Collection) ---
export const Icons = {
    Logo: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            {/* Dot Matrix N Representation */}
            <rect x="4" y="4" width="4" height="4" />
            <rect x="4" y="10" width="4" height="4" />
            <rect x="4" y="16" width="4" height="4" />
            <rect x="10" y="16" width="4" height="4" />
            <rect x="16" y="4" width="4" height="4" />
            <rect x="16" y="10" width="4" height="4" />
            <rect x="16" y="16" width="4" height="4" />
            <rect x="10" y="4" width="4" height="4" />
        </svg>
    ),
    Sun: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M4.93 4.93l1.41 1.41"></path>
            <path d="M17.66 17.66l1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="M6.34 17.66l-1.41 1.41"></path>
            <path d="M19.07 4.93l-1.41 1.41"></path>
        </svg>
    ),
    Moon: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    ),
    Globe: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
    ),
    Camera: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
        </svg>
    ),
    MapPin: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    ),
    Heart: ({ className, fill }: { className?: string, fill?: boolean }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
    ),
    MessageSquare: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    ),
    AlertTriangle: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    ),
    X: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    ),
    Trash: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    ),
    Menu: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    ),
    Wind: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
        </svg>
    ),
    ChevronDown: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    ),
    Calendar: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    Upload: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
    ),
    Bell: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
    ),
    ArrowRight: ({ className }: { className?: string }) => (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    )
};

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
interface ButtonProps extends HTMLMotionProps<"button"> {
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
    const baseStyle = "font-mono uppercase tracking-wider font-bold flex items-center justify-center gap-2 rounded-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";

    const variants = {
        primary: "bg-black dark:bg-white text-white dark:text-black border border-transparent shadow-sm",
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
        <motion.button
            className={cn(baseStyle, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        >
            {isLoading && <Spinner size="sm" className={variant === 'primary' ? 'border-white dark:border-black' : ''} />}
            {!isLoading && leftIcon}
            {children}
        </motion.button>
    );
};

// --- Card ---
interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, noPadding = false, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn(
                "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm overflow-hidden",
                noPadding ? "" : "p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
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

// --- Custom Select ---
interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
}

export const CustomSelect: React.FC<SelectProps> = ({ value, onChange, options, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-sm text-black dark:text-white rounded-sm flex items-center justify-between hover:border-black dark:hover:border-white transition-colors"
            >
                <span className="font-bold tracking-wide">{selectedLabel}</span>
                <Icons.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-black border border-black dark:border-white shadow-xl z-50 max-h-48 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm font-bold tracking-wide hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between ${option.value === value ? 'bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
                            >
                                {option.label}
                                {option.value === value && <span className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full"></span>}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Custom Date Input ---
interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const CustomDateInput: React.FC<DateInputProps> = ({ value, onChange, className = '' }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={`relative group ${className}`}>
            <input
                ref={inputRef}
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 pl-10 text-sm font-bold font-mono text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none transition-colors uppercase tracking-widest"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-black dark:group-focus-within:text-white pointer-events-none">
                <Icons.Calendar className="w-4 h-4" />
            </div>
        </div>
    );
};

// --- Toast System ---
interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration: number; // 0 = persistent
}

interface ToastContextType {
    addToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) => {
        const id = Math.random().toString(36).substring(7);
        const newToast = { id, message, type, duration };

        setToasts(prev => [...prev, newToast]);

        // Only set timeout if duration > 0
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none w-full max-w-xs sm:max-w-sm px-4 sm:px-0">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="pointer-events-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-4 rounded-sm flex items-start gap-3 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 relative group"
                        >
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${toast.type === 'success' ? 'bg-green-500' :
                                    toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                }`}></div>
                            <div className="flex-1 pr-4">
                                <p className="text-sm font-bold text-black dark:text-white leading-snug">{toast.message}</p>
                                {toast.duration === 0 && (
                                    <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">Realtime Alert</p>
                                )}
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};
