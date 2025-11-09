import { supabase } from './supabaseClient';
import { UserData } from '../types';

const TABLE_NAME = 'user_data';

export const getUserData = async (): Promise<UserData | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
        }

        return data as UserData | null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

export const saveUserData = async (userData: Partial<UserData>): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('Cannot save data, user not logged in.');
        return;
    }

    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert({
                user_id: user.id,
                ...userData,
            }, { onConflict: 'user_id' });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving user data:', error);
        // Optionally, you could add user-facing error handling here
    }
};
