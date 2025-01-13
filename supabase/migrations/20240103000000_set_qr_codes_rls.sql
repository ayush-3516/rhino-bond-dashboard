-- Enable RLS on qr_codes table
alter table qr_codes enable row level security;

-- Policy to allow service_role full access
create policy "Service role full access"
on qr_codes
to service_role
using (true)
with check (true);

-- Policy to allow admins full access
create policy "Admin full access"
on qr_codes
to authenticated
using (
  exists (
    select 1
    from users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from users
    where users.id = auth.uid()
      and users.role = 'admin'
  )
);

-- Policy to allow users to read their own codes
create policy "User read access"
on qr_codes
for select
to authenticated
using (
  created_by = auth.uid()
);
