-- Insert initial market segments
INSERT INTO market_segments (name, description) VALUES
('SaaS B2B', 'Software as a Service para empresas'),
('E-commerce', 'Comercio electrónico y ventas online'),
('Fintech', 'Tecnología financiera'),
('Healthtech', 'Tecnología en salud'),
('Edtech', 'Tecnología educativa'),
('Proptech', 'Tecnología inmobiliaria'),
('Mobility', 'Movilidad y transporte'),
('Foodtech', 'Tecnología en alimentación'),
('Cleantech', 'Tecnología limpia y sostenibilidad'),
('AI/ML', 'Inteligencia artificial y machine learning'),
('Cybersecurity', 'Ciberseguridad'),
('IoT', 'Internet de las cosas'),
('Blockchain', 'Tecnología blockchain'),
('Gaming', 'Videojuegos y entretenimiento'),
('Media & Entertainment', 'Medios y entretenimiento'),
('Logistics', 'Logística y supply chain'),
('HR Tech', 'Tecnología de recursos humanos'),
('Legal Tech', 'Tecnología legal'),
('Marketing Tech', 'Tecnología de marketing'),
('DevOps', 'Desarrollo y operaciones');

-- Insert sub-segments
INSERT INTO market_segments (name, description, parent_segment_id) 
SELECT 'CRM', 'Customer Relationship Management', id FROM market_segments WHERE name = 'SaaS B2B';

INSERT INTO market_segments (name, description, parent_segment_id) 
SELECT 'ERP', 'Enterprise Resource Planning', id FROM market_segments WHERE name = 'SaaS B2B';

INSERT INTO market_segments (name, description, parent_segment_id) 
SELECT 'Payment Processing', 'Procesamiento de pagos', id FROM market_segments WHERE name = 'Fintech';

INSERT INTO market_segments (name, description, parent_segment_id) 
SELECT 'Lending', 'Préstamos y financiación', id FROM market_segments WHERE name = 'Fintech';

INSERT INTO market_segments (name, description, parent_segment_id) 
SELECT 'Insurance Tech', 'Tecnología de seguros', id FROM market_segments WHERE name = 'Fintech'; 