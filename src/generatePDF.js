import jsPDF from "jspdf"

// takes the college list and turns it into a downloadable PDF
export function generatePDF(colleges, studentName) {
  const doc = new jsPDF()

  let y = 20 // vertical position on the page and moves down as we add lines

  doc.setFontSize(18)
  doc.text("College List", 20, y)
  y = y + 10

  if (studentName) {
    doc.setFontSize(12)
    doc.text("Prepared for: " + studentName, 20, y)
    y = y + 10
  }

  doc.setFontSize(10)

  for (let i = 0; i < colleges.length; i++) {
    const school = colleges[i]

    // if we're running out of room on the page then start a new one
    if (y > 270) {
      doc.addPage()
      y = 20
    }

    const name = school["school.name"]
    const city = school["school.city"]
    const state = school["school.state"]
    const location = city + ", " + state

    const admitRate = school["latest.admissions.admission_rate.overall"]
    let admitText = "N/A"
    if (admitRate) {
      admitText = Math.round(admitRate * 100) + "%"
    }

    doc.setFont(undefined, "bold")
    doc.text(name, 20, y)
    y = y + 6

    doc.setFont(undefined, "normal")
    doc.text(location + " - Admit rate: " + admitText, 20, y)
    y = y + 10
  }

  doc.save("college-list.pdf")
}