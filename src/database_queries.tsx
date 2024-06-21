export enum Platform {
  PC = "PC",
  XBOX = "XBOX",
  PlayStation = "PlayStation",
}

export interface KarmaProfile {
  reddit_username: string;
  karma: number;
  gamertags: {
    gamertag: string;
    gamertag_id: number;
    platform: string;
  }[];
  m76_karma: number;
}

export function getGamertagForPlatform(profile: KarmaProfile, platform: Platform): string {
  for (const gamertag of profile.gamertags) {
    if (gamertag.platform === platform) {
      return gamertag.gamertag;
    }
  }
  return "";
}

export async function getProfileInfo(username: string, apiKey: string): Promise<KarmaProfile> {
  const defaultProfile: KarmaProfile = {
    reddit_username: username,
    karma: 10,
    gamertags: [],
    m76_karma: 0,
  };

  try {
    const response = await fetch(`https://pipboy2000api-1-a5119667.deta.app/users/${username}`, {
      headers: {
        "X-Space-App-Key": apiKey,
      },
    });

    if (response.status === 404) {
      return defaultProfile;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return defaultProfile;
  }
}
