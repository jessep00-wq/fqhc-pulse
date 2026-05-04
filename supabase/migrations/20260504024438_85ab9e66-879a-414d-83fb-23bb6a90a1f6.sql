ALTER TABLE public.pdsa_cycles
  ADD COLUMN aim_statement text,
  ADD COLUMN prediction text,
  ADD COLUMN measurement_plan text,
  ADD COLUMN test_description text,
  ADD COLUMN analysis_summary text,
  ADD COLUMN decision text,
  ADD COLUMN template_id text;