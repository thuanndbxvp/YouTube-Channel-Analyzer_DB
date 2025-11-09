import { supabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // Explicitly set the redirect URL to the current page's origin.
            // This can help resolve redirect issues in specific environments.
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
    if (error) {
        console.error('Error logging in with Google:', error);
        throw error;
    }
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
        throw error;
    }
};

export const onAuthStateChange = (
    callback: (event: string, session: Session | null) => void
) => {
    const { data: authListener } = supabase.auth.onAuthStateChange(callback);
    return authListener;
};