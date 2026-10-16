/* LAFTAH brief form settings

   ACTIVE: Web3Forms (free) emails each brief to the address registered with the key. Works on GitHub Pages.
   Alternative for PHP hosting: endpoint "send.php" (emails info@laftah.me; edit TO_EMAIL / FROM_EMAIL at the top of send.php).
   It needs PHP hosting (for example the GoDaddy cPanel plan). Edit TO_EMAIL / FROM_EMAIL at the top of send.php.

   If send.php is missing or fails, the page falls back to opening the visitor's email app,
   so no enquiry is lost.

   To use an outside service instead, replace the two values:
   Web3Forms:  endpoint: "https://api.web3forms.com/submit",  accessKey: "<your access key>"
   Formspree:  endpoint: "https://formspree.io/f/<your form id>",  accessKey: ""
   Leave endpoint empty ("") to always open the email app.
*/
window.LAFTAH_FORM = { endpoint: "https://api.web3forms.com/submit", accessKey: "b3f9286b-04f9-4ea0-8a90-59d15376b904" };
