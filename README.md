# College List Builder

Live link: https://college-list-builder-sigma.vercel.app

A web app for college counselors. Type a description of a student and get back a data backed college list, downloadable as a PDF or CSV if you want something you can drop into a spreadsheet.

## How it works

1. Counselor types a plain English description of a student into a textarea.
2. That text gets sent to a small backend function (`/api/extract`) which calls Groq (Llama 3.3 70B) with a prompt that pulls out structured data like GPA, test scores, interests, financial aid needs, home location and personality.
3. That structured data gets run through my own matching logic against a dataset of about 1,900 real US colleges which scores and ranks schools, then splits them into a reach, target, and safety list.
4. The counselor can download the list as a PDF or CSV and choose a list of 10 or 20 schools.

The API key never touches the frontend. It's only ever used inside the backend function, so it's not exposed to anyone looking at the page or network requests.

## Why a hybrid approach (AI plus my own logic) and not just asking the AI for a list

I didn't want the whole thing to just be ask an LLM which colleges to recommend. That's fast to build but means trusting the model's judgment and potential hallucinations for something that actually matters to a real student. Instead:

- AI is only used for one narrow job: turning messy free form text into a clean structured json. That's a task LLMs are good and reliable at.
- The actual college matching and ranking is my code running against real government data from the U.S. Department of Education's College Scorecard API and not just the model's opinion. Every recommendation is grounded in real numbers like actual admission rates, actual financial aid stats, and actual program data not something an AI guessed.

I think this is more defensible and more useful for a counselor who needs to trust the output.

## Why Groq over Gemini

I tested both on the same task before committing. Groq (Llama 3.3 70B) returned a clean answer in about 49 total tokens with no hidden reasoning step. Gemini 3.6 Flash on the same prompt used about 536 tokens which were mostly invisible thinking tokens the model generates by default even for a task this simple. Since extraction doesn't need deep reasoning, Groq's default behavior made it the faster and more efficient choice for this specific job and it doesn't need any extra tuning. I'd expect this to look different for a harder task but for straightforward extraction it was a clear win.

## The dataset

Rather than calling the College Scorecard API live every time someone uses the app which in turn adds latency, I used a full snapshot of currently operating, four year, bachelor's degree granting institutions once and saved it locally as `colleges.json`. That's about 1,900 real schools, spanning every state, with real data on admission rates, tuition, financial aid (Pell grant rates) and program strength across a dozen plus fields of study including CS, biology, engineering, business, health, psychology, and art.

A few schools were excluded on purpose:
- U.S. territories like Puerto Rico and Guam since they are not relevant for a domestic focused tool.
- Schools with no published admission rate since we can't reliably classify these as reach, target, or safety without that number. For now rather than guessing they are skipped.
- Very small schools under about 200 students since these are almost always niche or specialty institutions such as seminaries or very small trade schools that don't make sense as a general recommendation.

## How matching works

Every school gets scored on:
- Interest and major fit: how strong the school's programs are in whatever the student is interested in, mapped from free text interests to real program percentage data.
- Financial fit: if the student needs aid, schools with a higher Pell Grant rate, meaning they actually serve lower income students well, score higher.
- Location fit: either a climate preference like "somewhere warm," or, if the student's home state is mentioned, actual proximity, where the same state scores highest, the same region scores decently, and far away scores low.

Schools are also bucketed into reach, target, and safety based on admission rate, and the final list is built with a roughly 30/40/30 split across those three tiers. This mirrors how counselors typically build a real college list from my research, rather than just returning whatever scores highest overall.

I looked at how tools like Naviance and Scoir define the ideal school treating academic, financial and personal factors as multiple dimensions rather than one dominant score and used that as the basis for balancing the weights rather than just guessing numbers. I intentionally didn't want to lean too heavily on academic fit alone, since there's research showing that over relying on pure academic matching leads students to under apply to schools they're actually qualified for.

I also chose soft, weighted scoring over hard filters, like requiring a school to be in state. With a dataset of about 1,900 schools, a hard filter risks returning very few or zero results for some students. Weighted scoring gives the best available options instead here.

I stress-tested against a range of student profiles across regions, interests, and academic levels (including vague, minimal-detail prompts) to check the matching logic held up.

## Known limitations

- "Close to home" only works if the student's home location is actually mentioned. If it's not in the description then there's nothing to compare against so that preference can't be applied. Climate preferences like "somewhere warm" don't have this problem since they're not relative to anything.
- Interest matching is also keyword based, mapped to about a dozen broad fields of study. It covers common interests well but isn't exhaustive, so an unusual or very specific interest might not match anything.
- The dataset is a snapshot and not live currently. It was pulled once from the College Scorecard API rather than queried in real time, for speed and reliability. A production version would either refresh this frequently or query live.

## Stack

- React and Vite for the frontend
- A Vercel serverless function for the backend which keeps the Groq key private
- Groq API (Llama 3.3 70B) for text extraction
- U.S. Department of Education College Scorecard API as the data source
- jsPDF for PDF generation and plain JS for CSV export

## Running it locally

npm install

npx vercel dev


You'll need a `.env` file in the project root with your own Groq key formatted like this:
GROQ_API_KEY=your_key_here

Groq also gives free API keys at console.groq.com. The first time you run `npx vercel dev` it will ask a few setup questions like which account or project to link to. 
