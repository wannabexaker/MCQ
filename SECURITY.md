# Security Policy

## Supported Versions

The `main` branch is the only supported version. Older tags do not receive security fixes.

## Reporting a Vulnerability

Please report security issues privately. Do not open public GitHub issues for security vulnerabilities.

- Open a [private security advisory](https://github.com/wannabexaker/mcq/security/advisories/new) on this repository, or
- Contact the maintainer through the channels listed at [wannabexaker.github.io](https://wannabexaker.github.io)

You will receive an acknowledgement within 7 days.

## Scope

In scope:

- Cross-site scripting in question rendering or import paths
- Injection through imported `q_*.json` content that escapes the JSON parser
- Service worker cache poisoning vectors
- Issues in the Capacitor Android wrapper bundled in this repository

Out of scope:

- Vulnerabilities in `@capacitor/*` upstream packages (report to the Capacitor project)
- Vulnerabilities in `nginx:alpine` upstream image (report to nginx)
- Self-XSS via the user's own pasted JSON content
- Lack of HTTPS when self-hosted on plain HTTP

## Disclosure

After a fix is published, a CVE may be requested depending on severity. Reporters will be credited unless they request anonymity.
