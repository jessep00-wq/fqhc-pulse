DROP TRIGGER IF EXISTS pdsa_cycles_revision_log ON public.pdsa_cycles;
CREATE TRIGGER pdsa_cycles_revision_log
AFTER INSERT OR UPDATE ON public.pdsa_cycles
FOR EACH ROW EXECUTE FUNCTION public.log_record_revision(
  'pdsa_cycle',
  'title,status,uds_measure,focus_area,root_cause,target_goal,clinical_workflow_impact,aim_statement,prediction,predicted_outcome,measurement_plan,baseline_rate,test_description,intervention_description,study_results,analysis_summary,actual_outcome,what_worked,what_didnt_work,act_next_steps,decision,next_cycle_decision,owner_user_id,start_date,opened_at,target_end_date,improvement_pct,structured_measures'
);