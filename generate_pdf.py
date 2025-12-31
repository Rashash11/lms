"""Generate PDF from Schema Comparison Report"""
from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 14)
        self.cell(0, 10, 'Schema Comparison Report', border=False, ln=True, align='C')
        self.set_font('Helvetica', '', 10)
        self.cell(0, 5, 'Production (new_schema) vs Local (schema.prisma)', ln=True, align='C')
        self.cell(0, 5, 'Generated: December 31, 2025', ln=True, align='C')
        self.ln(5)
    
    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_fill_color(52, 73, 94)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, title, ln=True, fill=True)
        self.set_text_color(0, 0, 0)
        self.ln(2)
    
    def sub_section(self, title):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(52, 73, 94)
        self.cell(0, 6, title, ln=True)
        self.set_text_color(0, 0, 0)
    
    def table_header(self, cols, widths):
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(236, 240, 241)
        for col, w in zip(cols, widths):
            self.cell(w, 6, col, border=1, fill=True)
        self.ln()
    
    def table_row(self, cols, widths):
        self.set_font('Helvetica', '', 8)
        for col, w in zip(cols, widths):
            self.cell(w, 5, str(col)[:40], border=1)
        self.ln()

    def bullet(self, text):
        self.set_font('Helvetica', '', 9)
        self.cell(5)
        self.cell(0, 5, f"- {text}", ln=True)

pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# Overview
pdf.section_title("1. Overview")
pdf.table_header(["Metric", "Local Prisma", "Production"], [60, 65, 65])
pdf.table_row(["Lines", "1,573", "1,141"], [60, 65, 65])
pdf.table_row(["Tables/Models", "~75", "~85"], [60, 65, 65])
pdf.table_row(["Format", "Prisma DSL", "PostgreSQL DDL"], [60, 65, 65])
pdf.ln(5)

# Major Differences
pdf.section_title("2. Major Structural Differences")

pdf.sub_section("2.1 Multi-Tenancy & Organization")
pdf.table_header(["Aspect", "Local (Prisma)", "Production"], [40, 75, 75])
pdf.table_row(["Structure", "Tenant -> Branch (flat)", "org -> organization_node (tree)"], [40, 75, 75])
pdf.table_row(["Hierarchy", "2 levels max", "Unlimited with parent_id"], [40, 75, 75])
pdf.table_row(["Path", "None", "ltree for fast queries"], [40, 75, 75])
pdf.ln(3)

pdf.sub_section("2.2 Content/Product Model")
pdf.table_header(["Aspect", "Local (Prisma)", "Production"], [40, 75, 75])
pdf.table_row(["Base Entity", "Course", "products (generic)"], [40, 75, 75])
pdf.table_row(["Types", "CourseUnit.type enum", "product_types table"], [40, 75, 75])
pdf.table_row(["Books", "Not supported", "book_reading_details, book_sections"], [40, 75, 75])
pdf.table_row(["Videos", "Part of unit config", "Dedicated videos, book_videos"], [40, 75, 75])
pdf.ln(3)

pdf.sub_section("2.3 User & Permissions")
pdf.table_header(["Aspect", "Local (Prisma)", "Production"], [40, 75, 75])
pdf.table_row(["Roles", "RoleKey enum (4)", "auth_role table (dynamic)"], [40, 75, 75])
pdf.table_row(["Permissions", "JSON in UserType", "auth_permission tables"], [40, 75, 75])
pdf.table_row(["Scope", "Global", "Per organization node"], [40, 75, 75])
pdf.ln(3)

pdf.sub_section("2.4 Skills & Knowledge")
pdf.table_header(["Aspect", "Local (Prisma)", "Production"], [40, 75, 75])
pdf.table_row(["Model", "Flat Skill", "track->competency->skill->k_atom"], [40, 75, 75])
pdf.table_row(["Objectives", "Not present", "objectives + bloom_level"], [40, 75, 75])
pdf.table_row(["Misconceptions", "Not present", "misconceptions tables"], [40, 75, 75])
pdf.ln(3)

pdf.sub_section("2.5 Quizzes & Assessments")
pdf.table_header(["Aspect", "Local (Prisma)", "Production"], [40, 75, 75])
pdf.table_row(["Quiz", "Test model", "quizzes with quiz_type"], [40, 75, 75])
pdf.table_row(["Questions", "Single table", "questions + question_type + difficulty"], [40, 75, 75])
pdf.table_row(["Answers", "JSON in options", "answer_choices table"], [40, 75, 75])
pdf.ln(3)

