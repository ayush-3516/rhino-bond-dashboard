-- Drop existing function if it exists
drop function if exists insert_qr_code(uuid, uuid, integer, uuid);

-- Create a function that can insert QR codes with proper RLS checks
create function insert_qr_code(
  batch_id uuid,
  product_id uuid,
  points_value integer,
  created_by uuid
) returns jsonb as $$
declare
  user_role text;
  is_service_role boolean;
begin
  -- Check if called by service role
  is_service_role := current_user = 'service_role';
  
  -- If not service role, verify admin permissions
  if not is_service_role then
    -- Get user role
    select role into user_role
    from users
    where id = created_by::uuid;

    -- Only allow admins to insert QR codes
    if user_role != 'admin' then
      raise exception 'Only admins can generate QR codes' using errcode = '42501';
    end if;
  end if;

  -- Insert the QR code
  insert into qr_codes (batch_id, product_id, points_value, created_by)
  values (batch_id, product_id, points_value, created_by);

  -- Return the inserted record
  return to_jsonb((
    select * from qr_codes
    where id = (select currval(pg_get_serial_sequence('qr_codes', 'id'))::bigint)
  ));
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated and service roles
grant execute on function insert_qr_code(uuid, uuid, integer, uuid) to authenticated, service_role;
