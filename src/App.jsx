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

  const resultsRef = useRef(null)

  async function handleClick() {
    setLoading(true)

    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description })
    })

    const info = await response.json()
    setStudentInfo(info)

    const results = matchColleges(info, 10)
    setColleges(results)
    setShowingMore(false)
    setLoading(false)

    setTimeout(function () {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  function handleShowMore() {
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

      {colleges.length > 0 && (
        <div className="results" ref={resultsRef}>
          <h2>Recommended Colleges</h2>

          {colleges.map((school, index) => (
            <div key={index} className="college-card">
              <div className="college-card-top">
                <h3>{school["school.name"]}</h3>
                <span className={"badge badge-" + school.tier}>{school.tier}</span>
              </div>
              <p>{school["school.city"]}, {school["school.state"]}</p>
              <p>Admit rate: {school["latest.admissions.admission_rate.overall"] ? Math.round(school["latest.admissions.admission_rate.overall"] * 100) + "%" : "N/A"}</p>
            </div>
          ))}

          <div className="action-row">
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