ALTER TABLE public.pdsa_cycles
  ADD COLUMN study_results text,
  ADD COLUMN what_worked text,
  ADD COLUMN what_didnt_work text,
  ADD COLUMN act_next_steps text;