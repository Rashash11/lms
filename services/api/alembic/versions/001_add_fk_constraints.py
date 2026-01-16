"""Add foreign key constraints only

Revision ID: 001_add_fk_constraints
Revises: 
Create Date: 2026-01-07

SAFE MIGRATION: Only adds FK constraints that may be missing.
Does NOT drop tables, columns, or change types.
Skips FKs that can't be created due to orphaned data.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = '001_add_fk_constraints'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def create_fk_if_not_exists(conn, source_table: str, target_table: str,
                             source_col: str, target_col: str,
                             ondelete: str, constraint_name: str):
    """Create FK using raw SQL with NOT VALID to skip orphan check."""
    # Check if constraint already exists
    check_sql = text("""
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = :name AND table_name = :table
    """)
    result = conn.execute(check_sql, {"name": constraint_name, "table": source_table})
    if result.fetchone():
        print(f"○ FK already exists: {constraint_name}")
        return
    
    # Create FK with NOT VALID (skips checking existing data)
    ondelete_clause = f"ON DELETE {ondelete}" if ondelete else ""
    create_sql = text(f"""
        ALTER TABLE "{source_table}" 
        ADD CONSTRAINT "{constraint_name}" 
        FOREIGN KEY ("{source_col}") 
        REFERENCES "{target_table}" ("{target_col}")
        {ondelete_clause}
        NOT VALID
    """)
    
    try:
        conn.execute(create_sql)
        print(f"✓ Added FK: {constraint_name} (NOT VALID - needs validation)")
    except Exception as e:
        print(f"✗ Failed FK {constraint_name}: {e}")


def upgrade() -> None:
    """Add missing foreign key constraints."""
    # Get raw connection for direct SQL execution
    conn = op.get_bind()
    
    # List of FKs to add: (source_table, target_table, source_col, target_col, ondelete, constraint_name)
    fks = [
        # Enrollment FKs
        ('enrollments', 'users', 'userId', 'id', 'CASCADE', 'fk_enrollments_user'),
        
        # LearningPathEnrollment FKs
        ('learning_path_enrollments', 'users', 'userId', 'id', 'CASCADE', 'fk_lp_enrollments_user'),
        ('learning_path_enrollments', 'learning_paths', 'pathId', 'id', 'CASCADE', 'fk_lp_enrollments_path'),
        
        # Course FKs
        ('courses', 'categories', 'categoryId', 'id', 'SET NULL', 'fk_courses_category'),
        ('courses', 'users', 'instructorId', 'id', 'SET NULL', 'fk_courses_instructor'),
        
        # CourseUnit FKs
        ('course_units', 'courses', 'courseId', 'id', 'CASCADE', 'fk_units_course'),
        
        # LearningPath FKs
        ('learning_paths', 'branches', 'branchId', 'id', 'SET NULL', 'fk_lp_branch'),
        ('learning_paths', 'users', 'instructorId', 'id', 'SET NULL', 'fk_lp_instructor'),
        
        # Group FKs
        ('groups', 'branches', 'branchId', 'id', 'SET NULL', 'fk_groups_branch'),
        ('groups', 'users', 'instructorId', 'id', 'SET NULL', 'fk_groups_instructor'),
        
        # Category self-FK
        ('categories', 'categories', 'parentId', 'id', 'SET NULL', 'fk_categories_parent'),
        
        # Assignment FKs
        ('assignments', 'courses', 'courseId', 'id', 'SET NULL', 'fk_assignments_course'),
        ('assignments', 'users', 'createdBy', 'id', 'CASCADE', 'fk_assignments_creator'),
        
        # AssignmentSubmission FKs
        ('assignment_submissions', 'course_units', 'assignmentUnitId', 'id', 'CASCADE', 'fk_submissions_unit'),
        ('assignment_submissions', 'users', 'userId', 'id', 'CASCADE', 'fk_submissions_user'),
        ('assignment_submissions', 'courses', 'courseId', 'id', 'CASCADE', 'fk_submissions_course'),
        ('assignment_submissions', 'users', 'gradedBy', 'id', 'SET NULL', 'fk_submissions_grader'),
        
        # CalendarEvent FK
        ('calendar_events', 'users', 'instructorId', 'id', 'CASCADE', 'fk_calendar_instructor'),
        
        # Conference FK
        ('conferences', 'users', 'instructorId', 'id', 'CASCADE', 'fk_conferences_instructor'),
        
        # Report FK
        ('reports', 'users', 'createdBy', 'id', 'CASCADE', 'fk_reports_creator'),
        
        # CertificateIssue FKs
        ('certificate_issues', 'users', 'userId', 'id', 'CASCADE', 'fk_cert_issues_user'),
        ('certificate_issues', 'courses', 'courseId', 'id', 'SET NULL', 'fk_cert_issues_course'),
        ('certificate_issues', 'learning_paths', 'pathId', 'id', 'SET NULL', 'fk_cert_issues_path'),
        ('certificate_issues', 'certificate_templates', 'templateId', 'id', 'RESTRICT', 'fk_cert_issues_template'),
        
        # GamificationSettings FK
        ('gamification_settings', 'branches', 'branchId', 'id', 'SET NULL', 'fk_gamification_branch'),
        
        # PointsLedger FK
        ('points_ledger', 'users', 'userId', 'id', 'CASCADE', 'fk_points_user'),
        
        # PasswordResetToken FK
        ('password_reset_tokens', 'users', 'userId', 'id', 'CASCADE', 'fk_reset_tokens_user'),
    ]
    
    for source_table, target_table, source_col, target_col, ondelete, constraint_name in fks:
        create_fk_if_not_exists(conn, source_table, target_table, source_col, target_col, ondelete, constraint_name)
    
    print("\n✓ Migration complete. FKs added with NOT VALID - run VALIDATE CONSTRAINT to enforce on existing data.")


def downgrade() -> None:
    """Remove added foreign key constraints."""
    conn = op.get_bind()
    
    constraint_names = [
        ('enrollments', 'fk_enrollments_user'),
        ('learning_path_enrollments', 'fk_lp_enrollments_user'),
        ('learning_path_enrollments', 'fk_lp_enrollments_path'),
        ('courses', 'fk_courses_category'),
        ('courses', 'fk_courses_instructor'),
        ('course_units', 'fk_units_course'),
        ('learning_paths', 'fk_lp_branch'),
        ('learning_paths', 'fk_lp_instructor'),
        ('groups', 'fk_groups_branch'),
        ('groups', 'fk_groups_instructor'),
        ('categories', 'fk_categories_parent'),
        ('assignments', 'fk_assignments_course'),
        ('assignments', 'fk_assignments_creator'),
        ('assignment_submissions', 'fk_submissions_unit'),
        ('assignment_submissions', 'fk_submissions_user'),
        ('assignment_submissions', 'fk_submissions_course'),
        ('assignment_submissions', 'fk_submissions_grader'),
        ('calendar_events', 'fk_calendar_instructor'),
        ('conferences', 'fk_conferences_instructor'),
        ('reports', 'fk_reports_creator'),
        ('certificate_issues', 'fk_cert_issues_user'),
        ('certificate_issues', 'fk_cert_issues_course'),
        ('certificate_issues', 'fk_cert_issues_path'),
        ('certificate_issues', 'fk_cert_issues_template'),
        ('gamification_settings', 'fk_gamification_branch'),
        ('points_ledger', 'fk_points_user'),
        ('password_reset_tokens', 'fk_reset_tokens_user'),
    ]
    
    for table, constraint in constraint_names:
        try:
            conn.execute(text(f'ALTER TABLE "{table}" DROP CONSTRAINT IF EXISTS "{constraint}"'))
        except Exception:
            pass
