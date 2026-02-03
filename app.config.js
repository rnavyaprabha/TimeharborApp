const appJson = require('./app.json');

const expo = appJson.expo || {};
const ios = expo.ios || {};
const android = expo.android || {};
const isEasBuild = !!process.env.EAS_BUILD;

const localGoogleServicesPlist = './config/GoogleService-Info.plist';
const localGoogleServicesJson = './config/google-services.json';

module.exports = {
  ...appJson,
  expo: {
    ...expo,
    ios: {
      ...ios,
      infoPlist: {
        ...(ios.infoPlist || {}),
        ITSAppUsesNonExemptEncryption: false,
      },
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST || (!isEasBuild ? localGoogleServicesPlist : undefined),
    },
    android: {
      ...android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || (!isEasBuild ? localGoogleServicesJson : undefined),
    },
  },
};
