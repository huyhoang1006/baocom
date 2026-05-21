<project>
  <name>baocom</name>
  <description>Báo Cơm Trưa Công Ty - E2E Test Specification</description>
  <tech_stack>Playwright + TypeScript</tech_stack>
  <date>2026-05-18</date>
  <review_status>VERIFIED with playwright-cli</review_status>
</project>

<locators verified="2026-05-19">
  <login_page>
    <username_input>getByRole('textbox', { name: 'Tên đăng nhập' })</username_input>
    <password_input>getByRole('textbox', { name: 'Mật khẩu' })</password_input>
    <submit_button>getByRole('button', { name: 'Đăng nhập' })</submit_button>
    <forgot_password_link>getByRole('link', { name: 'Quên mật khẩu?' })</forgot_password_link>
  </login_page>

  <admin_sidebar>
    <dashboard_link>getByRole('link', { name: /Dashboard/i })</dashboard_link>
    <menu_link>getByRole('link', { name: /Thực đơn/i })</menu_link>
    <holidays_link>getByRole('link', { name: /Ngày lễ/i })</holidays_link>
    <employees_link>getByRole('link', { name: /Nhân sự/i })</employees_link>
    <reports_link>getByRole('link', { name: /Báo cáo/i })</reports_link>
    <settings_link>getByRole('link', { name: /Cài đặt/i })</settings_link>
    <logout_button>getByRole('button', { name: /Đăng xuất/i })</logout_button>
  </admin_sidebar>

  <admin_dashboard>
    <date_picker>getByRole('textbox', { name: '' })</date_picker>
    <today_button>getByRole('button', { name: /Hôm nay/i })</today_button>
    <export_report_link>getByRole('link', { name: /Xuất báo cáo/i })</export_report_link>
    <manage_employees_link>getByRole('link', { name: /Quản lý nhân sự/i })</manage_employees_link>
    <stats_section>getByText(/Thống kê đăng ký/i)</stats_section>
  </admin_dashboard>

  <admin_menu>
    <week_display>getByText(/Tuần \d{2}\/\d{2} - \d{2}\/\d{2}/)</week_display>
    <prev_week_button>getByRole('button', { name: /Tuần trước/i })</prev_week_button>
    <current_week_button>getByRole('button', { name: /Tuần này/i })</current_week_button>
    <next_week_button>getByRole('button', { name: /Tuần sau/i })</next_week_button>
    <save_button>getByRole('button', { name: /Lưu thay đổi/i })</save_button>
  </admin_menu>

  <admin_employees>
    <add_employee_button>getByRole('button', { name: /Thêm nhân viên/i })</add_employee_button>
    <search_input>getByPlaceholder(/Tìm kiếm/i)</search_input>
  </admin_employees>

  <admin_reports>
    <report_type_day>getByRole('button', { name: /Ngày/i })</report_type_day>
    <report_type_week>getByRole('button', { name: /Tuần/i })</report_type_week>
    <report_type_month>getByRole('button', { name: /Tháng/i })</report_type_month>
    <preview_button>getByRole('button', { name: /Xem trước/i })</preview_button>
    <export_excel_button>getByRole('button', { name: /Xuất Excel/i })</export_excel_button>
    <export_csv_button>getByRole('button', { name: /Xuất CSV/i })</export_csv_button>
  </admin_reports>

  <employee_sidebar>
    <dashboard_link>getByRole('link', { name: /Dashboard/i })</dashboard_link>
    <book_link>getByRole('link', { name: /Báo cơm/i })</book_link>
    <history_link>getByRole('link', { name: /Lịch sử/i })</history_link>
  </employee_sidebar>

  <book_page>
    <week_label>getByText(/Tuần \d{2}\/\d{2} - \d{2}\/\d{2}/)</week_label>
    <prev_week_button>getByRole('button', { name: /← Tuần trước/i })</prev_week_button>
    <next_week_button>getByRole('button', { name: /Tuần sau →/i })</next_week_button>
    <eating_button>getByRole('button', { name: /Có ăn/i })</eating_button>
    <not_eating_button>getByRole('button', { name: /Không ăn/i })</not_eating_button>
    <today_badge>getByText(/Hôm nay/i)</today_badge>
  </book_page>

  <holidays_page>
    <add_holiday_button>getByRole('button', { name: /Thêm ngày lễ/i })</add_holiday_button>
  </holidays_page>
</locators>

