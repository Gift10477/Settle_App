import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReservationsCsv,
  buildReservationsPrintHtml,
  filterReservations,
} from '../src/components/admin/reservationReport.js';

const bookings = [
  {
    id: 2,
    student_name: 'Bea',
    email: 'bea@example.test',
    property_title: 'West Hall',
    status: 'approved',
    move_in_date: '2027-02-01',
    created_at: '2026-11-02T10:00:00Z',
  },
  {
    id: 1,
    student_name: 'Ari',
    email: 'ari@example.test',
    property_title: 'North Hall',
    status: 'pending',
    move_in_date: '2027-01-01',
    created_at: '2026-11-01T10:00:00Z',
  },
];

test('reservation report filters by status, submission dates, and search, then sorts', () => {
  const rows = filterReservations(bookings, {
    status: 'all',
    from: '2026-11-02',
    to: '2026-11-02',
    search: 'bea@',
    sort: 'oldest',
  });

  assert.deepEqual(rows.map(row => row.id), [2]);
});

test('reservation CSV contains report metadata and prevents spreadsheet formulas', () => {
  const csv = buildReservationsCsv([{
    ...bookings[0],
    student_name: '=HYPERLINK("https://example.test")',
  }], {
    status: 'approved',
    from: '',
    to: '',
    search: '',
    sort: 'newest',
  }, new Date('2026-11-12T08:00:00Z'));

  assert.match(csv, /SettleIn - Reservation Report/);
  assert.match(csv, /Status: approved/);
  assert.match(csv, /"'=HYPERLINK/);
});

test('print report has a dated branded header and escapes untrusted reservation data', () => {
  const html = buildReservationsPrintHtml([{
    ...bookings[0],
    student_name: '<script>alert(1)</script>',
  }], {
    status: 'all',
    from: '',
    to: '',
    search: '',
    sort: 'newest',
  }, new Date('2026-11-12T08:00:00Z'));

  assert.match(html, /SettleIn/);
  assert.match(html, /2026/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
});
