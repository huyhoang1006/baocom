<project>
  <name>baocom</name>
  <description>Báo Cơm Trưa Công Ty - Internal Lunch Registration System</description>
  <tech_stack>Next.js 16, React 19, TypeScript, Prisma, SQLite/libSQL</tech_stack>
  <date>2026-05-18</date>
</project>

<authentication>
  <login_flow>
    <step number="1">User enters username and password at /login page</step>
    <step number="2">Client validates password length >= 4 characters</step>
    <step number="3">POST /api/auth/login:
      <action>Find user by username in database</action>
      <action>bcrypt.verifyPassword() - constant-time comparison</action>
      <action>Check user.isActive === true</action>
      <action>Create JWT with payload { userId, role }, 7-day expiry, HS256 algorithm</action>
      <action>Set httpOnly cookie named "token" with sameSite=lax, maxAge=7days, secure=true in production</action>
    </step>
    <step number="4">Redirect: admin -> /admin/dashboard, employee -> /dashboard</step>
    <security_notes>
      <note>Passwords bcrypt hashed with cost factor 12</note>
      <note>Timing attack prevention: verifyPassword called even when user not found</note>
            <note>Inactive users (isActive=false) cannot login</note>
      <note>JWT_SECRET environment variable required at startup</note>
    </security_notes>
  </login_flow>

  <jwt_structure>
    <payload>
      <field name="userId" type="string">cuid identifier</field>
      <field name="role" type="enum">employee | admin</field>
      <field name="exp" type="timestamp">7 days from issue</field>
    </payload>
    <algorithm>HS256</algorithm>
    <secret_env_var>JWT_SECRET</secret_env_var>
  </jwt_structure>

  <auth_middleware>
    <handler name="withAuth">
      <description>Protects routes for any authenticated user</description>
      <behavior>
        <step>Extract "token" cookie from request</step>
        <step>verifyToken() using JWT_SECRET</step>
        <step>Return 401 if token missing or invalid</step>
        <step>Pass { userId, role } to handler on success</step>
      </behavior>
    </handler>
    <handler name="withAdmin">
      <description>Restricts routes to admin users only</description>
      <behavior>
        <step>First apply withAuth logic</step>
        <step>Check role === "admin"</step>
        <step>Return 403 if not admin</step>
        <step>Pass to handler if admin</step>
      </behavior>
    </handler>
  </auth_middleware>
</authentication>

<user_management>
  <user_model>
    <table>User</table>
    <fields>
      <field name="id" type="String">cuid, primary key</field>
      <field name="username" type="String" constraints="unique, required">login identifier</field>
      <field name="password" type="String">bcrypt hashed</field>
      <field name="name" type="String" constraints="required">display name</field>
      <field name="phone" type="String" optional="true">contact number</field>
      <field name="email" type="String" optional="true">contact email</field>
      <field name="department" type="String" optional="true">work department</field>
      <field name="role" type="String" default="employee">employee | admin</field>
      <field name="isActive" type="Boolean" default="true">soft delete flag</field>
      <field name="createdAt" type="DateTime">auto timestamp</field>
      <field name="updatedAt" type="DateTime">auto timestamp</field>
    </fields>
  </user_model>

  <roles>
    <role name="employee">
      <permissions>
        <permission>Book/cancel own meal registrations</permission>
        <permission>View own registration history</permission>
        <permission>View daily menu</permission>
      </permissions>
    </role>
    <role name="admin">
      <permissions>
        <permission>All employee permissions</permission>
        <permission>Manage employees (CRUD)</permission>
        <permission>Manage weekly menus</permission>
        <permission>Manage holidays</permission>
        <permission>View reports and statistics</permission>
        <permission>Override locked registrations</permission>
      </permissions>
    </role>
  </roles>

  <security_rules>
    <rule>Admin creates accounts - no self-service signup in v1</rule>
    <rule>Inactive users cannot authenticate</rule>
    <rule>Password minimum 4 characters (client-side validation)</rule>
  </security_rules>
</user_management>