<authentication>
  <tc id="AUTH_001">
    <name>Login thành công với tài khoản admin</name>
    <priority>High</priority>
    <preconditions>
      <item>Tài khoản admin tồn tại trong database</item>
      <item>Ứng dụng đang chạy tại http://127.0.0.1:3000</item>
    </preconditions>
    <test_data>
      <username>admin</username>
      <password>admin123</password>
      <expected_role>admin</expected_role>
    </test_data>
    <test_steps>
      <step number="1">Navigate to http://127.0.0.1:3000/login</step>
      <step number="2">Fill textbox "Tên đăng nhập" with "admin"</step>
      <step number="3">Fill textbox "Mật khẩu" with "admin123"</step>
      <step number="4">Click button "Đăng nhập"</step>
      <step number="5">Wait for URL to change from /login</step>
    </test_steps>
    <expected_results>
      <result>Redirect away from /login page</result>
      <result>Token cookie (httpOnly) is set</result>
      <result>Admin sidebar is visible with items: Dashboard, Thực đơn, Ngày lễ/ngày nghỉ, Nhân sự, Báo cáo</result>
    </expected_results>
  </tc>

  <tc id="AUTH_002">
    <name>Login thành công với tài khoản employee</name>
    <priority>High</priority>
    <preconditions>
      <item>Tài khoản nguyenvana hoặc hungpx tồn tại trong database</item>
    </preconditions>
    <test_data>
      <username>hungpx</username>
      <password>employee123</password>
      <expected_role>employee</expected_role>
    </test_data>
    <test_steps>
      <step number="1">Navigate to http://127.0.0.1:3000/login</step>
      <step number="2">Fill textbox "Tên đăng nhập" with "hungpx"</step>
      <step number="3">Fill textbox "Mật khẩu" with "employee123"</step>
      <step number="4">Click button "Đăng nhập"</step>
    </test_steps>
    <expected_results>
      <result>Redirect to /dashboard or /book</result>
      <result>Employee sidebar visible with items: Dashboard, Báo cơm, Lịch sử</result>
    </expected_results>
  </tc>

  <tc id="AUTH_003">
    <name>Login thất bại - username không tồn tại</name>
    <priority>High</priority>
    <test_data>
      <username>nonexistent_user_xyz</username>
      <password>anypassword123</password>
    </test_data>
    <test_steps>
      <step number="1">Navigate to http://127.0.0.1:3000/login</step>
      <step number="2">Fill textbox "Tên đăng nhập" with "nonexistent_user_xyz"</step>
      <step number="3">Fill textbox "Mật khẩu" with "anypassword123"</step>
      <step number="4">Click button "Đăng nhập"</step>
    </test_steps>
    <expected_results>
      <result>Stay on /login page</result>
      <result>Show error message "Invalid credentials"</result>
      <result>No token cookie set</result>
    </expected_results>
  </tc>

  <tc id="AUTH_004">
    <name>Login thất bại - password sai</name>
    <priority>High</priority>
    <test_data>
      <username>admin</username>
      <password>wrongpassword</password>
    </test_data>
    <test_steps>
      <step number="1">Navigate to http://127.0.0.1:3000/login</step>
      <step number="2">Fill "Tên đăng nhập" with "admin"</step>
      <step number="3">Fill "Mật khẩu" with "wrongpassword"</step>
      <step number="4">Click "Đăng nhập"</step>
    </test_steps>
    <expected_results>
      <result>Stay on /login page</result>
      <result>Show error message "Invalid credentials"</result>
    </expected_results>
  </tc>

  <tc id="AUTH_007">
    <name>Rate limit - 5 lần đăng nhập thất bại thì bị khóa</name>
    <priority>High</priority>
    <test_data>
      <username>admin</username>
      <wrong_password>wrongpassword</wrong_password>
      <max_attempts>5</max_attempts>
    </test_data>
    <test_steps>
      <step number="1">Loop login 5 lần với password sai</step>
      <step number="2">Ở lần thứ 6, login với password sai</step>
    </test_steps>
    <expected_results>
      <result>Lần 1-5: Status 401, message "Invalid credentials"</result>
      <result>Lần 6: Status 429, message "Too many failed attempts"</result>
      <result>Response có field retryAfter (khoảng 900 seconds)</result>
    </expected_results>
  </tc>

  <tc id="AUTH_009">
    <name>Token hết hạn sau 7 ngày - kiểm tra cookie attributes</name>
    <priority>High</priority>
    <test_data>
      <username>admin</username>
      <password>admin123</password>
    </test_data>
    <test_steps>
      <step number="1">POST /api/auth/login với credentials đúng</step>
      <step number="2">Kiểm tra Set-Cookie header</step>
    </test_steps>
    <expected_results>
      <result>Cookie "token" có Max-Age=604800 (7 ngày)</result>
      <result>Cookie có flag HttpOnly</result>
      <result>Cookie có flag SameSite=Lax hoặc SameSite=Strict</result>
    </expected_results>
  </tc>

  <tc id="AUTH_010">
    <name>Logout làm mất hiệu lực token</name>
    <priority>High</priority>
    <test_data>
      <username>admin</username>
      <password>admin123</password>
    </test_data>
    <test_steps>
      <step number="1">Login thành công</step>
      <step number="2">POST /api/auth/logout với token cookie</step>
      <step number="3">GET /api/auth/me với token cũ</step>
    </test_steps>
    <expected_results>
      <result>Logout returns 200</result>
      <result>GET /api/auth/me returns 401</result>
    </expected_results>
  </tc>

  <tc id="AUTH_011">
    <name>Token không hợp lệ bị reject</name>
    <priority>High</priority>
    <test_data>
      <invalid_token>invalid_token_abc123xyz</invalid_token>
    </invalid_token>
    <test_steps>
      <step number="1">GET /api/auth/me với header Cookie: token=invalid_token_abc123xyz</step>
    </test_steps>
    <expected_results>
      <result>Status 401</result>
      <result>Body: { "error": "Invalid token" }</result>
    </expected_results>
  </tc>

  <tc id="AUTH_012">
    <name>Không có token thì bị reject ở protected route</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">GET /api/auth/me without Cookie header</step>
    </test_steps>
    <expected_results>
      <result>Status 401</result>
      <result>Body: { "error": "Unauthorized" }</result>
    </expected_results>
  </tc>
