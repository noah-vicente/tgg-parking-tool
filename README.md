# TGG Parking Research Tool

Command-line tool for researching concise visitor parking recommendations for The Great Game adventures.

The tool uses Gemini Deep Research to find parking details near a game start location, then prints a short parking brief that can be reviewed and used in customer instructions.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add your Gemini API key to `.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Do not commit `.env` or any real API keys.

## Run

Use `npm run research --` followed by the game details:

Example:

```bash
npm run research -- \
  --title "UC San Diego Campus Adventure" \
  --campus "UC San Diego" \
  --address "Price Center Theatre, La Jolla, CA" \
  --lat 32.879 \
  --lng -117.236 \
  --city "La Jolla" \
  --state "CA"
```

## Arguments

- `--title`: Name of the adventure or game.
- `--campus`: Campus, college, venue, or location name.
- `--address`: Starting address or landmark for the game.
- `--lat`: Latitude of the game start point.
- `--lng`: Longitude of the game start point.
- `--city`: City where the game starts.
- `--state`: Two-letter state code.

Required arguments:

```txt
--title
--address
--lat
--lng
```

## Output

The tool starts a Gemini Deep Research job, checks its status every 15 seconds, and prints the final parking brief when complete.

Example output:

```txt
Started research: interaction-id
Status: running
Status: completed

Parking brief:

Recommended parking:
Address:
Access:
Cost:
Hours:
Distance from start:
Parking difficulty:
Notes:
Email copy:
Sources:
```

## Notes

- Deep Research can take several minutes.
- Results should be reviewed before sending to customers.
- If a parking detail is unclear, the tool asks Gemini to return `unknown` instead of guessing.
