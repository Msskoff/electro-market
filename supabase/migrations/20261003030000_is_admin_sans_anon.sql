-- Appliquée sur le projet Supabase « electromarket » le 2026-10-04.
-- Les visiteurs anonymes n'ont aucune politique qui appelle is_admin() : droit retiré
-- (avertissement « anon_security_definer_function_executable » de l'analyse de sécurité).
revoke execute on function public.is_admin() from anon;
