/* LAFTAH brief form settings

   DEFAULT: endpoint "send.php" - the PHP script in this folder emails the brief to info@laftah.me.
   It needs PHP hosting (for example the GoDaddy cPanel plan). Edit TO_EMAIL / FROM_EMAIL at the top of send.php.

   If send.php is missing or fails, the page falls back to opening the visitor's email app,
   so no enquiry is lost.

   To use an outside service instead, replace the two values:
   Web3Forms:  endpoint: "https://api.web3forms.com/submit",  accessKey: "<your access key>"
   Formspree:  endpoint: "https://formspree.io/f/<your form id>",  accessKey: ""
   Leave endpoint empty ("") to always open the email app.
*/
window.LAFTAH_FORM = { endpoint: "send.php", accessKey: "" };
