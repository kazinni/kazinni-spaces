'use strict';

/**
 * KazInni Learning — certificate generator
 * Renders a certificate as an HTML page, then triggers the browser's
 * "Save as PDF" via the print dialog. No external libraries.
 */

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getFullDate(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) { return '—'; }
}

/**
 * Opens a new window with a fully-styled certificate and auto-triggers print.
 * The user saves as PDF from the print dialog.
 *
 * @param {Object} opts
 * @param {string} opts.recipientName
 * @param {string} opts.courseTitle
 * @param {string} opts.courseCategory
 * @param {string} opts.certificateId
 * @param {number} opts.issuedAt  — ms epoch
 * @param {string} opts.instructor — optional, defaults to KazInni
 */
function downloadCertificate(opts) {
  const {
    recipientName = 'KazInni Learner',
    courseTitle = 'Course',
    courseCategory = '',
    certificateId = '',
    issuedAt = Date.now(),
    instructor = 'KazInni Learning'
  } = opts || {};

  const issued = getFullDate(issuedAt);
  const certId = certificateId || `KZ-${Date.now().toString(36).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate — ${escapeHtml(courseTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Satoshi:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 297mm;
    height: 210mm;
    font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #faf9f7;
    color: #0f0f1e;
    overflow: hidden;
  }
  .cert {
    width: 100%;
    height: 100%;
    padding: 12mm;
    background:
      radial-gradient(circle at 10% 10%, #fef3c7 0%, transparent 40%),
      radial-gradient(circle at 90% 90%, #fef3c7 0%, transparent 40%),
      #ffffff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .frame {
    width: 100%;
    height: 100%;
    border: 3px solid #ca8a04;
    border-radius: 4mm;
    padding: 14mm 18mm;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
  }
  .frame::before {
    content: '';
    position: absolute;
    inset: 3mm;
    border: 1px solid #fbbf24;
    border-radius: 2mm;
    pointer-events: none;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6mm;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 4mm;
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: 11pt;
    color: #0f0f1e;
  }
  .brand-mark {
    width: 12mm;
    height: 12mm;
    border-radius: 3mm;
    background: linear-gradient(135deg, #ca8a04 0%, #fbbf24 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 16pt;
    font-weight: 800;
    font-family: 'Clash Display', sans-serif;
  }
  .brand-text .accent {
    background: linear-gradient(135deg, #ca8a04 0%, #fbbf24 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cert-id {
    font-family: 'Satoshi', sans-serif;
    font-size: 8pt;
    color: #6b7280;
    letter-spacing: 0.5px;
    text-align: right;
  }
  .cert-id strong {
    display: block;
    font-size: 9pt;
    color: #0f0f1e;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: 1mm;
  }

  .body {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4mm 0;
  }
  .eyebrow {
    font-family: 'Satoshi', sans-serif;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: #a16207;
    margin-bottom: 4mm;
  }
  .cert-title {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 42pt;
    line-height: 1;
    color: #0f0f1e;
    margin-bottom: 8mm;
  }
  .presented-to {
    font-family: 'Satoshi', sans-serif;
    font-size: 10pt;
    color: #6b7280;
    margin-bottom: 3mm;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .recipient {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    font-size: 30pt;
    color: #0f0f1e;
    margin-bottom: 6mm;
    position: relative;
    display: inline-block;
    padding: 0 6mm;
  }
  .recipient::after {
    content: '';
    position: absolute;
    left: 6mm;
    right: 6mm;
    bottom: -2mm;
    height: 1px;
    background: linear-gradient(90deg, transparent, #ca8a04, transparent);
  }
  .completed {
    font-family: 'Satoshi', sans-serif;
    font-size: 10pt;
    color: #4a4a5e;
    margin-bottom: 3mm;
    line-height: 1.6;
  }
  .course-name {
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: 18pt;
    color: #0f0f1e;
    letter-spacing: -0.5px;
    margin-bottom: 4mm;
  }
  .category {
    display: inline-block;
    font-family: 'Satoshi', sans-serif;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    padding: 1.5mm 4mm;
    background: #fef3c7;
    color: #a16207;
    border-radius: 100px;
  }

  .footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8mm;
    align-items: end;
    margin-top: 6mm;
    padding-top: 6mm;
    border-top: 1px dashed #e9ecef;
  }
  .footer-col {
    text-align: center;
  }
  .footer-col .line {
    height: 1px;
    background: #0f0f1e;
    margin-bottom: 2mm;
  }
  .footer-col .label {
    font-family: 'Satoshi', sans-serif;
    font-size: 8pt;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .footer-col .value {
    font-family: 'Clash Display', sans-serif;
    font-size: 11pt;
    font-weight: 600;
    color: #0f0f1e;
    margin-bottom: 2mm;
  }
  .seal {
    width: 22mm;
    height: 22mm;
    border-radius: 50%;
    background: linear-gradient(135deg, #ca8a04 0%, #fbbf24 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: 7pt;
    text-align: center;
    line-height: 1.1;
    box-shadow: 0 2mm 6mm rgba(202,138,4,0.35);
    margin: 0 auto;
    padding: 3mm;
  }
  .seal span {
    display: block;
    font-size: 5pt;
    font-weight: 500;
    opacity: 0.9;
    letter-spacing: 0.5px;
    margin-top: 1mm;
  }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="cert">
    <div class="frame">

      <div class="header">
        <div class="brand">
          <div class="brand-mark">K</div>
          <div class="brand-text">Kaz<span class="accent">Inni</span> Learning</div>
        </div>
        <div class="cert-id">
          Certificate ID
          <strong>${escapeHtml(certId)}</strong>
        </div>
      </div>

      <div class="body">
        <div class="eyebrow">Certificate of Completion</div>
        <div class="cert-title">Certificate</div>
        <div class="presented-to">This certificate is proudly presented to</div>
        <div class="recipient">${escapeHtml(recipientName)}</div>
        <div class="completed">for successfully completing the course</div>
        <div class="course-name">${escapeHtml(courseTitle)}</div>
        ${courseCategory ? `<div class="category">${escapeHtml(courseCategory)}</div>` : ''}
      </div>

      <div class="footer">
        <div class="footer-col">
          <div class="value">${escapeHtml(issued)}</div>
          <div class="line"></div>
          <div class="label">Date Issued</div>
        </div>
        <div class="footer-col">
          <div class="seal">KAZINNI<span>VERIFIED</span></div>
        </div>
        <div class="footer-col">
          <div class="value">${escapeHtml(instructor)}</div>
          <div class="line"></div>
          <div class="label">Instructor</div>
        </div>
      </div>

    </div>
  </div>

  <script>
    // Auto-trigger print after fonts load, so the PDF captures the right typefaces.
    document.fonts.ready.then(() => {
      setTimeout(() => window.print(), 300);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups to download your certificate.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