<registration_system>
  <core_philosophy>
    <description>Default = Eating</description>
    <explanation>Nhân viên không cần đăng ký ăn. Chỉ báo nghỉ khi không ăn.</explanation>
  </core_philosophy>

  <registration_model>
    <table>Registration</table>
    <fields>
      <field name="id" type="String">cuid, primary key</field>
      <field name="userId" type="String">FK to User, indexed</field>
      <field name="date" type="DateTime">unique per user: @@unique([userId, date])</field>
      <field name="status" type="String">enum: eating | not_eating</field>
      <field name="note" type="String" optional="true">optional note</field>
      <field name="createdAt" type="DateTime">auto timestamp</field>
      <field name="updatedAt" type="DateTime">auto timestamp</field>
    </fields>
  </registration_model>

  <status_flow>
    <state name="implied_eating">
      <condition>No Registration record exists for user + date</condition>
      <status>"eating" (default, implied)</status>
    </state>
    <transition to="not_eating">
      <trigger>Employee clicks "Không ăn"</trigger>
      <action>Creates Registration record with status="not_eating"</action>
    </transition>
    <transition to="eating">
      <trigger>Employee clicks "Có ăn" on day with not_eating record</trigger>
      <action>Deletes Registration record (returns to implied eating)</action>
    </transition>
  </status_flow>

  <booking_window_rules location="src/lib/registrationWindow.ts">
    <rule name="past_dates">
      <behavior>BLOCKED</behavior>
      <error_code>DATE_NOT_FUTURE</error_code>
    </rule>
    <rule name="today">
      <behavior>BLOCKED</behavior>
      <explanation>Cannot book for current day</explanation>
    </rule>
    <rule name="weekends">
      <behavior>BLOCKED</behavior>
      <days>Saturday (weekday=6), Sunday (weekday=0)</days>
    </rule>
    <rule name="beyond_4_weeks">
      <behavior>BLOCKED</behavior>
      <error_code>OUTSIDE_CURRENT_WEEK</error_code>
      <explanation>Can only book current week + 4 weeks ahead = 5 weeks total</explanation>
    </rule>
    <rule name="after_cutoff">
      <behavior>BLOCKED for employees</behavior>
      <error_code>LOCKED</error_code>
      <admin_override>Admin can still change (creates audit record)</admin_override>
    </rule>
  </booking_window_rules>

  <cutoff_rules>
    <default_time>23:00 on day before registration date</default_time>
    <configurable>Yes via CutoffConfig table</configurable>
    <after_cutoff>
      <employee>Cannot change registration</employee>
      <admin>Can override (creates RegistrationOverride record)</admin>
    </after_cutoff>
  </cutoff_rules>

  <registration_override_model>
    <table>RegistrationOverride</table>
    <purpose>Audit trail for admin changes on locked dates</purpose>
    <fields>
      <field name="id" type="String">cuid, primary key</field>
      <field name="registrationId" type="String">FK to Registration</field>
      <field name="performedBy" type="String">admin userId</field>
      <field name="performedAt" type="DateTime">timestamp</field>
      <field name="originalStatus" type="String">status before change</field>
      <field name="newStatus" type="String">status after change</field>
      <field name="note" type="String" optional="true">reason for override</field>
    </fields>
  </registration_override_model>

  <api_endpoints>
    <endpoint method="GET" path="/api/registrations">
      <params>startDate, endDate</params>
      <auth>User</auth>
      <description>Fetch user's registrations in date range</description>
    </endpoint>
    <endpoint method="POST" path="/api/registrations">
      <auth>User</auth>
      <description>Create registration (upsert by userId + date)</description>
    </endpoint>
    <endpoint method="PUT" path="/api/registrations/[id]">
      <auth>User or Admin</auth>
      <description>Update own registration; Admin can update any</description>
    </endpoint>
    <endpoint method="DELETE" path="/api/registrations/[id]">
      <auth>Admin only</auth>
      <description>Delete registration</description>
    </endpoint>
  </api_endpoints>

  <validation_rules>
    <rule>status must be "eating" or "not_eating"</rule>
    <rule>date must be future weekday within booking window</rule>
    <rule>date must not be past cutoff (unless user is admin)</rule>
    <rule>Admin override creates RegistrationOverride audit record</rule>
  </validation_rules>
</registration_system>

