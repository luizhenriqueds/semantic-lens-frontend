alter table public.alerts drop constraint if exists alerts_cadence_check;
alter table public.alerts add constraint alerts_cadence_check
  check (cadence in ('daily', 'weekly', 'monthly'));
