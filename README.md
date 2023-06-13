**PREREQUISITES:**
1. Discord application
2. DigitalOcean account (use [referral link](https://m.do.co/c/fd492ca49952) to get 200$)
3. Installed [doctl](https://docs.digitalocean.com/reference/doctl/how-to/install)

**DEPLOY:**
1. Run `doctl apps create --spec ./.do/prod.spec.yml`
2. Set `DISCORD_APP_ID` and `DISCORD_TOKEN` envs on DO app settings

> NOTE: ESTIMATED MONTHLY APP COST IS $22.00 - $27.00