<admin_dashboard>
  <daily_stats>
    <metric name="total_employees">count of active users</metric>
    <metric name="eating_count">registrations with status "eating"</metric>
    <metric name="not_eating_count">registrations with status "not_eating"</metric>
    <metric name="unregistered_count">total - eating - not_eating</metric>
    <metric name="registration_rate">percentage</metric>
  </daily_stats>

  <absence_list>
    <description>List employees who have status="not_eating" for selected date</description>
  </absence_list>

  <quick_actions>
    <action name="Hôm nay">Jump to today's statistics</action>
    <action name="Xuất báo cáo">Navigate to reports page</action>
    <action name="Quản lý nhân sự">Navigate to employee management</action>
  </quick_actions>
</admin_dashboard>

<employee_management>
  <crud_operations>
    <operation name="create">
      <behavior>Opens modal with name (required), phone, email, department</behavior>
      <username_generation>Auto-generated from name</username_generation>
    </operation>
    <operation name="read">
      <display>Lists all employees with avatar (initials), name, username, phone, isActive badge</display>
    </operation>
    <operation name="update">
      <backend_status>ONLY name field is persisted</backend_status>
      <known_issue>phone, email, department updates NOT saved to database</known_issue>
    </operation>
    <operation name="delete">
      <behavior>Soft delete (sets isActive=false)</behavior>
      <hard_delete>NOT implemented</hard_delete>
    </operation>
  </crud_operations>

  <search>
    <searchable_fields>
      <field>name</field>
      <field>username</field>
      <field>phone</field>
    </searchable_fields>
    <match_type>Partial match</match_type>
  </search>

  <department_options>
    <option>Kỹ thuật</option>
    <option>Kinh doanh</option>
    <option>Nhân sự</option>
    <option>Tài chính</option>
    <option>Marketing</option>
  </department_options>

  <import_feature>
    <status>Under development ("đang phát triển")</status>
    <button_exists>Yes but non-functional</button_exists>
  </import_feature>
</employee_management>

<reporting_system>
  <report_types>
    <type name="day">
      <date_selector>Single date picker</date_selector>
      <scope>One specific date</scope>
    </type>
    <type name="week">
      <date_selector>Week dropdown</date_selector>
      <scope>Monday-Friday of selected week</scope>
    </type>
    <type name="month">
      <date_selector>Month dropdown</date_selector>
      <scope>All weekdays of selected month</scope>
    </type>
  </report_types>

  <export_formats>
    <format name="excel">
      <extension>.xlsx</extension>
      <implementation>Client-side using xlsx library</implementation>
    </format>
    <format name="csv">
      <extension>.csv</extension>
      <implementation>Server-generated via adminReportsApi.exportCsvUrl</implementation>
    </format>
  </export_formats>

  <columns>
    <column>STT (index row number)</column>
    <column>Họ tên (employee name)</column>
    <column>SĐT (phone)</column>
    <column>Ngày (date)</column>
    <footer>Total meal count</footer>
  </columns>

  <exclusion_rules>
    <rule name="sunday" status="EXCLUDED">no lunch service</rule>
    <rule name="holidays" status="NOT excluded">current gap - holiday dates still counted</rule>
  </exclusion_rules>
</reporting_system>

<menu_management>
  <weekly_grid_ui>
    <columns>
      <column>Monday</column>
      <column>Tuesday</column>
      <column>Wednesday</column>
      <column>Thursday</column>
      <column>Friday</column>
    </columns>
    <rows>
      <row type="Món chính">main dish</row>
      <row type="Món rau">vegetable dish</row>
      <row type="Tráng miệng">dessert</row>
    </rows>
    <navigation>Tuần trước, Tuần này, Tuần sau</navigation>
    <editing>Click cell to edit inline (comma-separated for multiple items)</editing>
    <save_action>Creates or updates DailyMenu records</save_action>
  </weekly_grid_ui>

  <data_models>
    <model name="Meal">
      <fields>id, name, type, isActive</fields>
      <relationships>has many DailyMenuMeal</relationships>
    </model>
    <model name="DailyMenu">
      <fields>id, date (unique)</fields>
      <relationships>has many DailyMenuMeal</relationships>
    </model>
    <model name="DailyMenuMeal">
      <fields>id, dailyMenuId, mealId, sortOrder</fields>
      <relationships>belongs to DailyMenu, Meal</relationships>
      <constraints>@@unique([dailyMenuId, mealId])</constraints>
    </model>
  </data_models>

  <meal_types>
    <type name="main">main dish category</type>
    <type name="vegetable">vegetable dish category</type>
    <type name="dessert">dessert category</type>
    <enforcement>In MealService.create/update</enforcement>
  </meal_types>

  <save_upsert_logic location="DailyMenuRepository.upsertWithMeals">
    <transaction_steps>
      <step>Start transaction</step>
      <step>Delete existing DailyMenuMeal entries for that date</step>
      <step>For each meal name in request: MealService.findOrCreateByName(name, type) to get mealId, then create new DailyMenuMeal with sortOrder</step>
      <step>Commit transaction</step>
    </transaction_steps>
  </save_upsert_logic>

  <meal_auto_creation>
    <api>mealsExtendedApi.findOrCreate</api>
    <behavior>
      <action>Case-insensitive lookup</action>
      <action>Creates new Meal if not found</action>
      <action>Returns existing Meal if found</action>
    </behavior>
  </meal_auto_creation>
