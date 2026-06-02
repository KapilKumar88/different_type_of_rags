# Task 13: Password Complexity Rules

## Goal

Fix the post-test security issue where registration accepts weak passwords such as `aaaaaaaa`.

## Scope

- Add password complexity validation to server registration DTOs.
- Add matching client-side registration validation.
- Keep login validation unchanged so existing users are not blocked at sign-in.
- Update focused unit and e2e tests.

## Implementation Details

- Require new registration passwords to contain at least one lowercase letter, one uppercase letter, and one number.
- Keep the existing 8 to 128 character length bounds.
- Use the same user-facing validation message on server and client.

## Completion Criteria

- [x] Server registration rejects weak but long-enough passwords.
- [x] Client registration validation rejects weak but long-enough passwords.
- [x] Existing valid registration/login flows use a compliant test password.
- [x] Server and client verification pass.

## Test Cases

- `aaaaaaaa` is rejected during server registration validation.
- A compliant 8-character password is accepted.
- A compliant 128-character password is accepted.
- Registration/login e2e happy paths still pass.

## Review Gate

Stop after this task and wait for user review before implementing additional security hardening items.

## Implementation Notes

- Added a shared server registration password complexity message and regex.
- Added matching client registration validation with the same message.
- Kept login validation length-based so existing users are not blocked at sign-in.
- Updated server auth unit/e2e fixtures to use a compliant password.
- Added server DTO and e2e coverage for weak password rejection.
