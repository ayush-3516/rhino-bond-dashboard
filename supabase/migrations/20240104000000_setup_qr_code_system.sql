-- Create QR code generation function
create or replace function generate_qr_code(
  batch_id uuid,
  product_id uuid,
  points_value integer
) returns void as $$
declare
  user_id uuid := auth.uid();
begin
  insert into qr_codes (batch_id, product_id, points_value, created_by)
  values (batch_id, product_id, points_value, user_id);
end;
$$ language plpgsql security definer;

-- Enable RLS on qr_codes table
alter table qr_codes enable row level security;

-- Create RLS policies
create policy "Users can insert their own QR codes"
on qr_codes for insert
with check (auth.uid() = created_by);

create policy "Users can read their own QR codes" 
on qr_codes for select
using (auth.uid() = created_by);

create policy "Admins have full access"
on qr_codes for all
using (auth.role() = 'admin')
with check (auth.role() = 'admin');
