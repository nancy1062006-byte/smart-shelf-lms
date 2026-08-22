REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.issue_book(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.return_book(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_book(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(UUID) TO authenticated;