</authentication>

<registration_system>
  <tc id="REG_001">
    <name>Employee đặt ăn (eating) cho ngày tương lai</name>
    <priority>High</priority>
    <preconditions>
      <item>Login với tài khoản employee (hungpx/employee123)</item>
      <item>Navigate to /book</item>
    </preconditions>
    <test_data>
      <username>hungpx</username>
      <password>employee123</password>
    </test_data>
    <test_steps>
      <step number="1">Login as hungpx/employee123</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Wait for page to load registration cards</step>
      <step number="4">Click button "Có ăn" on a future day (not today)</step>
      <step number="5">Wait for API call to complete</step>
    </test_steps>
    <expected_results>
      <result>Button "Có ăn" shows active/highlighted state</result>
      <result>API POST /api/registrations called with { date: "...", status: "eating" }</result>
      <result>Success notification appears</result>
    </expected_results>
  </tc>

  <tc id="REG_003">
    <name>Employee đặt không ăn (not_eating)</name>
    <priority>High</priority>
    <preconditions>
      <item>Login với tài khoản employee</item>
    </preconditions>
    <test_data>
      <username>hungpx</username>
      <password>employee123</password>
    </test_data>
    <test_steps>
      <step number="1">Login as hungpx/employee123</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Click button "Không ăn" on a future day</step>
    </test_steps>
    <expected_results>
      <result>Button "Không ăn" shows active state (red/highlighted)</result>
      <result>API creates registration with status "not_eating"</result>
    </expected_results>
  </tc>

  <tc id="REG_004">
    <name>Employee toggle từ not_eating sang eating</name>
    <priority>High</priority>
    <preconditions>
      <item>Đã có registration not_eating cho ngày trong tương lai</item>
    </preconditions>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Find day with "Không ăn" button active</step>
      <step number="4">Click "Có ăn" button</step>
    </test_steps>
    <expected_results>
      <result>Registration deleted (back to implied eating)</result>
      <result>Day shows no active button state</result>
    </expected_results>
  </tc>

  <tc id="REG_005">
    <name>Không thể đặt cho ngày trong quá khứ</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Inspect first day card (today)</step>
    </test_steps>
    <expected_results>
      <result>First card shows "Hôm nay" badge</result>
      <result>Today is not clickable/disabled for booking</result>
      <result>No API call for today</result>
    </expected_results>
  </tc>

  <tc id="REG_006">
    <name>Book page chỉ hiển thị ngày trong tuần (Thứ 2-6)</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Check day cards display</step>
    </test_steps>
    <expected_results>
      <result>Only weekdays (Mon-Fri) are displayed</result>
      <result>Weekends (Thứ 7, Chủ nhật) are NOT displayed or disabled</result>
    </expected_results>
  </tc>

  <tc id="REG_007">
    <name>Book page hiển thị 8 ngày (hôm nay + 7 ngày tới)</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Count visible day cards</step>
    </test_steps>
    <expected_results>
      <result>8 day cards displayed (today + 7 future days)</result>
      <result>First card labeled "Hôm nay"</result>
    </expected_results>
  </tc>

  <tc id="REG_009">
    <name>Employee không thể đặt sau cutoff time (23:00 ngày hôm trước)</name>
    <priority>High</priority>
    <preconditions>
      <item>Current time > 23:00</item>
      <item>Tomorrow has existing registration</item>
    </preconditions>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Try to change tomorrow's registration</step>
    </test_steps>
    <expected_results>
      <result>UI shows locked state for tomorrow</result>
      <result>API returns 400 with "LOCKED" error</result>
    </expected_results>
  </tc>

  <tc id="REG_010">
    <name>Admin có thể override locked registration</name>
    <priority>High</priority>
    <preconditions>
      <item>Logged in as admin</item>
      <item>Tomorrow's registration is past cutoff</item>
    </preconditions>
    <test_data>
      <username>admin</username>
      <password>admin123</password>
    </test_data>
    <test_steps>
      <step number="1">Login as admin</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Change tomorrow's registration status</step>
    </test_steps>
    <expected_results>
      <result>Admin can still modify (override)</result>
      <result>RegistrationOverride record is created in database</result>
    </expected_results>
  </tc>

  <tc id="REG_BOOK_WEEK_NAV">
    <name>Navigate tuần trước và tuần sau trên trang book</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Navigate to /book</step>
      <step number="3">Click "← Tuần trước" button</step>
      <step number="4">Verify week changes to previous week</step>
      <step number="5">Click "Tuần sau →" button</step>
      <step number="6">Verify week changes to next week</step>
    </test_steps>
    <expected_results>
      <result>Week label updates to show different date range</result>
      <result>Navigation works correctly</result>
    </expected_results>
  </tc>
