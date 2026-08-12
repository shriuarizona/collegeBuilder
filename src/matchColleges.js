import colleges from './colleges.json'

// how selective is too selective, medium, or easy (based on admission rate) 
function getBucket(admissionRate) {
  if (admissionRate === null) return "target" // unknown so guess target
  if (admissionRate < 0.3) return "reach"
  if (admissionRate < 0.6) return "target"
  return "safety"
}

// maps common interest words to the matching data field
const interestKeywords = {
  "program": "computer",
  "computer": "computer",
  "coding": "computer",
  "software": "computer",
  "bio": "biological",
  "marine": "biological",
  "engineer": "engineering",
  "business": "business_marketing",
  "marketing": "business_marketing",
  "entrepreneur": "business_marketing",
  "health": "health",
  "nursing": "health",
  "medicine": "health",
  "doctor": "health",
  "psychology": "psychology",
  "art": "visual_performing",
  "music": "visual_performing",
  "design": "visual_performing",
  "theater": "visual_performing",
  "communication": "communication",
  "journalism": "communication",
  "media": "communication",
  "teaching": "education",
  "education": "education",
  "writing": "english",
  "english": "english",
  "literature": "english",
  "math": "mathematics",
  "social": "social_science",
  "history": "social_science",
  "politics": "social_science",
  "physics": "physical_science",
  "chemistry": "physical_science",
  "science": "physical_science"
}

// checks if student's interests match this school's strong programs
function getInterestScore(school, interests) {
  let score = 0
  let matchCount = 0

  for (let i = 0; i < interests.length; i++) {
    const interest = interests[i].toLowerCase()

    // check this interest against every keyword we know about
    for (const keyword in interestKeywords) {
      if (interest.includes(keyword)) {
        const field = interestKeywords[keyword]
        score = score + (school["latest.academics.program_percentage." + field] || 0)
        matchCount = matchCount + 1
      }
    }
  }
  if (matchCount === 0) return 0

  const average = score / matchCount

  // program percentages are usually small so scale them up to be comparable with financial/location scores capped at 1
  const scaled = average * 4
  return Math.min(scaled, 1)
}

// higher pell grant rate = school supports financial aid students well
function getFinancialScore(school, needsAid) {
  if (!needsAid) return 0.5 // doesn't matter much if they don't need aid

  return school["latest.aid.pell_grant_rate"] || 0
}

// groups states into rough regions, used for "close to home" scoring
const regions = {
  "Northeast": ["NY", "MA", "PA", "NJ", "CT", "RI", "VT", "NH", "ME"],
  "South": ["TX", "FL", "GA", "NC", "SC", "VA", "TN", "AL", "MS", "LA", "AR", "OK", "KY", "WV"],
  "Midwest": ["IL", "OH", "MI", "MN", "WI", "IN", "IA", "MO", "KS", "NE", "ND", "SD"],
  "West": ["CA", "WA", "AZ", "CO", "OR", "NV", "UT", "ID", "MT", "WY", "NM", "AK", "HI"]
}

// finds which region a state belongs to
function getRegion(state) {
  for (const region in regions) {
    if (regions[region].includes(state)) return region
  }
  return null
}

// checks if student wants a warm state, or close to their home state
function getLocationScore(school, locationPref, homeState) {
  if (!locationPref) return 0.5

  const schoolState = school["school.state"]
  const wantsWarm = locationPref.toLowerCase().includes("warm")
  const wantsClose = locationPref.toLowerCase().includes("close") || locationPref.toLowerCase().includes("near")

  // handle "close to home" if we know the student's home state
  if (wantsClose && homeState) {
    if (schoolState === homeState) return 1 // same state, best match
    if (getRegion(schoolState) === getRegion(homeState)) return 0.7 // same region, decent match
    return 0.2 // far away
  }

  // handle warm climate preference
  const warmStates = ["CA", "TX", "FL", "AZ", "GA"]
  if (wantsWarm && warmStates.includes(schoolState)) {
    return 1
  }

  return 0.3
}

// combines everything into one score per school
function getTotalScore(school, studentInfo) {
  const interestScore = getInterestScore(school, studentInfo.interests)
  const financialScore = getFinancialScore(school, studentInfo.preferences.financialAid)
  const locationScore = getLocationScore(school, studentInfo.preferences.location, studentInfo.homeState)

  return (interestScore * 0.25) + (financialScore * 0.25) + (locationScore * 0.15)
}

// sorts by best match first, bigger schools win ties (less likely to be obscure/niche)
function sortSchools(a, b) {
  if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
  return (b["latest.student.size"] || 0) - (a["latest.student.size"] || 0)
}

// main function: picks the best colleges for this student
export function matchColleges(studentInfo, totalCount) {
  const reach = []
  const target = []
  const safety = []

  for (let i = 0; i < colleges.length; i++) {
    const school = colleges[i]
    const admissionRate = school["latest.admissions.admission_rate.overall"]

    // skip schools with no admission rate data as currently can't classify them reliably
    if (admissionRate === null) continue

    // skip very small schools usually niche/specialty institutions and not general recommendations
    const size = school["latest.student.size"]
    if (size === null || size < 200) continue

    const bucket = getBucket(admissionRate)
    const score = getTotalScore(school, studentInfo)

    const schoolWithScore = { ...school, matchScore: score, tier: bucket }
    if (bucket === "reach") reach.push(schoolWithScore)
    if (bucket === "target") target.push(schoolWithScore)
    if (bucket === "safety") safety.push(schoolWithScore)
  }

  // sort each group so the best matches are first
  reach.sort(sortSchools)
  target.sort(sortSchools)
  safety.sort(sortSchools)

  // split the total count roughly 30% reach, 40% target, 30% safety
  const reachCount = Math.round(totalCount * 0.3)
  const targetCount = Math.round(totalCount * 0.4)
  const safetyCount = Math.round(totalCount * 0.3)

  const finalList = reach.slice(0, reachCount)
    .concat(target.slice(0, targetCount))
    .concat(safety.slice(0, safetyCount))

  return finalList
}