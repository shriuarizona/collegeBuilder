// turns the college list into a downloadable csv file
export function generateCSV(colleges) {
  let csvText = "School Name,City,State,Admit Rate,Tier\n"

  for (let i = 0; i < colleges.length; i++) {
    const school = colleges[i]

    const name = school["school.name"]
    const city = school["school.city"]
    const state = school["school.state"]
    const admitRate = school["latest.admissions.admission_rate.overall"]

    let admitText = "N/A"
    if (admitRate) {
      admitText = Math.round(admitRate * 100) + "%"
    }

    const tier = school.tier

    // wrap name in quotes in case it has a comma in it
    csvText = csvText + "\"" + name + "\"," + city + "," + state + "," + admitText + "," + tier + "\n"
  }

  const blob = new Blob([csvText], { type: "text/csv" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "college-list.csv"
  link.click()
}