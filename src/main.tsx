import { Devvit } from "@devvit/public-api";
import { KarmaProfile, getProfileInfo, Platform, getGamertagForPlatform } from "./database_queries.js";

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

const dynamicForm = Devvit.createForm(
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
          defaultValue: data.m76_karma,
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
    return ctx.ui.showForm(dynamicForm, formData);
  },
});

export default Devvit;
