-- ==============================================================================
-- College Complaint Management System (CCMS)
-- Production-Grade MySQL 8.0+ Relational Database Schema & Migration Script
-- Target Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Compatible with: MySQL 8.0.16+, MySQL Workbench, AWS RDS MySQL, GCP Cloud SQL
-- ==============================================================================

-- Safe execution settings
SET NAMES utf8mb4;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------------------------
-- Database Creation
-- ------------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS ccms_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ccms_db;

-- ------------------------------------------------------------------------------
-- 1. ROLES TABLE
-- Reference lookup table for system actors: student, staff, admin
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(32) NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. DEPARTMENTS TABLE
-- Academic, administrative, and maintenance college divisions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    head_of_department VARCHAR(100) NULL,
    contact_email VARCHAR(120) NOT NULL,
    contact_phone VARCHAR(30) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_departments_code (code),
    INDEX idx_departments_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. USERS TABLE
-- Core accounts spanning students, departmental staff, and institution admins
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL,
    role_id VARCHAR(32) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    student_id VARCHAR(64) NULL, -- For students (e.g., Roll number ENG-2024-CSE-042)
    department_id VARCHAR(36) NULL, -- For staff members assigned to a department
    phone VARCHAR(30) NULL,
    avatar_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_student_id (student_id),
    INDEX idx_users_role (role_id),
    INDEX idx_users_department (department_id),
    INDEX idx_users_email (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. COMPLAINT CATEGORIES & SUBCATEGORIES
-- Two-tiered categorization hierarchy for routing complaints to correct departments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_categories (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    icon_name VARCHAR(64) NULL DEFAULT 'Folder',
    default_department_id VARCHAR(36) NULL,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE, -- Routes to confidential escalation/admin only
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (name),
    INDEX idx_categories_default_dept (default_department_id),
    CONSTRAINT fk_categories_department FOREIGN KEY (default_department_id) 
        REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaint_subcategories (
    id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_category_subcategory_name (category_id, name),
    INDEX idx_subcategories_category (category_id),
    CONSTRAINT fk_subcategories_category FOREIGN KEY (category_id) 
        REFERENCES complaint_categories(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5 & 6. ENUM TYPES
-- In MySQL, ENUM values are declared inline within column definitions:
-- Priority:  ('low', 'medium', 'high', 'critical')
-- Status:    ('submitted', 'acknowledged', 'assigned', 'in_progress', 
--             'awaiting_student_response', 'escalated', 'resolved', 
--             'closed', 'reopened', 'rejected')
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- 7. SLA RULES TABLE (escalation_rules)
-- Service Level Agreement timelines and auto-escalation thresholds per priority
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escalation_rules (
    id VARCHAR(36) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    acknowledgement_target_hours INT NOT NULL DEFAULT 24,
    resolution_target_hours INT NOT NULL DEFAULT 72,
    escalation_threshold_hours INT NOT NULL DEFAULT 96,
    auto_escalate BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_escalation_rules_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. COMPLAINTS CORE TABLE
-- Central entity storing ticket details, location, status lifecycle & resolution
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(32) NOT NULL, -- Human-readable identifier e.g., CCMS-2026-1001
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    subcategory_id VARCHAR(36) NULL,
    department_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    assigned_staff_id VARCHAR(36) NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM(
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
    ) NOT NULL DEFAULT 'submitted',

    -- Campus physical location breakdown
    campus_area VARCHAR(100) NOT NULL,
    building VARCHAR(100) NULL,
    floor VARCHAR(50) NULL,
    room_number VARCHAR(50) NULL,

    preferred_contact VARCHAR(30) NULL DEFAULT 'portal',
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,

    -- SLA tracking
    sla_deadline DATETIME NOT NULL,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,

    -- Reopening details
    reopen_count INT NOT NULL DEFAULT 0,
    last_reopened_at DATETIME NULL,
    reopen_reason TEXT NULL,

    -- Resolution record
    resolved_at DATETIME NULL,
    resolved_by_id VARCHAR(36) NULL,
    resolution_action_taken TEXT NULL,
    resolution_preventative_measures TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_complaints_student (student_id),
    INDEX idx_complaints_department (department_id),
    INDEX idx_complaints_assigned_staff (assigned_staff_id),
    INDEX idx_complaints_status (status),
    INDEX idx_complaints_priority (priority),
    INDEX idx_complaints_category (category_id),
    INDEX idx_complaints_subcategory (subcategory_id),
    INDEX idx_complaints_created_at (created_at),
    INDEX idx_complaints_sla (sla_deadline, is_overdue),
    CONSTRAINT fk_complaints_category FOREIGN KEY (category_id) 
        REFERENCES complaint_categories(id) ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_subcategory FOREIGN KEY (subcategory_id) 
        REFERENCES complaint_subcategories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) 
        REFERENCES users(id) ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_assigned_staff FOREIGN KEY (assigned_staff_id) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_complaints_resolved_by FOREIGN KEY (resolved_by_id) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. COMPLAINT ATTACHMENTS
-- Supporting evidence documents, images, error screenshots
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id VARCHAR(36) NOT NULL,
    complaint_id VARCHAR(32) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_attachments_complaint (complaint_id),
    INDEX idx_attachments_uploaded_by (uploaded_by),
    CONSTRAINT fk_attachments_complaint FOREIGN KEY (complaint_id) 
        REFERENCES complaints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) 
        REFERENCES users(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. COMPLAINT COMMENTS & INTERNAL NOTES
-- Communication thread between students, staff, and admin (with internal note flag)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_comments (
    id VARCHAR(36) NOT NULL,
    complaint_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- True: visible ONLY to Staff and Admin
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_comments_complaint (complaint_id),
    INDEX idx_comments_user (user_id),
    CONSTRAINT fk_comments_complaint FOREIGN KEY (complaint_id) 
        REFERENCES complaints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. COMPLAINT STATUS HISTORY (AUDIT TRAIL)
-- Immutable transition log tracking state changes, actor, and mandatory remarks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id VARCHAR(36) NOT NULL,
    complaint_id VARCHAR(32) NOT NULL,
    from_status ENUM(
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
    ) NULL,
    to_status ENUM(
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
    ) NOT NULL,
    changed_by_id VARCHAR(36) NOT NULL,
    remarks TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_status_history_complaint (complaint_id),
    INDEX idx_status_history_user (changed_by_id),
    CONSTRAINT fk_status_history_complaint FOREIGN KEY (complaint_id) 
        REFERENCES complaints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by_id) 
        REFERENCES users(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. COMPLAINT FEEDBACK & RATINGS
-- Post-resolution student feedback, 1-5 star ratings and satisfaction comments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_feedback (
    id VARCHAR(36) NOT NULL,
    complaint_id VARCHAR(32) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL,
    comments TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_feedback_complaint (complaint_id),
    INDEX idx_feedback_student (student_id),
    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_feedback_complaint FOREIGN KEY (complaint_id) 
        REFERENCES complaints(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) 
        REFERENCES users(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. IN-APP NOTIFICATIONS
-- Real-time notification dispatch for status updates, comments, and SLA alerts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    complaint_id VARCHAR(32) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notifications_user (user_id, is_read),
    INDEX idx_notifications_complaint (complaint_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_complaint FOREIGN KEY (complaint_id) 
        REFERENCES complaints(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. COMPREHENSIVE AUDIT LOGS
-- Immutable system-wide access, modification, and security compliance audit trail
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    user_role VARCHAR(32) NULL,
    user_name VARCHAR(120) NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_created_at (created_at),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 15. AUTOMATIC UUID GENERATION TRIGGERS (MySQL 8.0 Compatible)
-- Automatically generates a standard RFC 4122 UUID() when id is omitted or NULL
-- ==============================================================================
DELIMITER //

DROP TRIGGER IF EXISTS trg_departments_before_insert //
CREATE TRIGGER trg_departments_before_insert
BEFORE INSERT ON departments
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_users_before_insert //
CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_categories_before_insert //
CREATE TRIGGER trg_categories_before_insert
BEFORE INSERT ON complaint_categories
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_subcategories_before_insert //
CREATE TRIGGER trg_subcategories_before_insert
BEFORE INSERT ON complaint_subcategories
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_escalation_rules_before_insert //
CREATE TRIGGER trg_escalation_rules_before_insert
BEFORE INSERT ON escalation_rules
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_attachments_before_insert //
CREATE TRIGGER trg_attachments_before_insert
BEFORE INSERT ON complaint_attachments
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_comments_before_insert //
CREATE TRIGGER trg_comments_before_insert
BEFORE INSERT ON complaint_comments
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_status_history_before_insert //
CREATE TRIGGER trg_status_history_before_insert
BEFORE INSERT ON complaint_status_history
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_feedback_before_insert //
CREATE TRIGGER trg_feedback_before_insert
BEFORE INSERT ON complaint_feedback
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_notifications_before_insert //
CREATE TRIGGER trg_notifications_before_insert
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DROP TRIGGER IF EXISTS trg_audit_logs_before_insert //
CREATE TRIGGER trg_audit_logs_before_insert
BEFORE INSERT ON audit_logs
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END //

DELIMITER ;

-- ==============================================================================
-- 16. SEED DATA (Essential Reference Data & Demo Master Records)
-- Idempotent insertions using INSERT IGNORE
-- ==============================================================================

-- A. ROLES
INSERT IGNORE INTO roles (id, name, description) VALUES
('student', 'Student', 'Enrolled student submitting and tracking personal complaints'),
('staff', 'Department Staff', 'Department personnel resolving and managing assigned complaints'),
('admin', 'Administrator', 'College administrator with institution-wide oversight and management');

-- B. DEPARTMENTS
INSERT IGNORE INTO departments (id, code, name, description, head_of_department, contact_email, contact_phone, is_active) VALUES
('dept-it', 'DEPT-IT', 'IT Services & Network Infrastructure', 'Responsible for campus Wi-Fi, computer labs, student portals, and university software systems.', 'Dr. Suresh Chandra', 'it-support@college.edu', '+91 98765 43210', TRUE),
('dept-maint', 'DEPT-MAINT', 'Campus Works & Estate Maintenance', 'Oversees civil, electrical, plumbing, sanitation, and physical campus infrastructure.', 'Er. Rajesh Kumar', 'maintenance@college.edu', '+91 98765 43211', TRUE),
('dept-acad', 'DEPT-ACAD', 'Academic Affairs & Examinations', 'Manages timetables, grade disputes, attendance records, exam schedules, and curriculum resources.', 'Prof. Anjali Mathur', 'academics@college.edu', '+91 98765 43212', TRUE),
('dept-admin', 'DEPT-ADMIN', 'Administration & Student Services', 'Handles student documentation, fee receipts, scholarships, certificates, and general administrative services.', 'Mr. Arvind Gupta', 'admin.desk@college.edu', '+91 98765 43213', TRUE),
('dept-lib', 'DEPT-LIB', 'Central Library Services', 'Manages physical and digital catalog, lending, reading halls, and academic subscriptions.', 'Dr. Meenakshi Sundaram', 'library@college.edu', '+91 98765 43214', TRUE),
('dept-hostel', 'DEPT-HOSTEL', 'Hostels & Campus Facilities', 'Oversees residential rooms, mess, drinking water, cleanliness, and residential wardens.', 'Chief Warden Col. R. K. Singh', 'hostel-warden@college.edu', '+91 98765 43215', TRUE),
('dept-trans', 'DEPT-TRANS', 'Transport & Fleet Management', 'Coordinates university bus routes, drivers, schedules, and vehicle maintenance.', 'Mr. Bhupendra Singh', 'transport@college.edu', '+91 98765 43216', TRUE),
('dept-sec', 'DEPT-SEC', 'Campus Safety & Confidential Proctoring', 'Dedicated committee handling campus security, emergency concerns, harassment, and confidential student safety.', 'Prof. David Miller (Proctorial Board)', 'safety.confidential@college.edu', '+91 98765 43219', TRUE);

-- C. COMPLAINT CATEGORIES
INSERT IGNORE INTO complaint_categories (id, name, description, icon_name, default_department_id, is_sensitive, is_active) VALUES
('cat-infra', 'Infrastructure and Maintenance', 'Physical classrooms, electrical fittings, water supply, laboratory desks, and general building repairs.', 'Wrench', 'dept-maint', FALSE, TRUE),
('cat-it', 'IT and Technical Issues', 'Campus Wi-Fi connectivity, computer labs, college portal problems, account access, and projectors.', 'Wifi', 'dept-it', FALSE, TRUE),
('cat-acad', 'Academic Issues', 'Timetable discrepancies, examination schedules, attendance rectifications, and faculty communication.', 'BookOpen', 'dept-acad', FALSE, TRUE),
('cat-admin', 'Administration', 'Certificates, bona fide letters, fee receipt verification, and administrative processing delays.', 'FileText', 'dept-admin', FALSE, TRUE),
('cat-lib', 'Library', 'Book lending, digital IEEE/ACM journal access, reading hall facilities, and late fee inquiries.', 'Library', 'dept-lib', FALSE, TRUE),
('cat-hostel', 'Hostel and Campus Facilities', 'Room upkeep, mess food hygiene, purified water coolers, washrooms, and hostel curfew amenities.', 'Home', 'dept-hostel', FALSE, TRUE),
('cat-trans', 'Transportation', 'University bus schedules, delay alerts, overcrowding, route adjustments, and bus passes.', 'Bus', 'dept-trans', FALSE, TRUE),
('cat-sec', 'Safety and Security', 'Unsafe conditions, poorly lit pathways, emergency access, harassment, bullying, and confidential safety concerns.', 'ShieldAlert', 'dept-sec', TRUE, TRUE),
('cat-other', 'Other Issues', 'General college grievances not covered under specific departmental categories.', 'HelpCircle', 'dept-admin', FALSE, TRUE);

-- D. COMPLAINT SUBCATEGORIES
INSERT IGNORE INTO complaint_subcategories (id, category_id, name, description, is_active) VALUES
-- Infrastructure
('sub-infra-1', 'cat-infra', 'Classroom Maintenance', 'Desks, chalkboards, lighting and fans', TRUE),
('sub-infra-2', 'cat-infra', 'Electrical Issues', 'Power sockets, circuit breakers and switches', TRUE),
('sub-infra-3', 'cat-infra', 'Water Supply & Plumbing', 'Restroom leaks, taps and flush fixtures', TRUE),
('sub-infra-4', 'cat-infra', 'Furniture & Desk Damage', 'Broken chairs and laboratory benches', TRUE),
('sub-infra-5', 'cat-infra', 'Laboratory Equipment', 'Experimental setups, gas pipelines and meters', TRUE),
('sub-infra-6', 'cat-infra', 'Building & Structural Repair', 'Roof leakages, plaster and floor damages', TRUE),
-- IT & Technical
('sub-it-1', 'cat-it', 'Wi-Fi & Internet Connectivity', 'Campus AP signal drops and bandwidth limits', TRUE),
('sub-it-2', 'cat-it', 'Computer Laboratory Hardware/OS', 'Workstation faults, keyboard/mouse replacement', TRUE),
('sub-it-3', 'cat-it', 'College ERP / Student Portal', 'Exam enrollment and attendance system errors', TRUE),
('sub-it-4', 'cat-it', 'Student Email & Account Access', 'Password resets and LDAP authentication', TRUE),
('sub-it-5', 'cat-it', 'Smart Classroom Audio/Projector', 'HDMI issues, ceiling speakers and screens', TRUE),
-- Academic
('sub-acad-1', 'cat-acad', 'Timetable Discrepancies', 'Subject clashes and lecture room conflicts', TRUE),
('sub-acad-2', 'cat-acad', 'Examination & Hall Ticket Issues', 'Admit card errors and hall seating conflicts', TRUE),
('sub-acad-3', 'cat-acad', 'Attendance Discrepancies', 'Medical leave updates and biometric mismatch', TRUE),
('sub-acad-4', 'cat-acad', 'Faculty & Course Coordinator Concerns', 'Syllabus coverage and tutorial coordination', TRUE),
('sub-acad-5', 'cat-acad', 'Academic Resources & Lab Manuals', 'Course materials and syllabus handouts', TRUE),
-- Administration
('sub-admin-1', 'cat-admin', 'Documentation & Bona Fide Requests', 'Study certificates and passport letters', TRUE),
('sub-admin-2', 'cat-admin', 'Marksheet / Degree Certificates', 'Grade sheet issuance and transcript dispatch', TRUE),
('sub-admin-3', 'cat-admin', 'Fee Payment & Refund Inquiries', 'Payment gateway errors and caution deposit', TRUE),
('sub-admin-4', 'cat-admin', 'Administrative Processing Delays', 'ID card issuance and scholarship approvals', TRUE),
-- Library
('sub-lib-1', 'cat-lib', 'Book Availability & Catalog Deficit', 'Prescribed textbooks and reserve shortages', TRUE),
('sub-lib-2', 'cat-lib', 'Digital Library & Journal Access', 'IEEE, ACM, Springer remote access', TRUE),
('sub-lib-3', 'cat-lib', 'Reading Hall Facilities & Air-Conditioning', 'Lighting, chairs, and temperature control', TRUE),
('sub-lib-4', 'cat-lib', 'Borrowing, Return & Fine Discrepancy', 'RFID scan errors and overdue disputes', TRUE),
-- Hostel & Campus Facilities
('sub-hostel-1', 'cat-hostel', 'Room Cleanliness & Pest Control', 'Fumigation, sweeping and garbage clearance', TRUE),
('sub-hostel-2', 'cat-hostel', 'Washroom Maintenance & Geysers', 'Hot water geysers and plumbing repairs', TRUE),
('sub-hostel-3', 'cat-hostel', 'Drinking Water Purifier Operation', 'RO cooler service and filter replacement', TRUE),
('sub-hostel-4', 'cat-hostel', 'Mess Food Quality & Hygiene', 'Catering standards and nutrition concerns', TRUE),
('sub-hostel-5', 'cat-hostel', 'Laundry & Common Room Amenities', 'Washing machine maintenance and TV room', TRUE),
-- Transport
('sub-trans-1', 'cat-trans', 'Bus Schedule Delays', 'Morning route punctuality and vehicle breakdown', TRUE),
('sub-trans-2', 'cat-trans', 'Route Stoppage & Extension', 'New pickup points and stop adjustments', TRUE),
('sub-trans-3', 'cat-trans', 'Overcrowding & Safety', 'Bus capacity and emergency exits', TRUE),
('sub-trans-4', 'cat-trans', 'Bus Pass Verification', 'Biometric scanner errors on transport buses', TRUE),
-- Safety & Security
('sub-sec-1', 'cat-sec', 'Unsafe Campus Physical Conditions', 'Slippery stairs, construction zones, glass cracks', TRUE),
('sub-sec-2', 'cat-sec', 'Night Pathway Lighting & Security Guard Presence', 'Dark pathways and perimeter post presence', TRUE),
('sub-sec-3', 'cat-sec', 'Harassment or Misconduct (Strictly Confidential)', 'Proctorial board confidential investigation', TRUE),
('sub-sec-4', 'cat-sec', 'Theft or Lost Property on Campus', 'Campus lost & found registry and CCTV checks', TRUE),
-- Other
('sub-other-1', 'cat-other', 'Campus Cafeteria Pricing & Options', 'Menu diversity and pricing regulations', TRUE),
('sub-other-2', 'cat-other', 'General Inquiries', 'College calendar and visitor queries', TRUE);

-- E. SLA ESCALATION RULES
INSERT IGNORE INTO escalation_rules (id, priority, acknowledgement_target_hours, resolution_target_hours, escalation_threshold_hours, auto_escalate) VALUES
('sla-crit', 'critical', 2, 24, 28, TRUE),
('sla-high', 'high', 6, 48, 54, TRUE),
('sla-med', 'medium', 12, 72, 84, TRUE),
('sla-low', 'low', 24, 120, 140, FALSE);

-- F. SEED DEMO USERS (Passwords match bcrypt hash of 'password123' for demonstration)
INSERT IGNORE INTO users (id, role_id, email, password_hash, full_name, student_id, department_id, phone, is_active) VALUES
('user-admin', 'admin', 'admin@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Prof. David Miller (Dean / Admin)', NULL, NULL, '+91 98777 88990', TRUE),
('user-staff-it', 'staff', 'it.staff@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Vikram Verma (IT Staff)', NULL, 'dept-it', '+91 98444 55667', TRUE),
('user-staff-maint', 'staff', 'maint.staff@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Ramesh Chander (Maintenance Lead)', NULL, 'dept-maint', '+91 98555 66778', TRUE),
('user-staff-hostel', 'staff', 'hostel.staff@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Sunita Deshmukh (Hostel Warden)', NULL, 'dept-hostel', '+91 98666 77889', TRUE),
('user-student-1', 'student', 'rahul.sharma@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Rahul Sharma', 'ENG-2024-CSE-042', NULL, '+91 98111 22334', TRUE),
('user-student-2', 'student', 'priya.patel@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Priya Patel', 'ENG-2024-ECE-108', NULL, '+91 98222 33445', TRUE),
('user-student-3', 'student', 'aditya.sen@college.edu', '$2b$10$.44eiAJFQl/fVMJ3UyBCG.o5TJsjmRIWETmjvB4R/oYJHwYMBlRuW', 'Aditya Sen', 'ENG-2023-MECH-015', NULL, '+91 98333 44556', TRUE);

-- G. INITIAL REPRESENTATIVE COMPLAINT & WORKFLOW AUDIT (Verifies all foreign key links)
INSERT IGNORE INTO complaints (
    id, title, description, category_id, subcategory_id, department_id, 
    student_id, assigned_staff_id, priority, status, 
    campus_area, building, floor, room_number, preferred_contact, 
    is_sensitive, is_archived, sla_deadline, is_overdue, reopen_count,
    created_at, updated_at
) VALUES (
    'CCMS-2026-1001',
    'High-speed Wi-Fi router offline in Turing Computer Lab 3',
    'Students working on Capstone semester projects in Computer Lab 3 have been unable to connect to the campus subnet since yesterday afternoon. The central AP displays a solid red light.',
    'cat-it', 'sub-it-1', 'dept-it',
    'user-student-1', 'user-staff-it', 'high', 'in_progress',
    'Academic Block A (Computer & IT)', 'Software Lab Annex', '3rd Floor', 'Lab 302', 'portal',
    FALSE, FALSE, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR), FALSE, 0,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT IGNORE INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_id, remarks, created_at) VALUES
('hist-demo-1', 'CCMS-2026-1001', NULL, 'submitted', 'user-student-1', 'Initial complaint filed with AP physical observations.', CURRENT_TIMESTAMP),
('hist-demo-2', 'CCMS-2026-1001', 'submitted', 'assigned', 'user-admin', 'Assigned directly to Vikram Verma for network topology diagnosis.', CURRENT_TIMESTAMP),
('hist-demo-3', 'CCMS-2026-1001', 'assigned', 'in_progress', 'user-staff-it', 'Hardware reboot attempted; replacing faulty PoE injector on rack switch.', CURRENT_TIMESTAMP);

INSERT IGNORE INTO complaint_comments (id, complaint_id, user_id, content, is_internal, created_at) VALUES
('comm-demo-1', 'CCMS-2026-1001', 'user-staff-it', 'Diagnosed switch port 14 flapping. Dispatching network technician with spare Cisco PoE module.', FALSE, CURRENT_TIMESTAMP),
('comm-demo-2', 'CCMS-2026-1001', 'user-staff-it', 'INTERNAL NOTE: Spare switch inventory checked. Replacement unit tagged IT-HW-884.', TRUE, CURRENT_TIMESTAMP);

-- ------------------------------------------------------------------------------
-- Restore environment settings
-- ------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