pdf.sub_section("2.6 Internationalization")
pdf.table_header(["Aspect", "Local (Prisma)", "Production"], [40, 75, 75])
pdf.table_row(["Approach", "Single language field", "Dedicated *_languages tables"], [40, 75, 75])
pdf.table_row(["Coverage", "Limited", "15+ translation tables"], [40, 75, 75])
pdf.ln(5)

# Tables Only in Production
pdf.add_page()
pdf.section_title("3. Tables Only in Production (NOT in Local)")

pdf.sub_section("Core Content")
for t in ["products", "product_types", "product_languages", "book_reading_details", "book_sections", "book_videos", "paragraphs"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Knowledge Graph")
for t in ["knowledge_atom", "competency", "specific_skill", "track", "specific_skill_level_description"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Organization")
for t in ["org", "organization_node", "node_types", "product_node"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("XP & Gamification")
for t in ["xp_types", "xp_user_logs", "xp_levels_lookup", "user_xp_summary"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("AI Features")
for t in ["ai_coach_sessions", "chats", "messages"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Other Production Tables")
for t in ["custom_pathways", "user_video_progress", "instructor_ratings", "misconceptions", "objectives", "user_waiting_list", "user_education", "user_experiences", "companies", "certificates"]:
    pdf.bullet(t)
pdf.ln(5)

# Tables Only in Local
pdf.add_page()
pdf.section_title("4. Tables Only in Local (NOT in Production)")

pdf.sub_section("Multi-Tenancy")
for t in ["Tenant", "Branch", "PortalFeatureFlags"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Course Structure")
for t in ["CourseVersion", "CourseFile", "EnrollmentRequest", "UnitAsset"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Learning Paths")
for t in ["LearningPathSection", "LearningPathEnrollment"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Gamification")
for t in ["GamificationSettings", "PointsLedger", "Badge", "Level", "Reward"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Notifications")
for t in ["Notification", "NotificationHistory", "NotificationQueue", "Automation", "AutomationLog"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Discussions & Messaging")
for t in ["Discussion", "DiscussionComment", "MessageThread", "Message", "MessageRecipient"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("SCORM/xAPI")
for t in ["SCORMData", "LRSStatement"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Portal & Reports")
for t in ["Homepage", "HomepageSection", "Report", "ScheduledReport", "AnalyticsDashboard", "ReportExport"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Integrations & Admin")
for t in ["Integration", "APIKey", "SSOConfig", "ImpersonationSession", "ImportJob"]:
    pdf.bullet(t)
pdf.ln(2)

pdf.sub_section("Tests & Grading")
for t in ["Test", "Question", "QuestionPool", "TestAttempt", "ILTSession", "ILTAttendance"]:
    pdf.bullet(t)
pdf.ln(5)

# Recommendations
pdf.add_page()
pdf.section_title("5. Key Recommendations")

pdf.sub_section("To Align Local with Production:")
pdf.bullet("Replace Tenant/Branch with org + organization_node hierarchy")
pdf.bullet("Add Products Layer - Abstract Course into products + course_details")
pdf.bullet("Implement i18n - Create *_languages tables for translations")
pdf.bullet("Add Knowledge Graph: track -> competency -> specific_skill -> k_atom")
pdf.bullet("Add XP System: xp_types, xp_user_logs, xp_levels_lookup")
pdf.bullet("Add AI Features: ai_coach_sessions, chats, messages")
pdf.bullet("Restructure RBAC - Node-scoped permissions")
pdf.ln(3)

pdf.sub_section("To Enhance Production with Local Features:")
pdf.bullet("Add Versioning - Course snapshots like CourseVersion")
pdf.bullet("Add Notifications - Event-driven notification system")
pdf.bullet("Add Discussions - Forum-style discussions")
pdf.bullet("Add Reporting - Custom reports and dashboards")
pdf.bullet("Add SCORM/xAPI - Standards-based content tracking")
pdf.bullet("Add Integrations - SSO, API keys, webhooks")
pdf.ln(5)

# Schema Flow
pdf.section_title("6. Entity Relationship Summary")
pdf.sub_section("Production Schema Flow:")
pdf.set_font('Courier', '', 8)
pdf.multi_cell(0, 4, """org
  -> organization_node (tree)
      -> users (via user_role_permission)
      -> products
          -> course_details -> chapters -> videos
          -> book_reading_details -> book_sections
          -> book_video_details -> book_videos""")
pdf.ln(3)

pdf.sub_section("Local Schema Flow:")
pdf.set_font('Courier', '', 8)
pdf.multi_cell(0, 4, """Tenant
  -> Branch
      -> User (via UserRole)
      -> Course
          -> CourseSection
              -> CourseUnit (all content types)""")

# Save
pdf.output("schema_comparison_report.pdf")
print("PDF generated successfully: schema_comparison_report.pdf")