</registration_system>

<user_management>
  <tc id="USER_001">
    <name>Admin xem danh sách nhân viên</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin/admin123</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /admin/employees</step>
      <step number="2">Wait for table to load</step>
    </test_steps>
    <expected_results>
      <result>Table displays employees with name, username, phone</result>
      <result>At least admin and some employee users visible</result>
    </expected_results>
  </tc>

  <tc id="USER_002">
    <name>Employee không thể truy cập /admin/employees</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as employee (hungpx/employee123)</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /admin/employees</step>
    </test_steps>
    <expected_results>
      <result>403 Forbidden page hoặc redirect về /login</result>
    </expected_results>
  </tc>

  <tc id="USER_003">
    <name>Admin tạo nhân viên mới</name>
    <priority>High</priority>
    <test_data>
      <new_employee>
        <name>Test Employee New</name>
        <phone>0912345678</phone>
        <email>test@company.com</email>
      </new_employee>
    </test_data>
    <test_steps>
      <step number="1">Login as admin/admin123</step>
      <step number="2">Navigate to /admin/employees</step>
      <step number="3">Click button "Thêm nhân viên"</step>
      <step number="4">Fill modal form with test data</step>
      <step number="5">Click button "Lưu" or similar</step>
    </test_steps>
    <expected_results>
      <result>New employee appears in list</result>
      <result>Success notification shown</result>
    </expected_results>
  </tc>

  <tc id="USER_005">
    <name>Admin sửa tên nhân viên</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Login as admin/admin123</step>
      <step number="2">Navigate to /admin/employees</step>
      <step number="3">Click edit icon on an employee row</step>
      <step number="4">Change name field</step>
      <step number="5">Click "Lưu"</step>
    </test_steps>
    <expected_results>
      <result>Name updated in database</result>
      <result>UI shows new name</result>
    </expected_results>
  </tc>

  <tc id="USER_006">
    <name>Admin xóa (soft delete) nhân viên</name>
    <priority>High</priority>
    <preconditions>
      <item>Cần có ít nhất 1 employee không phải admin để test</item>
    </preconditions>
    <test_steps>
      <step number="1">Login as admin/admin123</step>
      <step number="2">Navigate to /admin/employees</step>
      <step number="3">Click delete button on a non-admin employee</step>
      <step number="4">Confirm deletion in modal if prompted</step>
    </test_steps>
    <expected_results>
      <result>Employee's isActive set to false</result>
      <result>Employee disappears from active list</result>
    </expected_results>
  </tc>

  <tc id="USER_008">
    <name>Search nhân viên</name>
    <priority>Medium</priority>
    <test_data>
      <search_query>admin</search_query>
    </test_data>
    <test_steps>
      <step number="1">Login as admin/admin123</step>
      <step number="2">Navigate to /admin/employees</step>
      <step number="3">Type in search input placeholder "Tìm kiếm"</step>
    </test_steps>
    <expected_results>
      <result>List filters to show matching employees</result>
      <result>Partial match works</result>
    </expected_results>
  </tc>
</user_management>

<admin_dashboard>
  <tc id="DASH_001">
    <name>Dashboard hiển thị stats đúng cho ngày hôm nay</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin/admin123</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /admin/dashboard</step>
      <step number="2">Wait for stats to load</step>
    </test_steps>
    <expected_results>
      <result>Shows heading "Thống kê đăng ký suất ăn trưa ngày hôm nay"</result>
      <result>Date picker shows current date (2026-05-19)</result>
      <result>Stats section visible</result>
    </expected_results>
  </tc>

  <tc id="DASH_003">
    <name>Chọn ngày khác để xem stats</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/dashboard</step>
      <step number="2">Click date picker input</step>
      <step number="3">Select a different date</step>
    </test_steps>
    <expected_results>
      <result>Stats update to show data for selected date</result>
    </expected_results>
  </tc>

  <tc id="DASH_004">
    <name>Nút "Hôm nay" chuyển về ngày hiện tại</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/dashboard</step>
      <step number="2">Select a different date</step>
      <step number="3">Click button "Hôm nay"</step>
    </test_steps>
    <expected_results>
      <result>View switches to today's stats</result>
      <result>Date picker shows current date</result>
    </expected_results>
  </tc>

  <tc id="DASH_005">
    <name>Nút "Xuất báo cáo" chuyển đến trang reports</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/dashboard</step>
      <step number="2">Click link "Xuất báo cáo"</step>
    </test_steps>
    <expected_results>
      <result>Navigate to /admin/reports</result>
    </expected_results>
  </tc>

  <tc id="DASH_006">
    <name>Nút "Quản lý nhân sự" chuyển đến trang employees</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/dashboard</step>
      <step number="2">Click link "Quản lý nhân sự"</step>
    </test_steps>
    <expected_results>
      <result>Navigate to /admin/employees</result>
    </expected_results>
  </tc>

  <tc id="DASH_007">
    <name>Employee không thể truy cập /admin/dashboard</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as employee (hungpx/employee123)</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /admin/dashboard</step>
    </test_steps>
    <expected_results>
      <result>403 Forbidden or redirect to /login</result>
    </expected_results>
  </tc>
