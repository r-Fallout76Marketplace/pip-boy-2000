import { Devvit } from "@devvit/public-api";
import { KarmaProfile, getProfileInfo, Platform, getGamertagForPlatform, getGamertagIDForPlatform, updateProfileInfo } from "./database_queries.js";

Devvit.configure({ redditAPI: true, http: true });

Devvit.addSettings([
  {
    name: "X-Space-App-Key",
    label: "Fallout76MarketplaceKarmaAPI App Key",
    type: "string",
    isSecret: true,
    scope: "app",
  },
]);

const profileCard = Devvit.createForm(
  (data) => {
    return {
      fields: [
        {
          name: "username",
          label: "USERNAME",
          type: "string",
          defaultValue: data.reddit_username,
          disabled: true,
        },
        {
          name: "fo76_karma",
          label: `r/Fallout76Marketplace Karma`,
          type: "string",
          defaultValue: `${data.karma}`,
          disabled: true,
        },
        {
          name: "m76_karma",
          label: `r/Market76 Karma`,
          type: "string",
          defaultValue: `${data.m76_karma}`,
          disabled: true,
        },
        {
          name: "xbox_gt",
          label: `XBOX GamerTag`,
          type: "string",
          defaultValue: getGamertagForPlatform(data as KarmaProfile, Platform.XBOX),
          disabled: true,
        },
        {
          name: "ps_gt",
          label: `PlayStation GamerTag`,
          type: "string",
          defaultValue: getGamertagForPlatform(data as KarmaProfile, Platform.PlayStation),
          disabled: true,
        },
        {
          name: "pc_gt",
          label: `PC GamerTag`,
          type: "string",
          defaultValue: getGamertagForPlatform(data as KarmaProfile, Platform.PC),
          disabled: true,
        },
      ],
      title: `r/Fallout76Marketplace Profile for ${data.reddit_username}`,
    };
  },
  async (_) => {}
);

Devvit.addMenuItem({
  label: "Pip-Boy 2000",
  location: ["post", "comment"],
  onPress: async (event, ctx) => {
    let post;
    if (event.targetId.startsWith("t1_")) {
      post = ctx.reddit.getCommentById(event.targetId);
    } else {
      post = ctx.reddit.getPostById(event.targetId);
    }

    const apiKey = (await ctx.settings.get("X-Space-App-Key")) as string;
    const formData = await getProfileInfo((await post).authorName, apiKey);
    return ctx.ui.showForm(profileCard, formData);
  },
});

const ABOVE_HUNDRED_FLAIR = "0467e0de-4a4d-11eb-9453-0e4e6fcf2865";
const FIFTY_TO_HUNDRED_FLAIR = "2624bc6a-4a4d-11eb-8b7c-0e6968d78889";
const ZERO_TO_FIFTY_FLAIR = "3c680234-4a4d-11eb-8124-0edd2b620987";

async function setFlairBasedOnKarma(username: string, subredditName: string, combinedKarma: number, ctx: Devvit.Context, flairText: string) {
  let flairTemplateId: string;

  if (combinedKarma < 49) {
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

const updateGamertagForm = Devvit.createForm(
  (data) => {
    return {
      fields: [
        {
          name: "username",
          label: "USERNAME",
          type: "string",
          defaultValue: data.reddit_username,
          disabled: true,
        },
        {
          name: "fo76_karma",
          label: `r/Fallout76Marketplace Karma`,
          type: "string",
          defaultValue: `${data.karma}`,
        },
        {
          name: "m76_karma",
          label: `r/Market76 Karma`,
          type: "string",
          defaultValue: `${data.m76_karma}`,
        },
        {
          name: "xbox_gt",
          label: `XBOX GamerTag`,
          type: "string",
          defaultValue: getGamertagForPlatform(data as KarmaProfile, Platform.XBOX),
        },
        {
          name: "xuid",
          label: `XBOX GamerTag ID`,
          type: "string",
          defaultValue: getGamertagIDForPlatform(data as KarmaProfile, Platform.XBOX),
        },
        {
          name: "ps_gt",
          label: `PlayStation GamerTag`,
          type: "string",
          defaultValue: getGamertagForPlatform(data as KarmaProfile, Platform.PlayStation),
        },
        {
          name: "psnid",
          label: `PlayStation GamerTag ID`,
          type: "string",
          defaultValue: getGamertagIDForPlatform(data as KarmaProfile, Platform.PlayStation),
        },
        {
          name: "pc_gt",
          label: `PC GamerTag`,
          type: "string",
          defaultValue: getGamertagForPlatform(data as KarmaProfile, Platform.PC),
        },
      ],
      title: `r/Fallout76Marketplace Profile for ${data.reddit_username}`,
    };
  },
  async (event, ctx) => {
    const apiKey = (await ctx.settings.get("X-Space-App-Key")) as string;
    const updatedProfile: KarmaProfile = {
      reddit_username: event.values.username,
      karma: parseInt(event.values.fo76_karma, 10),
      m76_karma: parseInt(event.values.m76_karma, 10),
      gamertags: [
        {
          gamertag: event.values.xbox_gt,
          gamertag_id: event.values.xuid,
          platform: Platform.XBOX,
        },
        {
          gamertag: event.values.ps_gt,
          gamertag_id: event.values.psnid,
          platform: Platform.PlayStation,
        },
        {
          gamertag: event.values.pc_gt,
          gamertag_id: "0",
          platform: Platform.PC,
        },
      ].filter((gamertag) => gamertag.gamertag !== undefined),
    };

    const user = await ctx.reddit.getUserByUsername(event.values.username);
    const subreddit = await ctx.reddit.getCurrentSubreddit();
    const userFlair = await user.getUserFlairBySubreddit(subreddit.name);
    const combinedKarma = parseInt(event.values.fo76_karma, 10) + parseInt(event.values.m76_karma, 10);
    const platformsEmojis = updatedProfile.gamertags.map((gamertag) => `:${gamertag.platform.toLowerCase()}:`);

    if (userFlair === undefined) {
      await setFlairBasedOnKarma(event.values.username, subreddit.name, combinedKarma, ctx, `${platformsEmojis.join(" ")} Karma: ${combinedKarma}`);
    } else {
      const flairText = userFlair.flairText;
      const flairLabel = flairText?.includes("Courier") ? "Verified Courier" : "Karma";
      const newFlair = `${platformsEmojis.join(" ")} ${flairLabel}: ${combinedKarma}`;

      await setFlairBasedOnKarma(event.values.username, subreddit.name, combinedKarma, ctx, newFlair);
    }

    await updateProfileInfo(updatedProfile, apiKey);
  }
);

Devvit.addMenuItem({
  label: "Update Karma Profile",
  location: ["post", "comment"],
  forUserType: "moderator",
  onPress: async (event, ctx) => {
    let post;
    if (event.targetId.startsWith("t1_")) {
      post = ctx.reddit.getCommentById(event.targetId);
    } else {
      post = ctx.reddit.getPostById(event.targetId);
    }

    const apiKey = (await ctx.settings.get("X-Space-App-Key")) as string;
    const formData = await getProfileInfo((await post).authorName, apiKey);
    return ctx.ui.showForm(updateGamertagForm, formData);
  },
});

export default Devvit;
