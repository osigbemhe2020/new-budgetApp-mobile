# 0001: Where entries are stored

Date: 2026-11-03
Status: Accepted

## Decision
A signed-in user's entries live only on their device, in a local SQLite
database (expo-sqlite). Entries do not follow the user to a new device; this
sprint chooses device-only storage. Every entry row records its owner, so
signing out and back in shows the same entries and a second account on the
same phone never sees them.

## Why
Only sign-in is verified against the server. Whether the server can store
entries is unverified, and nothing in this sprint assumes it can. SQLite also
fits the data: entries are rows with typed columns, which keeps a later sync a
simple mapping, and "newest first" and totals by direction are plain queries.

## Trade-offs
- Benefit: recording and viewing always work offline, and each write is atomic,
  so a save either fully happens or visibly fails.
- Cost: data is tied to this install. A new device, uninstall, or cleared app
  data loses the entries, and there is no cross-device access.

## Sprint non-negotiables
SQLite meets all three. It persists to disk, so entries survive a restart. It
runs entirely on the device, so it works without a connection. Writes happen
inside a transaction, so an entry is never silently lost. Implementation
tickets must show the user an error when a write fails.

## Revisit when
Server-side entry storage is verified and a sync ticket is planned.