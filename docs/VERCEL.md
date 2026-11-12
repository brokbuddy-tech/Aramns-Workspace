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

The production address is **https://armanpropertyadvisor.com**.

1. Open the deployed app's Vercel project → **Settings → Domains**.
2. Add `armanpropertyadvisor.com` to the **Production** environment.
3. Add `www.armanpropertyadvisor.com` and configure it to redirect to
   `https://armanpropertyadvisor.com`.
4. In **Cloudflare → armanpropertyadvisor.com → DNS → Records**, enter the
   exact records displayed by Vercel for this project. Set **Proxy status** to
   **DNS only** (gray cloud) and **TTL** to **Auto** for both website records:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | `@` | The apex IP shown by Vercel |
   | CNAME | `www` | The CNAME target shown by Vercel |

   If Vercel requests a domain ownership TXT record, add that exact record too.
   Replace conflicting website records for these names; retain email MX and
   unrelated verification TXT records. Keeping the current nameservers avoids
   moving the rest of the domain's DNS. Keep the existing Cloudflare nameservers.
5. Wait for both domains to show a valid configuration and HTTPS certificate
   in Vercel. Check the `www` redirect after DNS propagation.

Save `https://armanpropertyadvisor.com` in the broker's **BrokBuddy Branding →
Website** setting so feed and media access recognizes this website. Authorize
`https://armanpropertyadvisor.com/*` under the Google Maps browser key's
website restrictions. If `www` also serves pages instead of redirecting,
authorize `https://www.armanpropertyadvisor.com/*` as well.

No application hostname change is required: browser API requests already use
same-origin `/api/*` URLs. Domain attachment and DNS are configured outside
the source repository. Follow [Vercel's custom-domain guide](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
and use the project-specific values it displays.

Verify after deployment:

- `https://armanpropertyadvisor.com/api/site` returns broker/listing JSON, not
  HTML or a 503 response.
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
