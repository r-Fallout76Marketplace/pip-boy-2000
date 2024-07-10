import { Devvit, Subreddit, User } from "@devvit/public-api";

const ABOVE_HUNDRED_FLAIR = "0467e0de-4a4d-11eb-9453-0e4e6fcf2865";
const FIFTY_TO_HUNDRED_FLAIR = "2624bc6a-4a4d-11eb-8b7c-0e6968d78889";
const ZERO_TO_FIFTY_FLAIR = "3c680234-4a4d-11eb-8124-0edd2b620987";
const MODS_AND_COURIERS_FLAIR = "51524056-4a4d-11eb-814b-0e7b734c1fd5";

export async function setFlairBasedOnKarma(
  username: string,
  subredditName: string,
  combinedKarma: number,
  ctx: Devvit.Context,
  flairText: string,
  mod_or_courier: boolean
) {
  let flairTemplateId: string;

  if (mod_or_courier) {
    flairTemplateId = MODS_AND_COURIERS_FLAIR;
  } else if (combinedKarma < 49) {
    flairTemplateId = ZERO_TO_FIFTY_FLAIR;
  } else if (combinedKarma < 99) {
    flairTemplateId = FIFTY_TO_HUNDRED_FLAIR;
  } else {
    flairTemplateId = ABOVE_HUNDRED_FLAIR;
  }

  await ctx.reddit.setUserFlair({
    subredditName: subredditName,
    username: username,
    flairTemplateId: flairTemplateId,
    text: flairText,
  });
}

export async function isModerator(user: User, subreddit: Subreddit): Promise<boolean> {
  try {
    const moderatorPermissions = await user.getModPermissionsForSubreddit(subreddit.name);
    return Boolean(moderatorPermissions);
  } catch (error) {
    return false;
  }
}
