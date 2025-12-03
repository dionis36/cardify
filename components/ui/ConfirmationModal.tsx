"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Info, XCircle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'danger'
}: ConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
        }
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    // Handle click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    if (!isOpen) return null;

    // Icon and color based on variant
    const variantConfig = {
        danger: {
            icon: XCircle,
            iconColor: "text-red-500",
            buttonClass: "bg-red-600 hover:bg-red-700 text-white",
            iconBg: "bg-red-50"
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-yellow-500",
            buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
            iconBg: "bg-yellow-50"
        },
        info: {
            icon: Info,
            iconColor: "text-blue-500",
            buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
            iconBg: "bg-blue-50"
        }
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn"
            onClick={handleBackdropClick}
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
            }}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`${config.iconBg} p-3 rounded-full shrink-0`}>
                        <Icon className={`w-6 h-6 ${config.iconColor}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-colors duration-150 ${config.buttonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>
        </div>,
        document.body
    );
}
