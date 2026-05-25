function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.logoDataUrl = getLogoDataUrl_();

  let userProfile = null;
  try {
    userProfile = getCurrentUserProfile_({ incrementVisits: true, forceRefresh: true });
  } catch (error) {
    userProfile = {
      email: '',
      rowNumber: null,
      divisionRaw: '',
      divisionCanonical: '',
      divisionDisplay: '',
      fullName: '',
      firstName: '',
      isAdmin: false,
      hasValidDivision: false,
      accessAllowed: false,
    };
  }

  const userContext = {
    email: String(userProfile.email || '').trim().toLowerCase(),
    firstName: String(userProfile.firstName || '').trim(),
    divisionDisplay: userProfile.accessAllowed ? String(userProfile.divisionCanonical || userProfile.divisionDisplay || '').trim() : '',
    accessAllowed: Boolean(userProfile.accessAllowed),
    isAdmin: Boolean(userProfile.isAdmin),
    fullName: String(userProfile.fullName || '').trim(),
    accessDeniedMessage: getAccessDeniedMessage_(),
    headerBaseText: 'Status & Insights Assistant',
    headerDeniedText: 'Please contact an admin to use the chatbot.',
  };

  template.userContextJson = JSON.stringify(userContext).replace(/</g, '\\u003c');

  return template
    .evaluate()
    .setTitle('SIA Chat App');
}

/**
 * Run this manually from the Apps Script editor to trigger the authorization
 * flow for every scope this project relies on.
 *
 * Apps Script only shows the consent screen when a restricted service is
 * actually touched, so this helper intentionally accesses Sheets, Drive, and
 * the active user's email in one place.
 */
function reauthorizeProgramPermissions() {
  const authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  const requiredScopes = (authInfo && typeof authInfo.getRequiredScopes === 'function')
    ? authInfo.getRequiredScopes()
    : [];

  // Touch the services used by this project so Apps Script requests consent
  // for any scopes that are still missing.
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const driveRootFolder = DriveApp.getRootFolder();
  const activeUserEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();

  return {
    authStatus: String(authInfo.getAuthorizationStatus() || 'unknown'),
    authorizationUrl: String(authInfo.getAuthorizationUrl() || ''),
    requiredScopes: Array.isArray(requiredScopes)
      ? requiredScopes.map(function(scope) {
          return String(scope || '');
        }).filter(function(scope) {
          return Boolean(scope);
        })
      : [],
    touchedServices: {
      spreadsheetName: spreadsheet ? String(spreadsheet.getName() || '') : '',
      driveRootFolderName: driveRootFolder ? String(driveRootFolder.getName() || '') : '',
      activeUserEmail: activeUserEmail,
    },
    message: 'If the script still needs consent, open the authorization URL and rerun this function after granting access.',
  };
}

/**
 * Safe-to-call helper for the web app UI. This only reads authorization info
 * and does not touch Drive/Sheets, so users can click the link before they
 * have granted consent.
 */
function getReauthorizationInfo() {
  const authDebug = getCurrentUserAuthDebug_();

  return {
    authStatus: String(authDebug.authStatus || 'unknown'),
    authorizationUrl: String(authDebug.authUrl || ''),
    requiredScopes: Array.isArray(authDebug.requiredScopes) ? authDebug.requiredScopes : [],
    message: 'Open the authorization link in a new tab and grant access. Then come back and refresh the web app.',
  };
}

function getLogoDataUrl_() {
  const fileId = '10AlyHkfuFJm3yUDhK_Oorxb3B_SgYVUb';
  const blob = DriveApp.getFileById(fileId).getBlob();
  const contentType = blob.getContentType() || 'image/png';
  const base64 = Utilities.base64Encode(blob.getBytes());

  return 'data:' + contentType + ';base64,' + base64;
}