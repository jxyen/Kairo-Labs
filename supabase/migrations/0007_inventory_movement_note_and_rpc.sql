-- adjustments carry a human note
alter table public.inventory_movements add column note text;

-- record a movement AND update stock atomically (one transaction)
create or replace function public.apply_inventory_movement(
  p_size_id    uuid,
  p_delta      integer,
  p_reason     public.inventory_reason,
  p_note       text,
  p_created_by uuid
) returns void
  language plpgsql
  security invoker            -- existing is_staff() RLS still gates writes
  set search_path = public as $$
declare
  new_qty integer;
begin
  insert into public.inventory_movements (size_id, delta, reason, note, created_by)
  values (p_size_id, p_delta, p_reason, p_note, p_created_by);

  update public.inventory
     set quantity_on_hand = quantity_on_hand + p_delta,
         updated_at = now()
   where size_id = p_size_id
  returning quantity_on_hand into new_qty;

  if new_qty is null then
    raise exception 'no inventory row for size %', p_size_id;
  end if;
  if new_qty < 0 then
    raise exception 'movement would drive stock negative (%)', new_qty;
  end if;
end;
$$;

grant execute on function public.apply_inventory_movement(
  uuid, integer, public.inventory_reason, text, uuid
) to authenticated, service_role;
