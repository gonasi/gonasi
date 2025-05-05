CREATE INDEX idx_staff_members_created_by ON public.staff_members (created_by);

CREATE INDEX user_active_companies_company_id_idx ON public.user_active_companies(company_id);