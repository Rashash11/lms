"""
SQLAlchemy ORM Models

Models match the existing Prisma schema. Uses snake_case for Python
but maps to the actual table names in PostgreSQL.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# ============= Enums =============

import enum

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DEACTIVATED = "DEACTIVATED"
    LOCKED = "LOCKED"


class RoleKey(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    LEARNER = "LEARNER"
    SUPER_INSTRUCTOR = "SUPER_INSTRUCTOR"


class CourseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class EnrollmentStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class UnitType(str, enum.Enum):
    TEXT = "TEXT"
    FILE = "FILE"
    EMBED = "EMBED"
    VIDEO = "VIDEO"
    TEST = "TEST"
    SURVEY = "SURVEY"
    ASSIGNMENT = "ASSIGNMENT"
    ILT = "ILT"
    CMI5 = "CMI5"
    TALENTCRAFT = "TALENTCRAFT"
    SECTION = "SECTION"
    WEB = "WEB"
    AUDIO = "AUDIO"
    DOCUMENT = "DOCUMENT"
    IFRAME = "IFRAME"
    SCORM = "SCORM"
    XAPI = "XAPI"


class UnitStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    UNPUBLISHED_CHANGES = "UNPUBLISHED_CHANGES"


class SkillLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


# ============= Core Models =============

class Tenant(Base):
    __tablename__ = "tenants"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    domain: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    branches: Mapped[list["Branch"]] = relationship(back_populates="tenant", passive_deletes=True)


class Branch(Base):
    __tablename__ = "branches"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    tenant_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    default_language: Mapped[str] = mapped_column(String, default="en")
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant: Mapped["Tenant"] = relationship(back_populates="branches")
    users: Mapped[list["User"]] = relationship(back_populates="node", passive_deletes=True)
    groups: Mapped[list["Group"]] = relationship(back_populates="branch", passive_deletes=True)
    learning_paths: Mapped[list["LearningPath"]] = relationship(back_populates="branch", passive_deletes=True)
    gamification_settings: Mapped[list["GamificationSettings"]] = relationship(back_populates="branch", passive_deletes=True)
    
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="branches_tenant_slug_unique"),
    )


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column("firstName", String, nullable=False)
    last_name: Mapped[str] = mapped_column("lastName", String, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(String, default="UTC")
    language: Mapped[str] = mapped_column(String, default="en")
    password_hash: Mapped[str | None] = mapped_column("passwordHash", String)
    avatar: Mapped[str | None] = mapped_column(String)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.ACTIVE)
    role: Mapped[RoleKey] = mapped_column("activeRole", Enum(RoleKey), default=RoleKey.LEARNER)
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column("is_verified", Boolean, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column("lastLoginAt", DateTime)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column("lockedUntil", DateTime)
    exclude_from_emails: Mapped[bool] = mapped_column("excludeFromEmails", Boolean, default=False)
    rbac_overrides: Mapped[dict | None] = mapped_column("rbac_overrides", JSON)
    node_id: Mapped[str | None] = mapped_column("node_id", UUID(as_uuid=False), ForeignKey("branches.id", ondelete="SET NULL"))
    token_version: Mapped[int] = mapped_column("token_version", Integer, default=0)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    node: Mapped["Branch | None"] = relationship(back_populates="users")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    learning_path_enrollments: Mapped[list["LearningPathEnrollment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    user_skills: Mapped[list["UserSkill"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    created_assignments: Mapped[list["Assignment"]] = relationship(back_populates="creator", foreign_keys="Assignment.created_by", passive_deletes=True)
    assignment_submissions: Mapped[list["AssignmentSubmission"]] = relationship(back_populates="user", foreign_keys="AssignmentSubmission.user_id", cascade="all, delete-orphan")
    graded_submissions: Mapped[list["AssignmentSubmission"]] = relationship(back_populates="grader", foreign_keys="AssignmentSubmission.graded_by", passive_deletes=True)
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(back_populates="instructor", passive_deletes=True)
    conferences: Mapped[list["Conference"]] = relationship(back_populates="instructor", passive_deletes=True)
    reports: Mapped[list["Report"]] = relationship(back_populates="creator", passive_deletes=True)
    certificate_issues: Mapped[list["CertificateIssue"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    points_ledger: Mapped[list["PointsLedger"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    instructed_courses: Mapped[list["Course"]] = relationship(back_populates="instructor", foreign_keys="Course.instructor_id", passive_deletes=True)
    instructed_learning_paths: Mapped[list["LearningPath"]] = relationship(back_populates="instructor", foreign_keys="LearningPath.instructor_id", passive_deletes=True)
    instructed_groups: Mapped[list["Group"]] = relationship(back_populates="instructor", foreign_keys="Group.instructor_id", passive_deletes=True)


class UserRole(Base):
    __tablename__ = "user_roles"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_key: Mapped[RoleKey] = mapped_column("roleKey", Enum(RoleKey), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="roles")
    
    __table_args__ = (
        UniqueConstraint("userId", "roleKey", name="user_roles_user_role_unique"),
    )


# ============= RBAC Models =============

class AuthRole(Base):
    __tablename__ = "auth_role"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions: Mapped[list["AuthRolePermission"]] = relationship(back_populates="role", cascade="all, delete-orphan")


class AuthPermission(Base):
    __tablename__ = "auth_permission"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    full_permission: Mapped[str] = mapped_column("fullPermission", String, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    
    # Relationships
    role_permissions: Mapped[list["AuthRolePermission"]] = relationship(back_populates="permission", cascade="all, delete-orphan")


class AuthRolePermission(Base):
    __tablename__ = "auth_role_permission"
    
    role_id: Mapped[str] = mapped_column("roleId", UUID(as_uuid=False), ForeignKey("auth_role.id", ondelete="CASCADE"), primary_key=True)
    permission_id: Mapped[str] = mapped_column("permissionId", UUID(as_uuid=False), ForeignKey("auth_permission.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    
    # Relationships
    role: Mapped["AuthRole"] = relationship(back_populates="permissions")
    permission: Mapped["AuthPermission"] = relationship(back_populates="role_permissions")


# ============= Course Models =============

class Course(Base):
    __tablename__ = "courses"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[CourseStatus] = mapped_column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    hidden_from_catalog: Mapped[bool] = mapped_column("hiddenFromCatalog", Boolean, default=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=False)
    category_id: Mapped[str | None] = mapped_column("categoryId", UUID(as_uuid=False), ForeignKey("categories.id", ondelete="SET NULL"))
    instructor_id: Mapped[str | None] = mapped_column("instructorId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"))
    thumbnail_url: Mapped[str | None] = mapped_column("thumbnail_url", String)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category: Mapped["Category | None"] = relationship(back_populates="courses")
    instructor: Mapped["User | None"] = relationship(back_populates="instructed_courses", foreign_keys=[instructor_id])
    sections: Mapped[list["CourseSection"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    units: Mapped[list["CourseUnit"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="course", passive_deletes=True)
    assignment_submissions: Mapped[list["AssignmentSubmission"]] = relationship(back_populates="course", passive_deletes=True)
    certificate_issues: Mapped[list["CertificateIssue"]] = relationship(back_populates="course", passive_deletes=True)


class CourseSection(Base):
    __tablename__ = "course_sections"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    course_id: Mapped[str] = mapped_column("courseId", UUID(as_uuid=False), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    drip_enabled: Mapped[bool] = mapped_column("dripEnabled", Boolean, default=False)
    
    # Relationships
    course: Mapped["Course"] = relationship(back_populates="sections")
    units: Mapped[list["CourseUnit"]] = relationship(back_populates="section", passive_deletes=True)


class CourseUnit(Base):
    __tablename__ = "course_units"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    course_id: Mapped[str] = mapped_column("courseId", UUID(as_uuid=False), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[str | None] = mapped_column("sectionId", UUID(as_uuid=False), ForeignKey("course_sections.id", ondelete="SET NULL"))
    type: Mapped[UnitType] = mapped_column(Enum(UnitType), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[UnitStatus] = mapped_column(Enum(UnitStatus), default=UnitStatus.DRAFT)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    course: Mapped["Course"] = relationship(back_populates="units")
    section: Mapped["CourseSection | None"] = relationship(back_populates="units")
    assignment_submissions: Mapped[list["AssignmentSubmission"]] = relationship(back_populates="assignment_unit", passive_deletes=True)


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[str] = mapped_column("courseId", UUID(as_uuid=False), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.NOT_STARTED)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    started_at: Mapped[datetime | None] = mapped_column("startedAt", DateTime)
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="enrollments")
    course: Mapped["Course"] = relationship(back_populates="enrollments")
    
    __table_args__ = (
        UniqueConstraint("userId", "courseId", name="enrollments_user_course_unique"),
    )


# ============= Learning Path Models =============

class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=False)
    is_sequential: Mapped[bool] = mapped_column("isSequential", Boolean, default=False)
    branch_id: Mapped[str | None] = mapped_column("branchId", UUID(as_uuid=False), ForeignKey("branches.id", ondelete="SET NULL"))
    instructor_id: Mapped[str | None] = mapped_column("instructorId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    branch: Mapped["Branch | None"] = relationship(back_populates="learning_paths")
    instructor: Mapped["User | None"] = relationship(back_populates="instructed_learning_paths", foreign_keys=[instructor_id])
    enrollments: Mapped[list["LearningPathEnrollment"]] = relationship(back_populates="path", cascade="all, delete-orphan")
    certificate_issues: Mapped[list["CertificateIssue"]] = relationship(back_populates="path", passive_deletes=True)


class LearningPathEnrollment(Base):
    __tablename__ = "learning_path_enrollments"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    path_id: Mapped[str] = mapped_column("pathId", UUID(as_uuid=False), ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="NOT_STARTED")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    enrolled_at: Mapped[datetime] = mapped_column("enrolledAt", DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="learning_path_enrollments")
    path: Mapped["LearningPath"] = relationship(back_populates="enrollments")
    
    __table_args__ = (
        UniqueConstraint("userId", "pathId", name="lp_enrollments_user_path_unique"),
    )


# ============= Skills Models =============

class Skill(Base):
    __tablename__ = "skills"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column("imageUrl", String)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_skills: Mapped[list["UserSkill"]] = relationship(back_populates="skill", cascade="all, delete-orphan")


class UserSkill(Base):
    __tablename__ = "user_skills"
    
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[str] = mapped_column("skillId", UUID(as_uuid=False), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    level: Mapped[SkillLevel] = mapped_column(Enum(SkillLevel), default=SkillLevel.BEGINNER)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="user_skills")
    skill: Mapped["Skill"] = relationship(back_populates="user_skills")


# ============= Group & Category Models =============

class Group(Base):
    __tablename__ = "groups"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    branch_id: Mapped[str | None] = mapped_column("branchId", UUID(as_uuid=False), ForeignKey("branches.id", ondelete="SET NULL"))
    instructor_id: Mapped[str | None] = mapped_column("instructorId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    branch: Mapped["Branch | None"] = relationship(back_populates="groups")
    instructor: Mapped["User | None"] = relationship(back_populates="instructed_groups", foreign_keys=[instructor_id])


class Category(Base):
    __tablename__ = "categories"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    parent_id: Mapped[str | None] = mapped_column("parentId", UUID(as_uuid=False), ForeignKey("categories.id", ondelete="SET NULL"))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    
    # Relationships (self-referential)
    parent: Mapped["Category | None"] = relationship(back_populates="children", remote_side=[id])
    children: Mapped[list["Category"]] = relationship(back_populates="parent", passive_deletes=True)
    courses: Mapped[list["Course"]] = relationship(back_populates="category", passive_deletes=True)


# ============= Assignment Models =============

class Assignment(Base):
    __tablename__ = "assignments"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    course_id: Mapped[str | None] = mapped_column("courseId", UUID(as_uuid=False), ForeignKey("courses.id", ondelete="SET NULL"))
    due_at: Mapped[datetime | None] = mapped_column("dueAt", DateTime)
    created_by: Mapped[str] = mapped_column("createdBy", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    course: Mapped["Course | None"] = relationship(back_populates="assignments")
    creator: Mapped["User"] = relationship(back_populates="created_assignments", foreign_keys=[created_by])


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    assignment_unit_id: Mapped[str] = mapped_column("assignmentUnitId", UUID(as_uuid=False), ForeignKey("course_units.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[str] = mapped_column("courseId", UUID(as_uuid=False), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer)
    submitted_at: Mapped[datetime] = mapped_column("submittedAt", DateTime, default=datetime.utcnow)
    graded_at: Mapped[datetime | None] = mapped_column("gradedAt", DateTime)
    graded_by: Mapped[str | None] = mapped_column("gradedBy", UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"))
    
    # Relationships
    assignment_unit: Mapped["CourseUnit"] = relationship(back_populates="assignment_submissions")
    user: Mapped["User"] = relationship(back_populates="assignment_submissions", foreign_keys=[user_id])
    grader: Mapped["User | None"] = relationship(back_populates="graded_submissions", foreign_keys=[graded_by])
    course: Mapped["Course"] = relationship(back_populates="assignment_submissions")


# ============= Calendar & Conference Models =============

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_time: Mapped[datetime] = mapped_column("startTime", DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column("endTime", DateTime, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    instructor_id: Mapped[str] = mapped_column("instructorId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    instructor: Mapped["User"] = relationship(back_populates="calendar_events")


class Conference(Base):
    __tablename__ = "conferences"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_time: Mapped[datetime] = mapped_column("startTime", DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column("endTime", DateTime, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    meeting_url: Mapped[str | None] = mapped_column("meetingUrl", String)
    instructor_id: Mapped[str] = mapped_column("instructorId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    instructor: Mapped["User"] = relationship(back_populates="conferences")


# ============= Notification & Automation Models =============

class Notification(Base):
    __tablename__ = "notifications"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    event_key: Mapped[str] = mapped_column("eventKey", String, nullable=False)
    message_subject: Mapped[str] = mapped_column("messageSubject", String, nullable=False)
    message_body: Mapped[str] = mapped_column("messageBody", Text, nullable=False)
    recipient_type: Mapped[str] = mapped_column("recipientType", String, nullable=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Automation(Base):
    __tablename__ = "automations"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False)
    filters: Mapped[dict | None] = mapped_column(JSON)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============= Report & Certificate Models =============

class Report(Base):
    __tablename__ = "reports"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    ruleset: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by: Mapped[str] = mapped_column("createdBy", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator: Mapped["User"] = relationship(back_populates="reports")


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    html_body: Mapped[str] = mapped_column("htmlBody", Text, nullable=False)
    smart_tags: Mapped[dict] = mapped_column("smartTags", JSON, nullable=False)
    is_system: Mapped[bool] = mapped_column("isSystem", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    issues: Mapped[list["CertificateIssue"]] = relationship(back_populates="template", passive_deletes=True)


class CertificateIssue(Base):
    __tablename__ = "certificate_issues"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id: Mapped[str | None] = mapped_column("courseId", UUID(as_uuid=False), ForeignKey("courses.id", ondelete="SET NULL"))
    path_id: Mapped[str | None] = mapped_column("pathId", UUID(as_uuid=False), ForeignKey("learning_paths.id", ondelete="SET NULL"))
    template_id: Mapped[str] = mapped_column("templateId", UUID(as_uuid=False), ForeignKey("certificate_templates.id", ondelete="RESTRICT"), nullable=False)
    issued_at: Mapped[datetime] = mapped_column("issuedAt", DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="certificate_issues")
    course: Mapped["Course | None"] = relationship(back_populates="certificate_issues")
    path: Mapped["LearningPath | None"] = relationship(back_populates="certificate_issues")
    template: Mapped["CertificateTemplate"] = relationship(back_populates="issues")


# ============= Gamification Models =============

class GamificationSettings(Base):
    __tablename__ = "gamification_settings"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    portal_id: Mapped[str | None] = mapped_column("portalId", UUID(as_uuid=False))
    branch_id: Mapped[str | None] = mapped_column("branchId", UUID(as_uuid=False), ForeignKey("branches.id", ondelete="SET NULL"))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    points_enabled: Mapped[bool] = mapped_column("pointsEnabled", Boolean, default=True)
    badges_enabled: Mapped[bool] = mapped_column("badgesEnabled", Boolean, default=True)
    
    # Relationships
    branch: Mapped["Branch | None"] = relationship(back_populates="gamification_settings")


class PointsLedger(Base):
    __tablename__ = "points_ledger"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="points_ledger")


# ============= Password Reset =============

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column("userId", UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column("usedAt", DateTime)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")
