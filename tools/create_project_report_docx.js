const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "tmp", "project-report-docx");
const outDir = path.join(root, "reports");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, "utf8");
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function r(text, opts = {}) {
  const props = [];
  props.push(`<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/>`);
  if (opts.bold) props.push("<w:b/>");
  if (opts.italic) props.push("<w:i/>");
  if (opts.size) props.push(`<w:sz w:val="${opts.size * 2}"/>`);
  if (opts.color) props.push(`<w:color w:val="${opts.color}"/>`);
  return `<w:r><w:rPr>${props.join("")}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

function p(text = "", style = "Normal", opts = {}) {
  const pPr = [];
  if (style) pPr.push(`<w:pStyle w:val="${style}"/>`);
  if (opts.numId) {
    pPr.push(`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${opts.numId}"/></w:numPr>`);
  }
  if (opts.align) pPr.push(`<w:jc w:val="${opts.align}"/>`);
  const runs = Array.isArray(text) ? text.map((part) => r(part.text, part)).join("") : r(text, opts.run || {});
  return `<w:p><w:pPr>${pPr.join("")}</w:pPr>${runs}</w:p>`;
}

function pageBreak() {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

function bullet(text) {
  return p(text, "Normal", { numId: 1 });
}

function numbered(text) {
  return p(text, "Normal", { numId: 2 });
}

function tc(text, width, opts = {}) {
  const fill = opts.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>` : "";
  const cellText = Array.isArray(text)
    ? text.map((line, index) => p(line, index === 0 && opts.header ? "TableHeader" : "TableText")).join("")
    : p(text, opts.header ? "TableHeader" : "TableText");
  return `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${width}" w:type="dxa"/>
        ${fill}
        <w:tcMar>
          <w:top w:w="80" w:type="dxa"/>
          <w:start w:w="120" w:type="dxa"/>
          <w:bottom w:w="80" w:type="dxa"/>
          <w:end w:w="120" w:type="dxa"/>
        </w:tcMar>
        <w:tcBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="DADCE0"/>
        </w:tcBorders>
      </w:tcPr>
      ${cellText}
    </w:tc>`;
}

function table(headers, rows, widths) {
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  const headerRow = `<w:tr>${headers.map((header, i) => tc(header, widths[i], { header: true, fill: "F8F9FA" })).join("")}</w:tr>`;
  const bodyRows = rows.map((row) => `<w:tr>${row.map((value, i) => tc(value, widths[i])).join("")}</w:tr>`).join("");
  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:tblLayout w:type="fixed"/>
        <w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/>
      </w:tblPr>
      <w:tblGrid>${grid}</w:tblGrid>
      ${headerRow}
      ${bodyRows}
    </w:tbl>
    ${p("")}`;
}

function sectionProperties() {
  return `
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="200"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:b/><w:sz w:val="48"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="360" w:after="160" w:line="276" w:lineRule="auto"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="280" w:after="120" w:line="276" w:lineRule="auto"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80" w:line="276" w:lineRule="auto"/><w:outlineLvl w:val="2"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="TableText">
    <w:name w:val="Table Text"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="TableHeader">
    <w:name w:val="Table Header"/><w:basedOn w:val="TableText"/>
    <w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/><w:b/><w:sz w:val="20"/></w:rPr>
  </w:style>
</w:styles>`;
}

function numberingXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="2">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`;
}

function documentXml() {
  const body = [];
  body.push(p("JR Shelf Life Label App", "Title"));
  body.push(p("Detailed Project Report for Presentation and Handover", "Normal", { run: { size: 14 } }));
  body.push(p("Prepared for: JR Foods project stakeholders | Date: 28 May 2026 | Status: Android Phase 1 functional build", "Normal", { run: { size: 10 } }));
  body.push(p("This report summarizes the business purpose, current implementation, technical architecture, data model, printing workflow, APK status, risks, and recommended next steps for the JR Shelf Life Label App."));
  body.push(pageBreak());

  body.push(p("1. Executive Summary", "Heading1"));
  body.push(p("The JR Shelf Life Label App is an Android-first mobile application built for central kitchen and outlet teams to print accurate secondary shelf-life labels. It standardizes product shelf-life rules, outlet-specific product visibility, label preview, quantity selection, Bluetooth printer selection, and local print history in a simple offline workflow."));
  body.push(p("The project has progressed from requirements and planning into a functional Android app with a real APK installed and tested on an Oppo phone. The app can select outlets, browse product categories, manage local product data, preview labels, print via a GPrinter/Gainscha Bluetooth bridge, and export/import local data through Excel."));
  body.push(table(["Area", "Current Status", "Presentation Notes"], [
    ["Business workflow", "Functional Phase 1 staff flow", "Outlet selection, product/category browsing, preview, quantity, and print are implemented."],
    ["Android app", "Working APK available", "Latest release APK is built and installed successfully on the test phone."],
    ["Printing", "Functional Android Bluetooth printing", "Labels are rendered as bitmaps and sent through a native GPrinter SDK bridge."],
    ["Admin tools", "Broad local admin coverage", "Admin can manage products, categories, outlets, outlet lists, printers, and import/export."],
    ["Production readiness", "Prototype-to-pilot stage", "Main remaining hardening items are SQLite persistence, validation, and release workflow."]
  ], [1800, 2300, 5260]));

  body.push(p("2. Business Problem and Objective", "Heading1"));
  body.push(p("Food teams need to print accurate shelf-life labels quickly and consistently. Manual handwritten labels or manual date calculations create avoidable operational risk: wrong expiry timing, inconsistent label format, unclear storage method, and slower service during busy periods."));
  body.push(p("The app solves this by giving staff a fixed operational flow: choose outlet, choose product, confirm label preview, choose quantity, and print. Shelf-life timing is calculated automatically from product rules, and the printed label uses a standardized format."));
  body.push(p("Target Users", "Heading2"));
  [
    "Central kitchen staff who prepare or open food items.",
    "Outlet staff who need fast product lookup and printing.",
    "Outlet managers who control local product visibility.",
    "Local company admin users who maintain product/category/outlet records.",
    "Future site and company admins who will manage cloud data in Phase 2."
  ].forEach((item) => body.push(bullet(item)));

  body.push(p("3. Scope and Phase Position", "Heading1"));
  body.push(p("Phase 1 is focused on an offline Android app. It deliberately avoids cloud login, multi-company SaaS administration, and full web portal work so the team can validate the staff workflow and printer behavior first."));
  body.push(table(["Scope Category", "Included in Current Phase", "Deferred"], [
    ["Staff printing workflow", "Outlet, category, product detail, label preview, quantity, Bluetooth printing", "Cloud user roles and cross-device sync"],
    ["Local admin", "Categories, products, outlets, outlet product lists, printer choice, import/export", "Server-backed master data approval flow"],
    ["Data", "Seed data, local persistence, Excel import/export, bundled images", "PostgreSQL/cloud sync, audit-grade history"],
    ["Platforms", "Android APK", "iOS Bluetooth printing and App Store/TestFlight release"]
  ], [2100, 3900, 3360]));

  body.push(p("4. Current Application Flow", "Heading1"));
  [
    "User opens the app and selects an outlet.",
    "App shows available categories for that outlet.",
    "User chooses a category and sees the product list.",
    "User opens a product detail page.",
    "App shows product information, shelf-life rule, label preview, and quantity controls.",
    "User chooses Normal or Compact label preview mode.",
    "User taps Print; app captures the label preview as a bitmap and sends it to the selected Bluetooth printer.",
    "App saves a local PrintJob record for history and export."
  ].forEach((item) => body.push(numbered(item)));

  body.push(p("5. Feature Breakdown", "Heading1"));
  body.push(table(["Feature", "Implemented", "Details"], [
    ["Outlet selection", "Yes", "User must choose outlet before product printing."],
    ["Category selection", "Yes", "Pastel color-coded category cards with product counts."],
    ["Product browsing", "Yes", "Compact and regular product list modes; search support."],
    ["Product detail", "Yes", "Product image, English/Chinese names, storage method, shelf-life, preview, quantity, print."],
    ["Normal/Compact label preference", "Yes", "User choice persists across products, printing, and app restart."],
    ["Timestamp printing", "Yes", "Separate timestamp label flow for 40 x 30 labels."],
    ["Admin PIN", "Yes", "Simple local access control for admin screens."],
    ["Admin products/categories/outlets", "Yes", "Local create/edit workflows are implemented."],
    ["Outlet product lists", "Yes", "Controls which products are visible per outlet."],
    ["Printer selection", "Yes", "Admin can select preferred Bluetooth label printer."],
    ["Import/export", "Yes", "Excel workbook import/export for operational data."],
    ["Print history", "Basic", "Shows what was printed, when, and quantity."]
  ], [2400, 1400, 5560]));

  body.push(p("6. UI and UX Direction", "Heading1"));
  body.push(p("The UI follows an Operational Clean direction. The design is intentionally plain, readable, and fast for kitchen/outlet staff. The app avoids decorative screens and keeps the main path focused on finding products and printing labels."));
  [
    "Portrait-only layout for consistency on staff phones.",
    "Category-first navigation to reduce filter clutter on the product page.",
    "Compact product mode for seeing more products at once.",
    "Regular product mode for image-based recognition.",
    "Sticky back headers on scroll-heavy admin and detail screens.",
    "Admin access hidden behind long press/PIN behavior to avoid accidental data edits."
  ].forEach((item) => body.push(bullet(item)));

  body.push(p("7. Data Model", "Heading1"));
  body.push(p("The current TypeScript domain model defines the core records needed for Phase 1. The planned documentation recommends SQLite, while the current app still uses seed data and SecureStore-style local persistence for many records. That is acceptable for prototype and pilot testing, but SQLite should be introduced before production rollout."));
  body.push(table(["Entity", "Purpose", "Key Fields"], [
    ["Outlet", "Represents central kitchen or outlet location", "id, name, code, shortCode"],
    ["ProductCategory", "Groups products and controls product code prefix", "id, name, codePrefix, color, scope"],
    ["Product", "Printable food item with shelf-life rule", "productCode, nameEn, nameZh, daysToExpire, hoursToExpire, storageMethod, imageUri, active"],
    ["OutletProduct", "Outlet-specific product visibility", "outletId, productId, active"],
    ["PrintJob", "Local print history record", "labelType, outletName, productCode, quantity, printedAt, expiresAt, printerName"],
    ["PreferredBluetoothPrinter", "Saved printer preference", "address, name"]
  ], [1900, 3300, 4160]));

  body.push(p("8. Label and Printing Architecture", "Heading1"));
  body.push(p("The app renders labels as on-screen React Native views, captures them as PNG bitmaps, and sends the bitmap to the printer through an Android native module. This avoids relying on the printer's built-in Chinese fonts and gives the app more control over visual layout."));
  body.push(table(["Label Type", "Size", "Current Use"], [
    ["Normal product label", "60 x 40 mm", "Full product label with product name, Chinese name/storage, open time, use-by time."],
    ["Compact product label", "40 x 30 mm", "Condensed label with OPEN and USE BY lines; mode preference is saved."],
    ["Timestamp label", "40 x 30 mm", "Standalone date/time label for simple marking workflows."]
  ], [2300, 1800, 5260]));
  body.push(p("The Android native module uses the GPrinter SDK's BluetoothPort and LabelCommand. It opens a fresh Bluetooth connection, sends a high-contrast bitmap, waits briefly, then closes the port to reduce stuck-connection problems."));

  body.push(p("9. Printer Management", "Heading1"));
  [
    "Admin > Printers shows only supported label printers, not general Bluetooth accessories.",
    "The app filters devices by known printer names and Android Bluetooth imaging class.",
    "Admin can choose a preferred printer when multiple printers are paired.",
    "Printing uses the saved preferred printer first.",
    "If the preferred printer is unavailable, the app falls back to the first supported printer."
  ].forEach((item) => body.push(bullet(item)));

  body.push(p("10. Import, Export, and APK Variants", "Heading1"));
  body.push(p("The app supports Excel-based import/export to help admins manage data during Phase 1. Export includes categories, outlets, products, outlet product settings, print jobs, and export metadata."));
  body.push(table(["Build Artifact", "Purpose", "Status"], [
    ["jr-shelf-life-label-app-android-release-2026-05-28.apk", "Latest Android product-data build", "Built and installed successfully on phone."],
    ["jr-shelf-life-label-app-android-empty-products-2026-05-26.apk", "APK with categories but no seeded products", "Built for clean-data distribution/testing."]
  ], [3700, 3400, 2260]));

  body.push(p("11. Current Technical Risks", "Heading1"));
  body.push(table(["Risk", "Impact", "Recommended Action"], [
    ["SecureStore used for broad data persistence", "May not scale well for larger product/history data", "Move structured data to SQLite."],
    ["Printer device filtering is heuristic", "Some real printer models may be hidden if names/classes differ", "Add observed model names after field testing."],
    ["Failed print attempts not fully represented", "History may not capture all operational failures", "Save failed PrintJob records with error message."],
    ["Docs contain garbled Chinese encoding", "Presentation and handover clarity issue", "Normalize docs to UTF-8 and repair Chinese text."],
    ["iOS printing limitations", "Apple rollout may require different Bluetooth strategy", "Research CoreBluetooth/MFi requirements after Android pilot."],
    ["Large uncommitted worktree", "Higher risk of losing track of changes", "Commit current stable version to GitHub."]
  ], [2700, 3200, 3460]));

  body.push(p("12. Roadmap", "Heading1"));
  body.push(table(["Priority", "Next Step", "Why It Matters"], [
    ["1", "Commit the stable Android build to GitHub", "Creates a reliable restore point before deeper refactors."],
    ["2", "Move local data to SQLite", "Improves reliability for product records, history, and import/export."],
    ["3", "Harden validation rules", "Prevents duplicate product codes and invalid shelf-life values."],
    ["4", "Improve print failure tracking", "Supports troubleshooting and operational accountability."],
    ["5", "Run multi-printer field test", "Validates preferred printer selection and filtering."],
    ["6", "Prepare pilot release package", "Makes it easier for outlet staff to test the app consistently."],
    ["7", "Plan cloud Phase 2", "Defines server admin, sync, users, and audit logs."]
  ], [1200, 3600, 4560]));

  body.push(p("13. Conclusion", "Heading1"));
  body.push(p("The JR Shelf Life Label App is now a functional Android Phase 1 implementation rather than only a concept. It covers the core staff workflow, local admin operations, label preview, Bluetooth printing, and APK distribution. The project is ready for controlled operational testing, with the main engineering focus now shifting from feature creation to persistence hardening, validation, print reliability, and release management."));

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body.join("\n")}
    ${sectionProperties()}
  </w:body>
</w:document>`;
}

cleanDir(buildDir);
ensureDir(outDir);

write(path.join(buildDir, "[Content_Types].xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`);

write(path.join(buildDir, "_rels", ".rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);

write(path.join(buildDir, "word", "_rels", "document.xml.rels"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`);

write(path.join(buildDir, "word", "document.xml"), documentXml());
write(path.join(buildDir, "word", "styles.xml"), stylesXml());
write(path.join(buildDir, "word", "numbering.xml"), numberingXml());
write(path.join(buildDir, "word", "settings.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
  <w:compat/>
</w:settings>`);

write(path.join(buildDir, "docProps", "core.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>JR Shelf Life Label App - Detailed Project Report</dc:title>
  <dc:subject>Project report and handover</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-05-28T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-05-28T00:00:00Z</dcterms:modified>
</cp:coreProperties>`);

write(path.join(buildDir, "docProps", "app.xml"), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>`);

console.log(buildDir);
