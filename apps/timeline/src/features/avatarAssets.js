const USER_AVATAR_SOURCES = Object.entries(
  import.meta.glob("../../../../assets/image*.png", { eager: true, import: "default" })
)
  .sort((a, b) => {
    const aNum = Number(a[0].match(/image(\d+)\.png$/)?.[1] ?? 0);
    const bNum = Number(b[0].match(/image(\d+)\.png$/)?.[1] ?? 0);
    return aNum - bNum;
  })
  .map(([, src]) => src);

const DEFAULT_AVATAR_SRC = USER_AVATAR_SOURCES[0] ?? null;

function getAvatarSrcFromNumber(number) {
  const avatarCount = USER_AVATAR_SOURCES.length;
  if (!avatarCount) return DEFAULT_AVATAR_SRC;

  const normalizedNumber = Math.max(1, Math.trunc(Math.abs(Number(number) || 1)));
  return USER_AVATAR_SOURCES[(normalizedNumber - 1) % avatarCount] ?? DEFAULT_AVATAR_SRC;
}

export {
  DEFAULT_AVATAR_SRC,
  USER_AVATAR_SOURCES,
  getAvatarSrcFromNumber,
};
