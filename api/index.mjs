import {createBrokerClient} from '../server/brokbuddy.mjs';
import {createApiHandler} from '../server/http.mjs';

// Keep the raw request stream so the shared handler enforces its own JSON and
// 16 KiB limits before forwarding an enquiry. Vercel supplies runtime secrets.
export const config = {api: {bodyParser: false}};
export default createApiHandler(createBrokerClient());
