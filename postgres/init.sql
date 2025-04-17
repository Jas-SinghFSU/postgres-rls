CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
GRANT CONNECT ON DATABASE gobirds TO app_user;

\c gobirds

GRANT USAGE ON SCHEMA public TO app_user;

DROP TABLE IF EXISTS items;

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tenant_id TEXT NOT NULL
);

CREATE INDEX idx_items_tenant_id ON items(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE items TO app_user;
GRANT USAGE, SELECT ON SEQUENCE items_id_seq TO app_user;

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE items FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON items;

CREATE POLICY tenant_isolation_policy ON items
AS PERMISSIVE
FOR ALL
TO app_user
USING
    (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
WITH CHECK
    (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), ''));

INSERT INTO items (name, tenant_id)
SELECT
    'Item ' || tenant || ' #' || i,
    tenant
FROM generate_series(1, 1000) AS i,
LATERAL (
    SELECT unnest(ARRAY[
        'Facebook',
        'Amazon',
        'Apple',
        'Netflix',
        'Google',
    ]) AS tenant
) AS tenants;

