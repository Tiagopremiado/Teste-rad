import { useState, useCallback, useEffect } from 'react';
import type { User } from '../types';

export const usePremiumAccess = (user: User | null) => {
    const [expiryTimestamp, setExpiryTimestamp] = useState<number | null>(null);
    const [isPremium, setIsPremium] = useState(false);

    const checkPremiumStatus = useCallback(() => {
        if (!user) {
            setIsPremium(false);
            setExpiryTimestamp(null);
            return;
        }

        if (user.is_lifetime) {
            setIsPremium(true);
            setExpiryTimestamp(Infinity);
            return;
        }

        if (user.premium_expiry) {
            const expiry = new Date(user.premium_expiry).getTime();
            if (Date.now() < expiry) {
                setIsPremium(true);
                setExpiryTimestamp(expiry);
            } else {
                setIsPremium(false);
                setExpiryTimestamp(null);
            }
        } else {
            setIsPremium(false);
            setExpiryTimestamp(null);
        }
    }, [user]);

    useEffect(() => {
        checkPremiumStatus();
        // The check will re-run whenever the user object changes from the parent
    }, [checkPremiumStatus]);

    return { isPremium, expiryTimestamp };
};