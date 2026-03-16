/* ═══════════════════════════════════════════
   BriskLearn — PDF & Google Docs Export
   Uses jsPDF for PDF, Google Docs link export
   ═══════════════════════════════════════════ */

window.ExportService = (() => {

  /**
   * Export any text content as a PDF
   */
  async function exportToPDF(options = {}) {
    const {
      title = 'BriskLearn Export',
      content = '',
      author = 'BriskLearn LMS',
      type = 'document',
      metadata = {}
    } = options;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Colors
    const brandBlue = [30, 64, 175];
    const darkText   = [15, 23, 42];
    const mutedText  = [100, 116, 139];
    const lightBg    = [240, 244, 255];

    const margin = 18;
    const pageW  = 210;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ── Header bar ──────────────────────────────────────────
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('BriskLearn LMS', margin, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - margin, 14, { align: 'right' });

    y = 32;

    // ── Title ────────────────────────────────────────────────
    doc.setTextColor(...brandBlue);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, contentW);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 4;

    // ── Metadata chips ───────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    const metaParts = [];
    if (metadata.grade)    metaParts.push(`Grade: ${metadata.grade}`);
    if (metadata.subject)  metaParts.push(`Subject: ${metadata.subject}`);
    if (metadata.duration) metaParts.push(`Duration: ${metadata.duration}`);
    if (metadata.author)   metaParts.push(`By: ${metadata.author}`);
    if (metaParts.length) {
      doc.text(metaParts.join('   ·   '), margin, y);
      y += 6;
    }

    // ── Divider ──────────────────────────────────────────────
    doc.setDrawColor(...brandBlue);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Content ──────────────────────────────────────────────
    doc.setTextColor(...darkText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();

      // Section headers (lines ending with : or all caps short lines)
      if (trimmed.match(/^[A-Z][^a-z]{2,}:?$/) || trimmed.match(/^\d+\.\s+[A-Z]/)) {
        if (y > 265) { doc.addPage(); y = margin + 10; addPageHeader(doc, pageW, margin); }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...brandBlue);
        doc.text(trimmed, margin, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...darkText);
        continue;
      }

      // Bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\./)) {
        const wrapped = doc.splitTextToSize('  ' + trimmed, contentW - 4);
        for (const wl of wrapped) {
          if (y > 270) { doc.addPage(); y = margin + 10; addPageHeader(doc, pageW, margin); }
          doc.text(wl, margin, y);
          y += 5.5;
        }
        continue;
      }

      // Regular paragraph
      if (trimmed) {
        const wrapped = doc.splitTextToSize(trimmed, contentW);
        for (const wl of wrapped) {
          if (y > 270) { doc.addPage(); y = margin + 10; addPageHeader(doc, pageW, margin); }
          doc.text(wl, margin, y);
          y += 5.5;
        }
        y += 2;
      } else {
        y += 3; // blank line spacing
      }
    }

    // ── Footer ───────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      doc.setDrawColor(...mutedText);
      doc.setLineWidth(0.3);
      doc.line(margin, 285, pageW - margin, 285);
      doc.text('BriskLearn LMS — Powered by AI', margin, 290);
      doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 290, { align: 'right' });
    }

    // Save
    const filename = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40) + '_BriskLearn.pdf';
    doc.save(filename);
    toast('📄 PDF downloaded!', 'success');
  }

  function addPageHeader(doc, pageW, margin) {
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageW, 8, 'F');
  }

  /**
   * Export to Google Docs via URL encoding
   * Opens a new tab with the content pre-filled in a Google Doc
   */
  function exportToGoogleDocs(title, content) {
    // Google Docs doesn't support direct pre-fill via URL for new docs,
    // but we can open a new blank doc and copy content to clipboard
    const fullText = `${title}\n${'='.repeat(title.length)}\n\n${content}\n\n---\nGenerated by BriskLearn LMS`;
    navigator.clipboard.writeText(fullText)
      .then(() => {
        toast('📋 Content copied! Opening Google Docs...', 'success');
        window.open('https://docs.google.com/document/create', '_blank');
      })
      .catch(() => {
        // Fallback: show text in a modal for manual copy
        toast('📋 Please copy the content manually', 'info');
      });
  }

  /**
   * Export quiz results as PDF table
   */
  async function exportQuizResultsPDF(quizTitle, results) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 15;
    let y = 30;

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text('BriskLearn — Quiz Results Report', margin, 13);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(quizTitle, margin, y); y += 8;
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.setTextColor(100,116,139);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, y); y += 10;

    // Table header
    doc.setFillColor(240, 244, 255);
    doc.rect(margin, y, 180, 8, 'F');
    doc.setTextColor(30, 64, 175); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('Student', margin+2, y+5.5);
    doc.text('Score', margin+80, y+5.5);
    doc.text('Percentage', margin+110, y+5.5);
    doc.text('Grade', margin+155, y+5.5);
    y += 10;

    // Rows
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    for (const r of results) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setTextColor(15,23,42);
      const pct = Math.round((r.score / r.total) * 100);
      const grade = pct >= 90?'A+':pct>=80?'A':pct>=70?'B':pct>=60?'C':pct>=50?'D':'F';
      const gradeColor = pct>=70?[22,163,74]:pct>=50?[217,119,6]:[220,38,38];
      doc.text(r.name || r.studentId, margin+2, y+5);
      doc.text(`${r.score}/${r.total}`, margin+80, y+5);
      doc.text(`${pct}%`, margin+110, y+5);
      doc.setTextColor(...gradeColor); doc.setFont('helvetica','bold');
      doc.text(grade, margin+155, y+5);
      doc.setFont('helvetica','normal'); doc.setTextColor(15,23,42);
      doc.setDrawColor(226,232,240); doc.line(margin, y+8, margin+180, y+8);
      y += 9;
    }

    doc.save(`${quizTitle.replace(/\s+/g,'_')}_Results.pdf`);
    toast('📄 Results PDF downloaded!', 'success');
  }

  /**
   * Export CO-PO matrix as PDF
   */
  async function exportCOPOMatrix(courseName, cos, pos, matrix) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    const margin = 15;
    let y = 30;

    doc.setFillColor(30,64,175);
    doc.rect(0,0,297,20,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(12); doc.setFont('helvetica','bold');
    doc.text('BriskLearn — CO-PO Attainment Matrix', margin, 13);

    doc.setTextColor(15,23,42);
    doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(courseName + ' — CO-PO Mapping', margin, y); y += 12;

    // Headers
    const cellW = 18, coLabelW = 50;
    doc.setFillColor(240,244,255);
    doc.rect(margin, y, coLabelW + pos.length * cellW, 8, 'F');
    doc.setTextColor(30,64,175); doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('Course Outcome', margin+2, y+5.5);
    pos.forEach((po, i) => doc.text(po, margin + coLabelW + i * cellW + 4, y+5.5));
    y += 10;

    cos.forEach((co, ci) => {
      if (y > 185) { doc.addPage(); y = 20; }
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.setTextColor(15,23,42);
      doc.text(co, margin+2, y+5);
      pos.forEach((po, pi) => {
        const val = matrix?.[ci]?.[pi] || 0;
        const colors = [[248,250,252],[254,249,195],[253,230,138],[245,158,11]];
        const [r,g,b] = val === 3 ? [245,158,11] : val === 2 ? [253,230,138] : val === 1 ? [254,249,195] : [248,250,252];
        doc.setFillColor(r,g,b);
        doc.rect(margin + coLabelW + pi * cellW, y, cellW-1, 8, 'F');
        if (val > 0) {
          doc.setTextColor(92,56,0); doc.setFont('helvetica','bold');
          doc.text(String(val), margin + coLabelW + pi * cellW + cellW/2 - 1.5, y+5.5);
          doc.setFont('helvetica','normal'); doc.setTextColor(15,23,42);
        }
      });
      doc.setDrawColor(226,232,240); doc.line(margin, y+8, margin + coLabelW + pos.length * cellW, y+8);
      y += 9;
    });

    // Legend
    y += 8;
    doc.setFontSize(9); doc.setFont('helvetica','bold');
    doc.text('Mapping Level:', margin, y);
    [[0,'No mapping'],[1,'Low (1)'],[2,'Medium (2)'],[3,'High (3)']].forEach(([v,lbl], i) => {
      const colors = [[248,250,252],[254,249,195],[253,230,138],[245,158,11]];
      doc.setFillColor(...colors[v]);
      doc.rect(margin + 30 + i * 42, y-4, 8, 6, 'F');
      doc.setFont('helvetica','normal');
      doc.setTextColor(15,23,42);
      doc.text(lbl, margin + 40 + i * 42, y);
    });

    doc.save(`${courseName.replace(/\s+/g,'_')}_CO-PO_Matrix.pdf`);
    toast('📄 CO-PO Matrix PDF exported!', 'success');
  }

  return { exportToPDF, exportToGoogleDocs, exportQuizResultsPDF, exportCOPOMatrix };
})();
