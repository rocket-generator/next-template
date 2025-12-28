async function getTranslations() {
  return (key) => key;
}

async function getLocale() {
  return "ja";
}

async function getMessages() {
  return {};
}

function getRequestConfig(config) {
  return config;
}

module.exports = {
  getTranslations,
  getLocale,
  getMessages,
  getRequestConfig,
};
