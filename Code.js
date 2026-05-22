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

function getLogoDataUrl_() {
  const fileId = '10AlyHkfuFJm3yUDhK_Oorxb3B_SgYVUb';
  const blob = DriveApp.getFileById(fileId).getBlob();
  const contentType = blob.getContentType() || 'image/png';
  const base64 = Utilities.base64Encode(blob.getBytes());

  return 'data:' + contentType + ';base64,' + base64;
}