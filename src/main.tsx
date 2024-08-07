import { Devvit } from "@devvit/public-api";
import {
  KarmaProfile,
  getProfileInfo,
  Platform,
  getGamertagForPlatform,
  getGamertagIDForPlatform,
  updateProfileInfo,
  insertNewProfile,
} from "./database_queries.js";
import { isModerator, setFlairBasedOnKarma } from "./utils.js";

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
    const [profile, _] = await getProfileInfo((await post).authorName, apiKey);
    return ctx.ui.showForm(profileCard, profile);
  },
});

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
      ].filter((gamertag) => Boolean(gamertag.gamertag)),
    };

    const user = await ctx.reddit.getUserByUsername(event.values.username);
    const subreddit = await ctx.reddit.getCurrentSubreddit();
    const userFlair = await user.getUserFlairBySubreddit(subreddit.name);
    const combinedKarma = parseInt(event.values.fo76_karma, 10) + parseInt(event.values.m76_karma, 10);
    const isMod = await isModerator(user, subreddit);

    const platformsEmojis = updatedProfile.gamertags.map((gamertag) => `:${gamertag.platform.toLowerCase()}:`);
    const flairLabel = userFlair === undefined ? "Karma" : userFlair.flairText?.includes("Courier") ? "Verified Courier" : "Karma";
    const newFlair = `${platformsEmojis.join(" ")} ${flairLabel}: ${combinedKarma}`;
    await setFlairBasedOnKarma(event.values.username, subreddit.name, combinedKarma, ctx, newFlair, isMod || flairLabel === "Verified Courier");

    console.log(updatedProfile);
    try {
      await updateProfileInfo(updatedProfile, apiKey);
      return ctx.ui.showToast(`Profile Updated Successfully`);
    } catch (error) {
      return ctx.ui.showToast(`Error Updating Profile: ${error}`);
    }
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
    const [profile, isDefault] = await getProfileInfo((await post).authorName, apiKey);

    if (isDefault) {
      try {
        await insertNewProfile(profile, apiKey);
      } catch (error) {
        return ctx.ui.showToast("Couldn't insert new profile in database.");
      }
    }
    return ctx.ui.showForm(updateGamertagForm, profile);
  },
});

export default Devvit;
