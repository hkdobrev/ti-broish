/** Subquery counts for companion confirm status on the admin roster. */
export const COMPANION_COUNTS_SQL = `,
  (SELECT COUNT(*) FROM companions c WHERE c.signup_id = signups.id AND COALESCE(c.email_confirmed, 0) = 0) AS companions_pending,
  (SELECT COUNT(*) FROM companions c WHERE c.signup_id = signups.id AND COALESCE(c.email_confirmed, 0) = 1) AS companions_confirmed`
