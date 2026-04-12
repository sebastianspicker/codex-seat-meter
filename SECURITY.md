# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public issue.**

Instead, please email the maintainer directly or use GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
feature on this repository.

You should receive a response within 72 hours. If the vulnerability is
confirmed, a fix will be released as soon as possible.

## Supported Versions

Only the latest release on the `main` branch receives security updates.

## Scope

This project reads auth tokens from the local filesystem and forwards them to
the OpenAI API. Vulnerabilities in token handling, path traversal, API route
authentication, or CI/CD configuration are in scope.
