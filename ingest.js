// netlify/functions/ingest.js
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok: true, msg: "Pleading Sanity ingest endpoint ready." })
  };
};
