import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
    const sizeClass = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    }[size];

    return (
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClass}`}></div>
    );
};

export default LoadingSpinner;
