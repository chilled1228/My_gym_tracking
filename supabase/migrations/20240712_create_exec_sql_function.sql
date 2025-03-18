-- Create a function to execute SQL statements
-- This function requires the service role to execute
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION exec_sql FROM PUBLIC;

-- Grant execute to authenticated users (service role will still have access)
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated; 