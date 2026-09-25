// Export utilities for generating CSV and PDF reports

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return

  // Get headers from the first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes in values
          const stringValue = String(value ?? "")
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(","),
    ),
  ].join("\n")

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateTableHTML(headers: string[], rows: string[][]): string {
  const headerHTML = headers
    .map(
      (h) =>
        `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #004E66; color: white;">${h}</th>`,
    )
    .join("")

  const rowsHTML = rows
    .map(
      (row, index) =>
        `<tr style="background-color: ${index % 2 === 0 ? "#f9f9f9" : "white"};">
      ${row.map((cell) => `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`).join("")}
    </tr>`,
    )
    .join("")

  return `
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      <thead>
        <tr>${headerHTML}</tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  `
}

export function exportToPDF(title: string, content: string): void {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - LibraryHub</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #004E66;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #004E66;
          }
          .date {
            color: #666;
          }
          h1 {
            color: #004E66;
            margin-bottom: 20px;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">📚 LibraryHub</div>
          <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
        </div>
        <h1>${title}</h1>
        ${content}
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print()
  }
}
