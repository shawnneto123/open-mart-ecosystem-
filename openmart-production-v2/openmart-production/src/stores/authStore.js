import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const DEFAULT_STAFF_CREDENTIALS = {
  staffId: import.meta.env.VITE_STAFF_ID || 'admin',
  pinCode: import.meta.env.VITE_STAFF_PIN || '2026',
};

const getStaffCredentials = () => {
  const persisted = localStorage.getItem('openmart-auth');
  if (!persisted) return DEFAULT_STAFF_CREDENTIALS;

  try {
    const parsed = JSON.parse(persisted);
    return {
      staffId: parsed.state?.staffCredentials?.staffId || DEFAULT_STAFF_CREDENTIALS.staffId,
      pinCode: parsed.state?.staffCredentials?.pinCode || DEFAULT_STAFF_CREDENTIALS.pinCode,
    };
  } catch {
    return DEFAULT_STAFF_CREDENTIALS;
  }
};

/**
 * Fetch the extended profile row from the `profiles` table for a given user ID.
 * Returns { phone, address } on success, or empty strings on failure.
 */
const fetchUserProfile = async (userId) => {
  if (!supabase || !userId) return { phone: '', address: '' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, phone, address, role')
      .eq('id', userId)
      .single();

    if (error || !data) return { phone: '', address: '' };
    return {
      name: data.name || '',
      phone: data.phone || '',
      address: data.address || '',
      role: data.role || 'customer',
    };
  } catch {
    return { phone: '', address: '' };
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      customers: [],
      staffCredentials: {
        staffId: DEFAULT_STAFF_CREDENTIALS.staffId,
        pinCode: DEFAULT_STAFF_CREDENTIALS.pinCode,
      },

      /**
       * Sign in an existing customer via Supabase Auth.
       * Also fetches their extended profile (phone, address) from the profiles table.
       */
      loginCustomer: async (email, password) => {
        if (!isSupabaseConfigured) {
          return { success: false, message: 'Supabase database is not configured.' };
        }
        const normalizedEmail = email.trim().toLowerCase();
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) throw error;

          if (!data.user) {
            throw new Error('User data is missing.');
          }

          // Fetch extended profile data (phone, address) from profiles table
          const profile = await fetchUserProfile(data.user.id);

          set({
            user: {
              id: data.user.id,
              name: profile.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Customer',
              email: data.user.email,
              role: profile.role || data.user.user_metadata?.role || 'customer',
              phone: profile.phone || data.user.phone || '',
              address: profile.address || data.user.user_metadata?.address || '',
            },
            isAuthenticated: true,
          });

          return { success: true, message: 'Signed in successfully.' };
        } catch (err) {
          console.error('Supabase sign-in error:', err);
          return { success: false, message: err.message || 'Invalid customer credentials.' };
        }
      },

      /**
       * Register a new customer via Supabase Auth.
       * Also upserts a row into the `profiles` table with their name.
       */
      signUpCustomer: async (name, email, password) => {
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (!trimmedName || !normalizedEmail || !password.trim()) {
          return { success: false, message: 'Please complete all fields.' };
        }

        if (!isSupabaseConfigured) {
          return { success: false, message: 'Supabase database is not configured.' };
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: {
                name: trimmedName,
                role: 'customer',
              },
            },
          });
          if (error) throw error;

          const user = data.user;
          if (user) {
            // Upsert profile row in the profiles table
            // (The DB trigger handles this automatically on signup,
            //  but we do it here as well to ensure it runs immediately)
            await supabase.from('profiles').upsert({
              id: user.id,
              name: trimmedName,
              role: 'customer',
              phone: '',
              address: '',
              updated_at: new Date().toISOString(),
            });

            // Only update local state if session exists (email not required for confirmation)
            if (data.session) {
              set({
                user: {
                  id: user.id,
                  name: trimmedName,
                  email: user.email,
                  role: 'customer',
                  phone: '',
                  address: '',
                },
                isAuthenticated: true,
              });
            }
          }

          return {
            success: true,
            message: data.session
              ? 'Account created and signed in successfully.'
              : 'Sign up successful! Please check your email to confirm your account before logging in.',
          };
        } catch (err) {
          console.error('Supabase sign-up error:', err);
          return { success: false, message: err.message || 'Registration failed.' };
        }
      },

      loginAdmin: (staffId, pinCode) => {
        const activeStaffCredentials = getStaffCredentials();
        if (
          staffId.trim() === activeStaffCredentials.staffId &&
          pinCode.trim() === activeStaffCredentials.pinCode
        ) {
          set({
            user: { name: 'Staff Admin', email: 'staff@openmart.com', role: 'staff' },
            isAuthenticated: true,
          });

          return { success: true, message: 'Staff access granted.' };
        }

        return { success: false, message: 'Invalid staff credentials.' };
      },

      updateAdminCredentials: (newStaffId, newPin) => {
        const trimmedStaffId = newStaffId.trim();
        const trimmedPin = newPin.trim();

        if (!trimmedStaffId || !trimmedPin) {
          return { success: false, message: 'Both staff ID and PIN are required.' };
        }

        set({
          staffCredentials: {
            staffId: trimmedStaffId,
            pinCode: trimmedPin,
          },
        });

        return { success: true, message: 'Staff credentials updated successfully.' };
      },

      /**
       * Update the current customer's profile (name, phone, address).
       * Persists changes to BOTH the Supabase `profiles` table AND user_metadata,
       * so data is reliably available after page refreshes and re-logins.
       */
      updateCustomerProfile: async (email, updatedFields) => {
        if (!isSupabaseConfigured || !supabase) {
          return { success: false, message: 'Database not configured.' };
        }

        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, message: 'No user is logged in.' };
        }

        try {
          // Update user_metadata in Supabase Auth (for name)
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              name: updatedFields.name,
              address: updatedFields.address || '',
            },
          });

          if (authError) throw authError;

          // Upsert extended profile data (phone, address) into the profiles table
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: currentUser.id,
            name: updatedFields.name,
            phone: updatedFields.phone || '',
            address: updatedFields.address || '',
            updated_at: new Date().toISOString(),
          });

          if (profileError) throw profileError;

          // Update local Zustand state
          set({
            user: {
              ...currentUser,
              name: updatedFields.name,
              phone: updatedFields.phone || '',
              address: updatedFields.address || '',
            },
          });

          return { success: true, message: 'Profile updated successfully.' };
        } catch (err) {
          console.error('Profile update error:', err);
          return { success: false, message: err.message || 'Failed to update profile.' };
        }
      },

      /**
       * Change the current customer's password via Supabase Auth.
       * First re-authenticates with the current password to verify identity,
       * then updates to the new password.
       */
      updateCustomerPassword: async (email, currentPassword, newPassword) => {
        if (!isSupabaseConfigured || !supabase) {
          return { success: false, message: 'Database not configured.' };
        }

        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, message: 'No user is logged in.' };
        }

        try {
          // Step 1: Re-authenticate with current password to verify identity
          const { error: reAuthError } = await supabase.auth.signInWithPassword({
            email: currentUser.email,
            password: currentPassword,
          });

          if (reAuthError) {
            return { success: false, message: 'Incorrect current password. Please try again.' };
          }

          // Step 2: Update to new password
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (updateError) throw updateError;

          return { success: true, message: 'Password updated successfully.' };
        } catch (err) {
          console.error('Password update error:', err);
          return { success: false, message: err.message || 'Failed to update password.' };
        }
      },

      logout: async () => {
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error('Supabase sign-out error:', err);
          }
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'openmart-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        customers: state.customers,
        staffCredentials: state.staffCredentials,
      }),
    }
  )
);

export default useAuthStore;
