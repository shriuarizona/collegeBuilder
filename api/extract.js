/* This file does the following:
Gets counsellors text prompt from react front end.
Call groq with my private api key (on vercel's servers and not in user's browser for security).
Get groq's json answer back and converts it to a javascript object to work with.
*/

export default async function handler(req, res) {
  // get the text the user typed sent from the frontend
  const description = req.body.description

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.GROQ_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: "Extract structured info as JSON only. No markdown, no code fences, no text outside the JSON object. For single-value fields, use null if not mentioned. For array fields, always use an empty array if nothing applies, never null. apScores must only contain actual AP exam names and scores. achievements must only contain real accomplishments, not vague qualities. If the counselor mentions where the student lives (a city, state, or region), extract the 2-letter state abbreviation into homeState - otherwise use null. Schema: name, gpa, satScore, actScore, apScores (array of subject and score), interests (array), achievements (array), personality (array), preferences (location, financialAid, schoolType), homeState, notes. Description: " + description
        }
      ]
    })
  })

  // groq sends back a big object we only need the actual text part
  const data = await groqResponse.json()
  const extracted = JSON.parse(data.choices[0].message.content)

  // send the clean result back to our frontend
  res.status(200).json(extracted)
}