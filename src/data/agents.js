// One configured broker; never use demo or sibling agents as fallbacks.
export let AGENTS = [];
export function setAgents(agents) { AGENTS = agents; }
