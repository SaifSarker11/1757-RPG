import scene0 from "../assets/transitions/archer-watch.webp.asset.json";
import scene1 from "../assets/transitions/artillery-aftermath.webp.asset.json";
import scene2 from "../assets/transitions/camp-night.webp.asset.json";
import scene3 from "../assets/transitions/cannon-grove.webp.asset.json";
import scene4 from "../assets/transitions/cavalry-plain.webp.asset.json";
import scene5 from "../assets/transitions/command-tent.webp.asset.json";
import scene6 from "../assets/transitions/company-line.webp.asset.json";
import scene7 from "../assets/transitions/elephant-march.webp.asset.json";
import scene8 from "../assets/transitions/french-battery.webp.asset.json";
import scene9 from "../assets/transitions/monsoon-wagon.webp.asset.json";
import scene10 from "../assets/transitions/nawab-standard.webp.asset.json";
import scene11 from "../assets/transitions/river-dawn.webp.asset.json";
import scene12 from "../assets/transitions/river-messenger.webp.asset.json";
import scene13 from "../assets/transitions/war-council.webp.asset.json";

const host = "https://plassey-shadow-crown.lovable.app";
export const TRANSITION_SCENES = [
  { id: "commanders-duel", src: "/images/transition-battle.jpg", label: "Nawab and Clive" },
  { id: "archer-watch", src: `${host}${scene0.url}`, label: "Archer Watch" },
  { id: "artillery-aftermath", src: `${host}${scene1.url}`, label: "Artillery Aftermath" },
  { id: "camp-night", src: `${host}${scene2.url}`, label: "Camp Night" },
  { id: "cannon-grove", src: `${host}${scene3.url}`, label: "Cannon Grove" },
  { id: "cavalry-plain", src: `${host}${scene4.url}`, label: "Cavalry Plain" },
  { id: "command-tent", src: `${host}${scene5.url}`, label: "Command Tent" },
  { id: "company-line", src: `${host}${scene6.url}`, label: "Company Line" },
  { id: "elephant-march", src: `${host}${scene7.url}`, label: "Elephant March" },
  { id: "french-battery", src: `${host}${scene8.url}`, label: "French Battery" },
  { id: "monsoon-wagon", src: `${host}${scene9.url}`, label: "Monsoon Wagon" },
  { id: "nawab-standard", src: `${host}${scene10.url}`, label: "Nawab Standard" },
  { id: "river-dawn", src: `${host}${scene11.url}`, label: "River Dawn" },
  { id: "river-messenger", src: `${host}${scene12.url}`, label: "River Messenger" },
  { id: "war-council", src: `${host}${scene13.url}`, label: "War Council" },
] as const;
