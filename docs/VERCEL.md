# Deploy Novalux on Vercel

The repository includes `vercel.json` and `api/index.mjs`. Vercel serves the
Vite build from `dist` and sends `/api/*` to the shared Node API handler.
Direct page visits load the React application; missing files still return 404.
Do not upload only `dist`, because listings, enquiries and Maps configuration
require the function.

## Deploy from your terminal

From the project root:

```sh
npx vercel login
npx vercel link
```

Choose the intended account/team and create a project, or select the existing
Novalux project. Keep the root directory as `.`. In the Vercel project's
Settings, select Node.js **22.x**. The checked-in configuration selects Vite,
`npm ci`, `npm run build`, and `dist` automatically.

In **Settings → Environment Variables**, copy these values from your local
ignored `.env` into the **Production** environment. Add them to **Preview**
as well if preview deployments need the live broker feed:

| Variable | Required |
| --- | --- |
| `BROKBUDDY_API_BASE_URL` | Yes |
| `BROKBUDDY_BROKER_PROFILE_SLUG` | Yes |
| `BROKBUDDY_BROKER_CODE` | Yes; mark Sensitive |
| `GOOGLE_MAPS_BROWSER_API_KEY` | For maps |
| `GOOGLE_MAPS_MAP_ID` | Optional; existing default applies |

Keep these exact variable names. Never prefix broker settings with `VITE_`.
Do not upload `.env`; `PORT` and `HOST` are unnecessary on Vercel. The function
reads its environment at runtime. Redeploy after changing Vercel settings.

Deploy production:

```sh
npx vercel --prod
```

Alternatively, commit and push the prepared source to GitHub, import
`brokbuddy-tech/Aramns-Workspace` at <https://vercel.com/new>, enter the same
environment variables and deploy. GitHub deployments require these new files
to be present on the imported branch.

## Connect the published hostname

Save the final canonical HTTPS URL in the broker's BrokBuddy Branding settings
so feed and media access recognizes this website. If using a custom domain,
add it to the Vercel project and redirect aliases to the canonical hostname.
Authorize the same hostname under the Google Maps browser key's website
restrictions, for example `https://your-site.vercel.app/*`.

Verify after deployment:

- `/api/site` returns broker/listing JSON, not HTML or a 503 response.
- `/api/maps-config` returns public Maps configuration (or `enabled: false`
  when maps are intentionally disabled).
- Reloading a real `/property/<listing-id>` URL loads its detail page.
- Listing images load and maps work on the deployed hostname.
- If you send a test enquiry, confirm it reaches BrokBuddy; a viewing enquiry
  does not confirm a calendar appointment.

If `/api/site` returns 503, check the three broker variables and publication
prerequisites in [the integration guide](INTEGRATION.md), including Company
Website, Show Listings and the canonical Branding URL.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js),
[Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json).
