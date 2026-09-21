-- ============================================================================
-- CRM AUTOMOTOR SERVERLESS ($0 COST) - SUPABASE POSTGRESQL DDL SCRIPT
-- ============================================================================
-- Para ejecutar en: Supabase Dashboard > SQL Editor > Run
-- ============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    apellido VARCHAR(150),
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    tipo_documento VARCHAR(20) DEFAULT 'DNI',
    numero_documento VARCHAR(30),
    domicilio_calle VARCHAR(200),
    domicilio_numero VARCHAR(30),
    localidad VARCHAR(150),
    provincia VARCHAR(150),
    codigo_postal VARCHAR(20),
    compro_credito BOOLEAN DEFAULT FALSE,
    monto_credito NUMERIC(12, 2) DEFAULT 0.00,
    deja_auto_permuta BOOLEAN DEFAULT FALSE,
    auto_permuta_detalle TEXT,
    tipo_cliente VARCHAR(30) NOT NULL DEFAULT 'prospecto',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: inventario
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patente VARCHAR(20) UNIQUE,
    marca VARCHAR(60) NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    tipo_vehiculo VARCHAR(50) DEFAULT 'Sedán',
    numero_chasis VARCHAR(50),
    numero_motor VARCHAR(50),
    anio INT NOT NULL,
    kilometraje INT NOT NULL DEFAULT 0,
    es_cero_km BOOLEAN DEFAULT FALSE,
    precio_lista NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    costo_compra NUMERIC(12, 2) DEFAULT 0.00,
    origen_stock VARCHAR(30) DEFAULT 'Propio' CHECK (origen_stock IN ('Propio', 'Consignación')),
    dueno_consigna_nombre VARCHAR(150),
    dueno_consigna_telefono VARCHAR(50),
    dueno_consigna_documento VARCHAR(30),
    estado VARCHAR(30) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'reservado', 'vendido', 'reacondicionamiento')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: presupuestos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
    vehiculos_cotizados JSONB,
    precio_ofrecido NUMERIC(12, 2) NOT NULL,
    anticipo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    saldo_financiado NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado', 'ganado', 'perdido')),
    motivo_perdida VARCHAR(100) CHECK (
        motivo_perdida IS NULL OR 
        motivo_perdida IN ('Precio alto', 'Financiación inviable', 'Tasación baja', 'Sin stock', 'Compró en otra agencia', 'Otro')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: permutas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permutas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    patente VARCHAR(20),
    marca_modelo VARCHAR(120) NOT NULL,
    anio INT NOT NULL,
    kilometraje INT NOT NULL DEFAULT 0,
    valor_tasacion NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. TABLA: interacciones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Llamó', 'Vino al salón', 'No contesta', 'WhatsApp', 'Mail', 'Otro')),
    nota TEXT NOT NULL,
    fecha_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    proximo_contacto TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INDICES PARA OPTIMIZACION DE BUSQUEDAS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_inventario_patente ON inventario(patente);
CREATE INDEX IF NOT EXISTS idx_inventario_estado ON inventario(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_interacciones_proximo_contacto ON interacciones(proximo_contacto);

-- ============================================================================
-- AUTOMATIZACION OPERATIVA (TRIGGERS POSTGRESQL)
-- ============================================================================

-- Function 1: Actualizar vehículo a 'vendido' e ingresar permuta como 'reacondicionamiento' al ganar presupuesto
CREATE OR REPLACE FUNCTION procesar_cierre_presupuesto_ganado()
RETURNS TRIGGER AS $$
DECLARE
    rec_permuta RECORD;
    v_marca VARCHAR(60);
    v_modelo VARCHAR(60);
BEGIN
    -- Verificar si el estado del presupuesto cambió a 'ganado'
    IF NEW.estado = 'ganado' AND (OLD.estado IS NULL OR OLD.estado <> 'ganado') THEN
        
        -- 1. Actualizar vehículo vendido en inventario
        IF NEW.vehiculo_id IS NOT NULL THEN
            UPDATE inventario
            SET estado = 'vendido'
            WHERE id = NEW.vehiculo_id;
        END IF;

        -- 2. Actualizar cliente a 'comprador'
        UPDATE clientes
        SET tipo_cliente = 'comprador'
        WHERE id = NEW.cliente_id;

        -- 3. Si existe permuta asociada a este presupuesto, ingresarla al inventario en 'reacondicionamiento'
        FOR rec_permuta IN 
            SELECT * FROM permutas WHERE presupuesto_id = NEW.id
        LOOP
            -- Separar marca y modelo simple
            v_marca := SPLIT_PART(rec_permuta.marca_modelo, ' ', 1);
            v_modelo := SUBSTRING(rec_permuta.marca_modelo FROM LENGTH(v_marca) + 2);
            IF v_modelo IS NULL OR v_modelo = '' THEN
                v_modelo := 'Usado Permuta';
            END IF;

            INSERT INTO inventario (
                patente,
                marca,
                modelo,
                anio,
                kilometraje,
                es_cero_km,
                precio_lista,
                costo_compra,
                estado,
                observaciones
            ) VALUES (
                UPPER(rec_permuta.patente),
                v_marca,
                v_modelo,
                rec_permuta.anio,
                rec_permuta.kilometraje,
                FALSE,
                rec_permuta.valor_tasacion * 1.15, -- Precio sugerido inicial 15% sobre tasación
                rec_permuta.valor_tasacion,        -- Costo de compra = valor de toma
                'reacondicionamiento',
                CONCAT('Ingresado por permuta de presupuesto: ', NEW.id, '. Notas: ', rec_permuta.observaciones)
            );
        END LOOP;

    ELSIF NEW.estado = 'perdido' AND (OLD.estado IS NULL OR OLD.estado <> 'perdido') THEN
        -- Si el cliente perdió el presupuesto, se categoriza como 'no_compro'
        UPDATE clientes
        SET tipo_cliente = 'no_compro'
        WHERE id = NEW.cliente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger binding
DROP TRIGGER IF EXISTS trg_cierre_presupuesto ON presupuestos;
CREATE TRIGGER trg_cierre_presupuesto
    AFTER INSERT OR UPDATE OF estado ON presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION procesar_cierre_presupuesto_ganado();


-- ============================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE permutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones ENABLE ROW LEVEL SECURITY;

-- Politicas RLS permisivas para desarrollo/demostración (Permite lectura y escritura a usuarios autenticados y anonimos con anon-key)
CREATE POLICY "Permitir select total en clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Permitir insert/update en clientes" ON clientes FOR ALL USING (true);

CREATE POLICY "Permitir select total en inventario" ON inventario FOR SELECT USING (true);
CREATE POLICY "Permitir insert/update en inventario" ON inventario FOR ALL USING (true);

CREATE POLICY "Permitir select total en presupuestos" ON presupuestos FOR SELECT USING (true);
CREATE POLICY "Permitir insert/update en presupuestos" ON presupuestos FOR ALL USING (true);

CREATE POLICY "Permitir select total en permutas" ON permutas FOR SELECT USING (true);
CREATE POLICY "Permitir insert/update en permutas" ON permutas FOR ALL USING (true);

CREATE POLICY "Permitir select total en interacciones" ON interacciones FOR SELECT USING (true);
CREATE POLICY "Permitir insert/update en interacciones" ON interacciones FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 6. TABLA: pedidos_encargo (Agenda de Vehículos Solicitados por Encargo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos_encargo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    marca_buscada VARCHAR(60) NOT NULL,
    modelo_buscado VARCHAR(60) NOT NULL,
    anio_minimo INT,
    anio_maximo INT,
    presupuesto_maximo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    es_cero_km BOOLEAN DEFAULT FALSE,
    color_preferencia VARCHAR(50),
    estado VARCHAR(40) NOT NULL DEFAULT 'Buscando en Mercado' 
        CHECK (estado IN ('Buscando en Mercado', 'Unidad Localizada', 'En Negociación', 'Adquirido para Cliente', 'Operación Cancelada')),
    vehiculo_coincidente_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. TABLA: prestamos_pagares (Financiación Propia / Préstamos con Pagarés)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prestamos_pagares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    vehiculo_id UUID REFERENCES inventario(id) ON DELETE SET NULL,
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE SET NULL,
    monto_total_prestado NUMERIC(12, 2) NOT NULL,
    cantidad_cuotas INT NOT NULL DEFAULT 12,
    tasa_interes_anual NUMERIC(5, 2) DEFAULT 0.00,
    monto_cuota_promedio NUMERIC(12, 2) NOT NULL,
    fecha_otorgamiento DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Finalizado', 'En Legales', 'Refinanciado')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. TABLA: cuotas_pagares (Calendario y Vencimientos de Pagarés)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuotas_pagares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prestamo_id UUID NOT NULL REFERENCES prestamos_pagares(id) ON DELETE CASCADE,
    numero_cuota INT NOT NULL,
    numero_pagare VARCHAR(50),
    monto_cuota NUMERIC(12, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Cobrado', 'Parcialmente Cobrado', 'Vencido')),
    monto_pagado NUMERIC(12, 2) DEFAULT 0.00,
    fecha_pago TIMESTAMP WITH TIME ZONE,
    comprobante_pago VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. TABLA: reclamos_cobranza (Gestión de Llamados y Reclamos de Pagarés)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reclamos_cobranza (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuota_id UUID NOT NULL REFERENCES cuotas_pagares(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    fecha_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_gestion VARCHAR(50) NOT NULL CHECK (tipo_gestion IN ('Llamada Telefónica', 'Mensaje WhatsApp', 'Carta Documento', 'Visita Domiciliaria', 'Reunión en Concesionaria')),
    resultado_gestion VARCHAR(60) NOT NULL CHECK (resultado_gestion IN ('Compromiso de Pago', 'No Contesta', 'Número Inexistente', 'Promesa de Pago Incumplida', 'Solicita Refinanciación', 'Derivado a Abogado')),
    fecha_compromiso_pago DATE,
    monto_prometido NUMERIC(12, 2),
    detalle_reclamo TEXT NOT NULL,
    atendido_por VARCHAR(100) DEFAULT 'Administración'
);

-- Indices adicionales
CREATE INDEX IF NOT EXISTS idx_pedidos_encargo_estado ON pedidos_encargo(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_pagares_vencimiento ON cuotas_pagares(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cuotas_pagares_estado ON cuotas_pagares(estado);

-- ============================================================================
-- 11. TABLA: perfiles_usuarios (RBAC: vendedor, admin, superadmin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS perfiles_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL CHECK (rol IN ('vendedor', 'admin', 'superadmin')) DEFAULT 'vendedor',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper para consultar el rol del usuario autenticado sin recursión
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT rol FROM public.perfiles_usuarios WHERE id = auth.uid();
$$;

-- ============================================================================
-- 12. VISTA SEGURA: vista_inventario_comercial (Sin costos ni márgenes para vendedores)
-- ============================================================================
CREATE OR REPLACE VIEW vista_inventario_comercial AS
SELECT 
    id,
    patente,
    marca,
    modelo,
    tipo_vehiculo,
    numero_chasis,
    numero_motor,
    anio,
    kilometraje,
    es_cero_km,
    precio_lista, -- Solo precio de venta comercial
    origen_stock,
    estado,
    observaciones,
    created_at
FROM inventario;

-- ============================================================================
-- 13. TABLA: catalogo_vehiculos (Catálogo Unificado Argentina & Fuzzy Search)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS catalogo_vehiculos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    version_completa TEXT NOT NULL,
    tipo TEXT, -- Pick-up, SUV, Sedán, Hatchback, Utilitario, etc.
    origen TEXT, -- Nacional / Importado
    anios_disponibles INT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_catalogo_marca_modelo ON catalogo_vehiculos(marca, modelo);
CREATE INDEX IF NOT EXISTS idx_catalogo_trgm ON catalogo_vehiculos USING gin (version_completa gin_trgm_ops);

-- Vinculación en inventario y permutas (FK y columnas de especificación)
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS catalogo_id BIGINT REFERENCES catalogo_vehiculos(id) ON DELETE SET NULL;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS version TEXT;
CREATE INDEX IF NOT EXISTS idx_inventario_catalogo ON inventario(catalogo_id);

ALTER TABLE permutas ADD COLUMN IF NOT EXISTS marca TEXT;
ALTER TABLE permutas ADD COLUMN IF NOT EXISTS modelo TEXT;
ALTER TABLE permutas ADD COLUMN IF NOT EXISTS version TEXT;

-- ============================================================================
-- 14. POLÍTICAS RLS ESTRICTAS (SEGURIDAD POR ROL)
-- ============================================================================
ALTER TABLE pedidos_encargo ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos_pagares ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas_pagares ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamos_cobranza ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_vehiculos ENABLE ROW LEVEL SECURITY;

-- Pedidos Encargos: Lectura y escritura a usuarios autenticados
CREATE POLICY "Pedidos Encargo: Acceso autenticados" ON pedidos_encargo FOR ALL TO authenticated USING (true);

-- Pagarés y cobranzas: EXCLUSIVO Admin y SuperAdmin
CREATE POLICY "Pagarés: Solo Admin y SuperAdmin"
ON prestamos_pagares FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Cuotas: Solo Admin y SuperAdmin"
ON cuotas_pagares FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Reclamos: Solo Admin y SuperAdmin"
ON reclamos_cobranza FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- Perfiles de usuarios
CREATE POLICY "Perfiles: Lectura a todos los autenticados"
ON perfiles_usuarios FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Perfiles: Gestión solo Admin y SuperAdmin"
ON perfiles_usuarios FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- Catálogo: lectura a todos los autenticados
CREATE POLICY "Catálogo: Lectura a todos los autenticados"
ON catalogo_vehiculos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Catálogo: Gestión solo Admin y SuperAdmin"
ON catalogo_vehiculos FOR ALL TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

