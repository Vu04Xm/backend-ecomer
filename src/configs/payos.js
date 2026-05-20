const { PayOS } = require("@payos/node");

// Hardcoded keys provided by the user to ensure stability
const payos = new PayOS({
  clientId: "befcfaeb-6b5b-474f-88ab-65c59b98ca6c",
  apiKey: "85bd7799-dab6-4898-a471-5679664e8e9b",
  checksumKey: "32406eeb8bfe4f227b02622d3768cc6f37c21e2ac0f1a12cbdc039a95c0e9c69",
});

console.log("✅ PayOS initialized with direct keys.");

module.exports = payos;
