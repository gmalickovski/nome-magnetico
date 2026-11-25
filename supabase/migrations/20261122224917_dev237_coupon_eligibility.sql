ALTER TABLE public.access_codes
  ADD COLUMN excluded_user_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN new_customers_only boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT access_codes_coupon_eligibility_check CHECK (
    kind = 'coupon' OR (cardinality(excluded_user_ids) = 0 AND NOT new_customers_only)
  );
