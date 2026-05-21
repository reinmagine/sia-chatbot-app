function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.logoDataUrl = getLogoDataUrl_();

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