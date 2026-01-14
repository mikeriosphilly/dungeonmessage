import a01 from "../assets/avatars/01_Avatar.png";
import a02 from "../assets/avatars/02_Avatar.png";
import a03 from "../assets/avatars/03_Avatar.png";
import a04 from "../assets/avatars/04_Avatar.png";
import a05 from "../assets/avatars/05_Avatar.png";
import a06 from "../assets/avatars/06_Avatar.png";
import a07 from "../assets/avatars/07_Avatar.png";

export const AVATARS = [
  { key: "01", src: a01 },
  { key: "02", src: a02 },
  { key: "03", src: a03 },
  { key: "04", src: a04 },
  { key: "05", src: a05 },
  { key: "06", src: a06 },
  { key: "07", src: a07 },
];

export const AVATAR_KEYS = AVATARS.map((a) => a.key);

export function randomAvatarKey() {
  const idx = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[idx].key;
}

export function avatarSrcFromKey(key) {
  return AVATARS.find((a) => a.key === key)?.src || AVATARS[0].src;
}