</admin_dashboard>

<reporting_system>
  <tc id="REP_001">
    <name>Tạo report ngày</name>
    <priority>High</priority>
    <test_data>
      <report_type>Ngày</report_type>
    </test_data>
    <test_steps>
      <step number="1">Login as admin/admin123</step>
      <step number="2">Navigate to /admin/reports</step>
      <step number="3">Click button "Ngày" (if not already selected)</step>
      <step number="4">Pick a date in the date picker</step>
      <step number="5">Click button "Xem trước"</step>
    </test_steps>
    <expected_results>
      <result>Preview table shows employees with status for that date</result>
      <result>Columns: STT, Họ tên, SĐT, Ngày</result>
    </expected_results>
  </tc>

  <tc id="REP_002">
    <name>Tạo report tuần</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Navigate to /admin/reports</step>
      <step number="2">Click button "Tuần"</step>
      <step number="3">Select a week</step>
      <step number="4">Click "Xem trước"</step>
    </test_steps>
    <expected_results>
      <result>Shows Mon-Fri data for selected week</result>
      <result>Weekends not included</result>
    </expected_results>
  </tc>

  <tc id="REP_003">
    <name>Tạo report tháng</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/reports</step>
      <step number="2">Click button "Tháng"</step>
      <step number="3">Select a month</step>
      <step number="4">Click "Xem trước"</step>
    </test_steps>
    <expected_results>
      <result>Shows all weekdays of selected month</result>
    </expected_results>
  </tc>

  <tc id="REP_004">
    <name>Export Excel</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Navigate to /admin/reports</step>
      <step number="2">Generate a report preview</step>
      <step number="3">Click button "Xuất Excel"</step>
    </test_steps>
    <expected_results>
      <result>.xlsx file is downloaded</result>
      <result>File contains preview data</result>
    </expected_results>
  </tc>

  <tc id="REP_005">
    <name>Export CSV</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Navigate to /admin/reports</step>
      <step number="2">Generate a report preview</step>
      <step number="3">Click button "Xuất CSV"</step>
    </test_steps>
    <expected_results>
      <result>CSV file is downloaded</result>
      <result>File has suggested filename with date range</result>
    </expected_results>
  </tc>

  <tc id="REP_006">
    <name>CSV header chứa date range</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Export CSV với date range cụ thể</step>
      <step number="2">Open CSV file</step>
    </test_steps>
    <expected_results>
      <result>Header contains date range info</result>
    </expected_results>
  </tc>

  <tc id="REP_008">
    <name>Report loại trừ Chủ nhật</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Generate week report</step>
      <step number="2">Check total count</step>
    </test_steps>
    <expected_results>
      <result>Sunday is NOT counted</result>
      <result>Only Mon-Fri counted</result>
    </expected_results>
  </tc>
</reporting_system>

<menu_management>
  <tc id="MENU_001">
    <name>Xem weekly menu grid</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin/admin123</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /admin/menu</step>
      <step number="2">Wait for menu grid to load</step>
    </test_steps>
    <expected_results>
      <result>Page heading "Thực đơn"</result>
      <result>Week display shows date range (e.g., "Tuần 18/05 - 22/05")</result>
      <result>Week navigation buttons: ◀ Tuần trước, Tuần này, Tuần sau ▶</result>
    </expected_results>
  </tc>

  <tc id="MENU_002">
    <name>Navigate tuần trước</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/menu</step>
      <step number="2">Click button "Tuần trước" (◀)</step>
    </test_steps>
    <expected_results>
      <result>Week display changes to previous week</result>
    </expected_results>
  </tc>

  <tc id="MENU_003">
    <name>Navigate tuần sau</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/menu</step>
      <step number="2">Click button "Tuần sau ▶"</step>
    </test_steps>
    <expected_results>
      <result>Week display changes to next week</result>
    </expected_results>
  </tc>

  <tc id="MENU_004">
    <name>Edit và save menu cho một ngày</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">Navigate to /admin/menu</step>
      <step number="2">Click on a menu cell (e.g., Monday main dish)</step>
      <step number="3">Enter meal name(s)</step>
      <step number="4">Click button "Lưu thay đổi"</step>
    </test_steps>
    <expected_results>
      <result>API POST /api/daily-menus called</result>
      <result>Success notification</result>
      <result>Data persisted</result>
    </expected_results>
  </tc>

  <tc id="MENU_005">
    <name>Navigate về tuần hiện tại</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/menu</step>
      <step number="2">Click "◀ Tuần trước" once or twice</step>
      <step number="3">Click button "Tuần này"</step>
    </test_steps>
    <expected_results>
      <result>Week display returns to current week</result>
    </expected_results>
  </tc>