</menu_management>

<holiday_system>
  <holiday_model>
    <table>Holiday</table>
    <fields>
      <field name="id" type="String">cuid, primary key</field>
      <field name="date" type="DateTime" constraints="unique">@@unique([date])</field>
      <field name="description" type="String" optional="true">holiday name</field>
      <field name="isActive" type="Boolean" default="true">active flag</field>
    </fields>
  </holiday_model>

  <crud_operations>
    <operation name="create">Admin picks date, optionally adds description</operation>
    <operation name="read">List all holidays with date and description</operation>
    <operation name="update">Change date and/or description, toggle isActive</operation>
    <operation name="delete">Hard delete in backend (set isActive=false in UI)</operation>
  </crud_operations>

  <integration_status>NOT INTEGRATED</integration_status>
  <description>Holidays exist in database but are NOT enforced in registration logic</description>

  <gaps>
    <gap name="registration_booking">
      <current>Employee can book on holiday dates</current>
      <expected>Should be blocked</expected>
    </gap>
    <gap name="admin_stats">
      <current>Shows registration counts on holidays</current>
      <expected>Should show "Ngày lễ" indicator</expected>
    </gap>
    <gap name="report_generation">
      <current>Includes holiday counts in reports</current>
      <expected>Should exclude holiday dates</expected>
    </gap>
  </gaps>
</holiday_system>

<cutoff_configuration>
  <cutoff_model>
    <table>CutoffConfig</table>
    <fields>
      <field name="id" type="String" value="global">fixed singleton ID</field>
      <field name="cutoffHour" type="Int" default="23">hour of cutoff</field>
      <field name="cutoffMinute" type="Int" default="0">minute of cutoff</field>
    </fields>
  </cutoff_model>

  <cutoff_logic>
    <function name="getCutoffAt">
      <param>date</param>
      <description>Returns cutoff datetime for given registration date</description>
      <default_behavior>23:00 on day before</default_behavior>
      <example>for 2026-05-20 (Wednesday), cutoff is 2026-05-19 23:00</example>
    </function>
    <function name="isLocked">
      <param>date</param>
      <description>Checks if date is past cutoff</description>
      <returns>new Date() > getCutoffAt(date)</returns>
    </function>
  </cutoff_logic>
</cutoff_configuration>

<database_schema>
  <er_diagram>
    <entity name="User">
      <relationship type="has many" to="Registration">one-to-many</relationship>
    </entity>
    <entity name="Registration">
      <relationship type="has many" to="RegistrationOverride">one-to-many</relationship>
    </entity>
    <entity name="Meal">
      <relationship type="has many" to="DailyMenuMeal">one-to-many</relationship>
    </entity>
    <entity name="DailyMenu">
      <relationship type="has many" to="DailyMenuMeal">one-to-many</relationship>
    </entity>
    <entity name="Holiday">standalone, not linked</entity>
    <entity name="CutoffConfig">singleton (id = "global")</entity>
  </er_diagram>

  <models>
    <model name="User">
      <pk>id</pk>
      <indexes>username (unique)</indexes>
    </model>
    <model name="Registration">
      <pk>id</pk>
      <indexes>userId, [userId, date] (unique)</indexes>
    </model>
    <model name="RegistrationOverride">
      <pk>id</pk>
      <indexes>registrationId</indexes>
    </model>
    <model name="Meal">
      <pk>id</pk>
      <indexes>name</indexes>
    </model>
    <model name="DailyMenu">
      <pk>id</pk>
      <indexes>date (unique)</indexes>
    </model>
    <model name="DailyMenuMeal">
      <pk>id</pk>
      <indexes>dailyMenuId, mealId, [dailyMenuId, mealId] (unique)</indexes>
    </model>
    <model name="Holiday">
      <pk>id</pk>
      <indexes>date (unique)</indexes>
    </model>
    <model name="CutoffConfig">
      <pk>id</pk>
    </model>
  </models>
