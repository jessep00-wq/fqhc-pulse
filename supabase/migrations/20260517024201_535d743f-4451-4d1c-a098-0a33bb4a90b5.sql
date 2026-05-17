
UPDATE public.store_products
SET included_file_paths = ARRAY[
  '138a01f5-47cc-404b-9eff-2d4062d31500/HTN_PDSA_Template.docx',
  '138a01f5-47cc-404b-9eff-2d4062d31500/Measure_Snapshot_Template.docx',
  '138a01f5-47cc-404b-9eff-2d4062d31500/60_Day_Implementation_Tracker.docx',
  '138a01f5-47cc-404b-9eff-2d4062d31500/PDSA_Improvement_Bundle_Guide.pdf'
]
WHERE id = '138a01f5-47cc-404b-9eff-2d4062d31500';

UPDATE public.store_products
SET included_file_paths = ARRAY[
  'e6667d47-0fd8-41cf-89ad-bb80a2de9122/Diabetes_A1c_PDSA_Template.docx',
  'e6667d47-0fd8-41cf-89ad-bb80a2de9122/Measure_Snapshot_Template.docx',
  'e6667d47-0fd8-41cf-89ad-bb80a2de9122/60_Day_Implementation_Tracker.docx',
  'e6667d47-0fd8-41cf-89ad-bb80a2de9122/PDSA_Improvement_Bundle_Guide.pdf'
]
WHERE id = 'e6667d47-0fd8-41cf-89ad-bb80a2de9122';
