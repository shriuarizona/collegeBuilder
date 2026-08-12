// import statements
import { useState, useRef } from 'react'
import './App.css'
import { matchColleges } from './matchColleges'
import { generatePDF } from './generatePDF'
import { generateCSV } from './generateCSV'

function App() {
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [colleges, setColleges] = useState([])
  const [studentInfo, setStudentInfo] = useState(null)
  const [showingMore, setShowingMore] = useState(false)

  // used to scroll down to the results once they're ready
  const resultsRef = useRef(null)

  async function handleClick() {
    setLoading(true)

    try {
      // send the counselor's text to backend which calls groq
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description })
      })

      if (!response.ok) {
        throw new Error("extraction failed")
      }

      const info = await response.json()
      setStudentInfo(info)

      // run matching logic on the extracted data start with 10 schools
      const results = matchColleges(info, 10)
      setColleges(results)
      setShowingMore(false)

      // small delay so the results have rendered before we scroll to them
      setTimeout(function () {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
    } catch (error) {
      // something went wrong with groq or the network, let the user know instead of hanging forever
      alert("Something went wrong generating the list. Try again.")
    }

    setLoading(false)
  }

  function handleShowMore() {
    // reuse the same student info we already have just ask for 20 schools instead of 10
    const results = matchColleges(studentInfo, 20)
    setColleges(results)
    setShowingMore(true)
  }

  function handleDownloadPDF() {
    let name = null
    if (studentInfo && studentInfo.name) {
      name = studentInfo.name
    }
    generatePDF(colleges, name)
  }

  function handleDownloadCSV() {
    generateCSV(colleges)
  }

  return (
    <div className="app">
      <div className="header">
        <span className="eyebrow">College List Portal</span>
        <h1>College List Builder</h1>
        <p>Describe your student, get back a college list built for them.</p>
      </div>

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="e.g. Quiet kid, really into marine biology, middling test scores but a great story. Needs financial aid. Somewhere warm would be a plus."
        rows={8}
      />

      <button className="generate-button" onClick={handleClick} disabled={loading || !description}>
        {loading ? "Generating..." : "Generate College List"}
      </button>

      {/* only show results once we actually have some */}
      {colleges.length > 0 && (
        <div className="results" ref={resultsRef}>
          <h2>Recommended Colleges</h2>

          {colleges.map((school, index) => (
            <div key={index} className="college-card">
              <div className="college-card-top">
                <h3>{school["school.name"]}</h3>
                {/* reach, target, or safety badge, colored differently in the css */}
                <span className={"badge badge-" + school.tier}>{school.tier}</span>
              </div>
              <p>{school["school.city"]}, {school["school.state"]}</p>
              <p>Admit rate: {school["latest.admissions.admission_rate.overall"] ? Math.round(school["latest.admissions.admission_rate.overall"] * 100) + "%" : "N/A"}</p>
            </div>
          ))}

          <div className="action-row">
            {/* hide this button once they've already clicked it, since 20 is the max */}
            {!showingMore && (
              <button onClick={handleShowMore}>Show More Options</button>
            )}
            <button onClick={handleDownloadPDF} className="primary">Download PDF</button>
            <button onClick={handleDownloadCSV}>Export CSV</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