</menu_management>

<holiday_system>
  <tc id="HOL_001">
    <name>Xem danh sách ngày lễ</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin/admin123</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /admin/holidays</step>
    </test_steps>
    <expected_results>
      <result>Page displays list of holidays</result>
      <result>Each entry shows date and description</result>
    </expected_results>
  </tc>

  <tc id="HOL_002">
    <name>Tạo ngày lễ mới</name>
    <priority>High</priority>
    <test_data>
      <date>2026-06-01</date>
      <description>Ngày Quốc tế Thiếu nhi</description>
    </test_data>
    <test_steps>
      <step number="1">Navigate to /admin/holidays</step>
      <step number="2">Click button "Thêm ngày lễ"</step>
      <step number="3">Pick date: 2026-06-01</step>
      <step number="4">Enter description</step>
      <step number="5">Save</step>
    </test_steps>
    <expected_results>
      <result>Holiday created in database</result>
      <result>Appears in list</result>
    </expected_results>
  </tc>

  <tc id="HOL_003">
    <name>Tạo ngày lễ chỉ có date, không description</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Navigate to /admin/holidays</step>
      <step number="2">Click "Thêm ngày lễ"</step>
      <step number="3">Pick a date</step>
      <step number="4">Leave description empty</step>
      <step number="5">Save</step>
    </test_steps>
    <expected_results>
      <result>Holiday created successfully</result>
    </expected_results>
  </tc>

  <tc id="HOL_006">
    <name>Ngày lễ không block đặt ăn (known gap)</name>
    <priority>High</priority>
    <preconditions>
      <item>Tạo holiday vào ngày thứ Hai trong tương lai</item>
    </preconditions>
    <test_steps>
      <step number="1">Admin tạo holiday vào ngày 2026-06-08 (Monday)</step>
      <step number="2">Login as employee</step>
      <step number="3">Navigate to /book</step>
      <step number="4">Try to book 2026-06-08</step>
    </test_steps>
    <expected_results>
      <result>Employee CAN book on holiday date (THIS IS THE GAP)</result>
      <result>Expected behavior: should be blocked</result>
    </expected_results>
  </tc>

  <tc id="HOL_007">
    <name>Employee không thể tạo ngày lễ (403)</name>
    <priority>Medium</priority>
    <preconditions>
      <item>Login as employee (hungpx/employee123)</item>
    </preconditions>
    <test_steps>
      <step number="1">Try to POST /api/holidays directly</step>
    </test_steps>
    <expected_results>
      <result>403 Forbidden</result>
    </expected_results>
  </tc>
</holiday_system>

<meal_management>
  <tc id="MEAL_001">
    <name>List all meals via API</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin</item>
    </preconditions>
    <test_steps>
      <step number="1">GET /api/meals with auth cookie</step>
    </test_steps>
    <expected_results>
      <result>Status 200</result>
      <result>Returns array of meals: [{ id, name, type, isActive }, ...]</result>
    </expected_results>
  </tc>

  <tc id="MEAL_002">
    <name>Admin tạo meal mới với type hợp lệ</name>
    <priority>High</priority>
    <test_data>
      <name>Test Meal Automation</name>
      <type>main</type>
    </test_data>
    <test_steps>
      <step number="1">POST /api/meals with { name: "Test Meal Automation", type: "main" }</step>
    </test_steps>
    <expected_results>
      <result>Status 201 or 200</result>
      <result>Returns created meal object</result>
    </expected_results>
  </tc>

  <tc id="MEAL_003">
    <name>Tạo meal với type không hợp lệ</name>
    <priority>Medium</priority>
    <test_data>
      <name>Invalid Type Meal</name>
      <type>invalid_type_xyz</type>
    </test_data>
    <test_steps>
      <step number="1">POST /api/meals with invalid type</step>
    </test_steps>
    <expected_results>
      <result>Status 400 Bad Request</result>
      <result>Error: "Invalid meal type"</result>
    </expected_results>
  </tc>

  <tc id="MEAL_005">
    <name>Employee không thể tạo meal</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as employee (hungpx/employee123)</item>
    </preconditions>
    <test_steps>
      <step number="1">POST /api/meals</step>
    </test_steps>
    <expected_results>
      <result>403 Forbidden</result>
    </expected_results>
  </tc>

  <tc id="MEAL_006">
    <name>Unauthenticated không thể tạo meal</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">POST /api/meals without auth cookie</step>
    </test_steps>
    <expected_results>
      <result>Status 401 Unauthorized</result>
    </expected_results>
  </tc>
</meal_management>

