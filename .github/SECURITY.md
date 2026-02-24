# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email us at: [security contact email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 1 week
- **Fix & Disclosure:** Within 30 days

## Security Measures

This project implements the following security measures:

- **Authentication:** Supabase Auth with JWT tokens
- **Authorization:** Row Level Security (RLS) on all database tables
- **Input Validation:** Zod schema validation on all inputs
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Dependency Scanning:** Automated via Dependabot and npm audit
- **Secret Management:** Environment variables, never committed to git
- **CI/CD Security:** Automated secret scanning in CI pipeline