</database_schema>

<architecture_layers>
  <data_flow>
    <layer name="Browser">React UI</layer>
    <layer name="API Routes">app/api/**/route.ts with withAuth/withAdmin middleware</layer>
    <layer name="Controllers">src/controllers/*Controller.ts - parse request, validate, map errors</layer>
    <layer name="Services">src/services/*Service.ts - business rules, orchestration</layer>
    <layer name="Repositories">src/repositories/*Repository.ts - Prisma data access</layer>
    <layer name="Prisma Client">src/lib/prisma.ts with libSQL adapter</layer>
    <layer name="Database">SQLite</layer>
  </data_flow>

  <module_responsibilities>
    <layer name="UI Pages">
      <location>app/</location>
      <examples>app/(employee)/book/page.tsx, app/admin/dashboard/page.tsx</examples>
    </layer>
    <layer name="API Routes">
      <location>app/api/**/</location>
      <examples>app/api/registrations/route.ts</examples>
    </layer>
    <layer name="Controllers">
      <location>src/controllers/</location>
      <examples>RegistrationsController, UsersController, AdminStatsController</examples>
    </layer>
    <layer name="Services">
      <location>src/services/</location>
      <examples>RegistrationService, DailyMenuService, HolidayService</examples>
    </layer>
    <layer name="Repositories">
      <location>src/repositories/</location>
      <examples>RegistrationRepository, UserRepository, MealRepository</examples>
    </layer>
    <layer name="Auth">
      <location>src/lib/</location>
      <examples>auth.ts, authMiddleware.ts, registrationWindow.ts</examples>
    </layer>
    <layer name="API Client">
      <location>src/lib/api.ts</location>
      <description>Browser-side fetch facade for all endpoints</description>
    </layer>
  </module_responsibilities>
</architecture_layers>

<known_gaps>
  <gap id="GAP_001">
    <issue>Holiday dates not blocked in registration booking</issue>
    <impact>Employee can register for days that are holidays</impact>
    <priority>Medium</priority>
  </gap>
  <gap id="GAP_002">
    <issue>Holiday dates not excluded in reports</issue>
    <impact>Report counts include holidays</impact>
    <priority>Medium</priority>
  </gap>
  <gap id="GAP_003">
    <issue>Import employees not implemented</issue>
    <impact>Admin must create employees manually one by one</impact>
    <priority>Low</priority>
  </gap>
  <gap id="GAP_004">
    <issue>Edit employee - phone/email/department fields not saved</issue>
    <impact>Backend limitation prevents updating these fields</impact>
    <priority>Medium</priority>
  </gap>
  <gap id="GAP_005">
    <issue>RegistrationOverride not exposed in any UI</issue>
    <impact>No audit trail visibility for admin overrides</impact>
    <priority>Low</priority>
  </gap>
</known_gaps>

<constants>
  <constant name="MAX_BOOKING_WEEK_OFFSET">
    <value>4</value>
    <location>src/lib/registrationWindow.ts</location>
    <description>Maximum weeks ahead for booking (current week + 4 = 5 weeks total)</description>
  </constant>
  <constant name="DEFAULT_CUTOFF_HOUR">
    <value>23</value>
    <location>src/lib/registrationWindow.ts</location>
  </constant>
  <constant name="DEFAULT_CUTOFF_MINUTE">
    <value>0</value>
    <location>src/lib/registrationWindow.ts</location>
  </constant>
  <constant name="JWT_EXPIRY">
    <value>7 days</value>
    <location>src/lib/auth.ts</location>
  </constant>
  <constant name="BCRYPT_COST">
    <value>12</value>
    <location>src/lib/auth.ts</location>
  </constant>
  </constants>