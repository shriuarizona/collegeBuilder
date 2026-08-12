const apiKey = "okyS9ed4R2bndpbqz9f5s9O9WOmexI8zMpc3cuTf"

const fields = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "latest.admissions.admission_rate.overall",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.student.size",
  "latest.aid.pell_grant_rate",
  "latest.academics.program_percentage.computer",
  "latest.academics.program_percentage.biological",
  "latest.academics.program_percentage.engineering",
  "latest.academics.program_percentage.business_marketing",
  "latest.academics.program_percentage.health",
  "latest.academics.program_percentage.psychology",
  "latest.academics.program_percentage.visual_performing",
  "latest.academics.program_percentage.communication",
  "latest.academics.program_percentage.education",
  "latest.academics.program_percentage.english",
  "latest.academics.program_percentage.mathematics",
  "latest.academics.program_percentage.social_science",
  "latest.academics.program_percentage.physical_science"
].join(",")

// states/territories we don't want in our dataset
const excludedStates = ["PR", "GU", "VI", "AS", "MP", "FM", "MH", "PW"]

async function fetchColleges() {
  let allSchools = []
  let page = 0
  let keepGoing = true

  while (keepGoing) {
    const url = "https://api.data.gov/ed/collegescorecard/v1/schools?api_key=" + apiKey +
      "&fields=" + fields +
      "&school.degrees_awarded.predominant=3" +
      "&school.operating=1" +
      "&per_page=100" +
      "&page=" + page

    const response = await fetch(url)
    const data = await response.json()

    allSchools = allSchools.concat(data.results)
    console.log("Page " + page + ": got " + data.results.length + " schools, total so far: " + allSchools.length)

    if (data.results.length < 100) {
      keepGoing = false
    }

    page = page + 1
  }

  console.log("Total before filtering: " + allSchools.length + " schools")

  // now filter out territories 
  const filtered = allSchools.filter(function (school) {
    return !excludedStates.includes(school["school.state"])
  })

  console.log("Total after filtering: " + filtered.length + " schools")

  const fs = await import("fs")
  fs.writeFileSync("colleges.json", JSON.stringify(filtered, null, 2))

  console.log("Saved to colleges.json")
}

fetchColleges()