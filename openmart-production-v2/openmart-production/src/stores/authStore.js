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

      loginCustomer: async (email, password) => {
        if (!isSupabaseConfigured) {
          return { success: false, message: 'Supabase database is not configured.' };
        }
        const normalizedEmail = email.trim().toLowerCase();
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
          });
          if (error) throw error;

          if (!data.user) {
            throw new Error('User data is missing.');
          }

          set({
            user: {
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Customer',
              email: data.user.email,
              role: 'customer',
              phone: data.user.phone || '',
              address: data.user.user_metadata?.address || '',
            },
            isAuthenticated: true,
          });

          return { success: true, message: 'Signed in successfully.' };
        } catch (err) {
          console.error('Supabase sign-in error:', err);
          return { success: false, message: err.message || 'Invalid customer credentials.' };
        }
      },

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
              }
            }
          });
          if (error) throw error;

          const user = data.user;
          if (user) {
            set({
              user: {
                id: user.id,
                name: trimmedName,
                email: user.email,
                role: 'customer',
                phone: user.phone || '',
                address: '',
              },
              isAuthenticated: true,
            });
          }

          return { 
            success: true, 
            message: data.session ? 'Signed up and logged in successfully.' : 'Sign up successful! Please check your email for confirmation.' 
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

      updateCustomerProfile: (email, updatedFields) => {
        const normalizedEmail = email.trim().toLowerCase();
        const updatedCustomers = get().customers.map((c) =>
          c.email.toLowerCase() === normalizedEmail
            ? { ...c, ...updatedFields }
            : c
        );

        const currentCustomer = updatedCustomers.find((c) => c.email.toLowerCase() === normalizedEmail);

        if (get().user && get().user.email.toLowerCase() === normalizedEmail) {
          set({
            customers: updatedCustomers,
            user: {
              ...get().user,
              name: currentCustomer.name,
              phone: currentCustomer.phone || '',
              address: currentCustomer.address || '',
            },
          });
        } else {
          set({ customers: updatedCustomers });
        }

        return { success: true, message: 'Profile updated successfully.' };
      },

      updateCustomerPassword: (email, currentPassword, newPassword) => {
        const normalizedEmail = email.trim().toLowerCase();
        const customerIdx = get().customers.findIndex(
          (c) => c.email.toLowerCase() === normalizedEmail
        );

        if (customerIdx === -1) {
          return { success: false, message: 'Customer account not found.' };
        }

        const customer = get().customers[customerIdx];
        if (customer.password !== currentPassword) {
          return { success: false, message: 'Incorrect current password.' };
        }

        const updatedCustomers = [...get().customers];
        updatedCustomers[customerIdx] = {
          ...customer,
          password: newPassword,
        };

        set({ customers: updatedCustomers });
        return { success: true, message: 'Password updated successfully.' };
      },

      logout: async () => {
        if (isSupabaseConfigured) {
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
