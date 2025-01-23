-- Create a function to update points balance for multiple users
create or replace function update_points_balance(user_ids uuid[], points integer)
returns void as $$
begin
  update users
  set points_balance = points_balance + points
  where id = any(user_ids);
end;
$$ language plpgsql;
