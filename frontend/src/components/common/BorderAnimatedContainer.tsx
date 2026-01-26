import React from 'react';

interface BorderAnimatedContainerProps {
    children: React.ReactNode;
    className?: string;
}

const BorderAnimatedContainer = ({ children, className = "" }: BorderAnimatedContainerProps) => {
    return (
        <div
            className={`
                relative w-full h-full
                rounded-2xl
                [background:linear-gradient(45deg,#172033,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,theme(colors.cyan.500)_86%,theme(colors.cyan.300)_90%,theme(colors.cyan.500)_94%,theme(colors.slate.600/.48))_border-box]
                border border-transparent
                animate-border
                overflow-hidden
                ${className}
            `}
        >
            {children}
            
            {/* Add the CSS for the animation */}
            <style>
                {`
                    @property --border-angle {
                        syntax: "<angle>";
                        inherits: true;
                        initial-value: 0turn;
                    }
                    
                    @keyframes border-spin {
                        to {
                            --border-angle: 1turn;
                        }
                    }
                    
                    .animate-border {
                        animation: border-spin 3s linear infinite;
                    }
                `}
            </style>
        </div>
    );
};

export default BorderAnimatedContainer;