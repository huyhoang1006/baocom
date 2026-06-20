# Checklist nhanh — Reports / API / Security / Visual

## Reports
```
RPT-01 Báo cáo ngày                                   □
RPT-02 Báo cáo tuần                                   □
RPT-03 Báo cáo tháng                                  □
RPT-04 Export CSV                                      □
RPT-05 Export XLSX                                     □
RPT-06 Filter department                               □
RPT-07 Filter trạng thái                               □
RPT-08 Dashboard stats                                 □
RPT-09 Empty report                                    □
RPT-10 Data match UI vs export                         □
RPT-11 Performance                                     □
RPT-12 Quyền truy cập                                  □
RPT-13 SQL injection filter                            □
```

## API contract
```
API-01..API-22 (xem 11-api-contract.md)               □ □ □ ...
```

## Security
```
SEC-01 Horizontal privilege escalation                 □
SEC-02 Vertical privilege escalation                  □
SEC-03 IDOR                                           □
SEC-04 Cookie tampering                                □
SEC-05 JWT secret brute-force / alg confusion          □
SEC-06 XSS                                            □
SEC-07 CSRF                                           □
SEC-08 SQL injection                                  □
SEC-09 Path traversal                                 □
SEC-10 Open redirect                                  □
SEC-11 Sensitive data exposure                        □
SEC-12 Bcrypt cost factor                             □
SEC-13 Middleware matcher đầy đủ                      □
SEC-14 Auth bypass qua header                         □
SEC-15 Race condition override                        □
SEC-16 Information disclosure via error               □
SEC-17 HTTP security headers                          □
SEC-18 Logout invalidates token                       □
SEC-19 Email enumeration                              □
SEC-20 Audit log coverage                             □
```

## Visual / a11y / i18n
```
VIS-01 Layout tổng thể                                □
VIS-02 Responsive breakpoints                         □
VIS-03 Color & contrast                               □
VIS-04 Typography                                     □
VIS-05 Icons                                          □
VIS-06 Empty states                                   □
VIS-07 Loading states                                 □
VIS-08 Error states                                   □
A11Y-01 Keyboard navigation                           □
A11Y-02 Focus ring                                    □
A11Y-03 ARIA labels                                   □
A11Y-04 Form accessibility                            □
A11Y-05 Screen reader                                 □
A11Y-06 Color-only information                        □
A11Y-07 Lighthouse audit                              □
I18N-01 Tiếng Việt đầy đủ                             □
I18N-02 Encoding UTF-8                                □
I18N-03 Date format                                   □
I18N-04 Lang attribute                                □
I18N-05 Currency / number                             □
I18N-06 Số nhiều                                      □
```