<daily_menu_api>
  <tc id="DM_001">
    <name>List daily menus</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin</item>
    </preconditions>
    <test_steps>
      <step number="1">GET /api/daily-menus</step>
    </test_steps>
    <expected_results>
      <result>Status 200</result>
      <result>Returns array of daily menus with associated meals</result>
    </expected_results>
  </tc>

  <tc id="DM_002">
    <name>Admin tạo daily menu</name>
    <priority>High</priority>
    <test_data>
      <date>2026-05-28</date>
    </test_data>
    <test_steps>
      <step number="1">First GET /api/meals to get valid meal id</step>
      <step number="2">POST /api/daily-menus with { date: "2026-05-28", mainDishId: validMealId }</step>
    </test_steps>
    <expected_results>
      <result>Status 201 or 200</result>
      <result>DailyMenu created with DailyMenuMeal links</result>
    </expected_results>
  </tc>

  <tc id="DM_003">
    <name>Tạo daily menu với meal ID không tồn tại</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">POST /api/daily-menus with invalid meal ID</step>
    </test_steps>
    <expected_results>
      <result>Status 400 or 404</result>
    </expected_results>
  </tc>

  <tc id="DM_004">
    <name>Tạo daily menu với body rỗng</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">POST /api/daily-menus with {}</step>
    </test_steps>
    <expected_results>
      <result>Status 400 Bad Request</result>
    </expected_results>
  </tc>
</daily_menu_api>

<authorization_security>
  <tc id="AUTHZ_001">
    <name>Non-admin bị blocked khi gọi admin stats API</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as employee (hungpx/employee123)</item>
    </preconditions>
    <test_steps>
      <step number="1">GET /api/admin/stats</step>
    </test_steps>
    <expected_results>
      <result>Status 403 Forbidden</result>
      <result>Body: { "error": "Forbidden" }</result>
    </expected_results>
  </tc>

  <tc id="AUTHZ_002">
    <name>Admin có thể gọi admin stats API</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as admin/admin123</item>
    </preconditions>
    <test_steps>
      <step number="1">GET /api/admin/stats</step>
    </test_steps>
    <expected_results>
      <result>Status 200</result>
      <result>Returns stats object</result>
    </expected_results>
  </tc>

  <tc id="IDOR_001">
    <name>User A không thể đọc User B's registration</name>
    <priority>High</priority>
    <preconditions>
      <item>2 users: hungpx và một employee khác</item>
    </preconditions>
    <test_data>
      <user_a>hungpx</user_a>
      <user_b>nguyenvana</user_b>
      <password>employee123</password>
    </test_data>
    <test_steps>
      <step number="1">Login as user B (nguyenvana)</step>
      <step number="2">Create registration: POST /api/registrations { date: "2026-05-25", status: "eating" }</step>
      <step number="3">Get registration ID from response</step>
      <step number="4">Login as user A (hungpx)</step>
      <step number="5">GET /api/registrations/{registrationId}</step>
    </test_steps>
    <expected_results>
      <result>Status 403 Forbidden</result>
      <result>User A cannot access User B's registration</result>
    </expected_results>
  </tc>

  <tc id="IDOR_002">
    <name>User A không thể sửa User B's registration</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">User B creates registration</step>
      <step number="2">Get registration ID</step>
      <step number="3">User A tries to PATCH /api/registrations/{id}</step>
    </test_steps>
    <expected_results>
      <result>Status 403 Forbidden</result>
    </expected_results>
  </tc>

  <tc id="IDOR_003">
    <name>User A không thể xóa User B's registration</name>
    <priority>High</priority>
    <test_steps>
      <step number="1">User B creates registration</step>
      <step number="2">Get registration ID</step>
      <step number="3">User A tries to DELETE /api/registrations/{id}</step>
    </test_steps>
    <expected_results>
      <result>Status 403 Forbidden</result>
    </expected_results>
  </tc>

  <tc id="IDOR_004">
    <name>Admin có thể truy cập any registration</name>
    <priority>High</priority>
    <preconditions>
      <item>Employee creates registration</item>
    </preconditions>
    <test_steps>
      <step number="1">Employee creates registration</step>
      <step number="2">Admin GET /api/registrations/{id}</step>
    </test_steps>
    <expected_results>
      <result>Status 200</result>
      <result>Admin can access any user's registration</result>
    </expected_results>
  </tc>

  <tc id="SEC_001">
    <name>6 lần login sai trigger 15-minute lockout</name>
    <priority>High</priority>
    <test_data>
      <username>admin</username>
      <wrong_password>wrongpassword</wrong_password>
    </test_data>
    <test_steps>
      <step number="1">Loop login 5 lần với password sai</step>
      <step number="2">Lần 6: login với password sai</step>
    </test_steps>
    <expected_results>
      <result>Lần 1-5: 401 Invalid credentials</result>
      <result>Lần 6: 429 Too many failed attempts</result>
      <result>Response có: retryAfter >= 800 seconds</result>
    </expected_results>
  </tc>

  <tc id="SEC_002">
    <name>Token không hợp lệ không bị count vào rate limit</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Send 10 requests to /api/auth/me với token=invalid</step>
      <step number="2">Then login với valid credentials</step>
    </test_steps>
    <expected_results>
      <result>Login thành công (không bị blocked)</result>
    </expected_results>
  </tc>

  <tc id="SEC_003">
    <name>Role field không thể bị modify bởi non-admin</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as employee</item>
    </preconditions>
    <test_steps>
      <step number="1">Try to PATCH /api/users/{ownId} với { role: "admin" }</step>
    </test_steps>
    <expected_results>
      <result>Request rejected (403) or role not changed</result>
    </expected_results>
  </tc>
