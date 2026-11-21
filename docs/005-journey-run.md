# 0005: End-to-end journey run

Status: Run 1 complete (all 10 steps passed). No second run has been completed.
Date run: 2026-11-21
Run number: 1
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
| 1 | Open dashboard after creating the account | 0.00 | Empty state shown | PASS | |
| 2 | Add money out 5,000.00 | −5,000.00 | 1 entry; empty state gone | PASS | Label: New shoes; category: Shopping. |
| 3 | Add money in 20,000.00 | 15,000.00 | 2 entries; newest on top | PASS | Label: Test; category: Salary. |
| 4 | Edit the 5,000.00 out entry to 7,000.00 | 13,000.00 | Row shows 7,000.00; fields pre-filled | PASS | Amount and balance observed as 7,000.00 and 13,000.00; label: New shoes; category: Shopping. |
| 5 | Edit an entry's date from the 21st to the 22nd | Balance unchanged | List order updates | PASS | Balance remained unchanged and the list reordered after changing the date from the 21st to the 22nd. |
| 6 | Delete an entry (confirm) | −7,000.00 | Row removed; confirmation asked | PASS | Deleted the Test income entry (Salary); row removed and corrected balance was −7,000.00. |
| 7 | Fully close and reopen the app | −7,000.00 | Same list as step 6 | PASS | Entries and balance survived the restart |
| 8 | Airplane mode ON, fully close and reopen | −7,000.00 | Lands on the dashboard (not login); same list | PASS | Opened on the dashboard while offline; user was not signed out |
| 9 | Still in airplane mode: add money in 0.10, then money in 0.20 | −6,999.70 | 3 entries; adding works offline | PASS | Balance read −6,999.70, so 0.10 + 0.20 = 0.30 exactly |
| 10 | Airplane mode OFF, sign out, sign back in | −6,999.70 | Same 3 entries | PASS | Same entries and balance after signing back in |

#
## Acceptance criteria

| # | Criterion | Met? |
|---|-----------|------|
| 1 | Fresh start: add 5,000.00 out gives −5,000.00; add 20,000.00 in gives 15,000.00 | Met (storage cleared, new account) |
| 2 | Ordering, fields, edit-updates-balance and delete-corrects-balance hold during the run | Met (labels New shoes and Test, categories Shopping and Salary, date edit from the 21st to the 22nd, reordering, amount edit, and balance correction were observed) |
| 3 | Close/reopen and airplane mode show the same history and balance; adding works offline | Met (steps 7 to 9) |
| 4 | Sign out and back in shows the same entries and balance | Met (step 10) |
| 5 | No failed step, and the whole journey re-run twice cleanly | Not met yet: only one run has been completed |
#

## Limits of this run

- Storage was cleared rather than the app being uninstalled and reinstalled.

## Sign-off

Not signed off. A second clean run of steps 1 to 10 is still outstanding.