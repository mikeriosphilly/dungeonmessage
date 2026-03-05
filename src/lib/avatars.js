import a01 from "../assets/avatars/Avatar-01.svg";
import a02 from "../assets/avatars/Avatar-02.svg";
import a03 from "../assets/avatars/Avatar-03.svg";
import a04 from "../assets/avatars/Avatar-04.svg";
import a05 from "../assets/avatars/Avatar-05.svg";
import a06 from "../assets/avatars/Avatar-06.svg";
import a07 from "../assets/avatars/Avatar-07.svg";
import a08 from "../assets/avatars/Avatar-08.svg";

// Avatar-07 is reserved for the GM — not available to players.
export const GM_AVATAR_SRC = a07;

export const AVATARS = [
  { key: "01", src: a01 },
  { key: "02", src: a02 },
  { key: "03", src: a03 },
  { key: "04", src: a04 },
  { key: "05", src: a05 },
  { key: "06", src: a06 },
  { key: "08", src: a08 },
];

export const AVATAR_KEYS = AVATARS.map((a) => a.key);

export function randomAvatarKey() {
  const idx = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[idx].key;
}

export function avatarSrcFromKey(key) {
  return AVATARS.find((a) => a.key === key)?.src || AVATARS[0].src;
}