</authorization_security>

<employee_dashboard>
  <tc id="EMP_DASH_001">
    <name>Employee xem dashboard</name>
    <priority>High</priority>
    <preconditions>
      <item>Login as nguyenvana/employee123 hoặc hungpx/employee123</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /dashboard</step>
    </test_steps>
    <expected_results>
      <result>Shows heading "Thực Đơn Tuần này" or similar</result>
      <result>Day tabs (T2-T6) may be visible as buttons</result>
    </expected_results>
  </tc>

  <tc id="EMP_DASH_002">
    <name>Employee xem menu cho từng ngày</name>
    <priority>Medium</priority>
    <preconditions>
      <item>Login as employee</item>
      <item>Có menu data cho current week</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /dashboard</step>
      <step number="2">Click on different day buttons (T2, T3, T4...)</step>
    </test_steps>
    <expected_results>
      <result>Menu items display for selected day</result>
    </expected_results>
  </tc>

  <tc id="EMP_DASH_003">
    <name>Employee xem lịch sử đặt ăn</name>
    <priority>Medium</priority>
    <preconditions>
      <item>Login as employee</item>
    </preconditions>
    <test_steps>
      <step number="1">Navigate to /my-history</step>
    </test_steps>
    <expected_results>
      <result>Shows list of past registrations</result>
      <result>Each entry shows date and status</result>
    </expected_results>
  </tc>

  <tc id="EMP_NAV_001">
    <name>Employee sidebar navigation</name>
    <priority>Medium</priority>
    <test_steps>
      <step number="1">Login as employee</step>
      <step number="2">Check sidebar shows: Dashboard, Báo cơm, Lịch sử</step>
      <step number="3">Click "Báo cơm" link</step>
    </test_steps>
    <expected_results>
      <result>Navigate to /book</result>
    </expected_results>
  </tc>
</employee_dashboard>

<admin_settings>
  <tc id="ADMIN_SETTINGS_001">
    <name>Admin truy cập trang cài đặt</name>
    <priority>Low</priority>
    <preconditions>
      <item>Login as admin</item>
    </preconditions>
    <test_steps>
      <step number="1">Click link "Cài đặt" in admin sidebar</step>
    </test_steps>
    <expected_results>
      <result>Navigate to /admin/settings</result>
    </expected_results>
  </tc>
</admin_settings>

<test_data>
  <users>
    <user>
      <username>admin</username>
      <password>admin123</password>
      <role>admin</role>
      <name>Admin</name>
    </user>
    <user>
      <username>hungpx</username>
      <password>employee123</password>
      <role>employee</role>
      <name>Phạm Xuân Hùng</name>
    </user>
    <user>
      <username>nguyenvana</username>
      <password>employee123</password>
      <role>employee</role>
      <name>Nguyễn Văn A</name>
    </user>
    <user>
      <username>tranthib</username>
      <password>employee123</password>
      <role>employee</role>
      <name>Trần Thị B</name>
    </user>
  </users>

  <meal_types>
    <type>main</type>
    <type>vegetable</type>
    <type>dessert</type>
  </meal_types>

  <report_types>
    <type>Ngày</type>
    <type>Tuần</type>
    <type>Tháng</type>
  </report_types>

  <departments>
    <option>Kỹ thuật</option>
    <option>Kinh doanh</option>
    <option>Nhân sự</option>
    <option>Tài chính</option>
    <option>Marketing</option>
  </departments>
</test_data>

<cookie_helper>
  <description>Extract cookie string from Set-Cookie header for API requests</description>
  <code>
function getCookieHeader(headers: Record&lt;string, string&gt;): string {
  const cookies = headers['set-cookie'] || '';
  if (!cookies) return '';
  const cookieStrings = cookies.split(',').map(c => c.trim());
  return cookieStrings
    .map(c => c.split(';')[0])
    .filter(c => c.includes('='))
    .join('; ');
}
  </code>
</cookie_helper>

<notes>
  <item>All page object locators have been verified using playwright-cli on 2026-05-19</item>
  <item>Login uses Vietnamese labels: "Tên đăng nhập", "Mật khẩu", "Đăng nhập"</item>
  <item>Admin sidebar: Dashboard, Thực đơn, Ngày lễ/ngày nghỉ, Nhân sự, Báo cáo, Cài đặt, Đăng xuất</item>
  <item>Employee sidebar: Dashboard, Báo cơm, Lịch sử, Cài đặt, Đăng xuất</item>
  <item>Admin menu page has "Lưu thay đổi" button, not "Lưu"</item>
  <item>Book page shows week navigation with ← Tuần trước and Tuần sau →</item>
  <item>Admin dashboard shows "Thống kê đăng ký suất ăn trưa ngày hôm nay"</item>
</notes>