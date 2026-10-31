-- ==============================================================================
-- College Complaint Management System (CCMS)
-- Production-Ready PostgreSQL Relational Database Schema & Migration Script
-- Version: 1.0.0
-- ==============================================================================

-- Enable UUID extension for robust distributed keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description) VALUES
('student', 'Student', 'Enrolled student submitting and tracking personal complaints'),
('staff', 'Department Staff', 'Department personnel resolving and managing assigned complaints'),
('admin', 'Administrator', 'College administrator with institution-wide oversight and management')
ON CONFLICT (id) DO NOTHING;

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    head_of_department VARCHAR(100),
    contact_email VARCHAR(120) NOT NULL,
    contact_phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_active ON departments(is_active);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id VARCHAR(32) NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    student_id VARCHAR(64) UNIQUE, -- For students (e.g., Roll number)
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- For staff
    phone VARCHAR(30),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_email ON users(email);

-- 4. COMPLAINT CATEGORIES & SUBCATEGORIES
CREATE TABLE IF NOT EXISTS complaint_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(64) DEFAULT 'Folder',
    default_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_sensitive BOOLEAN DEFAULT FALSE, -- Routes to confidential escalation/admin only
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES complaint_categories(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, name)
);

CREATE INDEX idx_subcategories_category ON complaint_subcategories(category_id);

-- 5. COMPLAINT STATUS ENUM
DO $$ BEGIN
    CREATE TYPE complaint_status_enum AS ENUM (
        'submitted',
        'acknowledged',
        'assigned',
        'in_progress',
        'awaiting_student_response',
        'escalated',
        'resolved',
        'closed',
        'reopened',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 6. COMPLAINT PRIORITY ENUM
DO $$ BEGIN
    CREATE TYPE complaint_priority_enum AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. SLA RULES TABLE
CREATE TABLE IF NOT EXISTS escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    priority complaint_priority_enum NOT NULL UNIQUE,
    acknowledgement_target_hours INT NOT NULL DEFAULT 24,
    resolution_target_hours INT NOT NULL DEFAULT 72,
    escalation_threshold_hours INT NOT NULL DEFAULT 96,
    auto_escalate BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMPLAINTS CORE TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(32) PRIMARY KEY, -- Human readable ID, e.g. CCMS-2026-1001
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES complaint_categories(id),
    subcategory_id UUID REFERENCES complaint_subcategories(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    student_id UUID NOT NULL REFERENCES users(id),
    assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    priority complaint_priority_enum NOT NULL DEFAULT 'medium',
    status complaint_status_enum NOT NULL DEFAULT 'submitted',
    
    -- Specific location breakdown
    campus_area VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    floor VARCHAR(50),
    room_number VARCHAR(50),
    
    preferred_contact VARCHAR(30) DEFAULT 'portal',
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- SLA tracking
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_overdue BOOLEAN DEFAULT FALSE,
    
    -- Reopening details
    reopen_count INT DEFAULT 0,
    last_reopened_at TIMESTAMP WITH TIME ZONE,
    reopen_reason TEXT,
    
    -- Resolution record
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by_id UUID REFERENCES users(id),
    resolution_action_taken TEXT,
    resolution_preventative_measures TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_department ON complaints(department_id);
CREATE INDEX idx_complaints_assigned_staff ON complaints(assigned_staff_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_category ON complaints(category_id);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_sla ON complaints(sla_deadline, is_overdue);

-- 9. COMPLAINT ATTACHMENTS
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_complaint ON complaint_attachments(complaint_id);

-- 10. COMPLAINT COMMENTS & INTERNAL NOTES
CREATE TABLE IF NOT EXISTS complaint_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- True: visible ONLY to Staff and Admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_complaint ON complaint_comments(complaint_id);

-- 11. COMPLAINT STATUS HISTORY (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    from_status complaint_status_enum,
    to_status complaint_status_enum NOT NULL,
    changed_by_id UUID NOT NULL REFERENCES users(id),
    remarks TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_complaint ON complaint_status_history(complaint_id);

-- 12. COMPLAINT FEEDBACK & RATINGS
CREATE TABLE IF NOT EXISTS complaint_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. IN-APP NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    complaint_id VARCHAR(32) REFERENCES complaints(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- 14. COMPREHENSIVE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(32),
    user_name VARCHAR(120),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 15. AUTOMATIC TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_complaints_modtime
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_departments_modtime
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
