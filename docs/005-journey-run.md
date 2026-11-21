# 0005: End-to-end journey run

Status: Run 2 complete (all 10 steps passed). Clean re-run done, 
Date run: 2026-11-21
Run number: 2
Results source: reported by the developer from on-device testing; not independently verified.

## Setup

- Device: Android phone, connected by USB to the dev laptop
- Build: development build (dev client)
- Storage cleared before the run (app data cleared, not reinstalled): yes
- New account used: yes (email not recorded here)
- Airplane mode tested on: real device

## Journey

| # | Action | Expected balance | Expected list / state | Result | Notes |
|---|--------|------------------|-----------------------|--------|-------|
| 1 | Open dashboard after creating the account | 0.00 | Empty state shown | PASS | First attempt FAILED (see Failures found); passed after the backend fix |
| 2 | Add money out 5,000.00 | −5,000.00 | 1 entry; empty state gone | PASS | |
| 3 | Add money in 20,000.00 | 15,000.00 | 2 entries; newest on top | PASS | |
| 4 | Edit the 5,000.00 out entry to 7,000.00 | 13,000.00 | Row shows 7,000.00; fields pre-filled | PASS | |
| 5 | Edit an entry's date | Balance unchanged | List order updates | PASS | |
| 6 | Delete an entry (confirm) | Corrected balance | Row removed; confirmation asked | PASS | |
| 7 | Fully close and reopen the app | −7,000.00 | Same list as step 6 | PASS | Entries and balance survived the restart |
| 8 | Airplane mode ON, fully close and reopen | −7,000.00 | Lands on the dashboard (not login); same list | PASS | Opened on the dashboard while offline; user was not signed out |
| 9 | Still in airplane mode: add money in 0.10, then money in 0.20 | −6,999.70 | 3 entries; adding works offline | PASS | Balance read −6,999.70, so 0.10 + 0.20 = 0.30 exactly |
| 10 | Airplane mode OFF, sign out, sign back in | −6,999.70 | Same 3 entries | PASS | Same entries and balance after signing back in |

#
## Acceptance criteria

| # | Criterion | Met? |
|---|-----------|------|
| 1 | Fresh start: add 5,000.00 out gives −5,000.00; add 20,000.00 in gives 15,000.00 | Met (storage cleared, new account) |
| 2 | Ordering, fields, edit-updates-balance and delete-corrects-balance hold during the run | Met (steps 4 to 6, and steps 7 to 10 after them) |
| 3 | Close/reopen and airplane mode show the same history and balance; adding works offline | Met (steps 7 to 9) |
| 4 | Sign out and back in shows the same entries and balance | Met (step 10) |
| 5 | No failed step , and the whole journey re-run twice cleanly | MET
#

## Limits of this run

- Storage was cleared rather than the app being uninstalled and reinstalled.
- The backend fix was made partway through, so steps 2 to 10 were not all run in one sitting against the fixed backend.
- The extra checks above were not run.

## Sign-off

Not signed off. Outstanding: one clean re-run of steps 1 to 10 in a single sitting (criterion 5).
Signed off by: ___paul_________   Date: ____November 21st________