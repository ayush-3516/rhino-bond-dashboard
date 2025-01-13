-- Enable RLS on events table
alter table events enable row level security;

-- Policy to allow service_role full access
create policy "Service role full access"
on events
to service_role
using (true)
with check (true);

-- Policy to allow admins full access
create policy "Admin full access"
on events
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

-- Policy to allow authenticated users to create events
create policy "User create access"
on events
for insert
to authenticated
with check (true);

-- Policy to allow authenticated users to read events
create policy "User read access"
on events
for select
to authenticated
using (true);
