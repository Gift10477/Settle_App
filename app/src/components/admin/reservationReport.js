const REPORT_LABELS = {
  status: 'Status',
  from: 'Submitted from',
  to: 'Submitted through',
  search: 'Search',
  sort: 'Sorted by',
};

export function filterReservations(bookings, filters) {
  const search = filters.search.trim().toLocaleLowerCase();

  return bookings
    .filter(booking => {
      if (filters.status !== 'all' && booking.status !== filters.status) return false;
      const submitted = booking.created_at?.slice(0, 10);
      if (filters.from && (!submitted || submitted < filters.from)) return false;
      if (filters.to && (!submitted || submitted > filters.to)) return false;
      if (search && ![booking.student_name, booking.email, booking.property_title]
        .some(value => String(value || '').toLocaleLowerCase().includes(search))) return false;
      return true;
    })
    .sort((left, right) => {
      if (filters.sort === 'oldest') return String(left.created_at || '').localeCompare(String(right.created_at || ''));
      if (filters.sort === 'student') return String(left.student_name || '').localeCompare(String(right.student_name || ''));
      if (filters.sort === 'property') return String(left.property_title || '').localeCompare(String(right.property_title || ''));
      if (filters.sort === 'status') return String(left.status || '').localeCompare(String(right.status || ''));
      return String(right.created_at || '').localeCompare(String(left.created_at || ''));
    });
}

function csvCell(value) {
  let text = String(value ?? '');
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function filterSummary(filters) {
  return Object.entries(REPORT_LABELS)
    .map(([key, label]) => `${label}: ${filters[key] || (key === 'status' ? 'All' : key === 'sort' ? 'Newest first' : 'Any')}`)
    .join(' | ');
}

export function buildReservationsCsv(bookings, filters, generatedAt = new Date()) {
  const header = ['SettleIn - Reservation Report', `Generated: ${generatedAt.toLocaleString()}`, filterSummary(filters), ''];
  const columns = ['Reservation', 'Student', 'Email', 'Property', 'Status', 'Move-in date', 'Submitted'];
  const rows = bookings.map(booking => [
    booking.id,
    booking.student_name,
    booking.email,
    booking.property_title,
    booking.status,
    booking.move_in_date?.slice(0, 10),
    booking.created_at?.slice(0, 10),
  ]);
  return [...header.map(csvCell), columns.map(csvCell).join(','), ...rows.map(row => row.map(csvCell).join(','))].join('\r\n');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function buildReservationsPrintHtml(bookings, filters, generatedAt = new Date()) {
  const rows = bookings.map(booking => `<tr>
    <td>${escapeHtml(booking.id)}</td>
    <td>${escapeHtml(booking.student_name)}<br>${escapeHtml(booking.email)}</td>
    <td>${escapeHtml(booking.property_title)}</td>
    <td>${escapeHtml(booking.status)}</td>
    <td>${escapeHtml(booking.move_in_date?.slice(0, 10))}</td>
    <td>${escapeHtml(booking.created_at?.slice(0, 10))}</td>
  </tr>`).join('');
  const date = escapeHtml(generatedAt.toLocaleString());
  const summary = escapeHtml(filterSummary(filters));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SettleIn Reservation Report</title>
  <style>
    body{font:14px Arial,sans-serif;color:#172033;margin:32px}
    header{display:flex;align-items:center;gap:12px;border-bottom:2px solid #2563eb;padding-bottom:16px}
    h1{font-size:22px;margin:0} header p{margin:5px 0 0;color:#526078}
    .logo{width:42px;height:42px;border-radius:10px;background:#2563eb;color:#fff;display:grid;place-items:center;font-weight:700;font-size:20px}
    .meta{margin:18px 0;color:#526078;line-height:1.6}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #d5dbe5;text-align:left;padding:8px;vertical-align:top}
    th{background:#eef3ff}
    .empty{text-align:center;padding:24px;color:#526078}
    @media print{body{margin:12mm}thead{display:table-header-group}tr{break-inside:avoid}}
  </style>
</head>
<body>
  <header><div class="logo" aria-label="SettleIn logo">S</div><div><h1>SettleIn</h1><p>Reservation report</p></div></header>
  <p class="meta">Generated: ${date}<br>Filters: ${summary}<br>Reservations: ${bookings.length}</p>
  <table><thead><tr><th>Reservation</th><th>Student</th><th>Property</th><th>Status</th><th>Move-in</th><th>Submitted</th></tr></thead>
  <tbody>${rows || '<tr><td class="empty" colspan="6">No reservations match these filters.</td></tr>'}</tbody></table>
</body>
</html>`;
}
