"""
Verification Script for SQLAlchemy Models

Tests that:
1. All models import without errors
2. Relationships are properly configured
3. Foreign keys are defined
"""

import sys
sys.path.insert(0, ".")

def test_imports():
    """Test that all models can be imported."""
    print("=" * 60)
    print("TEST 1: Model Imports")
    print("=" * 60)
    
    try:
        from app.db.models import (
            Base,
            # Enums
            UserStatus, RoleKey, CourseStatus, EnrollmentStatus,
            UnitType, UnitStatus, SkillLevel,
            # Core models
            Tenant, Branch, User, UserRole,
            # RBAC
            AuthRole, AuthPermission, AuthRolePermission,
            # Course models
            Course, CourseSection, CourseUnit, Enrollment,
            # Learning Path
            LearningPath, LearningPathEnrollment,
            # Skills
            Skill, UserSkill,
            # Group & Category
            Group, Category,
            # Assignments
            Assignment, AssignmentSubmission,
            # Calendar
            CalendarEvent, Conference,
            # Notifications
            Notification, Automation,
            # Reports & Certs
            Report, CertificateTemplate, CertificateIssue,
            # Gamification
            GamificationSettings, PointsLedger,
            # Password Reset
            PasswordResetToken,
        )
        print("✓ All models imported successfully!")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False


def test_relationships():
    """Test that relationships are configured on both sides."""
    print("\n" + "=" * 60)
    print("TEST 2: Relationship Configuration")
    print("=" * 60)
    
    from app.db.models import (
        User, Enrollment, Course, Branch, Tenant,
        LearningPath, LearningPathEnrollment, Skill, UserSkill,
        Category, Assignment, AssignmentSubmission, 
        CertificateTemplate, CertificateIssue, PointsLedger,
        PasswordResetToken, Group, CalendarEvent, Conference,
        Report, GamificationSettings, CourseUnit, CourseSection
    )
    
    # Define expected bidirectional relationships
    relationships = [
        ("User", "enrollments", "Enrollment", "user"),
        ("User", "learning_path_enrollments", "LearningPathEnrollment", "user"),
        ("User", "user_skills", "UserSkill", "user"),
        ("User", "points_ledger", "PointsLedger", "user"),
        ("User", "password_reset_tokens", "PasswordResetToken", "user"),
        ("User", "certificate_issues", "CertificateIssue", "user"),
        ("Course", "enrollments", "Enrollment", "course"),
        ("Course", "sections", "CourseSection", "course"),
        ("Course", "units", "CourseUnit", "course"),
        ("LearningPath", "enrollments", "LearningPathEnrollment", "path"),
        ("Skill", "user_skills", "UserSkill", "skill"),
        ("Category", "courses", "Course", "category"),
        ("Category", "children", "Category", "parent"),
        ("CertificateTemplate", "issues", "CertificateIssue", "template"),
        ("Branch", "users", "User", "node"),
        ("Branch", "groups", "Group", "branch"),
        ("Tenant", "branches", "Branch", "tenant"),
    ]
    
    models = {
        "User": User, "Enrollment": Enrollment, "Course": Course,
        "Branch": Branch, "Tenant": Tenant, "LearningPath": LearningPath,
        "LearningPathEnrollment": LearningPathEnrollment, "Skill": Skill,
        "UserSkill": UserSkill, "Category": Category, "Assignment": Assignment,
        "AssignmentSubmission": AssignmentSubmission,
        "CertificateTemplate": CertificateTemplate,
        "CertificateIssue": CertificateIssue, "PointsLedger": PointsLedger,
        "PasswordResetToken": PasswordResetToken, "Group": Group,
        "CalendarEvent": CalendarEvent, "Conference": Conference,
        "Report": Report, "GamificationSettings": GamificationSettings,
        "CourseUnit": CourseUnit, "CourseSection": CourseSection
    }
    
    all_ok = True
    for parent_name, parent_attr, child_name, child_attr in relationships:
        parent_model = models[parent_name]
        child_model = models[child_name]
        
        # Check parent side
        parent_has = hasattr(parent_model, parent_attr)
        child_has = hasattr(child_model, child_attr)
        
        if parent_has and child_has:
            print(f"✓ {parent_name}.{parent_attr} <-> {child_name}.{child_attr}")
        else:
            all_ok = False
            if not parent_has:
                print(f"✗ Missing: {parent_name}.{parent_attr}")
            if not child_has:
                print(f"✗ Missing: {child_name}.{child_attr}")
    
    return all_ok


def test_foreign_keys():
    """Test that foreign keys are defined."""
    print("\n" + "=" * 60)
    print("TEST 3: Foreign Key Definitions")
    print("=" * 60)
    
    from app.db.models import Base
    
    # List of expected FKs
    expected_fks = [
        ("enrollments", "userId", "users.id"),
        ("enrollments", "courseId", "courses.id"),
        ("learning_path_enrollments", "userId", "users.id"),
        ("learning_path_enrollments", "pathId", "learning_paths.id"),
        ("courses", "categoryId", "categories.id"),
        ("courses", "instructorId", "users.id"),
        ("course_units", "courseId", "courses.id"),
        ("course_units", "sectionId", "course_sections.id"),
        ("assignments", "courseId", "courses.id"),
        ("assignments", "createdBy", "users.id"),
        ("assignment_submissions", "userId", "users.id"),
        ("assignment_submissions", "courseId", "courses.id"),
        ("assignment_submissions", "assignmentUnitId", "course_units.id"),
        ("certificate_issues", "userId", "users.id"),
        ("certificate_issues", "templateId", "certificate_templates.id"),
        ("points_ledger", "userId", "users.id"),
        ("password_reset_tokens", "userId", "users.id"),
        ("categories", "parentId", "categories.id"),
        ("groups", "branchId", "branches.id"),
        ("groups", "instructorId", "users.id"),
        ("gamification_settings", "branchId", "branches.id"),
    ]
    
    all_ok = True
    for table_name, col_name, target in expected_fks:
        table = Base.metadata.tables.get(table_name)
        if table is None:
            print(f"✗ Table not found: {table_name}")
            all_ok = False
            continue
        
        col = table.columns.get(col_name)
        if col is None:
            print(f"✗ Column not found: {table_name}.{col_name}")
            all_ok = False
            continue
        
        fks = list(col.foreign_keys)
        if fks:
            fk_target = str(fks[0].target_fullname)
            if fk_target == target:
                print(f"✓ {table_name}.{col_name} -> {target}")
            else:
                print(f"✗ {table_name}.{col_name} -> {fk_target} (expected {target})")
                all_ok = False
        else:
            print(f"✗ No FK on {table_name}.{col_name}")
            all_ok = False
    
    return all_ok


def main():
    print("\n" + "=" * 60)
    print("SQLAlchemy Models Verification")
    print("=" * 60 + "\n")
    
    results = []
    results.append(("Imports", test_imports()))
    results.append(("Relationships", test_relationships()))
    results.append(("Foreign Keys", test_foreign_keys()))
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
