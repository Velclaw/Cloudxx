import { DomainZone, DNSRecord } from '../types/dns';

/**
 * Generates an RFC 1035 compliant BIND Zone file string.
 */
export function generateBindZoneFile(domain: DomainZone, records: DNSRecord[]): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const serial = `${dateStr}01`;
  
  let output = `; ====================================================================
; BIND Zone File for domain: ${domain.name}
; Exported from Cloudxx Enterprise Platform
; Export Timestamp: ${new Date().toUTCString()}
; ====================================================================

$ORIGIN ${domain.name}.
$TTL 3600

; SOA (Start of Authority) Record
@   IN  SOA  ${domain.nameservers[0] || 'ns1.nameserver.net'}. hostmaster.${domain.name}. (
              ${serial} ; Serial (YYYYMMDDnn)
              10800      ; Refresh (3 hours)
              3600       ; Retry (1 hour)
              604800     ; Expire (1 week)
              300 )      ; Minimum / Negative Cache TTL (5 min)

; Nameservers
`;

  for (const ns of domain.nameservers) {
    output += `@   IN  NS   ${ns.endsWith('.') ? ns : ns + '.'}\n`;
  }

  output += '\n; Zone Resource Records\n';

  for (const r of records) {
    const ttlStr = r.ttl === 'Auto' ? '300' : r.ttl.toString();
    const cleanName = r.name === '@' ? '@' : r.name;
    const paddedName = cleanName.padEnd(20, ' ');
    const paddedTtl = ttlStr.padEnd(8, ' ');
    const paddedType = r.type.padEnd(8, ' ');

    let recordValue = r.content;
    if (r.type === 'MX') {
      recordValue = `${r.priority ?? 10} ${r.content.endsWith('.') ? r.content : r.content + '.'}`;
    } else if (r.type === 'SRV') {
      recordValue = `${r.priority ?? 10} ${r.weight ?? 10} ${r.port ?? 5060} ${r.content.endsWith('.') ? r.content : r.content + '.'}`;
    } else if (r.type === 'CNAME' || r.type === 'NS') {
      if (!recordValue.endsWith('.') && !recordValue.includes(' ') && !recordValue.startsWith('http')) {
        recordValue = `${recordValue}.`;
      }
    } else if (r.type === 'TXT') {
      recordValue = `"${recordValue.replace(/"/g, '\\"')}"`;
    }

    const commentStr = r.comment ? ` ; ${r.comment}` : '';
    output += `${paddedName} ${paddedTtl} IN  ${paddedType} ${recordValue}${commentStr}\n`;
  }

  return output;
}

/**
 * Generates Excel-friendly CSV with UTF-8 BOM so Vietnamese characters display cleanly.
 */
export function generateExcelCsv(records: DNSRecord[]): string {
  const headers = [
    'Tên miền',
    'Loại bản ghi',
    'Tên Host (Name)',
    'Giá trị (Value/Target)',
    'TTL (Giây)',
    'Ưu tiên (MX/SRV)',
    'Proxy CDN (Cloudflare)',
    'DDNS Tự Động',
    'Danh mục',
    'Trạng thái',
    'Cập nhật lần cuối',
    'Người cập nhật',
    'Ghi chú'
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map(r => [
    escapeCsv(r.domainName),
    escapeCsv(r.type),
    escapeCsv(r.name),
    escapeCsv(r.content),
    escapeCsv(r.ttl),
    escapeCsv(r.priority ?? ''),
    escapeCsv(r.proxied ? 'Có' : 'Không'),
    escapeCsv(r.autoUpdateEnabled ? 'Bật' : 'Tắt'),
    escapeCsv(r.category),
    escapeCsv(r.status),
    escapeCsv(new Date(r.lastUpdated).toLocaleString('vi-VN')),
    escapeCsv(r.updatedBy),
    escapeCsv(r.comment ?? '')
  ].join(','));

  // UTF-8 BOM '\uFEFF' ensures Microsoft Excel handles Vietnamese accents correctly
  return '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
}

/**
 * Triggers browser download of file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
