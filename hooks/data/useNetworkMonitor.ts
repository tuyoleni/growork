import { useState, useEffect, useCallback } from 'react';

// Android-specific network utilities
export const checkNetworkStatus = async (): Promise<boolean> => {
    try {
        // Simple network check for Android
        await fetch('https://www.google.com', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache'
        });
        return true;
    } catch (error) {
        console.warn('Network check failed:', error);
        return false;
    }
};

// Enhanced error handling for Android network issues
export const handleAndroidNetworkError = (error: any): string => {
    if (error.message.includes('network') || error.message.includes('timeout')) {
        return 'Network connection issue. Please check your internet connection and try again.';
    } else if (error.message.includes('permission')) {
        return 'Permission denied. Please log in again.';
    } else if (error.message.includes('fetch')) {
        return 'Unable to connect to server. Please try again later.';
    }
    return error.message || 'An unexpected error occurred.';
};

// Generic retry wrapper with exponential backoff
export const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve as any, delay));
        }
    }

    throw lastError;
};

// Network monitoring hook
export const useNetworkMonitor = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [lastCheck, setLastCheck] = useState<Date>(new Date());

    const checkConnectivity = useCallback(async () => {
        try {
            const online = await checkNetworkStatus();
            setIsOnline(online);
            setLastCheck(new Date());
            return online;
        } catch (error) {
            console.error('Network check error:', error);
            setIsOnline(false);
            return false;
        }
    }, []);

    useEffect(() => {
        // Initial check
        checkConnectivity();

        // Check connectivity every 10 seconds on Android
        const intervalId = setInterval(checkConnectivity, 10000);

        return () => clearInterval(intervalId);
    }, [checkConnectivity]);

    const retryOperation = useCallback(<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3
    ): Promise<T> => {
        return withRetry(operation, maxRetries);
    }, []);

    return {
        isOnline,
        lastCheck,
        checkConnectivity,
        retryOperation,
        handleNetworkError: handleAndroidNetworkError
    };
};
