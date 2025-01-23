-- Update points_transactions type check constraint to include airdrop
alter table points_transactions
drop constraint points_transactions_type_check;

alter table points_transactions
add constraint points_transactions_type_check check (
  type = any (array['earn'::text, 'redeem'::text, 'airdrop'::text])
);
