/* =========================================================================
   FALLBACK CUSTOMER DATA
   Used only when Supabase is not configured (no VITE_SUPABASE_URL / KEY) or
   unreachable, so the demo never breaks. Shape mirrors the real
   s_pankki_customers table exactly.

   The app logic never branches on any of these names/ids — getCustomers()
   just returns whatever rows it has (Supabase or this list), generically.
   Swap, add or remove rows here freely.
   ========================================================================= */
export const FALLBACK_CUSTOMERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    personal_id: '130588-123A',
    full_name: 'Anna Mäkinen',
    date_of_birth: '1988-05-13',
    phone: '+358401234567',
    email: 'anna.makinen@example.com',
    customer_segment: 'private'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    personal_id: '220385-456B',
    full_name: 'Mikko Mäkinen',
    date_of_birth: '1985-03-22',
    phone: '+358409876543',
    email: 'mikko.makinen@example.com',
    customer_segment: 'private'
  }
];
