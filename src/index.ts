import "dotenv/config";
import {
  getFinalParkingResearchText,
  getParkingDeepResearch,
  startParkingDeepResearch,
} from "./parkingResearch";

function getArg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const adventureTitle = getArg("title");
  const campusName = getArg("campus");
  const startAddress = getArg("address");
  const startLat = Number(getArg("lat"));
  const startLng = Number(getArg("lng"));
  const city = getArg("city");
  const state = getArg("state");

  if (!adventureTitle || !startAddress || !Number.isFinite(startLat) || !Number.isFinite(startLng)) {
    throw new Error("Missing required args: --title, --address, --lat, --lng");
  }

  const interaction = await startParkingDeepResearch({
    adventureTitle,
    campusName,
    startAddress,
    startLat,
    startLng,
    city,
    state,
  });

  console.log(`Started research: ${interaction.id}`);

  while (true) {
    const current = await getParkingDeepResearch(interaction.id);

    console.log(`Status: ${current.status}`);

    if (current.status === "completed") {
      console.log("\nParking brief:\n");
      console.log(getFinalParkingResearchText(current));
      break;
    }

    if (current.status === "failed") {
      throw new Error(`Research failed: ${JSON.stringify(current.error)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});