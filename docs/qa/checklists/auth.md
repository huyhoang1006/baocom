# Checklist nhanh — Auth

In ra, đánh dấu ✓ / ✗ khi chạy QA. Chi tiết xem `04-auth-flows.md`.

```
AUTH-01 Login admin thành công                         □
AUTH-02 Login employee thành công                      □
AUTH-03 Sai mật khẩu                                   □
AUTH-04 Username không tồn tại                         □
AUTH-05 Account disabled (isActive=false)              □
AUTH-06 Client-side validation                         □
AUTH-07 Auth guard /admin/*                            □
AUTH-08 Logout                                         □
AUTH-09 Session persistence                            □
AUTH-10 tokenVersion bump khi đổi pass                 □
AUTH-11 /403 page                                      □
AUTH-12 XSS qua input login                            □
```

Ghi chú:
- Cookie `token` httpOnly + sameSite=lax
- JWT_SECRET trong `.env`
- Middleware chỉ bắt `/admin/:path*` — kiểm tra `/employees` riêng